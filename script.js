const searchSubmit = document.getElementById('address-search-submit');
const searchAddressInput = document.getElementById('address-search-input');

let map;
let markers = [];
let labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefhijklmnopqrstuvwxyz1234567890';
let labelIndex = 0;

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 30.261717, lng: -81.657302 },
    zoom: 12,
  });

  const storedMarkers = JSON.parse(localStorage.getItem('markers')) || [];

  storedMarkers.forEach((marker) => {
    addMarker(marker.lat, marker.lng, marker.label);
  });

  google.maps.event.addListener(map, 'rightclick', (e) => {
    addMarker(e.latLng.lat(), e.latLng.lng());
  });
}

function initApp() {
  // Create the script tag, set the appropriate attributes
  var script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&callback=initMap`;
  script.defer = true;

  // Append the 'script' element to 'head'
  document.head.appendChild(script);
}

function addMarker(lat, lng, label = null) {
  const marker = new google.maps.Marker({
    position: { lat, lng },
    map: map,
    label: label || labels[labelIndex++ % labels.length],
  });

  markers.push(marker);

  google.maps.event.addListener(marker, 'rightclick', (e) => {
    marker.setMap(null);
    markers = markers.filter((x) => x.label !== marker.label);
  });
}

function saveMapData() {
  const storableMarkers = markers.map((marker) => {
    return {
      label: marker.position.label,
      lat: marker.position.lat(),
      lng: marker.position.lng(),
    };
  });
  localStorage.setItem('markers', JSON.stringify(storableMarkers));
}

async function plotPinByAddress(e) {
  e.preventDefault();
  const address = searchAddressInput.value.trim();
  if (address) {
    await getCoordinatesFromAddress(address);
  }
}

async function getCoordinatesFromAddress(addressString) {
  const encodedAddress = encodeURI(addressString);
  const result = fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_KEY}`
  )
    .then((result) => result.json())
    .then((data) => {
      if (data.results.length === 0) {
        return;
      }
      const { lat, lng } = data.results[0].geometry.location;
      addMarker(lat, lng);
    });
}

// Event Listeners
window.addEventListener('unload', saveMapData);
searchSubmit.addEventListener('submit', plotPinByAddress);

initApp();
