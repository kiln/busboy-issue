The code in this repository demonstrates an apparent problem with [busboy](https://github.com/mscdex/busboy).

It consists of a server program (`server`), and a client program (`client`). Running the client against the server should result in a hang, usually on the first request.

There is also a standalone demonstration that writes the chunks to busboy directly.

Tested with Node v9.6.1.

## Standalone demonstration

```
(cd standalone && npm start)
```

Note that it does not print field `bar`, nor does it print `Completed successfully!`.

## Client/server demonstration

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
* It seems to depend on how the request is split across TCP/IP packets. See this code from the client:

https://github.com/kiln/busboy-issue/blob/1aa2b88bf338734a4285f14e1257b80e4e4d62cc/client/index.js#L38-L54
