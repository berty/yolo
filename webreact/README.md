# Initializing React for Yolo ⚛

Just a placeholder for now. You must launch it from this subdirectory.

You will need to set `$YOLO_APP_PW` in your local environment before running these commands. (This is still not secure enough for production, but allows us to avoid committing a hardcoded password.)

```shell
npm install
npm start
```

Build:

```shell
npm run build
cd ./dist
python -m SimpleHTTPServer
open http://localhost:8080
```
