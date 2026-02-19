// ────────────────────────────────────────────────────────────────
// Bank Holiday Calendar — Vanilla JS (no library)
// ────────────────────────────────────────────────────────────────
'use strict';

// ────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────
const API_BASE = 'https://date.nager.at/api/v3';
const DEFAULT_CODE = 'BG';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Single holiday colour — bright coral-red for maximum visibility
const HOLIDAY_COLOR = '#e05555';

function getHolidayColor() {
  return HOLIDAY_COLOR;
}

// ────────────────────────────────────────────────────────────────
// State
// ────────────────────────────────────────────────────────────────
let currentYear = new Date().getFullYear();
let currentCountryCode = DEFAULT_CODE;
let isFetching = false;

// Map: 'YYYY-MM-DD' → [{ title, globalName, color, types }]
let holidayMap = new Map();

// ────────────────────────────────────────────────────────────────
// DOM Refs
// ────────────────────────────────────────────────────────────────
const select = document.getElementById('country-select');
const yearDisplay = document.getElementById('year-display');
const prevBtn = document.getElementById('prev-year');
const nextBtn = document.getElementById('next-year');
const spinner = document.getElementById('spinner');
const errorBanner = document.getElementById('error-banner');
const errorMsg = document.getElementById('error-message');
const errorClose = document.getElementById('error-close');
const statusText = document.getElementById('status-text');
const gridEl = document.getElementById('calendar-grid');
const tooltip = document.getElementById('holiday-tooltip');

// ────────────────────────────────────────────────────────────────
// Utilities
// ────────────────────────────────────────────────────────────────
function showSpinner() { spinner.hidden = false; }
function hideSpinner() { spinner.hidden = true; }
function showError(msg) { errorMsg.textContent = msg; errorBanner.hidden = false; }
function hideError() { errorBanner.hidden = true; }

function pad2(n) { return String(n).padStart(2, '0'); }

function dateKey(year, month, day) {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

// ────────────────────────────────────────────────────────────────
// API Calls
// ────────────────────────────────────────────────────────────────
async function fetchCountries() {
  const res = await fetch(`${API_BASE}/AvailableCountries`);
  if (!res.ok) throw new Error(`Countries API error: ${res.status}`);
  return res.json();
}

async function fetchHolidays(year, countryCode) {
  showSpinner();
  hideError();
  isFetching = true;
  try {
    const res = await fetch(`${API_BASE}/PublicHolidays/${year}/${countryCode}`);
    if (!res.ok) throw new Error(`Holidays API error: ${res.status}`);
    const data = await res.json();

    const label = select.options[select.selectedIndex]?.text || countryCode;
    statusText.textContent = `${data.length} holidays for ${label} in ${year}`;
    return data;
  } catch (err) {
    showError(err.message);
    statusText.textContent = 'Error loading holidays';
    return [];
  } finally {
    isFetching = false;
    hideSpinner();
  }
}

// ────────────────────────────────────────────────────────────────
// Build holiday map
// ────────────────────────────────────────────────────────────────
function buildHolidayMap(holidays) {
  const map = new Map();
  for (const h of holidays) {
    const color = getHolidayColor(h.types);
    const entry = {
      title: h.localName || h.name,
      globalName: h.name,
      color,
      types: h.types,
    };
    if (map.has(h.date)) {
      map.get(h.date).push(entry);
    } else {
      map.set(h.date, [entry]);
    }
  }
  return map;
}

/**
 * Bulgarian carry-over rule: when a holiday falls on Sunday,
 * the next Monday becomes a substitute bank holiday.
 */
function applyBulgarianCarryOver(holidays) {
  const extras = [];
  for (const h of holidays) {
    const d = new Date(h.date + 'T00:00:00');
    if (d.getDay() === 0) { // Sunday
      const monday = new Date(d);
      monday.setDate(monday.getDate() + 1);
      const monKey = `${monday.getFullYear()}-${pad2(monday.getMonth() + 1)}-${pad2(monday.getDate())}`;
      // Only add if Monday isn't already a holiday
      const alreadyHoliday = holidays.some(x => x.date === monKey);
      if (!alreadyHoliday) {
        extras.push({
          date: monKey,
          localName: `${h.localName || h.name} (преместен)`,
          name: `${h.name} (carry-over)`,
          types: ['Bank'],
        });
      }
    }
  }
  return [...holidays, ...extras];
}

// ────────────────────────────────────────────────────────────────
// Render calendar grid
// ────────────────────────────────────────────────────────────────
function renderCalendar() {
  gridEl.innerHTML = '';
  const today = new Date();
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

  for (let m = 0; m < 12; m++) {
    const card = document.createElement('div');
    card.className = 'month-card';

    // Month header
    const header = document.createElement('div');
    header.className = 'month-header';
    header.innerHTML = `<h3>${MONTH_NAMES[m]}</h3>`;
    card.appendChild(header);

    // Day-of-week row
    const dowRow = document.createElement('div');
    dowRow.className = 'dow-row';
    for (const d of DOW_LABELS) {
      const cell = document.createElement('div');
      cell.className = 'dow-cell';
      cell.textContent = d;
      dowRow.appendChild(cell);
    }
    card.appendChild(dowRow);

    // Day cells
    const daysGrid = document.createElement('div');
    daysGrid.className = 'days-grid';

    const firstDay = (new Date(currentYear, m, 1).getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(currentYear, m + 1, 0).getDate();

    // Leading empty cells
    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('div');
      empty.className = 'day-cell empty';
      daysGrid.appendChild(empty);
    }

    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const cell = document.createElement('div');
      cell.className = 'day-cell';

      const key = dateKey(currentYear, m, d);
      const dayOfWeek = (firstDay + d - 1) % 7;
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Sat=5, Sun=6
      const isToday = key === todayKey;
      const entries = holidayMap.get(key);

      if (isToday) cell.classList.add('today');
      if (isWeekend) cell.classList.add('weekend');

      // Day number
      const num = document.createElement('span');
      num.className = 'day-num';
      num.textContent = d;
      cell.appendChild(num);

      // Holiday indicators — colour the whole cell
      if (entries && entries.length > 0) {
        cell.classList.add('holiday');
        cell.style.setProperty('--holiday-color', entries[0].color);


        // Tooltip on mouseenter
        cell.addEventListener('mouseenter', (ev) => showTooltip(ev, key, entries));
        cell.addEventListener('mouseleave', hideTooltip);
        cell.addEventListener('mousemove', moveTooltip);
      }

      daysGrid.appendChild(cell);
    }

    // Pad to 42 cells (6 rows) for uniform height
    const totalCells = firstDay + daysInMonth;
    const trailing = 42 - totalCells;
    for (let i = 0; i < trailing; i++) {
      const empty = document.createElement('div');
      empty.className = 'day-cell empty';
      daysGrid.appendChild(empty);
    }

    card.appendChild(daysGrid);
    gridEl.appendChild(card);
  }
}

// ────────────────────────────────────────────────────────────────
// Tooltip logic
// ────────────────────────────────────────────────────────────────
function showTooltip(ev, dateStr, entries) {
  const [y, mStr, dStr] = dateStr.split('-');
  const m = parseInt(mStr, 10) - 1;
  const d = parseInt(dStr, 10);
  const dateLabel = `${MONTH_NAMES[m]} ${d}, ${y}`;

  let html = `<div class="tooltip-date">${dateLabel}</div>`;
  for (const e of entries) {
    html += `
      <div class="tooltip-item">
        <span class="tooltip-dot" style="background:${e.color}"></span>
        <span class="tooltip-name">${e.title}</span>
        <span class="tooltip-type">${e.types.join(', ')}</span>
      </div>`;
  }
  tooltip.innerHTML = html;
  tooltip.hidden = false;
  requestAnimationFrame(() => tooltip.classList.add('visible'));
  moveTooltip(ev);
}

function hideTooltip() {
  tooltip.classList.remove('visible');
  tooltip.hidden = true;
}

function moveTooltip(ev) {
  const pad = 12;
  let x = ev.clientX + pad;
  let y = ev.clientY + pad;

  // Keep tooltip on screen
  const rect = tooltip.getBoundingClientRect();
  if (x + rect.width > window.innerWidth) x = ev.clientX - rect.width - pad;
  if (y + rect.height > window.innerHeight) y = ev.clientY - rect.height - pad;

  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
}

// ────────────────────────────────────────────────────────────────
// Load & render
// ────────────────────────────────────────────────────────────────
async function loadHolidays() {
  let holidays = await fetchHolidays(currentYear, currentCountryCode);

  // Only show public holidays
  holidays = holidays.filter(h => h.types && h.types.includes('Public'));

  // Apply Bulgarian carry-over rule (Sunday → Monday)
  if (currentCountryCode === 'BG') {
    holidays = applyBulgarianCarryOver(holidays);
  }

  holidayMap = buildHolidayMap(holidays);
  renderCalendar();
}

// ────────────────────────────────────────────────────────────────
// Event listeners
// ────────────────────────────────────────────────────────────────
select.addEventListener('change', () => {
  if (isFetching) return;
  currentCountryCode = select.value;
  loadHolidays();
});

prevBtn.addEventListener('click', () => {
  if (isFetching) return;
  currentYear--;
  yearDisplay.textContent = currentYear;
  loadHolidays();
});

nextBtn.addEventListener('click', () => {
  if (isFetching) return;
  currentYear++;
  yearDisplay.textContent = currentYear;
  loadHolidays();
});

errorClose.addEventListener('click', hideError);

// ────────────────────────────────────────────────────────────────
// Bootstrap
// ────────────────────────────────────────────────────────────────
(async function init() {
  yearDisplay.textContent = currentYear;

  // Debug log
  console.log('Bank Holiday Calendar — custom grid (no library)');

  try {
    const countries = await fetchCountries();
    select.innerHTML = '';
    countries.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.countryCode;
      opt.textContent = `${c.name} (${c.countryCode})`;
      if (c.countryCode === DEFAULT_CODE) opt.selected = true;
      select.appendChild(opt);
    });
  } catch (err) {
    showError('Could not load countries: ' + err.message);
  }

  // Render empty grid first, then load holidays
  renderCalendar();
  await loadHolidays();
})();
