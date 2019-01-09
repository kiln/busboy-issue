const crypto = require("crypto"),
      fs = require("fs"),
      http = require("http");

const HOST = "127.0.0.1",
      PORT = 8765,
      PATH = "/",

      DELAY_MS = 0,
      BOUNDARY = "u2KxIV5yF1y+xUspOQCCZopaVgeV6Jxihv35XQJmuTx8X3sh",

      FILE_SIZE = 100000;

// Generate a random file buffer of FILE_SIZE bytes
const random_file_buffer = Buffer.alloc(FILE_SIZE);
crypto.randomFillSync(random_file_buffer);

/* Formatting of form-data */
function formDataSection(key, value) {
    return Buffer.from(`\r\n--${BOUNDARY}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}`);
}
function formDataFile(key, filename, content_type) {
    return Buffer.concat([
      Buffer.from(`\r\n--${BOUNDARY}\r\n`),
      Buffer.from(`Content-Disposition: form-data; name="${key}"; filename="${filename}"\r\n`),
      Buffer.from(`Content-Type: ${content_type}\r\n\r\n`),
      random_file_buffer
  ]);
}
const form_data_terminator = Buffer.from(`\r\n--${BOUNDARY}--\r\n`);

/* The parts of the request. Each part is written separately. */
const parts = [
    formDataSection("foo", "foo value"),
    formDataFile("file", "file.bin", "application/octet-stream"),
    formDataSection("bar", "bar value"),
    formDataSection("baz", "baz value"),
    form_data_terminator
];

function writeParts(req, parts) {
    let index = 0;

    function pf(resolve, reject) {
        if (index == parts.length) return resolve();
        setTimeout(function() {
            req.write(parts[index++]);
            resolve(new Promise(pf));
        }, DELAY_MS);
    };

    return new Promise(pf);
}

async function sendRequest() {
    let length = 0;
    for (const part of parts) length += part.length;

    const req = http.request({
        host: HOST,
        port: PORT,
        path: PATH,
        method: "POST",
        headers: {
            "Content-Type": "multipart/form-data; boundary=" + BOUNDARY,
            "Content-Length": length,
            "Connection": "close"
        }
    });

    console.log("Sending request");
    await writeParts(req, parts);

    return new Promise(function(resolve, reject) {
        req.on("error", reject);
        req.once("response", (res) => {
            console.log("Server responded with status", res.statusCode);

            let chunks = [];
            res.on("data", d => chunks.push(d));
            res.on("end", () => {
                console.log(`Response from server: ${chunks.join("")}`);
                resolve();
            });
        });
        req.end();
    });
}

async function main() {
    try {
        for(;;) await sendRequest();
    }
    catch (e) {
        console.error("Exception!", e.message);
    }
}

main();
