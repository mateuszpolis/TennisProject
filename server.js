if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const expressLayouts = require("express-ejs-layouts");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");

const indexRouter = require("./routes/index");
const playerRouter = require("./routes/players");
const matchRouter = require("./routes/matches");
const tournamentRouter = require("./routes/tournaments");
const statsRouter = require("./routes/stats");

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.set("layout", "layouts/layout");
app.use(expressLayouts);
app.use(methodOverride("_method"));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: false }));

const mognoose = require("mongoose");
mognoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true });
const db = mognoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to Mongoose"));

app.use("/", indexRouter);
app.use("/players", playerRouter);
app.use("/matches", matchRouter);
app.use("/tournaments", tournamentRouter);
app.use("/stats", statsRouter);

app.listen(process.env.PORT || 3000);
