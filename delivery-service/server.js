import express from "express";
import cors from "cors";
import pool from "./db.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ✅ Route: Get delivery prices by postcode
app.get("/api/delivery/:postcode", async (req, res) => {
  const { postcode } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM postcodes WHERE postcode = ?",
      [postcode.trim().toUpperCase()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Postcode not found" });
    }

    res.json({
      postcode: rows[0].postcode,
      economy_price: rows[0].economy_price,
      premium_price: rows[0].premium_price,
    });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Default route
app.get("/", (req, res) => {
  res.send("🚚 Delivery Service API running!");
});

app.post("/api/delivery", async (req, res) => {
  const { postcode, economy, premium } = req.body;
  if (!postcode || !economy || !premium)
    return res.status(400).json({ message: "Missing fields" });

  try {
    await pool.query(
      `INSERT INTO postcodes (postcode, economy_price, premium_price)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       economy_price = VALUES(economy_price), 
       premium_price = VALUES(premium_price)`,
      [postcode.trim().toUpperCase(), economy, premium]
    );
    res.json({ message: "Inserted/Updated successfully" });
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.put("/api/delivery/:postcode", async (req, res) => {
  const { postcode } = req.params;
  const { economy, premium } = req.body;
  try {
    await pool.query(
      `UPDATE postcodes 
       SET economy_price = ?, premium_price = ? 
       WHERE postcode = ?`,
      [economy, premium, postcode.trim().toUpperCase()]
    );
    res.json({ message: "Updated successfully" });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 🔍 Search by full or partial postcode
app.get("/api/delivery/search/:prefix", async (req, res) => {
  const { prefix } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT * FROM postcodes WHERE postcode LIKE ? ORDER BY postcode ASC`,
      [`${prefix.toUpperCase()}%`]
    );
    if (rows.length === 0) return res.status(404).json({ message: "No records found" });
    res.json(rows);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


// ✅ Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
