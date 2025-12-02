const express = require("express");
const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");
const cors = require("cors");
const app = express();

app.use(cors());

// Configure S3
const s3 = new AWS.S3({
  region: "us-east-1"
});

// Multer S3 storage
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "cih-plan-document",
    acl: "private", // secure
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const fileName = Date.now() + "-" + file.originalname;
      cb(null, fileName);
    }
  })
});

// Upload API
app.post("/uploadPlanFile", upload.single("file"), (req, res) => {
  res.json({
    message: "File uploaded successfully!",
    fileUrl: req.file.location
  });
});

// Start
app.listen(3000, () => console.log("Server started on port 3000"));
