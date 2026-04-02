const STORAGE_KEYS = {
  currentTrip: 'pakslim-current-trip',
  savedTrips: 'pakslim-saved-trips',
  defaults: 'pakslim-default-items',
  theme: 'pakslim-theme'
};

const CATEGORIES = ['Essentieel', 'Kleding', 'Toiletspullen', 'Slapen', 'Elektronica', 'Extra'];

const BASE_ITEMS = {
  Essentieel: ['Portemonnee', 'ID', 'Telefoon', 'Oplader', 'Sleutels', 'Medicatie'],
  Kleding: ['Ondergoed', 'Sokken', 'T-shirts'],
  Toiletspullen: ['Tandenborstel', 'Tandpasta', 'Deodorant'],
  Slapen: [],
  Elektronica: ['Powerbank'],
  Extra: []
};

const TRIP_TYPE_ITEMS = {
  kamp: {
    Slapen: ['Slaapzak', 'Luchtbed'],
    Kleding: ['Sportkleding', 'Oude kleding', 'Regenjas'],
    Extra: ['Zaklamp']
  },
  weekend: {
    Kleding: ['Extra outfit', 'Pyjama', 'Casual schoenen'],
    Toiletspullen: ['Toilettas'],
    Elektronica: ['Oplader']
  },
  vakantie: {
    Essentieel: ['Paspoort', 'Reisdocumenten'],
    Kleding: ['Zwemkleding'],
    Toiletspullen: ['Zonnebrand'],
    Extra: ['Zonnebril']
  },
  dagje: {
    Essentieel: ['Drinkfles'],
    Extra: ['Snacks', 'Jas'],
    Elektronica: ['Powerbank']
  }
};

const WEATHER_ITEMS = {
  warm: { Kleding: ['Extra T-shirt'], Toiletspullen: ['Zonnebrand'], Extra: ['Pet'] },
  koud: { Kleding: ['Trui', 'Dikke sokken'], Extra: ['Jas'] },
  regen: { Kleding: ['Extra sokken', 'Regenjas'], Extra: ['Poncho'] },
  normaal: {}
};

const el = {
  tripForm: document.getElementById('tripForm'),
  tripName: document.getElementById('tripName'),
  tripType: document.getElementById('tripType'),
  tripDays: document.getElementById('tripDays'),
  overnight: document.getElementById('overnight'),
  tripNotes: document.getElementById('tripNotes'),
  weatherGroup: document.getElementById('weatherGroup'),
  packingList: document.getElementById('packingList'),
  progressText: document.getElementById('progressText'),
  customCategory: document.getElementById('customCategory'),
  customItemInput: document.getElementById('customItemInput'),
  addCustomItemBtn: document.getElementById('addCustomItemBtn'),
  resetBtn: document.getElementById('resetBtn'),
  saveTripBtn: document.getElementById('saveTripBtn'),
  savedTripsList: document.getElementById('savedTripsList'),
  defaultType: document.getElementById('defaultType'),
  defaultItemInput: document.getElementById('defaultItemInput'),
  addDefaultBtn: document.getElementById('addDefaultBtn'),
  defaultLists: document.getElementById('defaultLists'),
  uncheckedOnly: document.getElementById('uncheckedOnly'),
  themeToggle: document.getElementById('themeToggle')
};

let state = {
  currentTrip: null,
  savedTrips: loadJson(STORAGE_KEYS.savedTrips, []),
  defaults: loadJson(STORAGE_KEYS.defaults, { always: [], kamp: [], weekend: [], vakantie: [], dagje: [] }),
  theme: localStorage.getItem(STORAGE_KEYS.theme) || 'dark'
};

function loadJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function createItem(name, category, count = null) {
  return {
    id: crypto.randomUUID(),
    name,
    category,
    checked: false,
    count
  };
}

function addItemToMap(map, category, name, count = null) {
  if (!name) return;
  if (!map[category]) map[category] = [];
  const exists = map[category].some(item => item.name.toLowerCase() === name.toLowerCase());
  if (!exists) map[category].push(createItem(name, category, count));
}

function getSelectedWeather() {
  return [...el.weatherGroup.querySelectorAll('input[type="checkbox"]:checked')].map(input => input.value);
}

function buildTripFromForm() {
  const tripName = el.tripName.value.trim();
  const tripType = el.tripType.value;
  const days = Math.max(1, Number(el.tripDays.value) || 1);
  const weather = getSelectedWeather();
  const notes = el.tripNotes.value.trim();
  const overnight = el.overnight.checked;

  const itemMap = Object.fromEntries(CATEGORIES.map(category => [category, []]));

  for (const [category, items] of Object.entries(BASE_ITEMS)) {
    items.forEach(item => addItemToMap(itemMap, category, item));
  }

  addItemToMap(itemMap, 'Kleding', 'Ondergoed', days);
  addItemToMap(itemMap, 'Kleding', 'Sokken', days);
  addItemToMap(itemMap, 'Kleding', 'T-shirts', days);
  addItemToMap(itemMap, 'Kleding', 'Broeken', Math.max(1, Math.ceil(days / 3)));

  const tripTypeItems = TRIP_TYPE_ITEMS[tripType] || {};
  for (const [category, items] of Object.entries(tripTypeItems)) {
    items.forEach(item => addItemToMap(itemMap, category, item));
  }

  weather.forEach(type => {
    const weatherItems = WEATHER_ITEMS[type] || {};
    for (const [category, items] of Object.entries(weatherItems)) {
      items.forEach(item => addItemToMap(itemMap, category, item));
    }
  });

  if (!overnight) {
    itemMap['Slapen'] = [];
    itemMap['Kleding'] = itemMap['Kleding'].filter(item => !['Pyjama'].includes(item.name));
  }

  state.defaults.always.forEach(item => addItemToMap(itemMap, 'Extra', item));
  (state.defaults[tripType] || []).forEach(item => addItemToMap(itemMap, 'Extra', item));

  return {
    id: crypto.randomUUID(),
    name: tripName,
    tripType,
    days,
    weather,
    overnight,
    notes,
    items: Object.values(itemMap).flat(),
    createdAt: new Date().toISOString()
  };
}

function renderPackingList() {
  const trip = state.currentTrip;
  if (!trip || !trip.items?.length) {
    el.packingList.className = 'packing-list empty-state';
    el.packingList.innerHTML = 'Maak eerst een trip aan om je paklijst te zien.';
    el.progressText.textContent = 'Nog geen lijst gemaakt';
    return;
  }

  const showUncheckedOnly = el.uncheckedOnly.checked;
  const grouped = Object.fromEntries(CATEGORIES.map(category => [category, []]));

  trip.items.forEach(item => {
    if (!showUncheckedOnly || !item.checked) {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    }
  });

  const total = trip.items.length;
  const done = trip.items.filter(item => item.checked).length;
  const percentage = total ? Math.round((done / total) * 100) : 0;

  el.progressText.innerHTML = `${done} van ${total} ingepakt
    <div class="progress-bar"><div class="progress-fill" style="width:${percentage}%"></div></div>`;

  const html = CATEGORIES.map(category => {
    const items = grouped[category] || [];
    if (!items.length) return '';

    return `
      <section class="category" data-category="${category}">
        <div class="category-head">
          <h3>${category}</h3>
          <span class="count-badge">${items.length}</span>
        </div>
        <div>
          ${items.map(item => `
            <div class="item-row" data-id="${item.id}">
              <div class="item-main">
                <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem('${item.id}')" />
                <span class="${item.checked ? 'checked' : ''}">${item.name}${item.count ? ` (${item.count}x)` : ''}</span>
              </div>
              <div class="item-actions">
                <button class="ghost-btn" type="button" onclick="moveItemPrompt('${item.id}')">Verplaats</button>
                <button class="danger-btn" type="button" onclick="deleteItem('${item.id}')">Verwijder</button>
              </div>
            </div>`).join('')}
        </div>
      </section>`;
  }).join('');

  el.packingList.className = 'packing-list';
  el.packingList.innerHTML = html || '<div class="empty-state">Geen items zichtbaar met dit filter.</div>';
}

function persistCurrentTrip() {
  saveJson(STORAGE_KEYS.currentTrip, state.currentTrip);
}

function syncFormFromTrip(trip) {
  el.tripName.value = trip.name || '';
  el.tripType.value = trip.tripType || 'kamp';
  el.tripDays.value = trip.days || 1;
  el.overnight.checked = trip.overnight ?? true;
  el.tripNotes.value = trip.notes || '';

  const selected = new Set(trip.weather || ['normaal']);
  el.weatherGroup.querySelectorAll('input[type="checkbox"]').forEach(input => {
    input.checked = selected.has(input.value);
  });
}

function saveCurrentTripToLibrary() {
  if (!state.currentTrip) {
    alert('Maak eerst een paklijst voordat je opslaat.');
    return;
  }

  const existingIndex = state.savedTrips.findIndex(trip => trip.id === state.currentTrip.id);
  if (existingIndex >= 0) {
    state.savedTrips[existingIndex] = structuredClone(state.currentTrip);
  } else {
    state.savedTrips.unshift(structuredClone(state.currentTrip));
  }

  saveJson(STORAGE_KEYS.savedTrips, state.savedTrips);
  renderSavedTrips();
  alert('Trip opgeslagen.');
}

function renderSavedTrips() {
  if (!state.savedTrips.length) {
    el.savedTripsList.innerHTML = '<div class="empty-state">Nog geen trips opgeslagen.</div>';
    return;
  }

  el.savedTripsList.innerHTML = state.savedTrips.map(trip => `
    <article class="saved-trip">
      <div class="saved-trip-head">
        <div>
          <h3>${trip.name}</h3>
          <p class="muted">${labelTripType(trip.tripType)} · ${trip.days} dag(en) · ${(trip.weather || []).join(', ') || 'normaal'}</p>
        </div>
        <div class="saved-trip-actions">
          <button class="secondary-btn" type="button" onclick="openSavedTrip('${trip.id}')">Open</button>
          <button class="ghost-btn" type="button" onclick="duplicateTrip('${trip.id}')">Dupliceer</button>
          <button class="danger-btn" type="button" onclick="deleteSavedTrip('${trip.id}')">Verwijder</button>
        </div>
      </div>
    </article>
  `).join('');
}

function labelTripType(value) {
  return {
    kamp: 'Kamp',
    weekend: 'Weekend weg',
    vakantie: 'Vakantie',
    dagje: 'Dagje weg'
  }[value] || value;
}

function renderDefaults() {
  const sections = [
    ['always', 'Altijd meenemen'],
    ['kamp', 'Kamp'],
    ['weekend', 'Weekend weg'],
    ['vakantie', 'Vakantie'],
    ['dagje', 'Dagje weg']
  ];

  el.defaultLists.innerHTML = sections.map(([key, label]) => `
    <section class="default-group">
      <div class="category-head">
        <h3>${label}</h3>
        <span class="count-badge">${(state.defaults[key] || []).length}</span>
      </div>
      <div>
        ${(state.defaults[key] || []).length
          ? state.defaults[key].map(item => `
              <div class="item-row">
                <div class="item-main"><span>${item}</span></div>
                <div class="item-actions">
                  <button class="danger-btn" type="button" onclick="removeDefaultItem('${key}', '${escapeQuotes(item)}')">Verwijder</button>
                </div>
              </div>`).join('')
          : '<div class="muted">Nog geen items toegevoegd.</div>'}
      </div>
    </section>
  `).join('');
}

function escapeQuotes(text) {
  return text.replace(/'/g, "\\'");
}

function addDefaultItem() {
  const key = el.defaultType.value;
  const item = el.defaultItemInput.value.trim();
  if (!item) return;
  const exists = (state.defaults[key] || []).some(value => value.toLowerCase() === item.toLowerCase());
  if (!exists) state.defaults[key].push(item);
  saveJson(STORAGE_KEYS.defaults, state.defaults);
  el.defaultItemInput.value = '';
  renderDefaults();
}

function removeDefaultItem(key, item) {
  state.defaults[key] = (state.defaults[key] || []).filter(value => value !== item);
  saveJson(STORAGE_KEYS.defaults, state.defaults);
  renderDefaults();
}

function addCustomItem() {
  if (!state.currentTrip) {
    alert('Maak eerst een trip aan.');
    return;
  }

  const category = el.customCategory.value;
  const name = el.customItemInput.value.trim();
  if (!name) return;

  state.currentTrip.items.push(createItem(name, category));
  el.customItemInput.value = '';
  persistCurrentTrip();
  renderPackingList();
}

function toggleItem(id) {
  const item = state.currentTrip?.items.find(entry => entry.id === id);
  if (!item) return;
  item.checked = !item.checked;
  persistCurrentTrip();
  renderPackingList();
}

function deleteItem(id) {
  if (!state.currentTrip) return;
  state.currentTrip.items = state.currentTrip.items.filter(item => item.id !== id);
  persistCurrentTrip();
  renderPackingList();
}

function moveItemPrompt(id) {
  const item = state.currentTrip?.items.find(entry => entry.id === id);
  if (!item) return;
  const newCategory = prompt(`Naar welke categorie wil je \"${item.name}\" verplaatsen?\nKies uit: ${CATEGORIES.join(', ')}`, item.category);
  if (!newCategory || !CATEGORIES.includes(newCategory)) return;
  item.category = newCategory;
  persistCurrentTrip();
  renderPackingList();
}

function openSavedTrip(id) {
  const trip = state.savedTrips.find(entry => entry.id === id);
  if (!trip) return;
  state.currentTrip = structuredClone(trip);
  persistCurrentTrip();
  syncFormFromTrip(state.currentTrip);
  renderPackingList();
}

function duplicateTrip(id) {
  const trip = state.savedTrips.find(entry => entry.id === id);
  if (!trip) return;
  const copy = structuredClone(trip);
  copy.id = crypto.randomUUID();
  copy.name = `${copy.name} (kopie)`;
  copy.createdAt = new Date().toISOString();
  state.savedTrips.unshift(copy);
  saveJson(STORAGE_KEYS.savedTrips, state.savedTrips);
  renderSavedTrips();
}

function deleteSavedTrip(id) {
  state.savedTrips = state.savedTrips.filter(entry => entry.id !== id);
  saveJson(STORAGE_KEYS.savedTrips, state.savedTrips);
  renderSavedTrips();
}

function resetApp() {
  state.currentTrip = null;
  localStorage.removeItem(STORAGE_KEYS.currentTrip);
  el.tripForm.reset();
  const normalCheckbox = el.weatherGroup.querySelector('input[value="normaal"]');
  if (normalCheckbox) normalCheckbox.checked = true;
  renderPackingList();
}

function applyTheme(theme) {
  state.theme = theme;
  document.body.classList.toggle('light', theme === 'light');
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

function initPanels() {
  document.querySelectorAll('[data-toggle]').forEach(button => {
    button.addEventListener('click', () => {
      const panel = document.getElementById(button.dataset.toggle);
      if (!panel) return;
      panel.classList.toggle('hidden');
      button.textContent = panel.classList.contains('hidden') ? 'Open' : 'Sluit';
    });
  });
}

el.tripForm.addEventListener('submit', event => {
  event.preventDefault();
  state.currentTrip = buildTripFromForm();
  persistCurrentTrip();
  renderPackingList();
});

el.saveTripBtn.addEventListener('click', saveCurrentTripToLibrary);
el.addCustomItemBtn.addEventListener('click', addCustomItem);
el.resetBtn.addEventListener('click', resetApp);
el.addDefaultBtn.addEventListener('click', addDefaultItem);
el.uncheckedOnly.addEventListener('change', renderPackingList);
el.themeToggle.addEventListener('click', () => applyTheme(state.theme === 'dark' ? 'light' : 'dark'));

window.toggleItem = toggleItem;
window.deleteItem = deleteItem;
window.moveItemPrompt = moveItemPrompt;
window.openSavedTrip = openSavedTrip;
window.duplicateTrip = duplicateTrip;
window.deleteSavedTrip = deleteSavedTrip;
window.removeDefaultItem = removeDefaultItem;

(function init() {
  initPanels();
  applyTheme(state.theme);
  renderDefaults();
  renderSavedTrips();

  const savedCurrentTrip = loadJson(STORAGE_KEYS.currentTrip, null);
  if (savedCurrentTrip) {
    state.currentTrip = savedCurrentTrip;
    syncFormFromTrip(savedCurrentTrip);
  }

  renderPackingList();
})();