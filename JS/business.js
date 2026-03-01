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

  let maxNum = 0;
  for (let i = 0; i < employees.length; i++) {
    const num = Number(employees[i].employeeId.substring(1));
    if (num > maxNum) maxNum = num;
  }

  const newEmployee = {
    employeeId: "E" + String(maxNum + 1).padStart(3, "0"),
    name: name,
    phone: phone
  };

  employees.push(newEmployee);
  await db.saveEmployees(employees);

  return { ok: true, message: "Employee added. . ." };
}

// /**
//  * Assigns an employee to a shift while enforcing daily hour limits.
//  * @param {string} employeeId
//  * @param {string} shiftId
//  * @returns {Promise<{ok:boolean, message:string}>}
//  */
// async function assignShift(employeeId, shiftId) {
//   const employees = await db.getAllEmployees();
//   const shifts = await db.getAllShifts();
//   const assignments = await db.getAllAssignments();
//   const config = await db.getConfig();

//   let employeeExists = false;
//   for (let i = 0; i < employees.length; i++) {
//     if (employees[i].employeeId === employeeId) {
//       employeeExists = true;
//       break;
//     }
//   }

//   let shift = null;
//   for (let i = 0; i < shifts.length; i++) {
//     if (shifts[i].shiftId === shiftId) {
//       shift = shifts[i];
//       break;
//     }
//   }

//   if (!employeeExists || !shift) {
//     return { ok: false, message: "Employee or shift does not exist." };
//   }

//   for (let i = 0; i < assignments.length; i++) {
//     if (
//       assignments[i].employeeId === employeeId &&
//       assignments[i].shiftId === shiftId
//     ) {
//       return { ok: false, message: "This assignment already exists." };
//     }
//   }

//   let totalHours = 0;
//   for (let i = 0; i < assignments.length; i++) {
//     if (assignments[i].employeeId !== employeeId) continue;

//     for (let j = 0; j < shifts.length; j++) {
//       if (
//         shifts[j].shiftId === assignments[i].shiftId &&
//         shifts[j].date === shift.date
//       ) {
//         totalHours += computeShiftDuration(
//           shifts[j].startTime,
//           shifts[j].endTime
//         );
//       }
//     }
//   }

//   const newShiftHours = computeShiftDuration(
//     shift.startTime,
//     shift.endTime
//   );

//   if (totalHours + newShiftHours > config.maxDailyHours) {
//     return {
//       ok: false,
//       message: "Cannot assign shift. Daily hour limit exceeded."
//     };
//   }

//   assignments.push({ employeeId, shiftId });
//   await db.saveAssignments(assignments);

//   return { ok: true, message: "Employee assigned to shift. . ." };
// }

/**
 * Returns the schedule for one employee.
 * @param {string} employeeId
 * @returns {Promise<{ok:boolean, message:string, employeeName?:string, items?:Array}>}
 */
async function viewSchedule(employeeId) {
  const employees = await db.getAllEmployees();
  const shifts = await db.getAllShifts();
  const assignments = await db.getAllAssignments();

  let employeeName = "";
  let phone = "";

  // Find employee
  for (let i = 0; i < employees.length; i++) {
    if (employees[i].employeeId === employeeId) {
      employeeName = employees[i].name;
      phone = employees[i].phone;
      break;
    }
  }

  if (employeeName === "") {
    return { ok: false, message: "Employee not found." };
  }

  const items = [];

  // Build shift list
  for (let i = 0; i < assignments.length; i++) {
    if (assignments[i].employeeId === employeeId) {
      for (let j = 0; j < shifts.length; j++) {
        if (shifts[j].shiftId === assignments[i].shiftId) {
          items.push({
            date: shifts[j].date,
            startTime: shifts[j].startTime,
            endTime: shifts[j].endTime,
            shiftId: shifts[j].shiftId
          });
        }
      }
    }
  }

  return {
    ok: true,
    employeeId,
    employeeName,
    phone,
    items
  };
}

module.exports = {
  listEmployees,
  addEmployee,
  // assignShift,
  viewSchedule,
  computeShiftDuration
};