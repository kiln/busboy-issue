const fs = require("fs"),
      http = require("http");

const Busboy = require("busboy");

const HOST = "127.0.0.1",
      PORT = 8765,

      UPLOADED_FILENAME = "/tmp/uploaded-file";


const app = http.createServer(function(req, res) {
    if (req.url !== "/") {
        res.writeHead(404, { Connection: "close", "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not found");
        return;
    }
    if (req.method !== "POST") {
        res.writeHead(405, { Connection: "close", "Content-Type": "text/plain; charset=utf-8", Allow: "POST" });
        res.end("Method not allowed");
        return;
    }

    console.log("Request received...");
    const busboy = new Busboy({ headers: req.headers });
    busboy.on("field", (key, value) => {
        console.log(`  ${key} = ${value}`);
    });
    busboy.on("file", (name, file, filename, encoding, mimetype) => {
        console.log(`  Received file: ${name} = ${filename}; writing to ${UPLOADED_FILENAME}`);
        file.pipe(fs.createWriteStream(UPLOADED_FILENAME));
    });
    req.pipe(busboy);
    busboy.on("finish", () => {
        console.log("Sending response.\n");
        res.writeHead(200, {"Content-Type": "text/plain; charset=utf-8"});
        res.end("OK");
    });
});

app.listen(PORT, HOST, () => {
    console.log(`Server listening on ${HOST}:${PORT}...`);
});
