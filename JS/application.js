const {setServers} = 
require("node:dns/promises");
setServers(["1.1.1.1", "8.8.8.8"]);
require("dotenv").config();

const express = require("express");
const exphbs = require("express-handlebars");
const bz = require("./business");

const app = express();
const PORT = 8000;

// View engine setup
app.engine("handlebars", exphbs.engine({ defaultLayout: false }));
app.set("view engine", "handlebars");
app.set("views", __dirname + "/views");

app.use(express.urlencoded({ extended: true }));

// Landing Page - List of Employees
app.get("/", async (req, res) => {
  const employees = await bz.listEmployees();
  res.render("landingPage", { employees });
});

app.listen(PORT, () => {
  console.log(`Server running at http://127.0.0.1:${PORT}`);
});