// persistance.js
const fs = require("fs/promises");
const path = require("path");
const BASE = __dirname;

const EMP_FILE = path.join(BASE, "../JSON/employees.json");
const SHIFT_FILE = path.join(BASE, "../JSON/shifts.json");
const ASSIGN_FILE = path.join(BASE, "../JSON/assignments.json");
const CONFIG_FILE = path.join(BASE, "../JSON/config.json");

/**
 * @param {string} filename
 * @param {any} defaultValue
 * @returns {Promise<any>}
 */
async function loadFile(filename, defaultValue) {
  try {
    const rawData = await fs.readFile(filename, "utf8");
    return JSON.parse(rawData);
  } catch (err) {
    return defaultValue;
  }
}

/**
 * @param {string} filename
 * @param {any} data
 * @returns {Promise<void>}
 */
async function saveFile(filename, data) {
  await fs.writeFile(filename, JSON.stringify(data, null, 2));
}

/** @returns {Promise<Array>} */
async function getAllEmployees() {
  return await loadFile(EMP_FILE, []);
}

/** @param {Array} employees @returns {Promise<void>} */
async function saveEmployees(employees) {
  await saveFile(EMP_FILE, employees);
}

/** @returns {Promise<Array>} */
async function getAllShifts() {
  return await loadFile(SHIFT_FILE, []);
}

/** @returns {Promise<Array>} */
async function getAllAssignments() {
  return await loadFile(ASSIGN_FILE, []);
}

/** @param {Array} assignments @returns {Promise<void>} */
async function saveAssignments(assignments) {
  return await saveFile(ASSIGN_FILE, assignments);
}

/** @returns {Promise<{maxDailyHours:number}>} */
async function getConfig() {
  const config = await loadFile(CONFIG_FILE, { maxDailyHours: 9 });
  if (!config.maxDailyHours) config.maxDailyHours = 9;
  return config;
}

module.exports = {
  getAllEmployees,
  saveEmployees,
  getAllShifts,
  getAllAssignments,
  saveAssignments,
  getConfig
};