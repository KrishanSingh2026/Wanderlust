const geocoder = require("../utils/geocoder");
const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = async (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res) => {
  try {
    // Create new listing first
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    // Handle image upload
    if (req.file) {
      newListing.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    // Geocode the location using OpenCage
    const locationQuery =
      req.body.listing.location +
      (req.body.listing.country ? `, ${req.body.listing.country}` : "");

    console.log(` Geocoding: ${locationQuery}`);
    const geoResult = await geocoder.geocode(locationQuery);

    if (!geoResult || geoResult.length === 0) {
      req.flash(
        "error",
        "Invalid location entered. Please check the location name and try again."
      );
      return res.redirect("/listings/new");
    }

    // OpenCage returns results in a specific format
    const geoData = geoResult[0];

    // Set geometry with coordinates
    newListing.geometry = {
      type: "Point",
      coordinates: [geoData.longitude, geoData.latitude],
    };

    // Update location with more precise data from OpenCage
    if (geoData.city) {
      newListing.location = geoData.city;
    } else if (geoData.formattedAddress) {
      // Extract city name from formatted address if possible
      const addressParts = geoData.formattedAddress.split(",");
      newListing.location = addressParts[0].trim();
    }

    if (geoData.country) {
      newListing.country = geoData.country;
    }

    await newListing.save();
    req.flash("success", "New Listing Created Successfully!");
    res.redirect("/listings");
  } catch (error) {
    console.error(" Error while creating listing:", error);

    // Handle specific OpenCage API errors
    if (error.message && error.message.includes("API key")) {
      req.flash(
        "error",
        "Geocoding service error. Please contact administrator."
      );
    } else if (error.message && error.message.includes("quota")) {
      req.flash("error", "Geocoding limit reached. Please try again later.");
    } else {
      req.flash("error", "Something went wrong. Please try again.");
    }

    res.redirect("/listings/new");
  }
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  try {
    let { id } = req.params;

    // Get the current listing to compare location changes
    const currentListing = await Listing.findById(id);
    if (!currentListing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    // Check if location has changed and needs re-geocoding
    const locationChanged =
      req.body.listing.location &&
      (req.body.listing.location !== currentListing.location ||
        req.body.listing.country !== currentListing.country);

    if (locationChanged) {
      try {
        const locationQuery =
          req.body.listing.location +
          (req.body.listing.country ? `, ${req.body.listing.country}` : "");

        console.log(` Re-geocoding: ${locationQuery}`);
        const geoResult = await geocoder.geocode(locationQuery);

        if (geoResult && geoResult.length > 0) {
          const geoData = geoResult[0];

          req.body.listing.geometry = {
            type: "Point",
            coordinates: [geoData.longitude, geoData.latitude],
          };

          // Update location with geocoded data
          if (geoData.city) {
            req.body.listing.location = geoData.city;
          } else if (geoData.formattedAddress) {
            const addressParts = geoData.formattedAddress.split(",");
            req.body.listing.location = addressParts[0].trim();
          }

          if (geoData.country) {
            req.body.listing.country = geoData.country;
          }
        } else {
          req.flash("error", "Invalid location entered during update.");
          return res.redirect(`/listings/${id}/edit`);
        }
      } catch (geoError) {
        console.error("Geocoding error during update:", geoError);

        if (geoError.message && geoError.message.includes("quota")) {
          req.flash(
            "error",
            "Geocoding limit reached. Please try again later."
          );
        } else {
          req.flash("error", "Could not validate location. Please try again.");
        }

        return res.redirect(`/listings/${id}/edit`);
      }
    }

    // Update the listing
    let listing = await Listing.findByIdAndUpdate(
      id,
      { ...req.body.listing },
      { new: true }
    );

    // Handle image update
    if (typeof req.file !== "undefined") {
      let url = req.file.path;
      let filename = req.file.filename;
      listing.image = { url, filename };
      await listing.save();
    }

    req.flash("success", "Listing Updated Successfully!");
    res.redirect(`/listings/${id}`);
  } catch (error) {
    console.error(" Error while updating listing:", error);
    req.flash(
      "error",
      "Something went wrong while updating. Please try again."
    );
    res.redirect(`/listings/${req.params.id}/edit`);
  }
};

//Search functionality
module.exports.index = async (req, res) => {
  try {
    let { search, category } = req.query;
    let query = {};
    let searchApplied = false;

    // Build search query
    if (search && search.trim() !== "") {
      searchApplied = true;
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { country: searchRegex },
      ];
    }

    // Add category filter
    if (category && category !== "all") {
      query.category = category;
    }

    // Fetch listings based on query
    const allListings = await Listing.find(query).populate("owner");

    // Pass search parameters to the view
    res.render("listings/index", {
      allListings,
      searchTerm: search || "",
      selectedCategory: category || "all",
      searchApplied: searchApplied,
    });
  } catch (error) {
    console.error("Search error:", error);
    req.flash("error", "Something went wrong while fetching listings!");
    res.redirect("/listings");
  }
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted Successfully!");
  res.redirect("/listings");
};
