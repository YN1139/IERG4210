import express from "express";
import cors from "cors";

const app = express();
const corsOptions = {
  origin: "*",
  credentials: true, // access-control-allow-credentials:true
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

//Update the database after receriving the form submission from the client
app.post("/admin/add-product", upload.single("image"), async (req, res) => {
  try {
    const { catid, name, price, description } = req.body;
    const imagePath = req.file ? req.file.path : null; //if there is a file, store the path, otherwise store null

    const sql =
      "INSERT INTO products (catid, name, price, description, image) VALUES (?, ?, ?, ?, ?)";
    const result = await db.query(sql, [
      catid,
      name,
      price,
      description,
      imagePath,
    ]);
    res.status(200).send({ message: "Product added successfully!" });
  } catch (error) {
    res.status(400).send(error);
  }
});
