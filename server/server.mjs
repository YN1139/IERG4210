import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import multer from "multer";
import path from "path";
import fs from "fs";

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
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
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
      return cb(new Error("Only jpg, png and gif are allowed"));
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

//Update the database after receriving the form submission from the client
app.post("/admin/add-product", upload.single("image"), async (req, res) => {
  try {
    const { catid, name, price, description } = req.body;
    const imagePath = req.file ? req.file.path : null; //if there is a file, store the path, otherwise store null

    const sql =
      "INSERT INTO products (catid, name, price, description, image) VALUES (?, ?, ?, ?, ?)";
    const [result] = await db.query(sql, [
      catid,
      name,
      price,
      description,
      imagePath,
    ]);
    const pid = result.insertId;

    if (imagePath) {
      const newImagePath = `uploads/${pid}${path.extname(imagePath)}`;
      fs.renameSync(imagePath, newImagePath);
      const updateSql = "UPDATE products SET image = ? WHERE pid = ?";
      await db.query(updateSql, [newImagePath, pid]);
    }

    res.status(200).send({ message: "Product added successfully!" });
  } catch (error) {
    res.status(400).send(error);
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
