const {setServers} = 
require("node:dns/promises");
setServers(["1.1.1.1", "8.8.8.8"]);
require("dotenv").config();

const express = require("express");
const exphbs = require("express-handlebars");
const cookieParser = require("cookie-parser");
const bz = require("./business");
const db = require("./persistance");
const auth = require("./auth");

const app = express();
const PORT = 8000;

// View engine setup
app.engine("handlebars", exphbs.engine({ defaultLayout: false }));
app.set("view engine", "handlebars");
app.set("views", __dirname + "/views");

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(async (req, res, next) => {
  let username = "unknown";

  if (req.cookies.sid) {
    auth.removeExpiredSessions();

    const session = auth.getSession(req.cookies.sid);
    if (session) {
      username = session.username;
    }
  }

  await db.addSecurityLog({
    timestamp: new Date(),
    username: username,
    url: req.originalUrl,
    method: req.method
  });

  next();
});

app.use((req, res, next) => {
  if (req.path === "/login" || req.path === "/logout") {
    return next();
  }

  auth.removeExpiredSessions();

  const sid = req.cookies.sid;

  if (!sid) {
    return res.redirect("/login?message=Please login first");
  }

  const session = auth.getSession(sid);

  if (!session) {
    res.clearCookie("sid");
    return res.redirect("/login?message=Session expired. Please login again");
  }

  auth.extendSession(session);
  next();
});

app.get("/login", (req, res) => {
  res.render("login", { message: req.query.message });
});

app.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const user = await db.getUserByUsername(username);
  // console.log("username entered:", username);
  // console.log("user found:", user); // temp just to check if user is being found in DB

  if (!user) {
    return res.redirect("/login?message=Invalid username or password");
  }

  const hashed = auth.hashPassword(password);
  // console.log("hashed entered password:", hashed);
  // console.log("stored password:", user ? user.password : "no user"); // temp just to check if password is being hashed correctly and matches stored hash

  if (hashed !== user.password) {
    return res.redirect("/login?message=Invalid username or password");
  }

  const sid = auth.createSession(username);

  res.cookie("sid", sid, {
    maxAge: 5 * 60 * 1000,
    httpOnly: true
  });

  res.redirect("/");
});

// Landing Page - List of Employees
app.get("/", async (req, res) => {
  const employees = await bz.listEmployees();
  res.render("landingPage", { employees });
});

// Employee Page - Employee Details
  app.get("/employee/:id", async (req, res) => {
  const result = await bz.viewSchedule(req.params.id);
  if (!result.ok) {
    return res.send(result.message);
  }
  res.render("employeeDetails", result);
});

// Show Edit Form
app.get("/edit/:id", async (req, res) => {
  const employee = await bz.getEmployeeById(req.params.id);

  if (!employee) {
    return res.send("Employee not found.");
  }

  res.render("editEmployee", employee);
});

// Handle Edit Submission
app.post("/edit/:id", async (req, res) => {
  await bz.updateEmployee(
    req.params.id,
    req.body.name,
    req.body.phone
  );

  res.redirect("/employee/" + req.params.id);
});

app.get("/logout", (req, res) => {
  const sid = req.cookies.sid;

  if (sid) {
    auth.deleteSession(sid);
  }

  res.clearCookie("sid");
  res.redirect("/login?message=Logged out successfully");
});

app.listen(PORT, () => {
  console.log(`Server running at http://127.0.0.1:${PORT}`);
});