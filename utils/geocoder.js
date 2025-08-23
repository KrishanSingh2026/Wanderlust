const NodeGeocoder = require("node-geocoder");
require("dotenv").config({ path: "../.env" }); // to read .env

const options = {
  provider: "opencage",
  apiKey: process.env.MAP_TOKEN,
  formatter: null,
};

const geocoder = NodeGeocoder(options);
module.exports = geocoder;
