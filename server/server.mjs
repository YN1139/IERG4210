import express from "express";
import cors from "cors";
import mysql from "mysql2";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const corsOptions = {
  origin: "*",
  credentials: true, // access-control-allow-credentials:true
  optionSuccessStatus: 200,
};
const db = mysql.createConnection({
  host: "database-1.cdoqes4camss.ap-southeast-2.rds.amazonaws.com",
  port: "3306",
  user: "shop27-admin",
  password: "mypass",
  database: "shop27",
});
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
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/", express.static(path.join(__dirname, "../")));
app.use("/public", express.static(path.join(__dirname, "../public")));

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
app.post("/admin/add-product", upload.single("image"), async (req, res) => {
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
      const newImagePath = `../public/uploads/${pid}${path.extname(imagePath)}`; //define a new path to access and rename the image file
      //console.log(imagePath, newImagePath);
      fs.renameSync(imagePath, newImagePath); //rename the image file with the pid
      const dbImagePath = `uploads/${pid}${path.extname(imagePath)}`; //store the image path in the database
      const updateSql = "UPDATE products SET image = ? WHERE pid = ?"; //update the image path in the database
      await db.promise().query(updateSql, [dbImagePath, pid]);
    }
    res.status(200).redirect("/admin.html");
  } catch (error) {
    res.status(400).send(error);
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
