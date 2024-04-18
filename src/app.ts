const express = require("express");
const fs = require("fs").promises; // Using promises version of fs
const path = require("path");
const multer = require("multer");
const JSZip = require("jszip");

const app = express();
const port = 3002;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "/uploads/")); // Save files to the 'uploads' directory
  },
  filename: function (req, file, cb) {
    // Generate a unique filename by appending a timestamp
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 1024 * 5, // Максимальный размер файла (в байтах) - в данном случае, 5 Gb
  },
});

async function avoUnzipFile(zipFilePath, destinationPath) {
  const zipData = await fs.readFile(zipFilePath);
  const zip = await JSZip.loadAsync(zipData);
  await Promise.all(Object.keys(zip.files).map(async (filename) => {
    const fileData = await zip.files[filename].async('nodebuffer');
    const filePath = path.join(destinationPath, filename);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, fileData);
  }));
}


app.get("/", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "index.html");
    const htmlContent = await fs.readFile(filePath, "utf-8");
    res.setHeader("Content-Type", "text/html");
    res.send(htmlContent);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    const destinationPath = path.join(path.dirname(req.file.path), path.parse(req.file.filename).name);
    await avoUnzipFile(req.file.path, destinationPath);

    res.send("File uploaded successfully");
  } catch (error) {
    return res.status(500).json({ code: 200202, message: 'attach add Internal Server Error: ' + (error).message });
  }
});

const server = app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});


server.setTimeout(1000 * 60 * 60); // 1 hour
