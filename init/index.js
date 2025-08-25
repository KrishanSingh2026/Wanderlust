const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

// Load environment variables from parent directory
require("dotenv").config({ path: "../.env" });

// Import geocoder AFTER loading env variables
const Geocoder = require("../utils/geocoder.js");

const MONGO_URL =
  process.env.MONGO_URL || "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log(" Connected to Local MongoDB");
  })
  .catch((err) => {
    console.log(" MongoDB connection error:", err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

// Function to assign categories based on listing content
const assignCategory = (listing) => {
  const title = listing.title.toLowerCase();
  const description = listing.description.toLowerCase();
  const location = listing.location.toLowerCase();

  // Mountains & Ski Areas
  if (
    title.includes("mountain") ||
    title.includes("cabin") ||
    title.includes("chalet") ||
    location.includes("aspen") ||
    location.includes("banff") ||
    location.includes("verbier") ||
    location.includes("scottish highlands") ||
    (title.includes("retreat") && location.includes("mountain"))
  ) {
    return "Mountains";
  }

  // Arctic/Winter Sports
  if (
    title.includes("ski") &&
    (location.includes("verbier") || location.includes("aspen"))
  ) {
    return "Arctic";
  }

  // Castles & Historic Properties
  if (
    title.includes("castle") ||
    (title.includes("historic") &&
      (title.includes("villa") ||
        title.includes("manor") ||
        title.includes("brownstone")))
  ) {
    return "Castles";
  }

  // Amazing Pools & Luxury Villas
  if (
    description.includes("pool") ||
    title.includes("luxury") ||
    title.includes("villa") ||
    title.includes("penthouse") ||
    description.includes("infinity pool") ||
    title.includes("desert oasis")
  ) {
    return "Amazing Pools";
  }

  // Camping & Nature Retreats
  if (
    title.includes("treehouse") ||
    title.includes("eco-friendly") ||
    title.includes("safari") ||
    (title.includes("lodge") && location.includes("serengeti"))
  ) {
    return "Camping";
  }

  // Rooms & Urban Apartments
  if (
    title.includes("apartment") ||
    title.includes("loft") ||
    title.includes("brownstone") ||
    (title.includes("modern") && title.includes("downtown"))
  ) {
    return "Rooms";
  }

  // Boats & Island Properties
  if (
    title.includes("island") ||
    location.includes("fiji") ||
    location.includes("maldives") ||
    title.includes("overwater") ||
    title.includes("private island")
  ) {
    return "Boats";
  }

  // Farms & Rural Cottages
  if (
    location.includes("cotswolds") ||
    location.includes("montana") ||
    title.includes("rustic") ||
    title.includes("cottage") ||
    (title.includes("cabin") && location.includes("lake"))
  ) {
    return "Farms";
  }

  // Iconic Cities
  if (
    location.includes("new york") ||
    location.includes("tokyo") ||
    location.includes("amsterdam") ||
    location.includes("florence") ||
    location.includes("dubai") ||
    location.includes("miami") ||
    location.includes("boston") ||
    location.includes("los angeles") ||
    location.includes("charleston")
  ) {
    return "Iconic Cities";
  }

  return "Trending"; // Default category
};

// Add delay between geocoding requests for OpenCage rate limiting
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const initDB = async () => {
  try {
    await Listing.deleteMany({});
    await User.deleteMany({});

    const user = new User({
      username: "Krishan Singh",
      email: "krishan123@gmail.com",
    });

    const registeredUser = await User.register(user, "1234");

    const processedListings = [];
    let successfulGeocodings = 0;
    let failedGeocodings = 0;

    for (let i = 0; i < initData.data.length; i++) {
      const obj = initData.data[i];

      console.log(`[${i + 1}/${initData.data.length}] "${obj.title}"`);
      console.log(`   Location: ${obj.location}, ${obj.country}`);

      let coordinates = [0, 0]; // Fallback coordinates
      let formattedLocation = obj.location;
      let formattedCountry = obj.country;

      try {
        // Geocode with OpenCage API
        const locationQuery = `${obj.location}, ${obj.country}`;
        console.log(`   Geocoding: "${locationQuery}"`);

        const geoResult = await Geocoder.geocode(locationQuery);

        if (geoResult && geoResult.length > 0) {
          const geoData = geoResult[0];
          coordinates = [geoData.longitude, geoData.latitude];

          // Use OpenCage's enhanced location data
          if (geoData.city) formattedLocation = geoData.city;
          if (geoData.country) formattedCountry = geoData.country;

          console.log(
            `   Geocoded: [${coordinates[0].toFixed(
              4
            )}, ${coordinates[1].toFixed(4)}]`
          );
          console.log(`   Enhanced: ${formattedLocation}, ${formattedCountry}`);
          successfulGeocodings++;
        } else {
          console.log(`   No geocoding results - using fallback [0, 0]`);
          failedGeocodings++;
        }
      } catch (error) {
        console.log(`   Geocoding error: ${error.message}`);
        failedGeocodings++;

        if (error.message.includes("API key")) {
          console.log(`   Hint: Check your MAP_TOKEN in .env file`);
        }
      }

      // Assign smart category based on listing content
      const category = assignCategory(obj);
      console.log(`   Category: ${category}`);

      // Build complete listing object
      const completeListing = {
        ...obj,
        location: formattedLocation,
        country: formattedCountry,
        category: category,
        owner: registeredUser._id,
        geometry: {
          type: "Point",
          coordinates: coordinates,
        },
      };

      processedListings.push(completeListing);

      // Rate limiting for OpenCage (max 1 request per second)
      if (i < initData.data.length - 1) {
        console.log(`   Rate limiting... waiting 1.2s\n`);
        await delay(1200);
      } else {
        console.log(""); // Final line break
      }
    }

    console.log(" Saving all listings to local MongoDB...");
    await Listing.insertMany(processedListings);

    // Show category breakdown
    const categoryStats = {};
    processedListings.forEach((listing) => {
      categoryStats[listing.category] =
        (categoryStats[listing.category] || 0) + 1;
    });

    console.log(`\n CATEGORY BREAKDOWN:`);
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`    ${category}: ${count} listings`);
    });
  } catch (err) {
    console.error(" INITIALIZATION FAILED!", err);
  }
};

initDB();
