The code in this repository demonstrates an apparent problem with [busboy](https://github.com/mscdex/busboy).

It consists of a server program (`server`), and a client program (`client`). Running the client against the server should result in a hang after some small but indeterminate number of requests.

Tested with Node v9.6.1.

## Usage

In one terminal window, run:
```
(cd server && npm start)
```

and then in another, run:
```
(cd client && npm start)
```

It should hang fairly quickly.

## Discussion

* This is a cut-down test case derived from a bug in our application, so it's a real-world problem – even if it looks a little contrived when reduced to a test case. The widely-used [request](https://www.npmjs.com/package/request) package splits fields across `write()` calls in precisely the way that this test client does.
* The problem only seems to occur when using the `.pipe()` method of the file object. Listening for `data` and `end` events works as expected, without hanging.
* It seems to depend on how the request is split across TCP/IP packets. Sending the terminator string in the same chunk as the final field also makes it work without hanging. For example, this change to the client makes it work:

```diff
diff --git a/client/index.js b/client/index.js
index b22924d..c8a86e4 100644
--- a/client/index.js
+++ b/client/index.js
@@ -34,8 +34,11 @@ const parts = [
     formDataSection("foo", "foo value"),
     formDataFile("file", "file.bin", "application/octet-stream"),
     formDataSection("bar", "bar value"),
-    formDataSection("baz", "baz value"),
-    form_data_terminator
+
+    Buffer.concat([
+        formDataSection("baz", "baz value"),
+        form_data_terminator
+    ])
 ];
 
 function writeParts(req, parts) {
```
