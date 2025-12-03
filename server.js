
const express = require("express");
const mysql = require("mysql2/promise");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const XLSX = require("xlsx"); 


//Express Setup
const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "public"))); 

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


// MySQL Connection Pool

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "glentec",
  database: "knnl",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


//Project Status

app.get("/api/projects", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM project_status");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching data:", err);
    res.status(500).json({ error: "Error fetching data" });
  }
});



// Reservoir Data

app.get("/api/reservoirs", async (req, res) => {
  try {
    const query = `
      SELECT 
        reservoirname,
        Date,
        InFlow,
        OutFlow,
        Storage_Per,
        Reservior_Level,
        Full_Reservoir_Level,
        CurrentGrossStorage,
        CurrentLiveStorage,
        MinLiveStorage_TMC,
        MaxLiveStorage_TMC,
        StorageCapacity_AsPerDesign,
        CumulativeInflow,
        CumulativeOutFlow
      FROM krishna_reservoirs
      ORDER BY reservoirname, Date;
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching reservoir data:", err);
    res.status(500).json({ error: "Error fetching reservoir data" });
  }
});


//  GeoJSON
app.get("/api/geojson/karnataka", (req, res) => {
  try {
    const geoPath = path.join(__dirname, "public", "karnataka.geojson");
    const data = fs.readFileSync(geoPath, "utf8");
    res.json(JSON.parse(data));
  } catch (err) {
    console.error("❌ Error loading Karnataka GeoJSON:", err);
    res.status(500).json({ error: "Failed to load Karnataka GeoJSON" });
  }
});

app.get("/api/geojson/dams", (req, res) => {
  try {
    const geoPath = path.join(__dirname, "public", "dams.geojson");
    const data = fs.readFileSync(geoPath, "utf8");
    res.json(JSON.parse(data));
  } catch (err) {
    console.error("❌ Error loading Dams GeoJSON:", err);
    res.status(500).json({ error: "Failed to load Dams GeoJSON" });
  }
});


// Land Info

app.get("/api/land_info", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM land_information");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching land info:", err);
    res.status(500).json({ error: "Error fetching land info" });
  }
});


//Project-wise Land Info

app.get("/api/prjct_land_info", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM projectwise_land_info");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching project-wise land info:", err);
    res.status(500).json({ error: "Error fetching project-wise land info" });
  }
});


// API 6: Financial Data

app.get("/api/financial_data", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM financial_data");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching financial data:", err);
    res.status(500).json({ error: "Error fetching financial data" });
  }
});

//API 7:Financial_Year_Data
app.get("/api/financial_year_data", async (req, res) => {
  try {
    const [records] = await pool.query("SELECT * FROM fin_project_record");
    const [years] = await pool.query("SELECT * FROM project_master");

    res.json({
      records,
      years
    });
  } catch (err) {
    console.error("❌ Error fetching data:", err);
    res.status(500).json({ error: "Error fetching data" });
  }
});

// Excel Data APIs

const EXCEL_FOLDER = "D:\\excel_files"; // Adjust path as needed

//Get all Excel file names
app.get("/api/files", (req, res) => {
  try {
    if (!fs.existsSync(EXCEL_FOLDER)) return res.json([]);
    const files = fs.readdirSync(EXCEL_FOLDER).filter(f => f.endsWith(".xlsx"));
    res.json(files);
  } catch (err) {
    console.error("❌ Error reading Excel folder:", err);
    res.status(500).json({ error: "Failed to read Excel files" });
  }
});

// Get sheet names for a selected file
app.get("/api/sheets", (req, res) => {
  try {
    const { file } = req.query;
    if (!file) return res.json([]);

    const filePath = path.join(EXCEL_FOLDER, file);
    if (!fs.existsSync(filePath)) return res.json([]);

    const workbook = XLSX.readFile(filePath);
    res.json(workbook.SheetNames);
  } catch (err) {
    console.error("❌ Error reading Excel sheets:", err);
    res.status(500).json({ error: "Failed to read sheet names" });
  }
});

// ✅ Get data for selected file + sheet
app.get("/api/data", (req, res) => {
  try {
    const { file, sheet } = req.query;
    if (!file || !sheet) return res.json([]);

    const filePath = path.join(EXCEL_FOLDER, file);
    if (!fs.existsSync(filePath)) return res.json([]);

    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[sheet];
    if (!worksheet) return res.json([]);

    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    res.json(json);
  } catch (err) {
    console.error("❌ Error reading Excel data:", err);
    res.status(500).json({ error: "Failed to read Excel data" });
  }
});

// ---------------------------
// 🚀 Start Server
// ---------------------------
const PORT = 3001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
