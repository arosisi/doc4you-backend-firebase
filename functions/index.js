const admin = require("firebase-admin");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const fs = require("fs");
const functions = require("firebase-functions");
const path = require("path");

const serviceAccount = require("./serviceAccountKey");

const indexRouter = require("./routes/index");
const testRouter = require("./routes/test");
const availabilitiesRouter = require("./routes/availabilities");
const usersRouter = require("./routes/users");

const app = express();

const privateInfo = JSON.parse(fs.readFileSync("./privateInfo.json"));

// view engine setup
app.set("view engine", "ejs");

app.set("origin", privateInfo[app.get("env")].origin);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  cors({
    origin: app.get("origin"),
    credentials: true
  })
);
app.use(express.static(path.join(__dirname, "public")));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://doc4you-backend.firebaseio.com"
});

const db = admin.firestore();

app.use("/", indexRouter);
app.use("/test", testRouter(db));
app.use("/availabilities", availabilitiesRouter(db));
app.use("/users", usersRouter(db, app.get("env")));

exports.app = functions.https.onRequest(app);
