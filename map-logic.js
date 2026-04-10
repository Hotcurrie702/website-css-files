/**
 * map-logic.js
 * Host this on GitHub
 */
window.initMap = initMap;

let map, clusterer;
let AdvancedMarkerElement, PinElement; 

async function initMap() {
  try {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement: AM, PinElement: PE } = await google.maps.importLibrary("marker");
    
    AdvancedMarkerElement = AM;
    PinElement = PE;

    const isMobile = window.innerWidth < 768;
    map = new Map(document.getElementById("map"), {
      zoom: isMobile ? 1 : 2,
      center: { lat: 20, lng: 0 },
      mapId: "c262e61d52467798bead7c88", // Ensure this Map ID is active in Google Console
      disableDefaultUI: isMobile
    });
    
    map.addListener("click", () => closeModal());
    clusterer = new markerClusterer.MarkerClusterer({ map });

    window.parent.postMessage("MAP_READY", "*");
    setupMessageListener();
  } catch (err) {
    console.error("Map Initialization Error:", err);
    document.getElementById('loader-status').innerText = "ERROR LOADING MAP";
  }
}

function setupMessageListener() {
  window.addEventListener("message", async (event) => {
    // Check if we received the data object from Wix
    if (event.data && event.data.css) {
      console.log("CSS received from Wix, injecting...");
      
      // Create a style element
      const styleTag = document.createElement('style');
      styleTag.type = 'text/css';
      styleTag.innerHTML = event.data.css;
      
      // Append it to the head
      document.head.appendChild(styleTag);
    }

    if (event.data && Array.isArray(event.data.locations)) {
      console.log("Locations received from Wix, rendering...");
      await renderMarkers(event.data.locations);
      
      // Hide the loader once markers are rendered
      const loader = document.getElementById('loader-container');
      if (loader) loader.classList.add('hidden');
    }
  });
}}

async function renderMarkers(locations) {
  document.getElementById('loader-status').innerText = "RENDERING...";
  const markers = [];
  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    if (loc.lat && loc.lng) markers.push(createMarker(loc));
    if (i % 20 === 0) {
      document.getElementById('progress-text').innerText = Math.round((i / locations.length) * 100) + "%";
      await new Promise(r => requestAnimationFrame(r));
    }
  }
  clusterer.addMarkers(markers);
}

function createMarker(loc) {
  const iconCustom = document.createElement("div");
  iconCustom.innerHTML = '<i class="material-icons" style="color:white;font-size:18px;">flight</i>';

  const pin = new google.maps.marker.PinElement({ // Use full path
    background: "#01257D",
    borderColor: "#FFFFFF",
    glyph: iconCustom, // The API warning is fine for now, but ensure this is correct
  });

  const marker = new google.maps.marker.AdvancedMarkerElement({
    position: { lat: parseFloat(loc.lat), lng: parseFloat(loc.lng) },
    map: map,
    title: loc.title,
    content: pin.element 
  });
}

  marker.addListener("gmp-click", () => {
    const modal = document.getElementById('map-modal');
    const content = document.getElementById('modal-content');
    const truncatedSubtitle = (loc.subtitle || '').substring(0, 320);
    
    content.innerHTML = `
      <div class="info-card">
        <img src="${loc.attimage || ''}" alt="${loc.title}">
        <div class="info-header">
          <h3>${loc.title}</h3>
          <h4>${loc.location || ''}</h4>
        </div>
        <div class="info-body">
          <p>${truncatedSubtitle}...</p>
          <a href="${loc.fullURL}" target="_blank" class="btn-details">VIEW DETAILS</a>
        </div>
      </div>
    `;
    modal.style.display = 'block';
    map.panTo(marker.position);
  });
  return marker;
}

function closeModal() {
  document.getElementById('map-modal').style.display = 'none';
}

// Attach initMap to the window so the Google script can find the callback
window.initMap = initMap;
