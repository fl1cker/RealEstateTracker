/* Next steps
1) Build the UI for add marker details
2) Add the JS to read the form on submit and store it
3) Consider additional fields to add to the UI (perhaps a key-value pair to add anything i want on the fly)


*/

const searchSubmit = document.getElementById('address-search-submit');
const searchAddressInput = document.getElementById('address-search-input');
const addMarkDetailsForm = document.getElementById('add-marker-details-form');

let map;
let markers = [];
let markerDetails = [];
let usableLabels =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefhijklmnopqrstuvwxyz1234567890';
let labelIndex = 0;

// Edit Map
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 30.261717, lng: -81.657302 },
    zoom: 12,
  });

  const storedMarkers = JSON.parse(localStorage.getItem('markers')) || [];
  markerDetails = JSON.parse(localStorage.getItem('markerDetails')) || [];

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
  const markerLabel = label || getNextUsableLabel();
  if (!markerLabel) {
    return;
  }
  const marker = new google.maps.Marker({
    position: { lat, lng },
    map: map,
    label: markerLabel,
  });

  removeUsableLabel(marker.label);
  markers.push(marker);

  google.maps.event.addListener(marker, 'rightclick', (e) => {
    const label = marker.label;
    marker.setMap(null);
    markers = markers.filter((x) => x.label !== label);
    deleteMarkerDetails(label);
  });
}

async function plotMarkerByAddress(e) {
  e.preventDefault();
  const address = searchAddressInput.value.trim();
  if (address) {
    await getCoordinatesFromAddress(address);
    searchAddressInput.value = '';
  }
}

async function getCoordinatesFromAddress(addressString) {
  const encodedAddress = encodeURI(addressString);
  fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_KEY}`
  )
    .then((result) => result.json())
    .then((data) => {
      if (
        data.results.length === 0 ||
        !data.results[0].formatted_address
          .toLowerCase()
          .includes('jacksonville')
      ) {
        alert('no location found');
        return;
      }

      const { lat, lng } = data.results[0].geometry.location;
      addMarker(lat, lng);
      moveToLocation(lat, lng);
    });
}

function moveToLocation(lat, lng) {
  const center = new google.maps.LatLng(lat, lng);
  map.panTo(center);
}

// Helper Functions
function removeUsableLabel(label) {
  usableLabels = usableLabels.replace(label, '');
}

function getNextUsableLabel() {
  const nextLabel = usableLabels[0];
  if (!nextLabel) {
    alert('No more labels available.  Delete unneeded markers');
    return null;
  }

  return nextLabel;
}

function addMarkerDetails() {}

function deleteMarkerDetails(label) {
  markerDetails = markerDetails.filter((item) => item.label !== label);
}

function getMarkerDetails(label) {
  return markerDetails.find((x) => x.label === label);
}

function saveMapData() {
  const storableMarkers = markers.map((marker) => {
    return {
      label: marker.label,
      lat: marker.position.lat(),
      lng: marker.position.lng(),
    };
  });
  localStorage.setItem('markers', JSON.stringify(storableMarkers));
  localStorage.setItem('markerDetails', JSON.stringify(markerDetails));
}

// Event Listeners
window.addEventListener('unload', saveMapData);
searchSubmit.addEventListener('submit', plotMarkerByAddress);
addPinForm.addEventListener('submit', addMarkerDetails);

initApp();
