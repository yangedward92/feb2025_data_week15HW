// Function to determine the color of the marker based on earthquake depth
function chooseColor(depth) {
  if (depth > 90) return "#ea2c2c";
  if (depth > 70) return "#ea822c";
  if (depth > 50) return "#ee9c00";
  if (depth > 30) return "#eecc00";
  if (depth > 10) return "#d4ee00";
  return "#98ee00";
}

// Function to calculate marker radius based on earthquake magnitude
function getRadius(mag) {
  return mag * 4;
}

// Function to create and render the map
function createMap(timeFrame) {
  // Clear and recreate map container
  let mapContainer = d3.select("#map_container");
  mapContainer.html("");
  mapContainer.append("div").attr("id", "map");

  // Define base layers
  let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  });

  // Fetch earthquake and tectonic plate data
  let queryUrl = `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_${timeFrame}.geojson`;
  let platesUrl = 'https://raw.githubusercontent.com/fraxen/tectonicplates/refs/heads/master/GeoJSON/PB2002_boundaries.json';

  d3.json(queryUrl).then(data => {
    d3.json(platesUrl).then(plateData => {
      // Create markers and heatmap data
      let markers = [];
      let heatArray = [];

      data.features.forEach(feature => {
        let [longitude, latitude, depth] = feature.geometry.coordinates;
        let mag = feature.properties.mag;

        if (latitude && longitude) {
          let marker = L.circleMarker([latitude, longitude], {
            fillOpacity: 0.75,
            color: "white",
            fillColor: chooseColor(depth),
            radius: getRadius(mag)
          }).bindPopup(
            `<h1>${feature.properties.title}</h1><hr><h2>Depth: ${depth}m</h2>`
          );

          markers.push(marker);
          heatArray.push([latitude, longitude]);
        }
      });

      // Define overlay layers
      let markerLayer = L.layerGroup(markers);
      let heatLayer = L.heatLayer(heatArray, {
        radius: 50,
        blur: 15
      });

      let geoLayer = L.geoJSON(plateData, {
        style: {
          color: "purple",
          weight: 5
        }
      });

      // Layer control setup
      let baseMaps = { Street: street, Topography: topo };
      let overlayMaps = {
        Earthquakes: markerLayer,
        "Tectonic Plates": geoLayer,
        Heatmap: heatLayer
      };

      // Initialize map
      let myMap = L.map("map", {
        center: [40.7, -94.5],
        zoom: 3,
        layers: [street, markerLayer, geoLayer]
      });

      // Add layer control
      L.control.layers(baseMaps, overlayMaps).addTo(myMap);

      // Add legend
      let legend = L.control({ position: "bottomright" });
      legend.onAdd = function () {
        let div = L.DomUtil.create("div", "info legend");
        div.innerHTML = `
          <h3>Earthquake <br> Depth</h3>
          <i style="background:#98ee00"></i>-10-10<br>
          <i style="background:#d4ee00"></i>10-30<br>
          <i style="background:#eecc00"></i>30-50<br>
          <i style="background:#ee9c00"></i>50-70<br>
          <i style="background:#ea822c"></i>70-90<br>
          <i style="background:#ea2c2c"></i>90+`;
        return div;
      };
      legend.addTo(myMap);
    });
  });
}

// Initialize map with selected time frame
function init() {
  let timeFrame = d3.select("#time_frame").property("value");
  createMap(timeFrame);
}

// Event listener for filter button
d3.select("#filter-btn").on("click", init);

// Initialize map on page load
init();
