require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const { Dropbox } = require("dropbox");
const fetch = require("node-fetch");

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static("public"));

const ACCESS_TOKEN = process.env.DROPBOX_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error("❌ DROPBOX_ACCESS_TOKEN 환경변수가 설정되어 있지 않습니다!");
  process.exit(1);
}

const dbx = new Dropbox({
  accessToken: ACCESS_TOKEN,
  fetch: fetch,
});

app.post("/upload", async (req, res) => {
  const { hashtags, photoData } = req.body;

  if (!photoData || !photoData.startsWith("data:image/jpeg;base64,")) {
  return res.status(400).json({ error: "Invalid image data" });
}


  const base64Data = photoData.replace(/^data:image\/jpeg;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  const now = new Date();
  const timestamp = now.toISOString().split("T")[0];
  const filename = `${timestamp}_${Date.now()}.jpg`;
  const path = `/APlaceICallHomeUploads/${filename}`;

  try {
    const response = await dbx.filesUpload({
      path,
      contents: buffer,
      mode: { ".tag": "add" }
    });

    console.log(`📥 Uploaded file to Dropbox: ${path}`);
    console.log(`🏷️ Hashtags: ${hashtags}`);
    console.log("Dropbox response:", response);

    res.json({ path });
  } catch (error) {
    console.error("❌ Dropbox upload error:", error.response || error.stack || error);
    res.status(500).send("Upload failed");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on http://localhost:${PORT}`);
});
