window.initMap = initMap;

let map, clusterer;

async function initMap() {
  // 1. SET UP LISTENER FIRST thing so we don't miss the Wix message
  setupMessageListener();

  try {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
    
    const isMobile = window.innerWidth < 768;
    map = new Map(document.getElementById("map"), {
      zoom: isMobile ? 1 : 2,
      center: { lat: 20, lng: 0 },
      mapId: "c262e61d52467798bead7c88",
      disableDefaultUI: isMobile
    });
    
    map.addListener("click", () => closeModal());
    clusterer = new markerClusterer.MarkerClusterer({ map });

    // 2. SIGNAL WIX AFTER map is ready
    console.log("GitHub Script: Signaling READY to Wix");
    window.parent.postMessage("MAP_READY", "*");

  } catch (err) {
    console.error("Map Initialization Error:", err);
  }
}

function setupMessageListener() {
  console.log("GitHub Script: Listener is active and waiting...");
  window.addEventListener("message", (event) => {
    // If we get ANY message, log it immediately
    console.log("GitHub Script: RECEIVED FROM WIX ->", event.data);

    const { css, locations } = event.data;

    if (css) {
      console.log("GitHub Script: Injecting CSS");
      const styleTag = document.getElementById('dynamic-wix-style') || document.createElement('style');
      styleTag.id = 'dynamic-wix-style';
      styleTag.innerHTML = css;
      document.head.appendChild(styleTag);
    }

    if (Array.isArray(locations)) {
      console.log("GitHub Script: Starting Marker Render");
      renderMarkers(locations);
    }
  });
}

async function renderMarkers(locations) {
  const markers = [];
  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    if (loc.lat && loc.lng) markers.push(createMarker(loc));
  }
  clusterer.addMarkers(markers);
  const loader = document.getElementById('loader-container');
  if(loader) loader.classList.add('hidden');
}

function createMarker(loc) {
  const iconCustom = document.createElement("div");
  iconCustom.innerHTML = '<i class="material-icons" style="color:white;font-size:18px;">flight</i>';

  const pin = new google.maps.marker.PinElement({
    background: "#01257D",
    borderColor: "#FFFFFF",
    glyph: iconCustom,
  });

  const marker = new google.maps.marker.AdvancedMarkerElement({
    position: { lat: parseFloat(loc.lat), lng: parseFloat(loc.lng) },
    map: map,
    title: loc.title,
    content: pin.element 
  });

  marker.addListener("gmp-click", () => {
    const modal = document.getElementById('map-modal');
    const content = document.getElementById('modal-content');
    content.innerHTML = `
      <div class="info-card">
        <img src="${loc.attimage || ''}" style="width:100%">
        <h3>${loc.title}</h3>
        <p>${(loc.subtitle || '').substring(0, 200)}...</p>
        <a href="${loc.fullURL}" target="_blank">VIEW DETAILS</a>
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
