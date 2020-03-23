const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const bearerToken = require("express-bearer-token");
const PORT = process.env.PORT || 2400;
require("dotenv").config();

// =============== Middleware =============== //
app.use(cors());
app.use(bearerToken());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// ================= Routes ================ //
const { authRouters, productRouters, partnerRouters, homepageRouters, transactionRouters } = require("./routers");

// =========== Routes Middleware =========== //
app.use("/auth", authRouters);
app.use("/product", productRouters);
app.use("/partner", partnerRouters);
app.use("/homepage", homepageRouters);
app.use("/t", transactionRouters);

app.get("/", (req, res) => res.status(200).send("Welcome to iDecorate API!"));
app.listen(PORT, () => console.log("running on port " + PORT));
