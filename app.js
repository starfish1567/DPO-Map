const DATA_URL = "./data/vehicles.json";
const REFRESH_INTERVAL_MS = 30_000;
const CITY_CENTER = [49.8209, 18.2625];
const CITY_BOUNDS = L.latLngBounds(
  [49.72, 18.05],
  [49.92, 18.43],
);
const TYPE_COLORS = {
  bus: "#ef4444",
  tram: "#2563eb",
  trolleybus: "#f59e0b",
  unknown: "#6b7280",
};

const state = {
  map: null,
  vehicles: [],
  filteredVehicles: [],
  markers: new Map(),
  selectedId: null,
  lastGeneratedAt: null,
};

const elements = {
  vehicleCount: document.querySelector("#vehicle-count"),
  lastUpdated: document.querySelector("#last-updated"),
  listCount: document.querySelector("#list-count"),
  vehicleList: document.querySelector("#vehicle-list"),
  searchInput: document.querySelector("#search-input"),
  typeFilter: document.querySelector("#type-filter"),
  statusBanner: document.querySelector("#status-banner"),
  legend: document.querySelector("#legend"),
  detailsEmpty: document.querySelector("#details-empty"),
  detailsCard: document.querySelector("#details-card"),
  detailRoute: document.querySelector("#detail-route"),
  detailType: document.querySelector("#detail-type"),
  detailTitle: document.querySelector("#detail-title"),
  detailSummary: document.querySelector("#detail-summary"),
  detailNumber: document.querySelector("#detail-number"),
  detailStatus: document.querySelector("#detail-status"),
  detailLastStop: document.querySelector("#detail-last-stop"),
  detailDestination: document.querySelector("#detail-destination"),
  detailModel: document.querySelector("#detail-model"),
  detailEngine: document.querySelector("#detail-engine"),
  detailCapacity: document.querySelector("#detail-capacity"),
  detailAccess: document.querySelector("#detail-access"),
  detailImage: document.querySelector("#detail-image"),
  detailImageCaption: document.querySelector("#detail-image-caption"),
};

function initMap() {
  const map = L.map("map", {
    zoomControl: true,
    minZoom: 11,
  }).setView(CITY_CENTER, 12);

  map.setMaxBounds(CITY_BOUNDS.pad(0.15));

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  state.map = map;
}

function formatDate(isoString) {
  if (!isoString) {
    return "Unknown";
  }

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatVehicleType(type) {
  if (!type) {
    return "Unknown";
  }
  if (type === "trolleybus") {
    return "Trolleybus";
  }
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function capacityLabel(vehicle) {
  const seating = vehicle.seating ?? 0;
  const standing = vehicle.standing ?? 0;
  if (!seating && !standing) {
    return "Not available";
  }
  return `${seating} seated / ${standing} standing`;
}

function accessLabel(vehicle) {
  const parts = [];
  parts.push(vehicle.isBarrierLess ? "Low-floor access" : "Accessibility unknown");
  if (vehicle.airCondition) {
    parts.push("Air conditioned");
  }
  if (vehicle.securityCamera) {
    parts.push("Security cameras");
  }
  return parts.join(" • ");
}

function searchableText(vehicle) {
  return [
    vehicle.vehicleNumber,
    vehicle.route,
    vehicle.type,
    vehicle.headSign,
    vehicle.tripFrom,
    vehicle.tripTo,
    vehicle.finalStopName,
    vehicle.lastStopName,
    vehicle.modelName,
    vehicle.licensePlate,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function buildLegend(typeCounts) {
  const entries = Object.entries(typeCounts);
  if (!entries.length) {
    elements.legend.innerHTML = "";
    return;
  }

  elements.legend.innerHTML = entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([type, count]) => {
      const color = TYPE_COLORS[type] || TYPE_COLORS.unknown;
      return `
        <span class="legend-pill">
          <span class="legend-dot" style="background:${color}"></span>
          ${formatVehicleType(type)}: ${count}
        </span>
      `;
    })
    .join("");
}

function populateTypeFilter(typeCounts) {
  const types = Object.keys(typeCounts).sort((a, b) => a.localeCompare(b));
  const currentValue = elements.typeFilter.value;
  elements.typeFilter.innerHTML = [
    '<option value="all">All</option>',
    ...types.map((type) => `<option value="${type}">${formatVehicleType(type)}</option>`),
  ].join("");
  elements.typeFilter.value = types.includes(currentValue) ? currentValue : "all";
}

function markerHtml(vehicle) {
  const type = vehicle.type || "unknown";
  const color = TYPE_COLORS[type] || TYPE_COLORS.unknown;
  return `
    <div class="map-marker" style="background:${color}">
      ${String(vehicle.route ?? "?").slice(0, 3)}
    </div>
  `;
}

function popupHtml(vehicle) {
  return `
    <p class="popup-title">Route ${vehicle.route ?? "?"} • #${vehicle.vehicleNumber ?? "?"}</p>
    <p class="popup-copy">${vehicle.headSign ?? "Unknown direction"}</p>
    <p class="popup-copy">${vehicle.delayLabel ?? "Unknown"}</p>
  `;
}

function clearMarkers() {
  for (const marker of state.markers.values()) {
    marker.remove();
  }
  state.markers.clear();
}

function renderMarkers(vehicles) {
  clearMarkers();

  vehicles.forEach((vehicle) => {
    if (typeof vehicle.lat !== "number" || typeof vehicle.lng !== "number") {
      return;
    }

    const marker = L.marker([vehicle.lat, vehicle.lng], {
      icon: L.divIcon({
        className: "",
        html: markerHtml(vehicle),
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      }),
    });

    marker.bindPopup(popupHtml(vehicle));
    marker.on("click", () => selectVehicle(vehicle.id));
    marker.addTo(state.map);
    state.markers.set(vehicle.id, marker);
  });
}

function renderVehicleList(vehicles) {
  elements.listCount.textContent = `${vehicles.length} shown`;

  if (!vehicles.length) {
    elements.vehicleList.innerHTML = '<div class="empty-state">No vehicles match this filter yet.</div>';
    return;
  }

  elements.vehicleList.innerHTML = vehicles
    .map((vehicle) => {
      const activeClass = vehicle.id === state.selectedId ? "is-active" : "";
      const delayClass = vehicle.delayState || "unknown";
      return `
        <button class="vehicle-item ${activeClass}" data-vehicle-id="${vehicle.id}">
          <div class="vehicle-row">
            <div>
              <div class="vehicle-primary">Route ${vehicle.route ?? "?"} • #${vehicle.vehicleNumber ?? "?"}</div>
              <div class="vehicle-secondary">${vehicle.headSign ?? "Unknown direction"}</div>
            </div>
            <span class="delay-chip ${delayClass}">${vehicle.delayLabel ?? "Unknown"}</span>
          </div>
          <div class="vehicle-secondary">${vehicle.lastStopName ?? "Unknown stop"} • ${vehicle.modelName ?? "Unknown model"}</div>
        </button>
      `;
    })
    .join("");

  elements.vehicleList.querySelectorAll("[data-vehicle-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectVehicle(button.dataset.vehicleId);
    });
  });
}

function renderDetails(vehicle) {
  if (!vehicle) {
    elements.detailsEmpty.classList.remove("hidden");
    elements.detailsCard.classList.add("hidden");
    return;
  }

  elements.detailsEmpty.classList.add("hidden");
  elements.detailsCard.classList.remove("hidden");

  elements.detailRoute.textContent = `Route ${vehicle.route ?? "?"}`;
  elements.detailType.textContent = formatVehicleType(vehicle.type);
  elements.detailTitle.textContent = vehicle.headSign || `Vehicle #${vehicle.vehicleNumber ?? "?"}`;
  elements.detailSummary.textContent = [
    vehicle.tripFrom ? `From ${vehicle.tripFrom}` : null,
    vehicle.tripTo ? `to ${vehicle.tripTo}` : null,
    vehicle.finalStopName ? `final stop ${vehicle.finalStopName}` : null,
  ]
    .filter(Boolean)
    .join(" • ");
  elements.detailNumber.textContent = vehicle.vehicleNumber ?? "Unknown";
  elements.detailStatus.textContent = vehicle.delayLabel ?? "Unknown";
  elements.detailLastStop.textContent = vehicle.lastStopName ?? "Unknown";
  elements.detailDestination.textContent = vehicle.finalStopName ?? vehicle.headSign ?? "Unknown";
  elements.detailModel.textContent = vehicle.modelName ?? "Unknown";
  elements.detailEngine.textContent = vehicle.engineType ?? "Unknown";
  elements.detailCapacity.textContent = capacityLabel(vehicle);
  elements.detailAccess.textContent = accessLabel(vehicle);

  if (vehicle.image) {
    elements.detailImage.src = vehicle.image;
    elements.detailImage.alt = `${vehicle.modelName ?? "Vehicle"} photo`;
    elements.detailImageCaption.textContent = `${vehicle.modelName ?? "Vehicle"}${vehicle.licensePlate ? ` • ${vehicle.licensePlate}` : ""}`;
  } else {
    elements.detailImage.removeAttribute("src");
    elements.detailImage.alt = "";
    elements.detailImageCaption.textContent = "No photo available";
  }
}

function updateMapFocus(vehicle) {
  if (!vehicle) {
    return;
  }

  const marker = state.markers.get(vehicle.id);
  if (marker) {
    state.map.flyTo([vehicle.lat, vehicle.lng], Math.max(state.map.getZoom(), 14), {
      duration: 0.6,
    });
    marker.openPopup();
  }
}

function selectVehicle(vehicleId) {
  state.selectedId = vehicleId;
  const vehicle = state.vehicles.find((item) => item.id === vehicleId) || null;
  renderVehicleList(state.filteredVehicles);
  renderDetails(vehicle);
  updateMapFocus(vehicle);
}

function applyFilters() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const type = elements.typeFilter.value;

  state.filteredVehicles = state.vehicles.filter((vehicle) => {
    const matchesQuery = !query || searchableText(vehicle).includes(query);
    const matchesType = type === "all" || vehicle.type === type;
    return matchesQuery && matchesType;
  });

  renderVehicleList(state.filteredVehicles);
  renderMarkers(state.filteredVehicles);

  if (state.selectedId && !state.filteredVehicles.some((vehicle) => vehicle.id === state.selectedId)) {
    state.selectedId = null;
    renderDetails(null);
  }
}

async function loadVehicles() {
  const response = await fetch(DATA_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load data: ${response.status}`);
  }
  return response.json();
}

function sortVehicles(vehicles) {
  return [...vehicles].sort((a, b) => {
    const routeA = Number(a.route ?? 0);
    const routeB = Number(b.route ?? 0);
    if (routeA !== routeB) {
      return routeA - routeB;
    }
    return Number(a.vehicleNumber ?? 0) - Number(b.vehicleNumber ?? 0);
  });
}

function applyPayload(payload, { isBackgroundRefresh = false } = {}) {
  const previousSelectedId = state.selectedId;
  state.vehicles = sortVehicles(payload.vehicles || []);
  state.lastGeneratedAt = payload.generatedAt || null;

  elements.vehicleCount.textContent = String(payload.count ?? state.vehicles.length);
  elements.lastUpdated.textContent = formatDate(payload.generatedAt);
  elements.statusBanner.textContent = isBackgroundRefresh
    ? `Auto-refreshed ${payload.count ?? state.vehicles.length} vehicles from the latest published snapshot.`
    : `Showing ${payload.count ?? state.vehicles.length} vehicles from the latest published snapshot.`;

  buildLegend(payload.typeCounts || {});
  populateTypeFilter(payload.typeCounts || {});
  applyFilters();

  if (previousSelectedId && state.filteredVehicles.some((vehicle) => vehicle.id === previousSelectedId)) {
    selectVehicle(previousSelectedId);
    return;
  }

  if (state.filteredVehicles.length) {
    selectVehicle(state.filteredVehicles[0].id);
    return;
  }

  renderDetails(null);
}

async function refreshVehicles({ silentIfUnchanged = false } = {}) {
  const payload = await loadVehicles();

  if (silentIfUnchanged && payload.generatedAt && payload.generatedAt === state.lastGeneratedAt) {
    return;
  }

  applyPayload(payload, { isBackgroundRefresh: silentIfUnchanged });
}

async function start() {
  initMap();

  elements.searchInput.addEventListener("input", applyFilters);
  elements.typeFilter.addEventListener("change", applyFilters);

  try {
    await refreshVehicles();
    window.setInterval(() => {
      refreshVehicles({ silentIfUnchanged: true }).catch((error) => {
        console.error(error);
        elements.statusBanner.textContent =
          "Auto-refresh could not load the latest published data. The map will keep showing the last successful snapshot.";
      });
    }, REFRESH_INTERVAL_MS);
  } catch (error) {
    console.error(error);
    elements.statusBanner.textContent =
      "The published data file could not be loaded. Run the fetch script or GitHub Action to refresh it.";
    elements.vehicleList.innerHTML =
      '<div class="empty-state">Data is unavailable right now. Check the repository setup steps in the README.</div>';
  }
}

start();
