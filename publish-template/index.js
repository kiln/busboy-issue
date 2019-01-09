const fs = require("fs"),
      http = require("http"),
      path = require("path"),
      { promisify } = require("util");

const HOST = "127.0.0.1",

      // PORT = 3000,
      // PATH = "/api/v1/template/publish",

      PORT = 8765,
      PATH = "/",

      SDK_VERSION = "3.7.1",
      TEMPLATE_ID = "survey",
      TEMPLATE_VERSION = "9.9.9",
      TIMEOUT_MS = 20 * 1000,
      DELAY_MS = 10,
      BOUNDARY = "u2KxIV5yF1y+xUspOQCCZopaVgeV6Jxihv35XQJmuTx8X3sh";

const sdk_tokens_file = path.join(process.env.HOME || process.env.USERPROFILE, ".flourish_sdk");

async function getSdkToken(server_opts) {
    const body = await promisify(fs.readFile)(sdk_tokens_file, "utf8");
    return JSON.parse(body)["localhost:3000"];
}

/* Formatting of form-data */
function formDataSection(key, value) {
    return Buffer.from(`\r\n--${BOUNDARY}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}`);
}
async function formDataFile(key, filename, content_type) {
    const contents = await promisify(fs.readFile)(filename);
    return Buffer.concat([
      Buffer.from(`\r\n--${BOUNDARY}\r\n`),
      Buffer.from(`Content-Disposition: form-data; name="${key}"; filename="${path.basename(filename)}"\r\n`),
      Buffer.from(`Content-Type: ${content_type}\r\n\r\n`),
      contents
  ]);
}
const form_data_terminator = Buffer.from(`\r\n--${BOUNDARY}--\r\n`);


/* Send the HTTP request with two write() calls, pausing between them. */

async function getParts() {
    const sdk_token = await getSdkToken();
    const file = await formDataFile("template", "template.zip", "application/zip");
    return [
        formDataSection("id", TEMPLATE_ID),
        formDataSection("version", TEMPLATE_VERSION),
        file,
        formDataSection("sdk_token", sdk_token),
        formDataSection("sdk_version", SDK_VERSION),
        form_data_terminator
    ];
}

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

async function publishTemplate() {
    const parts = await getParts();
    let length = 0;
    for (const part of parts) length += part.length;

    const req = http.request({
        host: HOST,
        port: PORT,
        path: PATH,
        method: "POST",
        timeout: TIMEOUT_MS,
        headers: {
            "Content-Type": "multipart/form-data; boundary=" + BOUNDARY,
            "Content-Length": length,
            "Connection": "close"
        }
    });

    console.log("Sending request in parts");
    await writeParts(req, parts);

    return new Promise(function(resolve, reject) {
        req.on("error", reject);
        req.end();

        req.once("response", (res) => {
            console.log("Server responded with status", res.statusCode);

            let chunks = [];
            res.on("data", d => chunks.push(d));
            res.on("end", () => {
                console.log(`Response from server: ${chunks.join("")}`);
                resolve();
            });
            res.on("error", reject);
        });
    });
}

async function main() {
    for(;;) {
        await publishTemplate();
    }
}

main();
