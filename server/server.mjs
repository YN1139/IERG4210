import express from "express";
import cors from "cors";
import helmet, { referrerPolicy } from "helmet";
import session from "express-session";
import csrf from "csrf";
import crypto from "crypto";
import mysql from "mysql2";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import Stripe from "stripe";
import nodemailer from "nodemailer";
import sharp from "sharp";
import "dotenv/config";

const stripe = Stripe(process.env.STRIPE_SERVER_KEY);
const endpointSecret = process.env.STRIPE_ENDPOINT_KEY;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();

const corsOptions = {
  origin: "https://s27.ierg4210.ie.cuhk.edu.hk",
  credentials: true, // access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

//loading the database
const dbConst = {
  host: process.env.SQL_HOST,
  port: process.env.SQL_PORT,
  user: process.env.SQL_USER,
  password: process.env.SQL_PW,
};
const db = mysql.createConnection({
  ...dbConst,
  database: process.env.SQL_DB_GENERAL,
});
const userDb = mysql.createConnection({
  ...dbConst,
  database: process.env.SQL_DB_USER,
});

//loading the configuration for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../public/uploads");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`); //store the image
  },
});
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (
      file.mimetype !== "image/jpeg" &&
      file.mimetype !== "image/png" &&
      file.mimetype !== "image/gif"
    ) {
      return cb(new Error("Only jpeg, png and gif are allowed"));
    }
    if (file.size > 10000000) {
      return cb(new Error("File size must be less than or is equal to 10MB"));
    }
    cb(null, true);
  },
});

app.set("trust proxy", 1); //trust the reverse proxy to set the secure flag on the cookie
//ref to sample code, HUGE THANKS

//cors and helmet middleware
app.use(cors(corsOptions));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://js.stripe.com"],
        frameSrc: ["'self'", "https://js.stripe.com"],
        styleSrc: ["'self'", "https://js.stripe.com"],
        imgSrc: ["'self'", "https://js.stripe.com"],
        connectSrc: [
          "'self'",
          "https://checkout.stripe.com",
          "https://js.stripe.com",
        ],
      },
    },
    strictTransportSecurity: {
      maxAge: 31536000,
      includeSubDomains: true,
    },
    xFrameOptions: { action: "deny" },
    xssFilter: false, //let nginx handle x-xss-protection
    noSniff: true,
    referrerPolicy: { policy: "no-referrer-when-downgrade" },
  })
);

app.use(
  session({
    secret: crypto.randomBytes(32).toString("hex"),
    name: "sess",
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, //1 day
    },
  })
);

//check session id and existence
/* app.use((req, res, next) => {
  console.log("Session ID:", req.sessionID);
  console.log("Has session:", !!req.session);
  console.log("CSRF Secret exists:", !!req.session.csrf_secret);
  next();
}); */

const tokens = new csrf();
app.use((req, res, next) => {
  //Check if the secret exists in the session, if not, create a new one
  if (!req.session.csrf_secret) {
    req.session.csrf_secret = tokens.secretSync();
    console.log("New CSRF secret created:", req.session.csrf_secret);
  }
  next();
});

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log(session);
      const { order_id, digest } = session.metadata;

      try {
        const order_sql =
          "SELECT * FROM orders WHERE orderID = ? AND status = ?";
        const [order] = await db
          .promise()
          .query(order_sql, [order_id, "pending"]);
        console.log(order[0].products);

        if (order.length === 0) {
          throw new Error("Order not found or completed.");
        }

        const verifyDigestItem = [
          "HKD",
          "admin@s27.com",
          order[0].products
            .map(
              (product) => `${product.pid}|${product.quantity}|${product.price}`
            )
            .join("|"),
          order[0].total,
          order[0].salt,
        ].join("|");

        console.log(verifyDigestItem);

        const verifyDigest = crypto
          .createHash("sha256")
          .update(verifyDigestItem)
          .digest("base64");

        if (verifyDigest !== digest) {
          throw new Error("Invalid digest.");
        }

        const update_sql = "UPDATE orders SET status = ? WHERE orderID = ?";
        await db.promise().query(update_sql, ["completed", order_id]);

        const customerOrderID =
          "S27" + crypto.randomBytes(3).toString("hex").toUpperCase();
        const hash_sql =
          "INSERT INTO customerOrder (orderID, customerOrderID) VALUES (?, ?)";
        await db.promise().query(hash_sql, [order_id, customerOrderID]);
        console.log("Order completed.");

        const customerEmail = session.customer_details.email;
        console.log(customerEmail);

        /* let s27 = await nodemailer.createTestAccount();
        console.log(s27); */

        const transporter = nodemailer.createTransport({
          service: "gmail",
          host: "smtp.gmail.com", //test account
          port: 465,
          secure: true,
          auth: {
            user: process.env.GMAIL,
            pass: process.env.GMAIL_APP_PW,
          },
        });

        let info = await transporter.sendMail({
          from: '"S27 shop" <shop27@s27.com>',
          to: customerEmail,
          subject: "Your Order Invoice",
          text: `Thank you for your order!`,
          html: `<h1>Thank you for your order in s27 shop!</h1>
                 <p>Your order ID is <b>${customerOrderID}</b>.</p>
                 <p>Please check your order status at our <a href="https://s27.ierg4210.ie.cuhk.edu.hk">website</a>.</p>`,
        });

        console.log("Invoice email sent: %s", info.messageId);

        res.json({ received: true, url: nodemailer.getTestMessageUrl(info) });
      } catch (error) {
        console.error("Error completing order:", error);
        res.json({ received: false });
      }
    }
  }
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/admin", requireAdmin);
app.use("/", express.static(path.join(__dirname, "../public/users")));

app.get("/admin", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin.html"));
});
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/users/login.html"));
});
app.get("/product", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/users/product.html"));
});
app.get("/member-panel", checkLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/member-panel.html"));
});
app.get("/check-order", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/users/check-order.html"));
});
app.get("/logout", (req, res) => {
  req.session.destroy(function () {
    res.clearCookie("sess");
    res.redirect("/");
  });
});
app.get("/panel", (req, res) => {
  if (req.session.admin === 1) {
    res.redirect("/admin");
  } else {
    res.redirect("/member-panel");
  }
});
//==========API============
app.get("/api/stripe", (req, res) => {
  const stripe_cart = process.env.STRIPE_CLIENT_KEY;
  res.json({ stripe_cart });
});
app.get("/api/csrf-token", (req, res) => {
  const csrfToken = tokens.create(req.session.csrf_secret);
  console.log("Sending CSRF token:", csrfToken);
  res.json({ csrfToken });
});

app.get("/api/userStatus", (req, res) => {
  let userStatus = "guest"; //default user status
  if (req.session.admin === 1) {
    userStatus = "admin"; //if the user is admin, set the user status to admin
    return res.json(userStatus);
  } else if (req.session.admin === 0) {
    userDb.query(
      "SELECT * FROM users WHERE userid = ?",
      [req.session.userId],
      (err, user) => {
        if (err) throw err;
        userStatus = user[0].email;
        return res.json(userStatus);
      }
    );
  } else {
    return res.json(userStatus);
  }
});

//Load the categories and products to homepage
app.get("/api/cat", async (req, res) => {
  db.query("SELECT * FROM categories", async (err, categories) => {
    if (err) throw err;
    res.json(categories);
  });
});

app.get("/api/prod", async (req, res) => {
  db.query("SELECT * FROM products", async (err, products) => {
    if (err) throw err;
    res.json(products);
  });
});

//Load the specific category
app.get("/api/category/:catid", async (req, res) => {
  const catid = req.params.catid;
  db.query(
    "SELECT * FROM categories WHERE catid = ?",
    [catid],
    async (err, category) => {
      if (err) throw err;
      res.json(category);
    }
  );
});

//Load the specific products based on the category
app.get("/api/products/:catid", async (req, res) => {
  const catid = req.params.catid;
  db.query(
    "SELECT * FROM products WHERE catid = ?",
    [catid],
    async (err, products) => {
      if (err) throw err;
      res.json(products);
    }
  );
});

//Load the specific products
app.get("/api/product/:pid", async (req, res) => {
  const pid = req.params.pid;
  db.query(
    "SELECT * FROM products WHERE pid = ?",
    [pid],
    async (err, product) => {
      if (err) throw err;
      res.json(product);
    }
  );
});

app.get("/api/orders", requireAdmin, async (req, res) => {
  const sql = "SELECT * FROM orders";
  const [orders] = await db.promise().query(sql);
  const customerOrder_sql = "SELECT * FROM customerOrder";
  const [customerOrder] = await db.promise().query(customerOrder_sql);
  res.json({ orders, customerOrder });
});

app.get("/api/user-orders", checkLogin, async (req, res) => {
  /* const sql =
    "SELECT * FROM orders WHERE user = ? ORDER BY orderID DESC LIMIT 5"; */
  const sql = "SELECT * FROM orders WHERE user = ?";
  const [orders] = await db.promise().query(sql, [req.session.email]);
  const orderIDs = orders.map((order) => order.orderID);
  if (orders.length === 0) {
    res.json({ orders: [], customerOrder: [] });
    return;
  }
  const customerOrder_sql = "SELECT * FROM customerOrder WHERE orderID IN (?)";
  const [customerOrder] = await db
    .promise()
    .query(customerOrder_sql, [orderIDs]);
  console.log(customerOrder);
  res.json({ orders, customerOrder });
});

app.get("/api/orders/:orderID", validateCSRF, async (req, res) => {
  const orderID = req.params.orderID;
  const sql = "SELECT * FROM customerOrder WHERE customerOrderID = ?";
  const [customerOrder] = await db.promise().query(sql, [orderID]);
  console.log(customerOrder);
  if (customerOrder.length === 0) {
    res.json({ order: [], customerOrder: [] });
    return;
  }
  const order_sql = "SELECT * FROM orders WHERE orderID = ?";
  const [order] = await db
    .promise()
    .query(order_sql, [customerOrder[0].orderID]);
  res.json({ order, customerOrder });
});

//=======POST EVENTS=========

//Update the database after receriving the form submission from the client
app.post(
  "/admin/add-category",
  validateCSRF,
  requireAdmin,
  async (req, res) => {
    const { name } = req.body;
    const sql = "INSERT INTO categories (name) VALUES (?)";
    const [result] = await db.promise().query(sql, [name]);
    res.status(200).redirect("/admin");
  }
);

app.post(
  "/admin/delete-category",
  validateCSRF,
  requireAdmin,
  async (req, res) => {
    const { catid } = req.body;
    const sql = "DELETE FROM categories WHERE catid = ?";
    const [result] = await db.promise().query(sql, [catid]);
    res.status(200).redirect("/admin");
  }
);

app.post(
  "/admin/add-product",
  upload.single("image"),
  validateCSRF,
  requireAdmin,
  async (req, res) => {
    try {
      const { catid, name, price, description } = req.body;
      const imagePath = req.file ? req.file.path : null; //if there is a file, store the path, otherwise store null
      console.log(req.body, req.file);
      const sql =
        "INSERT INTO products (catid, name, price, description, image) VALUES (?, ?, ?, ?, ?)";
      const [result] = await db
        .promise()
        .query(sql, [catid, name, price, description, imagePath]);
      const pid = result.insertId;

      //update the image with pid if image path exist in database
      if (imagePath) {
        const newImagePath = `../public/users/uploads/${pid}${path.extname(
          imagePath
        )}`; //define a new path to access and rename the image file
        console.log(imagePath, newImagePath);
        await sharp(imagePath)
          .resize({ width: 500, fit: "inside" }) //allow autoscale on height
          .toFile(newImagePath);
        //fs.renameSync(imagePath, newImagePath); //rename the image file with the pid
        fs.unlinkSync(imagePath); //delete the original image file
        const dbImagePath = `uploads/${pid}${path.extname(imagePath)}`; //store the image path in the database
        const updateSql = "UPDATE products SET image = ? WHERE pid = ?"; //update the image path in the database
        await db.promise().query(updateSql, [dbImagePath, pid]);
      }
      res.status(200).redirect("/admin");
    } catch (error) {
      res.status(400).send(error);
    }
  }
);

app.post(
  "/admin/edit-product",
  upload.single("image"),
  validateCSRF,
  requireAdmin,
  async (req, res) => {
    try {
      console.log(req.body);
      const { pid, catid, name, price, description } = req.body;

      const imagesql = "SELECT image FROM products WHERE pid = ?";
      const [image] = await db.promise().query(imagesql, [pid]);
      console.log(image);
      const imagePath = req.file ? req.file.path : image[0].image;
      const sql =
        "UPDATE products SET catid = ?, name = ?, price = ?, description = ?, image = ? WHERE pid = ?";
      const [result] = await db
        .promise()
        .query(sql, [catid, name, price, description, imagePath, pid]);
      console.log(result);

      //update the image with pid if image path exist in database
      if (req.file) {
        if (imagePath) {
          const newImagePath = `../public/users/uploads/${pid}${path.extname(
            imagePath
          )}`; //define a new path to access and rename the image file
          //console.log(imagePath, newImagePath);
          await sharp(imagePath)
            .resize({ width: 500, fit: "inside" })
            .toFile(newImagePath);
          //fs.renameSync(imagePath, newImagePath); //rename the image file with the pid
          fs.unlinkSync(imagePath); //delete the original image file
          const dbImagePath = `uploads/${pid}${path.extname(imagePath)}`; //store the image path in the database
          const updateSql = "UPDATE products SET image = ? WHERE pid = ?"; //update the image path in the database
          await db.promise().query(updateSql, [dbImagePath, pid]);
        }
      }
      res.status(200).redirect("/admin");
    } catch (error) {
      res.status(400).send(error);
    }
  }
);

app.post(
  "/admin/delete-product",
  validateCSRF,
  requireAdmin,
  async (req, res) => {
    try {
      const { pid } = req.body;
      console.log(req.body, pid);
      console.log("Deleting product");
      const sql = "DELETE FROM products WHERE pid IN (?)";
      const [result] = await db.promise().query(sql, [pid]);
      console.log(result);
      res.status(200).redirect("/admin");
    } catch (error) {
      res.status(400).send(error);
    }
  }
);

//Login the user
app.post("/checkLogin", validateCSRF, async (req, res) => {
  try {
    const { email, password } = req.body;
    const sql = "SELECT * FROM users WHERE email = ?";
    const [users] = await userDb.promise().query(sql, [email]);
    console.log(users);
    //if the user does not exist, return an error
    if (users.length === 0) {
      return res
        .status(401)
        .json({ loginError: "Invalid email or password" })
        .end();
    }
    //if the user exists, check the password
    const storedSalt = users[0].salt;
    const salt = Buffer.from(storedSalt, "hex");
    const storedPassword = users[0].password;

    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) throw err;
      console.log(derivedKey.toString("hex"));
      const derivedPassword = derivedKey.toString("hex");
      if (derivedPassword !== storedPassword) {
        //if the password is not matched, return an error
        return res
          .status(401)
          .json({ loginError: "Invalid email or password" })
          .end();
      } else {
        console.log("Login successful");
        req.session.regenerate(function () {
          req.session.email = req.body.email;
          req.session.userId = users[0].userid;
          req.session.admin = users[0].admin;

          req.session.save(function (err) {
            if (err) return err;
            if (req.session.admin === 1) {
              return res.status(200).redirect("/admin");
            } else {
              return res.status(200).redirect("/");
            }
          });
        });
      }
    });
  } catch (error) {
    res.status(400).send(error);
  }
});

app.post("/createAccount", validateCSRF, async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body, email, password);
    const [existingUsers] = await userDb
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }
    const salt = crypto.randomBytes(64); //generate a random salt
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const hashedPassword = derivedKey.toString("hex");

    console.log("Salt:", salt.toString("hex"));
    console.log("Hashed password:", hashedPassword);
    const sql =
      "INSERT INTO users (email, password, salt, admin) VALUES (?, ?, ?, ?)";
    const [newUser] = await userDb
      .promise()
      .query(sql, [email, hashedPassword, salt.toString("hex"), 0]);
    console.log(newUser);

    req.session.regenerate(function () {
      req.session.email = email;
      req.session.userId = newUser.insertId;
      req.session.admin = 0;

      console.log("Session created:", req.session);

      req.session.save(function (err) {
        if (err) return err;
        return res.status(200).redirect("/");
      });
    });
  } catch (err) {
    console.log("Error creating account:", err);
    res.status(400).send(err);
  }
});

app.post("/resetPassword", validateCSRF, async (req, res) => {
  try {
    const { email, oldPW, newPW } = req.body;
    console.log(req.body);
    const sql = "SELECT * FROM users WHERE email = ?";
    const [users] = await userDb.promise().query(sql, [email]);
    console.log(users);
    //if the user does not exist, return an error
    if (users.length === 0) {
      return res.status(401).json({ Error: "User not exist" }).end();
    }
    //if the user exists, check the password
    const UID = users[0].userid;
    const storedSalt = users[0].salt;
    const salt = Buffer.from(storedSalt, "hex");
    const storedPassword = users[0].password;
    const derivedKey = crypto.scryptSync(oldPW, salt, 64).toString("hex");
    if (derivedKey !== storedPassword) {
      //if the password is not matched, return an error
      return res.status(401).json({ Error: "Invalid password" }).end();
    }

    const newSalt = crypto.randomBytes(64); //generate a new salt for newPW
    const newDerivedKey = crypto.scryptSync(newPW, newSalt, 64).toString("hex");
    const sqlUpdate =
      "UPDATE users SET password = ?, salt = ? WHERE userID = ?";
    const [update] = await userDb
      .promise()
      .query(sqlUpdate, [newDerivedKey, newSalt.toString("hex"), UID]);
    console.log(update);

    req.session.destroy(function () {
      res.clearCookie("sess");
      res.status(200).redirect("/");
    });
  } catch (error) {
    console.log("Error resetting password:", error);
    res.status(400).send(error);
  }
});

//payment
app.post("/pay", validateCSRF, async (req, res) => {
  try {
    const items = req.body; // Get line items from the request body
    console.log(items);
    const sortItems = items.sort((a, b) => a.pid - b.pid); //fix bug: sort the items by pid before processing
    console.log(sortItems);
    const itemQuantity = sortItems.map((item) => item.quantity);
    for (let i = 0; i < sortItems.length; i++) {
      console.log(itemQuantity[i]);
    }
    var sql = "SELECT * FROM products WHERE pid IN ( ? )";
    const [orderProducts] = await db
      .promise()
      .query(sql, [sortItems.map((item) => item.pid)]); // Fetch product details one by one into an array

    console.log(orderProducts);

    const salt = crypto.randomBytes(64).toString("hex");
    const total = orderProducts.reduce(
      (sum, product, i) => sum + product.price * itemQuantity[i],
      0
    );

    const digestItems = [
      "HKD",
      "admin@s27.com",
      orderProducts
        .map(
          (product, i) =>
            `${product.pid}|${itemQuantity[i]}|${
              product.price * itemQuantity[i]
            }`
        )
        .join("|"),
      total,
      salt,
    ].join("|");

    console.log(digestItems);
    const digest = crypto
      .createHash("sha256")
      .update(digestItems)
      .digest("base64");

    console.log(digest);

    const orderData = items.map((item) => {
      //map the items to the orderProducts
      const product = orderProducts.find((product) => product.pid == item.pid); //find the product in items (cart) in the orderProducts
      if (!product) {
        throw new Error(`Product with ID ${item.pid} not found`); //debug
      }
      return {
        pid: item.pid,
        quantity: item.quantity,
        price: product.price * item.quantity,
      };
    });

    const order_sql =
      "INSERT INTO orders (products, user, salt, total, digest, status) VALUES (?, ?, ?, ?, ?, ?)";
    const [newOrder] = await db
      .promise()
      .query(order_sql, [
        JSON.stringify(orderData),
        req.session.email ? req.session.email : "guest",
        salt,
        total,
        digest,
        "pending",
      ]);
    console.log(newOrder);

    const order_id = newOrder.insertId;

    const session = await stripe.checkout.sessions.create({
      line_items: orderProducts.map((product, i) => ({
        //i = index of the mapping
        price_data: {
          currency: "hkd",
          product_data: {
            name: product.name,
            images: [`https://s27.ierg4210.ie.cuhk.edu.hk/${product.image}`],
          },
          unit_amount: product.price * 100,
        },
        quantity: itemQuantity[i],
      })),
      mode: "payment",
      success_url: "https://s27.ierg4210.ie.cuhk.edu.hk/",
      cancel_url: "https://s27.ierg4210.ie.cuhk.edu.hk/",
      metadata: {
        order_id: order_id,
        digest: digest,
      },
    });
    console.log("Session created:", session);
    res.json({ id: session.id }); // Redirect to the checkout session URL
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).send({ error: "Payment failed" });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

function validateCSRF(req, res, next) {
  console.log("CSRF validation started");
  console.log(req.session.csrf_secret);
  console.log(req.body._csrf);
  const token =
    req.body._csrf || req.headers["csrf-token"] || req.headers["x-csrf-token"];
  if (!token) {
    return res.status(403).send("CSRF token not found");
  }
  if (!tokens.verify(req.session.csrf_secret, token)) {
    return res.status(403).send("CSRF validation failed");
  }
  next();
}

function requireAdmin(req, res, next) {
  console.log("Admin check started");
  console.log("Session admin status:", req.session.admin);
  if (req.session.admin === 1) {
    next();
  } else {
    res.redirect("/"); //redirect to homepage if not admin
  }
}

function checkLogin(req, res, next) {
  if (req.session.email) {
    next();
  } else {
    res.redirect("/login"); //redirect to login page if not logged in
  }
}
