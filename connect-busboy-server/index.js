const { Writable } = require("stream");

const busboy = require("connect-busboy"),
      express = require("express");

const app = express();

const HOST = "127.0.0.1",
      PORT = 8765;

app.use(busboy());

app.post("/", function(req, res) {
    console.log("Request received...");
    req.busboy.on("field", (key, value) => {
        console.log(`  ${key} = ${value}`);
    });
    req.busboy.on("file", (name, file, filename, encoding, mimetype) => {
        console.log(`  Received file: ${name} = ${filename}`);
        file.on("data", (chunk) => {
            console.log(`  read chunk of length ${chunk.length}`);
        })
        .on("end", () => {
            console.log("  finished reading file");
        });
    });
    req.pipe(req.busboy);
    req.busboy.on("finish", () => {
        console.log("Sending response.\n");
        res.header("Content-type", "text/plain; charset=utf-8").send("OK");
    });
});

app.listen(PORT, HOST, () => {
    console.log(`Server listening on ${HOST}:${PORT}...`);
});
