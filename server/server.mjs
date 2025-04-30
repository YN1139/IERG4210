import express from "express";
import cors from "cors";
import helmet from "helmet";
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

const stripe = Stripe(
  "sk_test_51RHU04CXaNkR4rcTkq5yct9lZcQg6V7MblQJH5itCZ2ExzhjhgrBgxseEH1NfwhMDuNWCjiJQyzmelmxaIWacAgz00jntz3uZY"
);

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
  host: "database-1.cdoqes4camss.ap-southeast-2.rds.amazonaws.com",
  port: "3306",
  user: "shop27-admin",
  password: "mypass",
};
const db = mysql.createConnection({
  ...dbConst,
  database: "shop27",
});
const userDb = mysql.createConnection({
  ...dbConst,
  database: "shop27account",
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
        scriptSrc: ["'self'", "https://js.stripe.com/v3/"],
        frameSrc: ["'self'", "https://js.stripe.com"],
      },
    },
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/admin", requireAdmin);
app.use("/", express.static(path.join(__dirname, "../public/users")));

app.get("/admin", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin.html"));
});
app.get("/logout", (req, res) => {
  req.session.destroy(function () {
    res.clearCookie("sess");
    res.redirect("/");
  });
});
//==========API============
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

//Update the database after receriving the form submission from the client
app.post(
  "/admin/add-product",
  upload.single("image"),
  validateCSRF,
  requireAdmin,
  async (req, res) => {
    try {
      const { catid, name, price, description } = req.body;
      const imagePath = req.file ? req.file.path : null; //if there is a file, store the path, otherwise store null

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
        //console.log(imagePath, newImagePath);
        fs.renameSync(imagePath, newImagePath); //rename the image file with the pid
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
  const { items } = req.body; // Get line items from the request body
  console.log(items);
  const salt = crypto.randomBytes(32).toString("hex");
  const digestString = [
    "hkd",
    "cd@s27.com",
    salt,
    ...items.map((item) => `${item.pid}-${item.quantity}-${item.price}`),
    //! make a function to get the price from the database
    totalAmount.toFixed(2),
  ].join("|");

  const digest = crypto.createHash("sha256").update(digestString).digest("hex");

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: items.map((item) => ({
        price_data: {
          currency: "hkd",
          product_data: {
            pid: item.pid,
          },
          unit_amount: item.price * 100,
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      ui_mode: "embedded",
      success_url: "https://s27.ierg4210.ie.cuhk.edu.hk/success",
      cancel_url: "https://s27.ierg4210.ie.cuhk.edu.hk/cancel",
    });

    await db
      .promise()
      .query(
        "INSERT INTO orders (stripe_session_id, customer_id, total_amount, order_date, digest, salt, details) VALUES (?, ?, ?, NOW(), ?, ?, ?)",
        [
          null,
          req.session.userId || null,
          totalAmount,
          digest,
          salt,
          line_items,
        ]
      );
    res.redirect(303, session.url);
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).send({ error: "Payment failed" });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

function validateCSRF(req, res, next) {
  /* console.log("CSRF validation started");
  console.log(req.session.csrf_secret);
  console.log(req.body._csrf); */
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
