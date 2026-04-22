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

const TRANSLATIONS = {
  en: {
    unknown: "Unknown",
    waiting: "Waiting",
    all: "All",
    shown: "shown",
    noVehiclesMatch: "No vehicles match this filter yet.",
    routePrefix: "Route",
    from: "From",
    to: "to",
    finalStop: "final stop",
    unknownDirection: "Unknown direction",
    unknownStop: "Unknown stop",
    unknownModel: "Unknown model",
    lowFloor: "Low-floor access",
    accessibilityUnknown: "Accessibility unknown",
    airConditioned: "Air conditioned",
    securityCameras: "Security cameras",
    notAvailable: "Not available",
    seated: "seated",
    standing: "standing",
    noPhoto: "No photo available",
    autoRefreshed: "Auto-refreshed {count} vehicles from the latest published DPO API snapshot.",
    showing: "Showing {count} vehicles from the latest published DPO API snapshot.",
    autoRefreshFailed:
      "Auto-refresh could not load the latest published data. The map will keep showing the last successful snapshot.",
    loadFailed:
      "The published data file could not be loaded. Run the fetch script or GitHub Action to refresh it.",
    dataUnavailable: "Data is unavailable right now. Check the repository setup steps in the README.",
    loadingMapData: "Loading map data...",
    pathNeedsStops: "Please select both start and end stops.",
    pathSameStop: "Start and end stop are the same. Select different stops.",
    pathResult: "Path ready: {from} → {to} ({distance} km straight-line estimate).",
    pathDrawnLabel: "Selected path",
    searchPlaceholder: "Search route, stop, number, model...",
    eyebrow: "Open-source GitHub Pages app",
    languageLabel: "Language",
    heroTitle: "DPO Live Vehicle Map",
    heroCopy:
      "Explore live DPO vehicles on an interactive map. Click any bus, tram, or trolleybus to see its route, timing, vehicle details, and photo.",
    legalNote:
      "Data source: DPO API endpoint (via the refresh script in this repository). Check DPO API terms before public/commercial use.",
    liveVehicles: "Live vehicles",
    lastRefresh: "Last refresh",
    findVehicle: "Find a vehicle",
    vehicleType: "Vehicle type",
    tripPlanner: "Trip planner",
    fromStop: "From",
    toStop: "To",
    buildPath: "Show path",
    vehicles: "Vehicles",
    detailsEmpty: "Select a vehicle on the map or in the list to see details and photo.",
    vehicleNumber: "Vehicle number",
    status: "Status",
    lastStop: "Last stop",
    destination: "Destination",
    model: "Model",
    engine: "Engine",
    capacity: "Capacity",
    accessibility: "Accessibility",
  },
  cs: {
    unknown: "Neznámé",
    waiting: "Čeká se",
    all: "Vše",
    shown: "zobrazeno",
    noVehiclesMatch: "Tomuto filtru teď neodpovídají žádná vozidla.",
    routePrefix: "Linka",
    from: "Ze",
    to: "do",
    finalStop: "konečná",
    unknownDirection: "Neznámý směr",
    unknownStop: "Neznámá zastávka",
    unknownModel: "Neznámý model",
    lowFloor: "Nízkopodlažní přístup",
    accessibilityUnknown: "Bez údajů o přístupnosti",
    airConditioned: "Klimatizace",
    securityCameras: "Bezpečnostní kamery",
    notAvailable: "Není k dispozici",
    seated: "sedících",
    standing: "stojících",
    noPhoto: "Fotografie není k dispozici",
    autoRefreshed: "Automaticky obnoveno: {count} vozidel z posledního snapshotu DPO API.",
    showing: "Zobrazeno {count} vozidel z posledního snapshotu DPO API.",
    autoRefreshFailed:
      "Automatická obnova nemohla načíst nejnovější data. Mapa ponechá poslední úspěšná data.",
    loadFailed:
      "Publikovaný datový soubor se nepodařilo načíst. Spusťte fetch skript nebo GitHub Action.",
    dataUnavailable: "Data jsou teď nedostupná. Zkontrolujte postup v README.",
    loadingMapData: "Načítám data mapy...",
    pathNeedsStops: "Vyberte prosím výchozí i cílovou zastávku.",
    pathSameStop: "Výchozí a cílová zastávka jsou stejné. Vyberte jiné zastávky.",
    pathResult: "Trasa připravena: {from} → {to} (přímý odhad {distance} km).",
    pathDrawnLabel: "Vybraná trasa",
    searchPlaceholder: "Hledat linku, zastávku, číslo, model...",
    eyebrow: "Open-source aplikace pro GitHub Pages",
    languageLabel: "Jazyk",
    heroTitle: "Živá mapa vozidel DPO",
    heroCopy:
      "Prohlížejte živá vozidla DPO na interaktivní mapě. Klikněte na autobus, tramvaj nebo trolejbus a uvidíte linku, zpoždění, detaily vozidla a fotku.",
    legalNote:
      "Zdroj dat: API DPO (přes refresh skript v tomto repozitáři). Před veřejným nebo komerčním použitím ověřte podmínky API DPO.",
    liveVehicles: "Aktivní vozidla",
    lastRefresh: "Poslední obnova",
    findVehicle: "Najít vozidlo",
    vehicleType: "Typ vozidla",
    tripPlanner: "Plánovač trasy",
    fromStop: "Odkud",
    toStop: "Kam",
    buildPath: "Zobrazit trasu",
    vehicles: "Vozidla",
    detailsEmpty: "Vyberte vozidlo na mapě nebo v seznamu a zobrazí se detaily i fotografie.",
    vehicleNumber: "Číslo vozidla",
    status: "Stav",
    lastStop: "Poslední zastávka",
    destination: "Cíl",
    model: "Model",
    engine: "Pohon",
    capacity: "Kapacita",
    accessibility: "Přístupnost",
  },
};

const state = {
  map: null,
  vehicles: [],
  filteredVehicles: [],
  markers: new Map(),
  selectedId: null,
  lastGeneratedAt: null,
  language: "en",
  plannerPathLine: null,
  stopCoordinates: new Map(),
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
  languageSelect: document.querySelector("#language-select"),
  startStop: document.querySelector("#start-stop"),
  endStop: document.querySelector("#end-stop"),
  buildPath: document.querySelector("#build-path"),
  plannerResult: document.querySelector("#planner-result"),
};

function t(key, params = {}) {
  const strings = TRANSLATIONS[state.language] || TRANSLATIONS.en;
  const fallback = TRANSLATIONS.en[key] || key;
  let value = strings[key] || fallback;
  Object.entries(params).forEach(([param, replacement]) => {
    value = value.replaceAll(`{${param}}`, String(replacement));
  });
  return value;
}

function applyLanguageToStaticText() {
  document.documentElement.lang = state.language;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    node.textContent = t(key);
  });

  elements.searchInput.placeholder = t("searchPlaceholder");
  elements.lastUpdated.textContent = state.lastGeneratedAt ? formatDate(state.lastGeneratedAt) : t("waiting");
}

function setLanguage(language) {
  state.language = language === "cs" ? "cs" : "en";
  elements.languageSelect.value = state.language;
  applyLanguageToStaticText();
  buildLegend(
    state.filteredVehicles.reduce((counts, vehicle) => {
      const type = vehicle.type || "unknown";
      counts[type] = (counts[type] || 0) + 1;
      return counts;
    }, {}),
  );
  populateTypeFilter(
    state.vehicles.reduce((counts, vehicle) => {
      const type = vehicle.type || "unknown";
      counts[type] = (counts[type] || 0) + 1;
      return counts;
    }, {}),
  );
  renderVehicleList(state.filteredVehicles);
  renderDetails(state.vehicles.find((item) => item.id === state.selectedId) || null);
}

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
    return t("unknown");
  }

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return t("unknown");
  }

  return new Intl.DateTimeFormat(state.language === "cs" ? "cs-CZ" : undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatVehicleType(type) {
  if (!type) {
    return t("unknown");
  }
  if (type === "trolleybus") {
    return state.language === "cs" ? "Trolejbus" : "Trolleybus";
  }
  if (state.language === "cs" && type === "bus") {
    return "Autobus";
  }
  if (state.language === "cs" && type === "tram") {
    return "Tramvaj";
  }
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function capacityLabel(vehicle) {
  const seating = vehicle.seating ?? 0;
  const standing = vehicle.standing ?? 0;
  if (!seating && !standing) {
    return t("notAvailable");
  }
  return `${seating} ${t("seated")} / ${standing} ${t("standing")}`;
}

function accessLabel(vehicle) {
  const parts = [];
  parts.push(vehicle.isBarrierLess ? t("lowFloor") : t("accessibilityUnknown"));
  if (vehicle.airCondition) {
    parts.push(t("airConditioned"));
  }
  if (vehicle.securityCamera) {
    parts.push(t("securityCameras"));
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
    `<option value="all">${t("all")}</option>`,
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
    <p class="popup-title">${t("routePrefix")} ${vehicle.route ?? "?"} • #${vehicle.vehicleNumber ?? "?"}</p>
    <p class="popup-copy">${vehicle.headSign ?? t("unknownDirection")}</p>
    <p class="popup-copy">${vehicle.delayLabel ?? t("unknown")}</p>
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
  elements.listCount.textContent = `${vehicles.length} ${t("shown")}`;

  if (!vehicles.length) {
    elements.vehicleList.innerHTML = `<div class="empty-state">${t("noVehiclesMatch")}</div>`;
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
              <div class="vehicle-primary">${t("routePrefix")} ${vehicle.route ?? "?"} • #${vehicle.vehicleNumber ?? "?"}</div>
              <div class="vehicle-secondary">${vehicle.headSign ?? t("unknownDirection")}</div>
            </div>
            <span class="delay-chip ${delayClass}">${vehicle.delayLabel ?? t("unknown")}</span>
          </div>
          <div class="vehicle-secondary">${vehicle.lastStopName ?? t("unknownStop")} • ${vehicle.modelName ?? t("unknownModel")}</div>
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

  elements.detailRoute.textContent = `${t("routePrefix")} ${vehicle.route ?? "?"}`;
  elements.detailType.textContent = formatVehicleType(vehicle.type);
  elements.detailTitle.textContent = vehicle.headSign || `Vehicle #${vehicle.vehicleNumber ?? "?"}`;
  elements.detailSummary.textContent = [
    vehicle.tripFrom ? `${t("from")} ${vehicle.tripFrom}` : null,
    vehicle.tripTo ? `${t("to")} ${vehicle.tripTo}` : null,
    vehicle.finalStopName ? `${t("finalStop")} ${vehicle.finalStopName}` : null,
  ]
    .filter(Boolean)
    .join(" • ");
  elements.detailNumber.textContent = vehicle.vehicleNumber ?? t("unknown");
  elements.detailStatus.textContent = vehicle.delayLabel ?? t("unknown");
  elements.detailLastStop.textContent = vehicle.lastStopName ?? t("unknown");
  elements.detailDestination.textContent = vehicle.finalStopName ?? vehicle.headSign ?? t("unknown");
  elements.detailModel.textContent = vehicle.modelName ?? t("unknown");
  elements.detailEngine.textContent = vehicle.engineType ?? t("unknown");
  elements.detailCapacity.textContent = capacityLabel(vehicle);
  elements.detailAccess.textContent = accessLabel(vehicle);

  if (vehicle.image) {
    elements.detailImage.src = vehicle.image;
    elements.detailImage.alt = `${vehicle.modelName ?? "Vehicle"} photo`;
    elements.detailImageCaption.textContent = `${vehicle.modelName ?? "Vehicle"}${vehicle.licensePlate ? ` • ${vehicle.licensePlate}` : ""}`;
  } else {
    elements.detailImage.removeAttribute("src");
    elements.detailImage.alt = "";
    elements.detailImageCaption.textContent = t("noPhoto");
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

function buildStopCoordinates(vehicles) {
  const buckets = new Map();

  vehicles.forEach((vehicle) => {
    if (typeof vehicle.lat !== "number" || typeof vehicle.lng !== "number") {
      return;
    }
    [vehicle.lastStopName, vehicle.tripFrom, vehicle.tripTo, vehicle.finalStopName]
      .filter(Boolean)
      .forEach((stopName) => {
        const current = buckets.get(stopName) || { latSum: 0, lngSum: 0, count: 0 };
        current.latSum += vehicle.lat;
        current.lngSum += vehicle.lng;
        current.count += 1;
        buckets.set(stopName, current);
      });
  });

  state.stopCoordinates = new Map(
    [...buckets.entries()]
      .filter(([, value]) => value.count > 0)
      .map(([name, value]) => [name, { lat: value.latSum / value.count, lng: value.lngSum / value.count }]),
  );
}

function populateStopSelectors() {
  const stops = [...state.stopCoordinates.keys()].sort((a, b) => a.localeCompare(b));
  const stopOptions = stops.map((stop) => `<option value="${stop}">${stop}</option>`).join("");
  elements.startStop.innerHTML = `<option value="">—</option>${stopOptions}`;
  elements.endStop.innerHTML = `<option value="">—</option>${stopOptions}`;
}

function distanceKm(start, end) {
  const r = 6371;
  const dLat = ((end.lat - start.lat) * Math.PI) / 180;
  const dLng = ((end.lng - start.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((start.lat * Math.PI) / 180) * Math.cos((end.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function drawPlannerPath() {
  const fromName = elements.startStop.value;
  const toName = elements.endStop.value;

  if (!fromName || !toName) {
    elements.plannerResult.textContent = t("pathNeedsStops");
    return;
  }
  if (fromName === toName) {
    elements.plannerResult.textContent = t("pathSameStop");
    return;
  }

  const start = state.stopCoordinates.get(fromName);
  const end = state.stopCoordinates.get(toName);
  if (!start || !end) {
    elements.plannerResult.textContent = t("pathNeedsStops");
    return;
  }

  if (state.plannerPathLine) {
    state.plannerPathLine.remove();
  }

  state.plannerPathLine = L.polyline(
    [
      [start.lat, start.lng],
      [end.lat, end.lng],
    ],
    {
      color: "#93c5fd",
      weight: 5,
      opacity: 0.95,
      dashArray: "10, 8",
    },
  )
    .bindTooltip(t("pathDrawnLabel"))
    .addTo(state.map);

  state.map.fitBounds(state.plannerPathLine.getBounds(), { padding: [40, 40], maxZoom: 14 });

  const km = distanceKm(start, end).toFixed(1);
  elements.plannerResult.textContent = t("pathResult", { from: fromName, to: toName, distance: km });
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
    ? t("autoRefreshed", { count: payload.count ?? state.vehicles.length })
    : t("showing", { count: payload.count ?? state.vehicles.length });

  buildLegend(payload.typeCounts || {});
  populateTypeFilter(payload.typeCounts || {});
  buildStopCoordinates(state.vehicles);
  populateStopSelectors();
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
  setLanguage("en");
  elements.statusBanner.textContent = t("loadingMapData");

  elements.searchInput.addEventListener("input", applyFilters);
  elements.typeFilter.addEventListener("change", applyFilters);
  elements.languageSelect.addEventListener("change", (event) => {
    setLanguage(event.target.value);
  });
  elements.buildPath.addEventListener("click", drawPlannerPath);

  try {
    await refreshVehicles();
    window.setInterval(() => {
      refreshVehicles({ silentIfUnchanged: true }).catch((error) => {
        console.error(error);
        elements.statusBanner.textContent = t("autoRefreshFailed");
      });
    }, REFRESH_INTERVAL_MS);
  } catch (error) {
    console.error(error);
    elements.statusBanner.textContent = t("loadFailed");
    elements.vehicleList.innerHTML = `<div class="empty-state">${t("dataUnavailable")}</div>`;
  }
}

start();
