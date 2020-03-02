const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const bearerToken = require("express-bearer-token");
require("dotenv").config();
const PORT = process.env.PORT || 2400;

// =============== Middleware =============== //
app.use(cors());
app.use(bearerToken());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

// ================= Routes ================ //
const { authRouters, productRouters, partnerRouters } = require("./routers");

// =========== Routes Middleware =========== //
app.use("/auth", authRouters);
app.use("/product", productRouters);
app.use("/partner", partnerRouters);

app.get("/", (req, res) => res.status(200).send("Welcome to iDecorate API!"));
app.listen(PORT, () => console.log("running on port " + PORT));
