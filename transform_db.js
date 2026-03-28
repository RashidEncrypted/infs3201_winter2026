// Need 1 time migration script to convert from old JSON files to MongoDB collections, then we can remove this file and the old JSON files
require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
const DB_NAME = "ess";

async function connect() {
  await client.connect();
  return client.db(DB_NAME);
}

async function addEmployeesArray(db) {
  const shifts = await db.collection("shifts").find({}).toArray();

  for (let i = 0; i < shifts.length; i++) {
    if (!shifts[i].employees) {
      shifts[i].employees = [];

      await db.collection("shifts").replaceOne(
        { _id: shifts[i]._id },
        shifts[i]
      );
    }
  }

  console.log("Step 1 done.");
}

async function moveEmployees(db) {
  const employees = await db.collection("employees").find({}).toArray();
  const shifts = await db.collection("shifts").find({}).toArray();
  const assignments = await db.collection("assignments").find({}).toArray();

  for (let i = 0; i < assignments.length; i++) {
    let empId = null;
    let shift = null;

    for (let j = 0; j < employees.length; j++) {
      if (employees[j].employeeId === assignments[i].employeeId) {
        empId = employees[j]._id;
        break;
      }
    }

    for (let j = 0; j < shifts.length; j++) {
      if (shifts[j].shiftId === assignments[i].shiftId) {
        shift = shifts[j];
        break;
      }
    }

    if (!empId || !shift) {
      continue;
    }

    if (!shift.employees) {
      shift.employees = [];
    }

    let exists = false;
    for (let j = 0; j < shift.employees.length; j++) {
      if (String(shift.employees[j]) === String(empId)) {
        exists = true;
        break;
      }
    }

    if (!exists) {
      shift.employees.push(empId);

      await db.collection("shifts").replaceOne(
        { _id: shift._id },
        shift
      );
    }
  }

  console.log("Step 2 done.");
}

async function removeOldData(db) {
  const employees = await db.collection("employees").find({}).toArray();
  const shifts = await db.collection("shifts").find({}).toArray();

  for (let i = 0; i < employees.length; i++) {
    if (employees[i].employeeId !== undefined) {
      delete employees[i].employeeId;

      await db.collection("employees").replaceOne(
        { _id: employees[i]._id },
        employees[i]
      );
    }
  }

  for (let i = 0; i < shifts.length; i++) {
    if (shifts[i].shiftId !== undefined) {
      delete shifts[i].shiftId;

      await db.collection("shifts").replaceOne(
        { _id: shifts[i]._id },
        shifts[i]
      );
    }
  }

  await db.collection("assignments").drop();

  console.log("Step 3 done.");
}

async function main() {
  try {
    const db = await connect();

    await addEmployeesArray(db);
    await moveEmployees(db);
    await removeOldData(db);

    console.log("Transform complete.");
  } catch (err) {
    console.error("Transform failed:", err);
  } finally {
    await client.close();
  }
}

main();