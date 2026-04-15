/**
 * Master Map Logic for shanecurrie.id.au
 * Handles dynamic icons, zoom, and centering from Wix Page Code
 */

let map, clusterer;
let AdvancedMarkerElement, PinElement;
let pageConfig = {}; // Stores iconName, zoom, and center sent from Wix

async function initMap() {
    try {
        const { Map } = await google.maps.importLibrary("maps");
        const { AdvancedMarkerElement: AM, PinElement: PE } = await google.maps.importLibrary("marker");
        
        AdvancedMarkerElement = AM;
        PinElement = PE;

        const isMobile = window.innerWidth < 768;

        // Initial Map Render (using defaults until Wix sends config)
        map = new Map(document.getElementById("map"), {
            zoom: isMobile ? 1 : 3,
            center: { lat: 14, lng: 95 },
            mapId: "c262e61d52467798bead7c88",
            disableDefaultUI: isMobile
        });
        
        map.addListener("click", () => closeModal());

        clusterer = new markerClusterer.MarkerClusterer({ map });

        // Signal Wix that Iframe is ready to receive data
        window.parent.postMessage("MAP_READY", "*");

        setupMessageListener();
    } catch (err) {
        console.error("Map Initialization Error:", err);
        document.getElementById('loader-status').innerText = "ERROR LOADING MAP";
    }
}

function setupMessageListener() {
    window.addEventListener("message", async (event) => {
        const { css, locations, config } = event.data;

        // Apply Page Configuration (Center, Zoom, Icon)
        if (config) {
            pageConfig = config; 
            const isMobile = window.innerWidth < 768;
            
            if (config.center) map.setCenter(config.center);
            if (config.zoom) {
                map.setZoom(isMobile ? config.zoom.mobile : config.zoom.desktop);
            }
        }

        // Inject Dynamic CSS
        if (css) {
            const styleTag = document.createElement('style');
            styleTag.innerHTML = css;
            document.head.appendChild(styleTag);
        }

        // Render Markers
        if (Array.isArray(locations)) {
            await renderMarkers(locations);
            document.getElementById('loader-container').classList.add('hidden');
        }
    });
}

async function renderMarkers(locations) {
    document.getElementById('loader-status').innerText = "RENDERING DESTINATIONS...";
    const markers = [];
    const total = locations.length;
    
    for (let i = 0; i < total; i++) {
        const loc = locations[i];
        if (loc.lat && loc.lng) {
            markers.push(createMarker(loc));
        }

        if (i % 20 === 0 || i === total - 1) {
            const percent = Math.round(((i + 1) / total) * 100);
            document.getElementById('progress-text').innerText = percent + "%";
            await new Promise(r => requestAnimationFrame(r));
        }
    }
    clusterer.addMarkers(markers);
}

function createMarker(loc) {
    const iconCustom = document.createElement("div");
    const iconName = pageConfig.icon || 'business'; // Use the icon sent from Wix
    iconCustom.innerHTML = `<i class="material-icons" style="color:white;font-size:18px;">${iconName}</i>`;

    const pin = new PinElement({
        background: "#01257D",
        borderColor: "#FFFFFF",
        glyph: iconCustom,
    });

    const marker = new AdvancedMarkerElement({
        position: { lat: parseFloat(loc.lat), lng: parseFloat(loc.lng) },
        map: map,
        title: loc.title,
        content: pin.element
    });

    marker.addListener("gmp-click", () => {
        const modal = document.getElementById('map-modal');
        const content = document.getElementById('modal-content');
        const truncatedSubtitle = (loc.subtitle || '').substring(0, 400);
        
        // We add the Close Button back in here so it exists inside the modal
        content.innerHTML = `
            <span class="modal-close" onclick="closeModal()">
                <i class="material-icons">close</i>
            </span>
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
