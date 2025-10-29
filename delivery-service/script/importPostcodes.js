import fs from "fs";
import csv from "csv-parser";
import pool from "../db.js";
import path from "path";
import { fileURLToPath } from "url";

async function importCSV(filePath) {
  console.log(`📦 Importing ${filePath}...`);
  const rows = [];
  const invalidRows = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        const postcode = data.Postcode?.trim();
        const economy = parseFloat(data.Economy);
        const premium = parseFloat(data.Premium);

        // Detect NaN or missing values
        if (!postcode || isNaN(economy) || isNaN(premium)) {
          invalidRows.push(data);
        } else {
          rows.push([postcode, economy, premium]);
        }
      })
      .on("end", async () => {
        if (invalidRows.length > 0) {
          console.warn(
            `⚠️ ${invalidRows.length} invalid rows found in ${filePath}`
          );
          // optional: write to a file for later debugging
          fs.writeFileSync(
            `invalid_${path.basename(filePath)}`,
            JSON.stringify(invalidRows, null, 2)
          );
        }

        if (rows.length === 0) {
          console.warn(`🚫 No valid rows found in ${filePath}`);
          return resolve();
        }

        const connection = await pool.getConnection();
        try {
          await connection.query(
            `INSERT INTO postcodes (postcode, economy_price, premium_price)
             VALUES ?
             ON DUPLICATE KEY UPDATE
             economy_price = VALUES(economy_price),
             premium_price = VALUES(premium_price)`,
            [rows]
          );
          console.log(`✅ Imported ${rows.length} rows from ${filePath}`);
          resolve();
        } catch (err) {
          reject(err);
        } finally {
          connection.release();
        }
      })
      .on("error", reject);
  });
}
// -------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Correct absolute path
const folder = path.resolve(__dirname, "postcode_chunks_csv");

const files = fs
  .readdirSync(folder)
  .filter((f) => f.endsWith(".csv"))
  .sort(); // optional: sort to maintain order

for (const file of files) {
  try {
    await importCSV(`${folder}/${file}`);
  } catch (err) {
    console.error(`💥 Failed importing ${file}:`, err.message);
  }
}

console.log("🎉 All CSVs imported successfully!");
process.exit(0);
