// var map = new maplibregl.Map({
//   style: "https://tiles.stadiamaps.com/styles/outdoors.json",
//   container: "map",
//   center: geoData.coordinates, //Starting Position [lng, lat]
//   zoom: 9,
//   attributionControl: false,
// });

// new maplibregl.Marker({ color: "#ff6b6b" })
//   .setLngLat([geoData.coordinates]) //listing.geoData.coordinates
//   .setPopup(new maplibregl.Popup().setHTML("<h3>📍 Dehradun, Uttarakhand</h3>"))
//   .addTo(map)
//   .togglePopup();

// public/js/map.js

// Make sure maplibre is loaded
if (typeof maplibregl !== "undefined" && coordinates) {
  const map = new maplibregl.Map({
    style: "https://tiles.stadiamaps.com/styles/outdoors.json",
    container: "map",
    center: coordinates, // [lng, lat]
    zoom: 9,
    attributionControl: false,
  });

  new maplibregl.Marker({ color: "#ff6b6b" })
    .setLngLat(coordinates)
    .setPopup(
      new maplibregl.Popup().setHTML(
        `<h3>📍 ${locationText}</h3><p>Exact Location will be provided after booking</p>`
      )
    )
    .addTo(map)
    .togglePopup();
}
