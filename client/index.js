const crypto = require("crypto"),
      fs = require("fs"),
      http = require("http");

const HOST = "127.0.0.1",
      PORT = 8765,
      PATH = "/",

      // Changing the value of DELAY_MS does not seem to affect the
      // frequency of the problem, with the chunks combined as they
      // are below. If the "file" and "bar" chunks are separate, then
      // a smaller delay value makes the problem occur more frequently.
      // A delay of 0 is recommended for testing that case.
      DELAY_MS = 100,

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

/* The chunks of the request. Each chunk is written separately. */
const chunks = [
    // Combining these two into the same chunk makes the problem
    // happen more reliably. If they are written separately, and
    // the value of DELAY_MS is small (ideally 0) then it still
    // happens sometimes, I think when these happen to be combined
    // into the same read on the server.
    Buffer.concat([
        formDataFile("file", "file.bin", "application/octet-stream"),
        formDataSection("foo", "foo value"),
    ]),

    // Conversely, combining these two into the same chunk seems to
    // prevent the problem from happening.
    formDataSection("bar", "bar value"),
    form_data_terminator
];

function writeChunks(req, chunks) {
    let index = 0;

    function pf(resolve, reject) {
        if (index == chunks.length) return resolve();
        setTimeout(function() {
            req.write(chunks[index++]);
            resolve(new Promise(pf));
        }, DELAY_MS);
    };

    return new Promise(pf);
}

async function sendRequest() {
    let length = 0;
    for (const chunk of chunks) length += chunk.length;

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
    await writeChunks(req, chunks);

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
