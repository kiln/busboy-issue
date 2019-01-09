The code in this repository demonstrates an apparent problem with [busboy](https://github.com/mscdex/busboy).

It consists of a server programs (`server`), and a client program (`client`). Running the client against the server should result in a hang after some small but indeterminate number of requests.

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
