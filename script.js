
const STORAGE_KEY = "pakslim-state-v1";
const HISTORY_STORAGE_KEY = "pakslim-history-v1";
const THEME_STORAGE_KEY = "pakslim-theme-v1";
const SETTINGS_STORAGE_KEY = "pakslim-settings-v1";
const SAVED_TRIPS_STORAGE_KEY = "pakslim-saved-trips-v1";

const categories = ["Essentieel", "Kleding", "Toiletspullen", "Slapen", "Elektronica", "Extra"];

const tripTypeLabels = {
  kamp: "Kamp",
  weekend: "Weekend weg",
  vakantie: "Vakantie",
  dagje: "Dagje weg",
};

const weatherLabels = {
  normaal: "normaal weer",
  warm: "warm weer",
  koud: "koud weer",
  regen: "regen",
};

const baseItems = [
  { name: "Portemonnee", category: "Essentieel" },
  { name: "ID", category: "Essentieel" },
  { name: "Telefoon", category: "Essentieel" },
  { name: "Oplader", category: "Elektronica" },
  { name: "Sleutels", category: "Essentieel" },
  { name: "Medicatie", category: "Essentieel" },
  { name: "Tandenborstel", category: "Toiletspullen" },
  { name: "Tandpasta", category: "Toiletspullen" },
  { name: "Deodorant", category: "Toiletspullen" },
];

const tripItems = {
  kamp: [
    { name: "Slaapzak", category: "Slapen" },
    { name: "Luchtbed", category: "Slapen" },
    { name: "Zaklamp", category: "Extra" },
    { name: "Sportkleding", category: "Kleding" },
    { name: "Oude kleding", category: "Kleding" },
    { name: "Regenjas", category: "Kleding" },
  ],
  weekend: [
    { name: "Extra outfit", category: "Kleding" },
    { name: "Toilettas", category: "Toiletspullen" },
    { name: "Pyjama", category: "Kleding" },
    { name: "Casual schoenen", category: "Kleding" },
  ],
  vakantie: [
    { name: "Paspoort", category: "Essentieel" },
    { name: "Reisdocumenten", category: "Essentieel" },
    { name: "Zwemkleding", category: "Kleding" },
    { name: "Zonnebrand", category: "Toiletspullen" },
    { name: "Zonnebril", category: "Extra" },
    { name: "Powerbank", category: "Elektronica" },
  ],
  dagje: [
    { name: "Drinkfles", category: "Extra" },
    { name: "Snacks", category: "Extra" },
    { name: "Jas", category: "Kleding" },
    { name: "Powerbank", category: "Elektronica" },
  ],
};

const weatherItems = {
  warm: [
    { name: "Zonnebrand", category: "Toiletspullen" },
    { name: "Pet", category: "Extra" },
    { name: "Extra T-shirt", category: "Kleding" },
  ],
  koud: [
    { name: "Trui", category: "Kleding" },
    { name: "Dikke sokken", category: "Kleding" },
    { name: "Warme jas", category: "Kleding" },
  ],
  regen: [
    { name: "Regenjas", category: "Kleding" },
    { name: "Extra sokken", category: "Kleding" },
    { name: "Poncho of waterdichte tas", category: "Extra" },
  ],
  normaal: [],
};

const elements = {
  form: document.getElementById("trip-form"),
  themeSelect: document.getElementById("theme-select"),
  tripName: document.getElementById("trip-name"),
  tripType: document.getElementById("trip-type"),
  tripDays: document.getElementById("trip-days"),
  tripWeather: Array.from(document.querySelectorAll('input[name="trip-weather"]')),
  tripOvernight: document.getElementById("trip-overnight"),
  resetBtn: document.getElementById("reset-btn"),
  packingSection: document.getElementById("packing-section"),
  packingList: document.getElementById("packing-list"),
  suggestionsPanel: document.getElementById("suggestions-panel"),
  suggestionsMeta: document.getElementById("suggestions-meta"),
  suggestedItems: document.getElementById("suggested-items"),
  removedItemsNote: document.getElementById("removed-items-note"),
  tripTitle: document.getElementById("trip-title"),
  progressText: document.getElementById("progress-text"),
  progressBar: document.getElementById("progress-bar"),
  filterUnpacked: document.getElementById("filter-unpacked"),
  saveTripBtn: document.getElementById("save-trip-btn"),
  tripNotes: document.getElementById("trip-notes"),
  customItemName: document.getElementById("custom-item-name"),
  customItemCategory: document.getElementById("custom-item-category"),
  addItemBtn: document.getElementById("add-item-btn"),
  personalItemName: document.getElementById("personal-item-name"),
  personalItemCategory: document.getElementById("personal-item-category"),
  personalItemScope: document.getElementById("personal-item-scope"),
  personalItemWeather: document.getElementById("personal-item-weather"),
  addPersonalItemBtn: document.getElementById("add-personal-item-btn"),
  personalDefaultsList: document.getElementById("personal-defaults-list"),
  savedTripsSearch: document.getElementById("saved-trips-search"),
  savedTripsClear: document.getElementById("saved-trips-clear"),
  savedTripsSort: document.getElementById("saved-trips-sort"),
  savedTripsList: document.getElementById("saved-trips-list"),
  saveTripFeedback: document.getElementById("save-trip-feedback"),
};

let appState = loadState();
let historyState = loadHistory();
let settingsState = loadSettings();
let savedTrips = loadSavedTrips();
let themeState = loadTheme();
let draggedItemId = null;
let saveTripFeedbackTimer = null;

function uniqueId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeItemName(name) {
  return name.trim().toLowerCase();
}

function makeItem(name, category, packed = false) {
  return { id: uniqueId(), name, category, packed };
}

function cloneItemsWithFreshIds(items) {
  return items.map((item) => makeItem(item.name, item.category, Boolean(item.packed)));
}

function addIfMissing(list, item) {
  const exists = list.some((entry) => normalizeItemName(entry.name) === normalizeItemName(item.name));
  if (!exists) list.push(makeItem(item.name, item.category, Boolean(item.packed)));
}

function createEmptySettings() {
  return {
    always: [],
    tripTypes: { kamp: [], weekend: [], vakantie: [], dagje: [] },
    weatherTypes: { normaal: [], warm: [], koud: [], regen: [] },
    comboTypes: {},
  };
}

function createEmptyAppState() {
  return { trip: null, items: [], savedTripId: null, filterUnchecked: false };
}

function normalizeWeatherSelection(weather) {
  const weatherList = Array.isArray(weather) ? weather : weather ? [weather] : ["normaal"];
  const uniqueWeather = [...new Set(weatherList)];
  if (!uniqueWeather.length) return ["normaal"];
  if (uniqueWeather.length > 1) return uniqueWeather.filter((type) => type !== "normaal");
  return uniqueWeather;
}

function normalizeTrip(trip) {
  if (!trip) return null;
  return {
    tripName: trip.tripName || "",
    tripType: trip.tripType || "kamp",
    days: Math.max(1, Number(trip.days) || 1),
    weather: normalizeWeatherSelection(trip.weather),
    overnight: trip.overnight || "ja",
    notes: trip.notes || "",
  };
}

function normalizeSettings(settings) {
  const base = createEmptySettings();
  if (!settings) return base;

  const normalizeItems = (items) => Array.isArray(items)
    ? items.filter((item) => item?.name && item?.category).map((item) => ({ name: item.name, category: item.category }))
    : [];

  return {
    always: normalizeItems(settings.always),
    tripTypes: {
      kamp: normalizeItems(settings.tripTypes?.kamp),
      weekend: normalizeItems(settings.tripTypes?.weekend),
      vakantie: normalizeItems(settings.tripTypes?.vakantie),
      dagje: normalizeItems(settings.tripTypes?.dagje),
    },
    weatherTypes: {
      normaal: normalizeItems(settings.weatherTypes?.normaal),
      warm: normalizeItems(settings.weatherTypes?.warm),
      koud: normalizeItems(settings.weatherTypes?.koud),
      regen: normalizeItems(settings.weatherTypes?.regen),
    },
    comboTypes: Object.fromEntries(
      Object.entries(settings.comboTypes || {})
        .map(([key, items]) => [key, normalizeItems(items)])
        .filter(([, items]) => items.length)
    ),
  };
}
function normalizeSavedTrip(entry) {
  if (!entry?.trip || !Array.isArray(entry.items)) return null;

  const trip = normalizeTrip(entry.trip);
  const items = entry.items
    .filter((item) => item?.name && item?.category)
    .map((item) => ({ name: item.name, category: item.category, packed: Boolean(item.packed) }));

  return {
    id: entry.id || uniqueId(),
    name: entry.name || getTripDisplayName(trip),
    trip,
    items,
    savedAt: entry.savedAt || new Date().toISOString(),
  };
}

function normalizeAppState(state) {
  const base = createEmptyAppState();
  if (!state) return base;

  return {
    trip: normalizeTrip(state.trip),
    items: Array.isArray(state.items)
      ? state.items.filter((item) => item?.name && item?.category).map((item) => makeItem(item.name, item.category, Boolean(item.packed)))
      : [],
    savedTripId: state.savedTripId || null,
    filterUnchecked: Boolean(state.filterUnchecked),
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    trip: appState.trip,
    items: appState.items,
    savedTripId: appState.savedTripId,
    filterUnchecked: appState.filterUnchecked,
  }));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return createEmptyAppState();
  try {
    return normalizeAppState(JSON.parse(saved));
  } catch {
    return createEmptyAppState();
  }
}

function saveHistory() {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyState));
}

function loadHistory() {
  const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
  if (!saved) return {};
  try {
    return JSON.parse(saved);
  } catch {
    return {};
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsState));
}

function loadSettings() {
  const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!saved) return createEmptySettings();
  try {
    return normalizeSettings(JSON.parse(saved));
  } catch {
    return createEmptySettings();
  }
}

function saveSavedTrips() {
  localStorage.setItem(SAVED_TRIPS_STORAGE_KEY, JSON.stringify(savedTrips));
}

function loadSavedTrips() {
  const saved = localStorage.getItem(SAVED_TRIPS_STORAGE_KEY);
  if (!saved) return [];
  try {
    return JSON.parse(saved).map((entry) => normalizeSavedTrip(entry)).filter(Boolean);
  } catch {
    return [];
  }
}

function saveTheme(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  return ["light", "dark", "sunset"].includes(saved) ? saved : "light";
}

function updateThemeColorMeta() {
  const themeColor = getComputedStyle(document.body).getPropertyValue("--primary").trim();
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor && themeColor) metaThemeColor.setAttribute("content", themeColor);
}

function applyTheme(theme) {
  themeState = ["light", "dark", "sunset"].includes(theme) ? theme : "light";
  document.body.dataset.theme = themeState;
  elements.themeSelect.value = themeState;
  updateThemeColorMeta();
}

function getSelectedWeather() {
  const selected = elements.tripWeather.filter((input) => input.checked).map((input) => input.value);
  return normalizeWeatherSelection(selected);
}

function setSelectedWeather(weather) {
  const normalizedWeather = normalizeWeatherSelection(weather);
  elements.tripWeather.forEach((input) => {
    input.checked = normalizedWeather.includes(input.value);
  });
}

function addQuantities(list, days, overnight) {
  const adjustedDays = overnight === "nee" ? 1 : days;
  const clothingCounts = [
    { name: `Ondergoed (${adjustedDays})`, category: "Kleding" },
    { name: `Sokken (${adjustedDays})`, category: "Kleding" },
    { name: `T-shirts (${adjustedDays})`, category: "Kleding" },
    { name: `Broeken (${Math.max(1, Math.ceil(adjustedDays / 3))})`, category: "Kleding" },
  ];

  clothingCounts.forEach((item) => addIfMissing(list, item));

  if (overnight === "ja") {
    addIfMissing(list, { name: "Pyjama", category: "Kleding" });
    addIfMissing(list, { name: "Handdoek", category: "Toiletspullen" });
  }
}

function buildBaseItems({ tripType, days, weather, overnight }) {
  const items = [];
  const selectedWeather = normalizeWeatherSelection(weather);

  baseItems.forEach((item) => addIfMissing(items, item));
  (tripItems[tripType] || []).forEach((item) => addIfMissing(items, item));
  selectedWeather.forEach((weatherType) => {
    (weatherItems[weatherType] || []).forEach((item) => addIfMissing(items, item));
  });
  settingsState.always.forEach((item) => addIfMissing(items, item));
  (settingsState.tripTypes[tripType] || []).forEach((item) => addIfMissing(items, item));
  selectedWeather.forEach((weatherType) => {
    (settingsState.weatherTypes[weatherType] || []).forEach((item) => addIfMissing(items, item));
    (settingsState.comboTypes[`${tripType}__${weatherType}`] || []).forEach((item) => addIfMissing(items, item));
  });
  addQuantities(items, days, overnight);

  if (overnight === "nee") {
    ["Slaapzak", "Luchtbed", "Pyjama"].forEach((name) => {
      const index = items.findIndex((item) => normalizeItemName(item.name) === normalizeItemName(name));
      if (index !== -1) items.splice(index, 1);
    });
  }

  return items;
}

function generatePackingList({ tripName, tripType, days, weather, overnight, notes }) {
  const trip = normalizeTrip({ tripName, tripType, days, weather, overnight, notes });
  return { trip, items: buildBaseItems(trip), savedTripId: null, filterUnchecked: false };
}

function labelForTripType(type) {
  return tripTypeLabels[type] || "Trip";
}

function getTripDisplayName(trip) {
  const cleanName = trip?.tripName?.trim();
  return cleanName || `Paklijst: ${labelForTripType(trip?.tripType)}`;
}

function getTripProfileKey(trip) {
  const weather = normalizeWeatherSelection(trip.weather).slice().sort().join("+");
  return `${trip.tripType}__${weather}`;
}

function getTripProfileLabel(trip) {
  const weatherText = normalizeWeatherSelection(trip.weather).map((type) => weatherLabels[type] || type).join(", ");
  return `${labelForTripType(trip.tripType)} - ${weatherText}`;
}

function collectTripAdjustments(trip, items) {
  const baseItemsForTrip = buildBaseItems(trip);
  const currentMap = new Map(items.map((item) => [normalizeItemName(item.name), item]));
  const baseMap = new Map(baseItemsForTrip.map((item) => [normalizeItemName(item.name), item]));

  const addedItems = items
    .filter((item) => !baseMap.has(normalizeItemName(item.name)))
    .map((item) => ({ name: item.name, category: item.category }));

  const removedItems = baseItemsForTrip
    .filter((item) => !currentMap.has(normalizeItemName(item.name)))
    .map((item) => ({ name: item.name, category: item.category }));

  return { addedItems, removedItems };
}

function persistHistoryForCurrentTrip() {
  if (!appState.trip) return;

  historyState[getTripProfileKey(appState.trip)] = {
    tripType: appState.trip.tripType,
    weather: normalizeWeatherSelection(appState.trip.weather),
    updatedAt: new Date().toISOString(),
    ...collectTripAdjustments(appState.trip, appState.items),
  };

  saveHistory();
}
function getSuggestionsForTrip(trip, currentItems = []) {
  const profile = historyState[getTripProfileKey(trip)];
  if (!profile) return null;

  const currentNames = new Set(currentItems.map((item) => normalizeItemName(item.name)));
  const suggestedItems = (profile.addedItems || []).filter(
    (item) => !currentNames.has(normalizeItemName(item.name))
  );

  return { ...profile, suggestedItems };
}

function commitState({ updateHistory = false, syncSavedTrip = true } = {}) {
  saveState();
  if (updateHistory) persistHistoryForCurrentTrip();
  if (syncSavedTrip) syncCurrentTripToSavedTrip();
}

function syncCurrentTripToSavedTrip() {
  if (!appState.savedTripId) return;

  const index = savedTrips.findIndex((trip) => trip.id === appState.savedTripId);
  if (index === -1) {
    appState.savedTripId = null;
    saveState();
    return;
  }

  savedTrips[index] = {
    id: appState.savedTripId,
    name: getTripDisplayName(appState.trip),
    trip: normalizeTrip(appState.trip),
    items: appState.items.map((item) => ({ name: item.name, category: item.category, packed: Boolean(item.packed) })),
    savedAt: new Date().toISOString(),
  };

  saveSavedTrips();
  renderSavedTrips();
}

function fillFormFromState() {
  if (!appState.trip) {
    elements.tripNotes.value = "";
    return;
  }

  elements.tripName.value = appState.trip.tripName || "";
  elements.tripType.value = appState.trip.tripType || "kamp";
  elements.tripDays.value = appState.trip.days || 3;
  setSelectedWeather(appState.trip.weather || ["normaal"]);
  elements.tripOvernight.value = appState.trip.overnight || "ja";
  elements.tripNotes.value = appState.trip.notes || "";
}

function updateSaveTripButton() {
  elements.saveTripBtn.textContent = appState.savedTripId ? "Trip bijwerken" : "Trip opslaan";
}

function renderPersonalDefaults() {
  const groups = [
    { key: "always", label: "Altijd toevoegen", items: settingsState.always },
    { key: "kamp", label: "Kamp", items: settingsState.tripTypes.kamp },
    { key: "weekend", label: "Weekend weg", items: settingsState.tripTypes.weekend },
    { key: "vakantie", label: "Vakantie", items: settingsState.tripTypes.vakantie },
    { key: "dagje", label: "Dagje weg", items: settingsState.tripTypes.dagje },
    { key: "weather:normaal", label: "Normaal weer", items: settingsState.weatherTypes.normaal },
    { key: "weather:warm", label: "Warm weer", items: settingsState.weatherTypes.warm },
    { key: "weather:koud", label: "Koud weer", items: settingsState.weatherTypes.koud },
    { key: "weather:regen", label: "Regen", items: settingsState.weatherTypes.regen },
  ];
  const comboGroups = Object.entries(settingsState.comboTypes)
    .filter(([, items]) => items.length)
    .map(([key, items]) => {
      const [tripType, weatherType] = key.split("__");
      return {
        key: `combo:${key}`,
        label: `${labelForTripType(tripType)} + ${weatherLabels[weatherType] || weatherType}`,
        items,
      };
    });

  elements.personalDefaultsList.innerHTML = "";

  [...groups, ...comboGroups].forEach((group) => {
    const section = document.createElement("div");
    section.className = "defaults-group";

    const title = document.createElement("div");
    title.className = "defaults-group-title";
    title.textContent = group.label;
    section.appendChild(title);

    if (!group.items.length) {
      const emptyNote = document.createElement("p");
      emptyNote.className = "empty-note";
      emptyNote.textContent = "Nog geen items toegevoegd.";
      section.appendChild(emptyNote);
    } else {
      group.items.forEach((item) => {
        const row = document.createElement("div");
        row.className = "compact-item-row";

        const copy = document.createElement("div");
        copy.className = "compact-item-copy";
        copy.innerHTML = `<span class="compact-item-name">${item.name}</span><span class="compact-item-meta">${item.category}</span>`;

        const actions = document.createElement("div");
        actions.className = "compact-item-actions";

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "mini-btn danger";
        deleteBtn.textContent = "Verwijder";
        deleteBtn.addEventListener("click", () => removePersonalDefaultItem(group.key, item.name));

        actions.appendChild(deleteBtn);
        row.append(copy, actions);
        section.appendChild(row);
      });
    }

    elements.personalDefaultsList.appendChild(section);
  });
}

function formatSavedAt(value) {
  try {
    return new Intl.DateTimeFormat("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function renderSavedTrips() {
  elements.savedTripsList.innerHTML = "";
  const query = elements.savedTripsSearch.value.trim().toLowerCase();
  const sortMode = elements.savedTripsSort.value;
  elements.savedTripsClear.classList.toggle("hidden", !query);
  const filteredTrips = savedTrips.filter((savedTrip) => {
    if (!query) return true;
    const haystack = [
      savedTrip.name,
      getTripProfileLabel(savedTrip.trip),
      savedTrip.trip.notes || "",
    ].join(" ").toLowerCase();
    return haystack.includes(query);
  });

  if (!savedTrips.length) {
    const emptyNote = document.createElement("p");
    emptyNote.className = "empty-note";
    emptyNote.textContent = "Nog geen trips opgeslagen.";
    elements.savedTripsList.appendChild(emptyNote);
    return;
  }

  if (!filteredTrips.length) {
    const emptyNote = document.createElement("p");
    emptyNote.className = "empty-note";
    emptyNote.textContent = "Geen opgeslagen trips gevonden.";
    elements.savedTripsList.appendChild(emptyNote);
    return;
  }

  filteredTrips.slice().sort((a, b) => {
    if (sortMode === "name") {
      return a.name.localeCompare(b.name, "nl");
    }
    if (sortMode === "oldest") {
      return new Date(a.savedAt) - new Date(b.savedAt);
    }
    return new Date(b.savedAt) - new Date(a.savedAt);
  }).forEach((savedTrip) => {
    const row = document.createElement("div");
    row.className = "saved-trip-row";

    const copy = document.createElement("div");
    copy.className = "saved-trip-copy";
    copy.innerHTML = `<span class="saved-trip-name">${savedTrip.name}</span><span class="saved-trip-meta">${getTripProfileLabel(savedTrip.trip)} - ${formatSavedAt(savedTrip.savedAt)}</span>`;

    const actions = document.createElement("div");
    actions.className = "saved-trip-actions";

    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "mini-btn";
    openBtn.textContent = "Open";
    openBtn.addEventListener("click", () => openSavedTrip(savedTrip.id));

    const duplicateBtn = document.createElement("button");
    duplicateBtn.type = "button";
    duplicateBtn.className = "mini-btn";
    duplicateBtn.textContent = "Kopie";
    duplicateBtn.addEventListener("click", () => duplicateSavedTrip(savedTrip.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "mini-btn danger";
    deleteBtn.textContent = "Verwijder";
    deleteBtn.addEventListener("click", () => deleteSavedTrip(savedTrip.id));

    actions.append(openBtn, duplicateBtn, deleteBtn);
    row.append(copy, actions);
    elements.savedTripsList.appendChild(row);
  });
}

function renderSuggestions() {
  const suggestionData = appState.trip ? getSuggestionsForTrip(appState.trip, appState.items) : null;

  elements.suggestedItems.innerHTML = "";
  elements.suggestionsMeta.textContent = "";
  elements.removedItemsNote.textContent = "";
  elements.removedItemsNote.classList.add("hidden");

  if (!suggestionData || (!suggestionData.suggestedItems.length && !(suggestionData.removedItems || []).length)) {
    elements.suggestionsPanel.classList.add("hidden");
    return;
  }

  elements.suggestionsPanel.classList.remove("hidden");
  elements.suggestionsMeta.textContent = `Onthouden voor ${getTripProfileLabel(appState.trip)}`;

  suggestionData.suggestedItems.forEach((item) => {
    const row = document.createElement("div");
    row.className = "suggestion-row";

    const copy = document.createElement("div");
    copy.className = "suggestion-copy";
    copy.innerHTML = `<span class="suggestion-name">${item.name}</span><span class="suggestion-category">${item.category}</span>`;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggestion-btn";
    button.textContent = "Toevoegen";
    button.addEventListener("click", () => addSuggestedItem(item));

    row.append(copy, button);
    elements.suggestedItems.appendChild(row);
  });

  if (suggestionData.removedItems?.length) {
    const removedNames = suggestionData.removedItems.map((item) => item.name).join(", ");
    elements.removedItemsNote.textContent = `Eerder verwijderd bij dit profiel: ${removedNames}.`;
    elements.removedItemsNote.classList.remove("hidden");
  }
}

function renderPackingList() {
  elements.packingList.innerHTML = "";

  const sourceItems = appState.filterUnchecked ? appState.items.filter((item) => !item.packed) : appState.items;

  if (!sourceItems.length) {
    const emptyNote = document.createElement("p");
    emptyNote.className = "empty-note";
    emptyNote.textContent = appState.filterUnchecked ? "Alles staat al op ingepakt." : "Nog geen items in deze lijst.";
    elements.packingList.appendChild(emptyNote);
    return;
  }
  categories.forEach((category) => {
    const visibleItems = sourceItems.filter((item) => item.category === category);
    if (appState.filterUnchecked && !visibleItems.length) return;

    const categoryCard = document.createElement("section");
    categoryCard.className = "category-card";
    categoryCard.dataset.category = category;
    categoryCard.addEventListener("dragover", handleCategoryDragOver);
    categoryCard.addEventListener("dragenter", handleCategoryDragEnter);
    categoryCard.addEventListener("dragleave", handleCategoryDragLeave);
    categoryCard.addEventListener("drop", handleCategoryDrop);

    const top = document.createElement("div");
    top.className = "category-top";
    top.innerHTML = `<h3>${category}</h3><span class="category-count">${visibleItems.length} item(s)</span>`;

    const list = document.createElement("div");
    list.className = "item-list";

    if (!visibleItems.length) {
      const emptyNote = document.createElement("p");
      emptyNote.className = "empty-note";
      emptyNote.textContent = "Sleep een item hierheen.";
      list.appendChild(emptyNote);
    }

    visibleItems.forEach((item) => {
      const row = document.createElement("div");
      row.className = "item-row";
      row.draggable = true;
      row.dataset.itemId = item.id;
      row.addEventListener("dragstart", handleItemDragStart);
      row.addEventListener("dragend", handleItemDragEnd);

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = item.packed;
      checkbox.addEventListener("change", () => togglePacked(item.id));

      const label = document.createElement("span");
      label.className = `item-label ${item.packed ? "packed" : ""}`;
      label.textContent = item.name;

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "item-delete";
      deleteBtn.type = "button";
      deleteBtn.textContent = "x";
      deleteBtn.setAttribute("aria-label", `Verwijder ${item.name}`);
      deleteBtn.addEventListener("click", () => deleteItem(item.id));

      row.append(checkbox, label, deleteBtn);
      list.appendChild(row);
    });

    categoryCard.append(top, list);
    elements.packingList.appendChild(categoryCard);
  });

  if (!elements.packingList.children.length) {
    const emptyNote = document.createElement("p");
    emptyNote.className = "empty-note";
    emptyNote.textContent = "Alles staat al op ingepakt.";
    elements.packingList.appendChild(emptyNote);
  }
}

function render() {
  updateSaveTripButton();
  elements.filterUnpacked.checked = appState.filterUnchecked;
  elements.tripNotes.value = appState.trip?.notes || "";

  if (!appState.trip || !appState.items.length) {
    elements.packingSection.classList.add("hidden");
    elements.suggestionsPanel.classList.add("hidden");
    return;
  }

  elements.packingSection.classList.remove("hidden");
  elements.tripTitle.textContent = getTripDisplayName(appState.trip);

  const packedCount = appState.items.filter((item) => item.packed).length;
  const totalCount = appState.items.length;
  const percentage = totalCount ? Math.round((packedCount / totalCount) * 100) : 0;

  elements.progressText.textContent = `${packedCount} van ${totalCount} ingepakt`;
  elements.progressBar.style.width = `${percentage}%`;

  renderSuggestions();
  renderPackingList();
}

function addPersonalDefaultItem() {
  const name = elements.personalItemName.value.trim();
  const category = elements.personalItemCategory.value;
  const scope = elements.personalItemScope.value;
  const weatherScope = elements.personalItemWeather.value;
  if (!name) return;

  let targetList;
  if (scope !== "always" && weatherScope !== "any") {
    const comboKey = `${scope}__${weatherScope}`;
    if (!settingsState.comboTypes[comboKey]) settingsState.comboTypes[comboKey] = [];
    targetList = settingsState.comboTypes[comboKey];
  } else if (weatherScope !== "any") {
    targetList = settingsState.weatherTypes[weatherScope];
  } else if (scope === "always") {
    targetList = settingsState.always;
  } else {
    targetList = settingsState.tripTypes[scope];
  }
  const exists = targetList.some((item) => normalizeItemName(item.name) === normalizeItemName(name));
  if (exists) {
    elements.personalItemName.value = "";
    return;
  }

  targetList.push({ name, category });
  saveSettings();
  renderPersonalDefaults();
  elements.personalItemName.value = "";
  elements.personalItemScope.value = "always";
  elements.personalItemWeather.value = "any";
}

function removePersonalDefaultItem(scope, itemName) {
  let targetList;
  if (scope.startsWith("combo:")) {
    const comboKey = scope.split(":")[1];
    targetList = settingsState.comboTypes[comboKey] || [];
  } else if (scope.startsWith("weather:")) {
    const weatherScope = scope.split(":")[1];
    targetList = settingsState.weatherTypes[weatherScope];
  } else {
    targetList = scope === "always" ? settingsState.always : settingsState.tripTypes[scope];
  }
  const nextItems = targetList.filter((item) => normalizeItemName(item.name) !== normalizeItemName(itemName));

  if (scope.startsWith("combo:")) {
    const comboKey = scope.split(":")[1];
    if (nextItems.length) {
      settingsState.comboTypes[comboKey] = nextItems;
    } else {
      delete settingsState.comboTypes[comboKey];
    }
  } else if (scope.startsWith("weather:")) {
    const weatherScope = scope.split(":")[1];
    settingsState.weatherTypes[weatherScope] = nextItems;
  } else if (scope === "always") {
    settingsState.always = nextItems;
  } else {
    settingsState.tripTypes[scope] = nextItems;
  }

  saveSettings();
  renderPersonalDefaults();
}

function saveCurrentTrip() {
  if (!appState.trip) return;
  const wasExistingTrip = Boolean(appState.savedTripId);

  const record = {
    id: appState.savedTripId || uniqueId(),
    name: getTripDisplayName(appState.trip),
    trip: normalizeTrip(appState.trip),
    items: appState.items.map((item) => ({ name: item.name, category: item.category, packed: Boolean(item.packed) })),
    savedAt: new Date().toISOString(),
  };

  const existingIndex = savedTrips.findIndex((entry) => entry.id === record.id);
  if (existingIndex === -1) {
    savedTrips.unshift(record);
  } else {
    savedTrips[existingIndex] = record;
  }

  appState.savedTripId = record.id;
  saveSavedTrips();
  saveState();
  renderSavedTrips();
  render();
  showSaveTripFeedback(wasExistingTrip ? "Trip bijgewerkt" : "Trip opgeslagen");
}

function openSavedTrip(id) {
  const savedTrip = savedTrips.find((entry) => entry.id === id);
  if (!savedTrip) return;

  persistHistoryForCurrentTrip();
  appState = {
    trip: normalizeTrip(savedTrip.trip),
    items: cloneItemsWithFreshIds(savedTrip.items),
    savedTripId: savedTrip.id,
    filterUnchecked: false,
  };

  saveState();
  fillFormFromState();
  render();
}

function makeCopyName(name) {
  return name.endsWith("(kopie)") ? `${name} 2` : `${name} (kopie)`;
}

function duplicateSavedTrip(id) {
  const savedTrip = savedTrips.find((entry) => entry.id === id);
  if (!savedTrip) return;

  const duplicateTrip = normalizeTrip(savedTrip.trip);
  duplicateTrip.tripName = makeCopyName(getTripDisplayName(savedTrip.trip));

  savedTrips.unshift({
    id: uniqueId(),
    name: duplicateTrip.tripName,
    trip: duplicateTrip,
    items: savedTrip.items.map((item) => ({ name: item.name, category: item.category, packed: Boolean(item.packed) })),
    savedAt: new Date().toISOString(),
  });

  saveSavedTrips();
  renderSavedTrips();
  showSaveTripFeedback("Kopie gemaakt");
}

function deleteSavedTrip(id) {
  savedTrips = savedTrips.filter((entry) => entry.id !== id);
  if (appState.savedTripId === id) {
    appState.savedTripId = null;
    saveState();
  }
  saveSavedTrips();
  renderSavedTrips();
  render();
}
function togglePacked(id) {
  appState.items = appState.items.map((item) => item.id === id ? { ...item, packed: !item.packed } : item);
  commitState({ syncSavedTrip: true });
  render();
}

function deleteItem(id) {
  appState.items = appState.items.filter((item) => item.id !== id);
  commitState({ updateHistory: true, syncSavedTrip: true });
  render();
}

function addItemToCurrentList(name, category) {
  if (!appState.trip) return false;

  const cleanName = name.trim();
  if (!cleanName) return false;

  const exists = appState.items.some((item) => normalizeItemName(item.name) === normalizeItemName(cleanName));
  if (exists) return false;

  appState.items.push(makeItem(cleanName, category));
  commitState({ updateHistory: true, syncSavedTrip: true });
  render();
  return true;
}

function addCustomItem() {
  const name = elements.customItemName.value.trim();
  const category = elements.customItemCategory.value;
  if (!name) return;

  addItemToCurrentList(name, category);
  elements.customItemName.value = "";
}

function addSuggestedItem(item) {
  addItemToCurrentList(item.name, item.category);
}

function moveItemToCategory(itemId, category) {
  let changed = false;

  appState.items = appState.items.map((item) => {
    if (item.id !== itemId || item.category === category) return item;
    changed = true;
    return { ...item, category };
  });

  if (!changed) return;

  commitState({ syncSavedTrip: true });
  render();
}

function handleItemDragStart(event) {
  const itemId = event.currentTarget.dataset.itemId;
  if (!itemId) return;

  draggedItemId = itemId;
  event.currentTarget.classList.add("dragging");

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", itemId);
  }
}

function handleItemDragEnd(event) {
  draggedItemId = null;
  event.currentTarget.classList.remove("dragging");
  clearCategoryDropState();
}

function handleCategoryDragOver(event) {
  if (!draggedItemId) return;
  event.preventDefault();
}

function handleCategoryDragEnter(event) {
  if (!draggedItemId) return;
  event.currentTarget.classList.add("drop-target");
}

function handleCategoryDragLeave(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    event.currentTarget.classList.remove("drop-target");
  }
}

function handleCategoryDrop(event) {
  event.preventDefault();
  const itemId = event.dataTransfer?.getData("text/plain") || draggedItemId;
  const category = event.currentTarget.dataset.category;
  clearCategoryDropState();

  if (!itemId || !category) return;
  moveItemToCategory(itemId, category);
}

function clearCategoryDropState() {
  document.querySelectorAll(".category-card.drop-target").forEach((card) => {
    card.classList.remove("drop-target");
  });
}

function resetTrip() {
  persistHistoryForCurrentTrip();
  appState = createEmptyAppState();
  saveState();
  elements.form.reset();
  elements.tripDays.value = 3;
  elements.tripType.value = "kamp";
  setSelectedWeather(["normaal"]);
  elements.tripOvernight.value = "ja";
  elements.tripNotes.value = "";
  render();
}

function handleSubmit(event) {
  event.preventDefault();
  persistHistoryForCurrentTrip();

  const tripName = elements.tripName.value.trim();
  const tripType = elements.tripType.value;
  const days = Math.max(1, Number(elements.tripDays.value) || 1);
  const weather = getSelectedWeather();
  const overnight = elements.tripOvernight.value;
  const notes = elements.tripNotes.value.trim();

  appState = generatePackingList({ tripName, tripType, days, weather, overnight, notes });
  saveState();
  render();
}

function handleWeatherChange(event) {
  if (event.target.name !== "trip-weather") return;

  if (event.target.value === "normaal" && event.target.checked) {
    elements.tripWeather.forEach((input) => {
      if (input.value !== "normaal") input.checked = false;
    });
    return;
  }

  if (event.target.value !== "normaal" && event.target.checked) {
    const normalOption = elements.tripWeather.find((input) => input.value === "normaal");
    if (normalOption) normalOption.checked = false;
  }

  if (!elements.tripWeather.some((input) => input.checked)) {
    const normalOption = elements.tripWeather.find((input) => input.value === "normaal");
    if (normalOption) normalOption.checked = true;
  }
}

function handleThemeChange(event) {
  applyTheme(event.target.value);
  saveTheme(themeState);
}

function handleFilterChange() {
  appState.filterUnchecked = elements.filterUnpacked.checked;
  saveState();
  render();
}

function handleNotesInput() {
  if (!appState.trip) return;
  appState.trip.notes = elements.tripNotes.value;
  commitState({ syncSavedTrip: true });
}

function showSaveTripFeedback(message) {
  elements.saveTripFeedback.textContent = message;
  elements.saveTripFeedback.classList.remove("hidden");

  if (saveTripFeedbackTimer) clearTimeout(saveTripFeedbackTimer);
  saveTripFeedbackTimer = setTimeout(() => {
    elements.saveTripFeedback.classList.add("hidden");
    elements.saveTripFeedback.textContent = "";
  }, 1800);
}

function clearSavedTripsSearch() {
  elements.savedTripsSearch.value = "";
  renderSavedTrips();
}

elements.form.addEventListener("submit", handleSubmit);
elements.form.addEventListener("change", handleWeatherChange);
elements.resetBtn.addEventListener("click", resetTrip);
elements.addItemBtn.addEventListener("click", addCustomItem);
elements.customItemName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addCustomItem();
  }
});
elements.addPersonalItemBtn.addEventListener("click", addPersonalDefaultItem);
elements.personalItemName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addPersonalDefaultItem();
  }
});
elements.themeSelect.addEventListener("change", handleThemeChange);
elements.filterUnpacked.addEventListener("change", handleFilterChange);
elements.saveTripBtn.addEventListener("click", saveCurrentTrip);
elements.tripNotes.addEventListener("input", handleNotesInput);
elements.savedTripsSearch.addEventListener("input", renderSavedTrips);
elements.savedTripsClear.addEventListener("click", clearSavedTripsSearch);
elements.savedTripsSort.addEventListener("change", renderSavedTrips);

applyTheme(themeState);
fillFormFromState();
renderPersonalDefaults();
renderSavedTrips();
render();
