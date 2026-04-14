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
const emailSystem = require("./emailSystem");
const upload = require("./uploadConfig");
const path = require("path");
const { ObjectId } = require("mongodb");

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
  if (
  req.path === "/login"  ||
  req.path === "/logout" ||
  req.path === "/twofa"
  ) {
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

  if (!user) {
    return res.redirect("/login?message=Invalid username or password");
  }

  if (user.isLocked) {
    return res.redirect("/login?message=Account is locked");
  }

  const hashed = auth.hashPassword(password);

  if (hashed !== user.password) {
    let attempts = 1;

    if (user.failedLoginAttempts) {
      attempts = user.failedLoginAttempts + 1;
    }

    await db.updateUserFailedAttempts(username, attempts);

    if (attempts === 3) {
      emailSystem.sendEmail(
        user.email,
        "Suspicious Activity Detected",
        "There have been 3 invalid login attempts on your account."
      );
    }

    if (attempts >= 10) {
      await db.lockUserAccount(username);
      return res.redirect("/login?message=Account is locked");
    }

    return res.redirect("/login?message=Invalid username or password");
  }

  await db.resetUserFailedAttempts(username);

  auth.removeExpired2FACodes();
  const code = auth.generate2FACode(username);

  emailSystem.sendEmail(
    user.email,
    "Your 2FA Code",
    "Your 2FA code is: " + code
  );

  res.render("twoFA", {
    username: username,
    message: "A 2FA code has been sent to your email."
  });
});

app.get("/twofa", (req, res) => {
  res.render("twoFA", {
    username: req.query.username,
    message: req.query.message
  });
});

app.post("/twofa", async (req, res) => {
  const username = req.body.username;
  const code = req.body.code;

  auth.removeExpired2FACodes();

  const valid = auth.verify2FACode(username, code);

  if (!valid) {
    return res.render("twoFA", {
      username: username,
      message: "Invalid or expired 2FA code"
    });
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

  result.message = req.query.message;
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

app.post("/employee/:id/upload", (req, res) => {
  upload.single("document")(req, res, async function (err) {
    if (err) {
      return res.redirect(
        "/employee/" + req.params.id + "?message=" + encodeURIComponent(err.message)
      );
    }

    const allowed = await bz.canUploadDocument(req.params.id);

    if (!allowed) {
      return res.redirect(
        "/employee/" + req.params.id + "?message=" + encodeURIComponent("Maximum 5 documents allowed")
      );
    }

    if (!req.file) {
      return res.redirect(
        "/employee/" + req.params.id + "?message=" + encodeURIComponent("Please select a PDF file")
      );
    }

    await db.addEmployeeDocument(
      new ObjectId(req.params.id),
      {
        originalName: req.file.originalname,
        storedName: req.file.filename,
        uploadedAt: new Date()
      }
    );

    res.redirect(
      "/employee/" + req.params.id + "?message=" + encodeURIComponent("Document uploaded successfully")
    );
  });
});

app.get("/employee/:id/document/:filename", (req, res) => {
  const filePath = path.join(
    __dirname,
    "uploads",
    "employeeDocs",
    req.params.filename
  );

  res.sendFile(filePath);
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