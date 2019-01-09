const crypto = require("crypto"),
      fs = require("fs");
const Busboy = require("busboy");

const UPLOADED_FILENAME = "/tmp/uploaded-file",
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
    // Separating these two into separate chunks makes it work. Note
    // that this combined buffer is longer than 64k bytes, so will
    // be written to busboy as two separate writes.
    Buffer.concat([
        formDataFile("file", "file.bin", "application/octet-stream"),
        formDataSection("foo", "foo value"),
    ]),

    // Conversely, combining these two into the same chunk seems to
    // also prevent the problem from happening.
    formDataSection("bar", "bar value"),
    form_data_terminator
];


let length = 0;
for (const chunk of chunks) length += chunk.length;

const busboy = new Busboy({ headers: {
    "content-type": "multipart/form-data; boundary=" + BOUNDARY,
    "content-length": length,
}});

busboy.on("field", (key, value) => {
    console.log(`  ${key} = ${value}`);
});
busboy.on("file", (name, file, filename, encoding, mimetype) => {
    console.log(`  Received file: ${name} = ${filename}; writing to ${UPLOADED_FILENAME}`);
    file.pipe(fs.createWriteStream(UPLOADED_FILENAME));
});
busboy.on("finish", () => {
    console.log("Completed successfully!\n");
});

for (let chunk of chunks) {
    while (chunk.length > 65536) {
        busboy.write(chunk.slice(0, 65536));
        chunk = chunk.slice(65536);
    }
    if (chunk.length > 0) busboy.write(chunk);
}

