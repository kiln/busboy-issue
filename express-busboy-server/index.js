const express_busboy = require("express-busboy"),
      express = require("express");

const app = express();

const HOST = "127.0.0.1",
      PORT = 8765;

express_busboy.extend(app, { upload: true });

app.post("/", function(req, res) {
    console.log("Request received...");
    for (const key in req.body) {
        console.log(`  ${key} = ${req.body[key]}`);
    }
    for (const key in req.files) {
        console.log(`  Received file ${key} = ${req.files[key].filename}`);
    }
    console.log("Sending response.\n");
    res.header("Content-type", "text/plain; charset=utf-8").send("OK");
});

app.listen(PORT, HOST, () => {
    console.log(`Server listening on ${HOST}:${PORT}...`);
});
