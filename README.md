The code in this repository demonstrates a problem with [express-busboy](https://github.com/yahoo/express-busboy).

It consists of two server programs (`express-busboy-server` and `connect-busboy-server`), and one client program (`publish-template`). Running the client against the `express-busboy-server` should result in a hang after some indeterminate number of requests; running the client agains the `connect-busboy-server` should run successfully forever.

## Usage

In one terminal window, run:
```
(cd express-busboy-server && npm start)
```

and in another, run:
```
(cd publish-template && npm start)
```

It should hang fairly quickly.

On the other hand, if you instead run the server that uses connect-busboy directly:
```
(cd connect-busboy-server && npm start)
```

then it should run forever without hanging.

The root cause of this problem is still unknown. My best guess is that the underlying problem is actually with busboy itself, and that express-busboy uses busboy in a way that triggers the underlying bug.
