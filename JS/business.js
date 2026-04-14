const db = require("./persistance");

// Function generated using ChatGPT
// Prompt used:
// "Create a function that calculates the number of hours between two times
// in HH:MM format. Example: 11:00 to 13:30 should return 2.5."

/**
 * Calculates the duration of a shift in hours.
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @returns {number} Number of hours worked
 */
function computeShiftDuration(startTime, endTime) {
  const startParts = startTime.split(":");
  const endParts = endTime.split(":");

  const startMinutes = Number(startParts[0]) * 60 + Number(startParts[1]);
  const endMinutes = Number(endParts[0]) * 60 + Number(endParts[1]);

  return (endMinutes - startMinutes) / 60;
}

/**
 * Returns all employees.
 * @returns {Promise<Array>}
 */
async function listEmployees() {
  return await db.getAllEmployees();
}

/**
 * Adds a new employee.
 * @param {string} name
 * @param {string} phone
 * @returns {Promise<{ok:boolean, message:string}>}
 */
async function addEmployee(name, phone) {
  const employees = await db.getAllEmployees();

  if (name === "" || phone === "") {
    return { ok: false, message: "Name and phone cannot be empty." };
  }

  const newEmployee = {
    name: name,
    phone: phone
  };

  // ^^ employeeId removed and MongoDB _id should be used instead

  employees.push(newEmployee);
  await db.saveEmployees(employees);

  return { ok: true, message: "Employee added. . ." };
}

async function assignShift(employeeId, shiftId) {
  const employees = await db.getAllEmployees();
  const shifts = await db.getAllShifts();

  let employee = null;
  let shift = null;

  for (let i = 0; i < employees.length; i++) {
    if (String(employees[i]._id) === String(employeeId)) {
      employee = employees[i];
      break;
    }
  }

  for (let i = 0; i < shifts.length; i++) {
    if (String(shifts[i]._id) === String(shiftId)) {
      shift = shifts[i];
      break;
    }
  }

  if (!employee || !shift) {
    return { ok: false, message: "Employee or shift does not exist." };
  }

  if (!shift.employees) {
    shift.employees = [];
  }

  for (let i = 0; i < shift.employees.length; i++) {
    if (String(shift.employees[i]) === String(employee._id)) {
      return { ok: false, message: "This assignment already exists." };
    }
  }

  shift.employees.push(employee._id);
  await db.saveShifts(shifts);

  return { ok: true, message: "Employee assigned to shift. . ." };
}

/**
 * Returns the schedule for one employee.
 * @param {string} employeeId
 * @returns {Promise<{ok:boolean, message:string, employeeName?:string, items?:Array}>}
 */
async function viewSchedule(employeeId) {
  const employees = await db.getAllEmployees();
  const shifts = await db.getAllShifts();

  let employee = null;

  for (let i = 0; i < employees.length; i++) {
    if (String(employees[i]._id) === String(employeeId)) {
      employee = employees[i];
      break;
    }
  }

  if (!employee) {
    return { ok: false, message: "Employee not found." };
  }

  const items = [];

  for (let i = 0; i < shifts.length; i++) {
    if (!shifts[i].employees) {
      continue;
    }

    let found = false;

    for (let j = 0; j < shifts[i].employees.length; j++) {
      if (String(shifts[i].employees[j]) === String(employee._id)) {
        found = true;
        break;
      }
    }

    if (found) {
      const hour = Number(shifts[i].startTime.split(":")[0]);
      items.push({
        date: shifts[i].date,
        startTime: shifts[i].startTime,
        endTime: shifts[i].endTime,
        isMorning: hour < 12
      });
    }
  }

  return {
    ok: true,
    _id: String(employee._id),
    employeeName: employee.name,
    phone: employee.phone,
    photo: employee.photo,
    documents: employee.documents || [],
    items
  };
}

async function getEmployeeById(employeeId) {
  const employees = await db.getAllEmployees();

  for (let i = 0; i < employees.length; i++) {
    if (String(employees[i]._id) === String(employeeId)) {
      return employees[i];
    }
  }

  return null;
}

async function updateEmployee(employeeId, name, phone) {
  const employees = await db.getAllEmployees();

  for (let i = 0; i < employees.length; i++) {
    if (String(employees[i]._id) === String(employeeId)) {
      employees[i].name = name;
      employees[i].phone = phone;
      await db.saveEmployees(employees);
      return true;
    }
  }

  return false;
}

async function canUploadDocument(employeeId) {
  const employees = await db.getAllEmployees();

  for (let i = 0; i < employees.length; i++) {
    if (String(employees[i]._id) === String(employeeId)) {
      if (!employees[i].documents) {
        return true;
      }

      return employees[i].documents.length < 5;
    }
  }

  return false;
}

module.exports = {
  listEmployees,
  addEmployee,
  assignShift,
  viewSchedule,
  computeShiftDuration,
  getEmployeeById,
  updateEmployee,
  canUploadDocument
};