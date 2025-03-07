const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const port = 3000;

const streamLinks = {
    "site1": "https://manifest.googlevideo.com/api/manifest/dash/expire/1741332511/ei/v0vKZ62HMreN3LUP8_rpsAY/ip/2001%3A448a%3A5040%3A4719%3Aec24%3A402f%3Ad794%3Affd2/id/yNKvkPJl-tg.4/source/yt_live_broadcast/requiressl/yes/xpc/EgVo2aDSNQ%3D%3D/as/fmp4_audio_clear%2Cwebm_audio_clear%2Cwebm2_audio_clear%2Cfmp4_sd_hd_clear%2Cwebm2_sd_hd_clear/siu/1/spc/RjZbSf9_wPQ1GwKnkEtoJLTqdjh8MmSeiHdaioobMamj9qgAgt95kDVuB_CHNbU/vprv/1/rqh/2/pacing/0/keepalive/yes/fexp/51326932%2C51355912%2C51358317%2C51411871/itag/0/playlist_type/LIVE/sparams/expire%2Cei%2Cip%2Cid%2Csource%2Crequiressl%2Cxpc%2Cas%2Csiu%2Cspc%2Cvprv%2Crqh%2Citag%2Cplaylist_type/sig/AJfQdSswRQIgXrgciJnniESVQMZiR-yRBtIiKzkvZEL2KyGjkH1sIqgCIQDHHJAqO_c2iWgyOvcFFVUwcxsPX7x0RuwwMIMaMHA73A%3D%3D","hlsManifestUrl":"https://manifest.googlevideo.com/api/manifest/hls_variant/expire/1741332511/ei/v0vKZ62HMreN3LUP8_rpsAY/ip/2001%3A448a%3A5040%3A4719%3Aec24%3A402f%3Ad794%3Affd2/id/yNKvkPJl-tg.4/source/yt_live_broadcast/requiressl/yes/xpc/EgVo2aDSNQ%3D%3D/hfr/1/playlist_duration/30/manifest_duration/30/maxh/4320/maudio/1/siu/1/bui/AUWDL3wM-KP8q6MiJ2HMzmJ75iaLXbPjjWJw-68jvVjsuMgvZFp3SeNMn7N-zyy87p76R2EQdg/spc/RjZbSf98wPQ1GwKnkEtoJLTqdjh8MmSeiHdaioobMamj9qgAgt95kDVuB_CHBbZ9zQ/vprv/1/go/1/rqh/5/pacing/0/nvgoi/1/ncsapi/1/keepalive/yes/fexp/51326932%2C51355912%2C51358317%2C51411871/dover/11/itag/0/playlist_type/DVR/sparams/expire%2Cei%2Cip%2Cid%2Csource%2Crequiressl%2Cxpc%2Chfr%2Cplaylist_duration%2Cmanifest_duration%2Cmaxh%2Cmaudio%2Csiu%2Cbui%2Cspc%2Cvprv%2Cgo%2Crqh%2Citag%2Cplaylist_type/sig/AJfQdSswRQIhAOXvbK3WB9TsFInxCgO9akHQc321IAyLVgWFY193eMCzAiBW2-tFuM6z_1xi3YIg7mhAzNA0HCHlceWMx1JyI4odng%3D%3D/file/index.m3u8",
};

// Objek untuk menyimpan IP yang aktif dan status akses
let activeSessions = {};

// Middleware untuk mengatur akses 1 IP per website
app.use((req, res, next) => {
    const userIP = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const siteID = req.path.split("/")[1]; // Ambil siteID dari URL

    if (!streamLinks[siteID]) {
        return res.status(404).send("Website tidak ditemukan.");
    }

    // Jika tidak ada sesi aktif, simpan IP baru
    if (!activeSessions[siteID]) {
        activeSessions[siteID] = { ip: userIP, active: true };
        console.log(`IP ${userIP} sekarang memiliki akses eksklusif ke ${siteID}`);
    }

    // Jika IP yang sama mengakses ulang, izinkan
    if (activeSessions[siteID].ip === userIP) {
        return next();
    }

    // Jika IP berbeda mencoba mengakses, tolak akses
    if (activeSessions[siteID].active) {
        return res.send("<h1>Silahkan logout dari perangkat lainnya sebelum masuk.</h1>");
    }

    next();
});

// Endpoint untuk logout (membuka akses untuk IP baru)
app.get("/:siteID/logout", (req, res) => {
    const siteID = req.params.siteID;
    const userIP = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    if (activeSessions[siteID] && activeSessions[siteID].ip === userIP) {
        console.log(`IP ${userIP} telah logout dari ${siteID}`);
        delete activeSessions[siteID]; // Hapus sesi, memungkinkan IP baru masuk
        return res.send("<h1>Anda berhasil logout. IP baru sekarang bisa masuk.</h1>");
    }

    res.send("<h1>Anda tidak sedang login ke website ini.</h1>");
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
