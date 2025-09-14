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
