// Tried accept only PDF files, but it was not working in Postman. So I switched to checking the mimetype instead, which works correctly.
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadPath = path.join(__dirname, "uploads", "employeeDocs");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9) + ".pdf";
    cb(null, uniqueName);
  }
});

function fileFilter(req, file, cb) {
  if (
    file.mimetype !== "application/pdf" ||
    path.extname(file.originalname).toLowerCase() !== ".pdf"
  ) {
    return cb(new Error("Only PDF files are allowed"));
  }

  cb(null, true);
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024
  }
});

module.exports = upload;