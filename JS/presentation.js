// Rashid Alsubaiey 60301072
const prompt = require("prompt-sync")();
const bz = require("./business");

function appMenu() {
  console.log("\n1. Show all employees");
  console.log("2. Add new employee");
  console.log("3. Assign employee to shift");
  console.log("4. View employee schedule");
  console.log("5. Exit");
}

async function showEmployeesUI() {
  const employees = await bz.listEmployees();

  if (employees.length === 0) {
    console.log("No employees found.");
    return;
  }

  let maxNameLength = 4; // "Name"
  for (let i = 0; i < employees.length; i++) {
    const name = employees[i].name;
    if (name.length > maxNameLength) maxNameLength = name.length;
  }

  console.log("Employee ID".padEnd(12) + "Name".padEnd(maxNameLength + 4) + "Phone");
  console.log("-----------".padEnd(12) + "-".repeat(maxNameLength + 2) + "  ---------");

  for (let i = 0; i < employees.length; i++) {
    console.log(
      employees[i].employeeId.padEnd(12) +
        employees[i].name.padEnd(maxNameLength + 4) +
        employees[i].phone
    );
  }
}

async function addEmployeeUI() {
  const name = prompt("Enter employee name: ");
  const phone = prompt("Enter phone number: ");

  const result = await bz.addEmployee(name, phone);
  console.log(result.message);
}

async function assignShiftUI() {
  const employeeId = prompt("Enter employee ID (E###): ").trim();
  const shiftId = prompt("Enter shift ID (S###): ").trim();

  const result = await bz.assignShift(employeeId, shiftId);
  console.log(result.message);
}

async function viewScheduleUI() {
  const employeeId = prompt("Enter employee ID (E###): ").trim();

  const result = await bz.viewSchedule(employeeId);

  if (!result.ok) {
    console.log(result.message);
    return;
  }

  console.log(`Schedule for ${employeeId} (${result.employeeName}):`);

  if (!result.items || result.items.length === 0) {
    console.log("No shifts assigned.");
    return;
  }

  for (let i = 0; i < result.items.length; i++) {
    const s = result.items[i];
    console.log(`${s.date} ${s.startTime}-${s.endTime} (${s.shiftId})`);
  }
}

async function main() {
  let choice = "";
  while (choice !== "5") {
    appMenu();
    choice = prompt("What is your choice> ");

    switch (choice) {
      case "1":
        await showEmployeesUI();
        break;
      case "2":
        await addEmployeeUI();
        break;
      case "3":
        await assignShiftUI();
        break;
      case "4":
        await viewScheduleUI();
        break;
      case "5":
        console.log("Exiting application.");
        break;
      default:
        console.log("Invalid choice. Please only enter numbers 1-5.");
    }
  }
}
main();