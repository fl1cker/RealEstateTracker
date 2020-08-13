/* Next steps
Draw Maps for Schools/Crimes/etc
*/

const searchSubmit = document.getElementById('address-search-submit');
const searchAddressInput = document.getElementById('address-search-input');
const markerDetailsContainer = document.getElementById(
  'marker-details-container'
);
const markerDetailsForm = document.getElementById('marker-details-form');
const markerDetailsCancelBtn = document.getElementById(
  'marker-details-cancel-btn'
);
const markerDetailsLink = document.getElementById('marker-details-link');
const markerDetailsLinkOpen = document.getElementById(
  'marker-details-link-open'
);

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
  addMarkerEventListeners(marker);
  markers.push(marker);
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

function addMarkerEventListeners(marker) {
  google.maps.event.addListener(marker, 'click', (e) => {
    // if closed, open
    // if open and same label, close
    // if open and new label, clear form and repopulate
    if (!markerDetailsContainer.classList.contains('open')) {
      populateMarkerDetailsForm(marker.label);
      openMarkerDetailsForm();
    } else {
      if (
        marker.label !== document.getElementById('marker-details-label').value
      ) {
        clearMarkerDetailsForm();
        populateMarkerDetailsForm(marker.label);
      }
    }
  });

  google.maps.event.addListener(marker, 'rightclick', (e) => {
    const label = marker.label;
    marker.setMap(null);
    markers = markers.filter((x) => x.label !== label);
    deleteMarkerDetails(label);
    cancelMarkerDetailsUpdate();
  });
}

function populateMarkerDetailsForm(label) {
  const markerDetail = markerDetails.find((x) => x.label === label);

  if (markerDetail) {
    document.getElementById('marker-details-address').value =
      markerDetail.address;
    document.getElementById('marker-details-price').value = markerDetail.price;
    document.getElementById('marker-details-beds').value = markerDetail.beds;
    document.getElementById('marker-details-baths').value = markerDetail.baths;
    document.getElementById('marker-details-office').checked =
      markerDetail.hasOffice;
    document.getElementById('marker-details-workshop').checked =
      markerDetail.hasWorkshop;
    document.getElementById('marker-details-pool').checked =
      markerDetail.hasPool;
    document.getElementById('marker-details-link').value = markerDetail.link;
    document.getElementById('marker-details-notes').value = markerDetail.notes;
  }

  document.getElementById('marker-details-label').value = label;
}

function openMarkerDetailsForm() {
  markerDetailsContainer.classList.add('open');
}

function updateMarkerDetails(e) {
  e.preventDefault();

  const markerDetail = {
    label: document.getElementById('marker-details-label').value,
    address: document.getElementById('marker-details-address').value,
    price: document.getElementById('marker-details-price').value,
    beds: document.getElementById('marker-details-beds').value,
    baths: document.getElementById('marker-details-baths').value,
    hasOffice: document.getElementById('marker-details-office').checked,
    hasWorkshop: document.getElementById('marker-details-workshop').checked,
    hasPool: document.getElementById('marker-details-pool').checked,
    link: document.getElementById('marker-details-link').value,
    notes: document.getElementById('marker-details-notes').value,
  };

  const index = markerDetails.findIndex((x) => x.label === markerDetail.label);
  if (index > -1) {
    markerDetails[index] = markerDetail;
  } else {
    markerDetails.push(markerDetail);
  }

  clearMarkerDetailsForm();

  markerDetailsContainer.classList.remove('open');
}

function cancelMarkerDetailsUpdate() {
  clearMarkerDetailsForm();
  markerDetailsContainer.classList.remove('open');
}

function clearMarkerDetailsForm() {
  document.getElementById('marker-details-label').value = '';
  document.getElementById('marker-details-address').value = '';
  document.getElementById('marker-details-price').value = '';
  document.getElementById('marker-details-beds').value = '';
  document.getElementById('marker-details-baths').value = '';
  document.getElementById('marker-details-office').checked = '';
  document.getElementById('marker-details-workshop').checked = '';
  document.getElementById('marker-details-pool').checked = '';
  document.getElementById('marker-details-link').value = '';
  document.getElementById('marker-details-notes').value = '';
}

function deleteMarkerDetails(label) {
  markerDetails = markerDetails.filter((item) => item.label !== label);
}

function getMarkerDetails(label) {
  return markerDetails.find((x) => x.label === label);
}

function openMarkerDetailsLink() {
  const url = markerDetailsLink.value;
  if (url) {
    window.open(url, '_blank');
  }
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

function resetAllSavedData() {
  markers = [];
  markerDetails = [];
  localStorage.clear();
}

// Event Listeners
window.addEventListener('unload', saveMapData);
searchSubmit.addEventListener('submit', plotMarkerByAddress);
markerDetailsForm.addEventListener('submit', updateMarkerDetails);
markerDetailsCancelBtn.addEventListener('click', cancelMarkerDetailsUpdate);
markerDetailsLinkOpen.addEventListener('click', openMarkerDetailsLink);

initApp();
