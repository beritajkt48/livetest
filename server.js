const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const port = 3000;

const streamLinks = {
    "site1": "https://manifest.googlevideo.com/api/manifest/hls_variant/.../file/index.m3u8",
    "site2": "https://manifest.googlevideo.com/api/manifest/hls_variant/.../file/index.m3u8",
    "site3": "https://manifest.googlevideo.com/api/manifest/hls_variant/.../file/index.m3u8"
};

// Objek untuk menyimpan IP yang diperbolehkan mengakses setiap website
let activeIPs = {};

app.use(cors());

// Middleware untuk membatasi akses ke 1 IP per website
app.use((req, res, next) => {
    const userIP = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const siteID = req.path.split("/")[1]; // Ambil siteID dari URL

    if (!streamLinks[siteID]) {
        return res.status(404).send("Website tidak ditemukan.");
    }

    if (!activeIPs[siteID]) {
        activeIPs[siteID] = userIP;
        console.log(`IP ${userIP} sekarang memiliki akses eksklusif ke ${siteID}`);
    }

    if (activeIPs[siteID] !== userIP) {
        return res.send("<h1>Silahkan logout dari perangkat lainnya.</h1>");
    }

    next();
});

// Endpoint untuk mengambil link M3U8 per website
app.get("/:siteID/stream", (req, res) => {
    const siteID = req.params.siteID;
    if (!streamLinks[siteID]) {
        return res.status(404).send("Website tidak ditemukan.");
    }
    res.json({ streamUrl: streamLinks[siteID] });
});

// Menyajikan halaman HTML per website
app.get("/:siteID", (req, res) => {
    if (!streamLinks[req.params.siteID]) {
        return res.status(404).send("Website tidak ditemukan.");
    }
    res.sendFile(path.join(__dirname, "index.html"));
});

// Jalankan server
app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
