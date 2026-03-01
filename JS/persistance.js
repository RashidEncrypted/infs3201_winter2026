// persistance.js
require("dotenv").config();
const fs = require("fs/promises");
const path = require("path");
const BASE = __dirname;
const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
let db;

const DB_NAME = "ess";
const CONFIG_FILE = path.join(__dirname, "../JSON/config.json");
console.log("URI:", process.env.MONGO_URI);
// ---------- Check for URI

// const EMP_FILE = path.join(BASE, "../JSON/employees.json");
// const SHIFT_FILE = path.join(BASE, "../JSON/shifts.json");
// const ASSIGN_FILE = path.join(BASE, "../JSON/assignments.json");
// const CONFIG_FILE = path.join(BASE, "../JSON/config.json");
// ---------- The following functions are used to interact with the MongoDB database. They replace the previous file-based persistence methods.

// ---------- MongoDB connection testing
// (async () => {
//   try {
//     await connect();
//     console.log("MongoDB Connected");
//     process.exit(0);
//   } catch (err) {
//     console.error("Connection Failed:", err);
//     process.exit(1);
//   }
// })();

/**
 * @returns {Promise<any>}
 */
async function connect() {
  if (!db) {
    await client.connect();
    db = client.db(DB_NAME);
  }
  return db;
}

/** @returns {Promise<Array>} */
async function getAllEmployees() {
  const database = await connect();
  return await database.collection("employees").find({}).toArray();
}

/** @param {Array} employees @returns {Promise<void>} */
async function saveEmployees(employees) {
  const database = await connect();
  const col = database.collection("employees");
  await col.deleteMany({});
  if (employees.length > 0) {
    await col.insertMany(employees);
  }
}

/** @returns {Promise<Array>} */
async function getAllShifts() {
  const database = await connect();
  return await database.collection("shifts").find({}).toArray();
}

/** @returns {Promise<Array>} */
async function getAllAssignments() {
  const database = await connect();
  return await database.collection("assignments").find({}).toArray();
}

/** @param {Array} assignments @returns {Promise<void>} */
async function saveAssignments(assignments) {
  const database = await connect();
  const col = database.collection("assignments");
  await col.deleteMany({});
  if (assignments.length > 0) {
    await col.insertMany(assignments);
  }
}

/** @returns {Promise<{maxDailyHours:number}>} */
async function getConfig() {
  try {
    const rawData = await fs.readFile(CONFIG_FILE, "utf8");
    const config = JSON.parse(rawData);
    if (!config.maxDailyHours) config.maxDailyHours = 9;
    return config;
  } catch (err) {
    return { maxDailyHours: 9 };
  }
}

module.exports = {
  getAllEmployees,
  saveEmployees,
  getAllShifts,
  getAllAssignments,
  saveAssignments,
  getConfig
};