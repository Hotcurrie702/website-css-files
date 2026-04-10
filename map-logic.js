/**
 * map-logic.js - Version 206
 */
window.initMap = async function() {
  console.log("1. GitHub: initMap started");
  
  // Start the listener IMMEDIATELY
  setupMessageListener();

  try {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
    
    window.map = new Map(document.getElementById("map"), {
      zoom: 2,
      center: { lat: 20, lng: 0 },
      mapId: "c262e61d52467798bead7c88"
    });

    console.log("2. GitHub: Map object created, signaling Wix...");
    window.parent.postMessage("MAP_READY", "*");
  } catch (err) {
    console.error("GitHub: Map Error:", err);
  }
};

function setupMessageListener() {
  console.log("3. GitHub: Listener registered");
  window.addEventListener("message", (event) => {
    // SECURITY CHECK: Wix sometimes sends internal messages, ignore those
    if (!event.data || typeof event.data !== 'object') return;

    console.log("4. GitHub: SUCCESS! Received data:", event.data);

    if (event.data.css) {
      console.log("5. GitHub: Injecting CSS");
      const style = document.createElement('style');
      style.innerHTML = event.data.css;
      document.head.appendChild(style);
    }

    if (Array.isArray(event.data.locations)) {
      console.log("6. GitHub: Rendering", event.data.locations.length, "markers");
      // Marker logic follows...
      event.data.locations.forEach(loc => {
        if (loc.lat && loc.lng) {
            new google.maps.marker.AdvancedMarkerElement({
                position: { lat: parseFloat(loc.lat), lng: parseFloat(loc.lng) },
                map: window.map,
                title: loc.title
            });
        }
      });
    }
  });
}
