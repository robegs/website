const $ = id => document.getElementById(id);
const YEAR_NOW = new Date().getFullYear();
const CANDIDATE_THRESHOLDS = Array.from({length: 121}, (_, index) => index - 60);
const MIN_THRESHOLD_LINES = 5;
const MAX_THRESHOLD_LINES = 9;
const SOURCE = "era5-open-meteo";
const CACHE_PREFIX = "calor-compare-session-v3:";
const CACHE_MAX = 20;
const BASELINES = {
  "1981-2010": [1981, 2010],
  "1991-2020": [1991, 2020]
};
const state = {
  a: null,
  b: null,
  timers: {},
  controllers: {},
  thresholds: [],
  pendingBase: null,
  lastResult: null
};

$("compare-end").value = YEAR_NOW - 1;

function locationName(place) {
  return [place.name, place.admin1, place.country].filter(Boolean).join(", ");
}

function shortLocationName(place) {
  return String(place?.name || "Ubicación").split(",")[0].trim();
}

function chartLocationName(place, maximumLength) {
  const name = shortLocationName(place);
  return name.length <= maximumLength ? name : `${name.slice(0, maximumLength - 1).trimEnd()}…`;
}

function updateDocumentTitle() {
  document.title = state.a && state.b
    ? `${shortLocationName(state.a)} vs. ${shortLocationName(state.b)} · Calor`
    : "Comparar ubicaciones · Calor";
}

function escapeHtml(value) {
  const node = document.createElement("div");
  node.textContent = value;
  return node.innerHTML;
}

function setStatus(text, isError = false) {
  $("compare-status").textContent = text;
  $("compare-status").classList.toggle("error", isError);
}

function configurationError(message, inputId) {
  const error = new Error(message);
  error.inputId = inputId;
  return error;
}

function isoDate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function retryDelay(response, attempt) {
  const raw = response.headers.get("Retry-After");
  let milliseconds = NaN;

  if (raw !== null && raw.trim() !== "") {
    const seconds = Number(raw);
    if (Number.isFinite(seconds)) {
      milliseconds = Math.max(0, seconds * 1000);
    } else {
      const date = Date.parse(raw);
      if (Number.isFinite(date)) milliseconds = Math.max(0, date - Date.now());
    }
  }

  if (!Number.isFinite(milliseconds)) milliseconds = 1500 * (2 ** attempt);
  return Math.min(30000, Math.max(500, milliseconds));
}

async function fetchWithRetry(url, options) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, options);
    if (response.status !== 429) return response;
    if (attempt === 3) return response;

    const delay = retryDelay(response, attempt);
    setStatus(`La fuente pública ha recibido demasiadas consultas y limita temporalmente el acceso (error 429). Reintentando en ${Math.ceil(delay / 1000)} s…`);
    await wait(delay);
  }
  throw new Error("No se pudo contactar con la fuente.");
}

function requireOk(response) {
  if (response.status === 429) {
    throw new Error("La fuente pública ha limitado temporalmente las consultas (error 429) porque está recibiendo demasiadas solicitudes. Espera unos minutos o vuelve a usar una consulta ya guardada en esta sesión.");
  }
  if (!response.ok) throw new Error(`La fuente devolvió el error HTTP ${response.status}.`);
}

function currentThresholds() {
  return state.thresholds;
}

function selectedThresholds() {
  return [...$("threshold-controls").querySelectorAll("input:checked")]
    .map(input => Number(input.value))
    .sort((a, b) => a - b);
}

function automaticThreshold(thresholds) {
  return thresholds.find(value => value % 5 === 0) ?? thresholds[Math.floor(thresholds.length / 2)];
}

function resetThresholdControls() {
  state.thresholds = [];
  const placeholder = document.createElement("span");
  placeholder.className = "hint threshold-placeholder";
  placeholder.textContent = "Se calcularán automáticamente al comparar las ubicaciones.";
  $("threshold-controls").replaceChildren(placeholder);
  $("compare-base").replaceChildren(new Option("Automático según las ubicaciones", "auto", true, true));
  $("compare-base").disabled = true;
  ["threshold-main", "threshold-all", "threshold-none"].forEach(id => $(id).disabled = true);
}

function buildThresholdControls(resetSelection = true, preferredBase = null) {
  const thresholds = currentThresholds();
  if (!thresholds.length) { resetThresholdControls(); return; }
  const previous = resetSelection ? [] : selectedThresholds();
  const automatic = automaticThreshold(thresholds);
  const oldBase = Number($("compare-base").value);
  const base = [preferredBase, oldBase, automatic].find(value => Number.isFinite(value) && thresholds.includes(value)) ?? automatic;
  const defaultSet = new Set([thresholds[0], ...thresholds.filter(value => value % 5 === 0), thresholds.at(-1), base]);
  const selected = new Set(previous.length ? previous : defaultSet);
  const fragment = document.createDocumentFragment();

  thresholds.forEach(value => {
    const label = document.createElement("label");
    label.className = "check";
    label.style.paddingBottom = "0";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = String(value);
    input.checked = selected.has(value);
    input.addEventListener("change", () => {
      ensureVisibleBase();
      rerenderLastResult();
    });
    label.append(input, ` >${value} °C`);
    fragment.append(label);
  });
  $("threshold-controls").replaceChildren(fragment);

  $("compare-base").replaceChildren(...thresholds.map(value => {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = `>${value} °C`;
    return option;
  }));
  $("compare-base").value = String(base);
  $("compare-base").disabled = false;
  ["threshold-main", "threshold-all", "threshold-none"].forEach(id => $(id).disabled = false);
  ensureVisibleBase();
}

function setThresholdPreset(preset) {
  const base = Number($("compare-base").value);
  const thresholds = currentThresholds();
  $("threshold-controls").querySelectorAll("input").forEach(input => {
    const value = Number(input.value);
    input.checked = preset === "all" || (preset === "main" && (value % 5 === 0 || value === thresholds[0] || value === thresholds.at(-1))) || (preset === "base" && value === base);
  });
  ensureVisibleBase();
  rerenderLastResult();
}

function ensureVisibleBase() {
  const checks = [...$("threshold-controls").querySelectorAll("input")];
  let selected = checks.filter(input => input.checked);
  if (!selected.length) {
    const baseInput = checks.find(input => input.value === $("compare-base").value) || checks[0];
    if (baseInput) baseInput.checked = true;
    selected = baseInput ? [baseInput] : [];
  }

  const baseInput = checks.find(input => input.value === $("compare-base").value);
  if (baseInput && !baseInput.checked) $("compare-base").value = selected[0].value;
}

function updateModeControls() {
  const anomaly = $("compare-mode").value === "anomaly";
  $("compare-baseline").disabled = !anomaly;
  rerenderLastResult();
}

function ready() {
  $("compare-button").disabled = !(state.a && state.b);
}

function queueSearch(which) {
  clearTimeout(state.timers[which]);
  state[which] = null;
  updateDocumentTitle();
  state.lastResult = null;
  resetThresholdControls();
  $("comparison").hidden = true;
  ready();
  const query = $(`station-${which}`).value.trim();
  $(`chosen-${which}`).textContent = "Selecciona una sugerencia.";
  if (query.length > 1) state.timers[which] = setTimeout(() => search(which), 300);
}

async function search(which) {
  const query = $(`station-${which}`).value.trim();
  state.controllers[which]?.abort();
  state.controllers[which] = new AbortController();
  $(`results-${which}`).replaceChildren();

  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.search = new URLSearchParams({name: query, count: "6", language: "es", format: "json"});
    const response = await fetchWithRetry(url, {signal: state.controllers[which].signal});
    requireOk(response);
    const data = await response.json();
    if (query !== $(`station-${which}`).value.trim()) return;
    if (!data.results?.length) {
      setStatus("No se encontraron resultados.", true);
      return;
    }

    const fragment = document.createDocumentFragment();
    data.results.forEach(place => {
      const button = document.createElement("button");
      button.className = "result";
      button.type = "button";
      button.innerHTML = `${escapeHtml(locationName(place))}<small>${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)} · ${escapeHtml(place.timezone || "zona horaria automática")}</small>`;
      button.onclick = () => choose(which, place);
      fragment.append(button);
    });
    $(`results-${which}`).append(fragment);
    setStatus("Selecciona ambas ubicaciones.");
  } catch (error) {
    if (error.name !== "AbortError") setStatus(`No se pudo buscar: ${error.message}`, true);
  }
}

function choose(which, place) {
  state[which] = place;
  updateDocumentTitle();
  state.lastResult = null;
  $("comparison").hidden = true;
  $(`station-${which}`).value = locationName(place);
  $(`results-${which}`).replaceChildren();
  $(`chosen-${which}`).textContent = `Seleccionado: ${locationName(place)} · ${place.timezone || "zona horaria automática"}.`;
  ready();
  if (state.a && state.b) setStatus("Todo listo con la configuración predeterminada. Pulsa Comparar.");
}

function readInputs() {
  const start = Number($("compare-start").value);
  const end = Number($("compare-end").value);
  const kind = $("compare-kind").value;
  const mode = $("compare-mode").value;
  const baseline = $("compare-baseline").value;
  const baselineYears = BASELINES[baseline];
  const thresholds = currentThresholds();
  const baseThreshold = $("compare-base").value === "auto" ? null : Number($("compare-base").value);

  if (!Number.isInteger(start) || !Number.isInteger(end) || start > end || start < 1940 || end > YEAR_NOW) {
    const inputId = !Number.isInteger(start) || start < 1940 || start > end ? "compare-start" : "compare-end";
    throw configurationError("Revisa el periodo de años.", inputId);
  }
  if (!baselineYears) throw configurationError("Selecciona un periodo de referencia válido.", "compare-baseline");
  if (thresholds.length && !thresholds.includes(baseThreshold)) throw configurationError("Selecciona un umbral de resumen válido.", "compare-base");

  return {
    start,
    end,
    kind,
    mode,
    baseline,
    baselineStart: baselineYears[0],
    baselineEnd: baselineYears[1],
    baseThreshold,
    thresholds,
    candidateThresholds: CANDIDATE_THRESHOLDS,
    fetchStart: mode === "anomaly" ? Math.min(start, baselineYears[0]) : start,
    fetchEnd: mode === "anomaly" ? Math.max(end, baselineYears[1]) : end,
    source: SOURCE
  };
}

function cacheKey(place, values) {
  const parts = [
    SOURCE,
    values.kind,
    values.fetchStart,
    values.fetchEnd,
    place.latitude.toFixed(4),
    place.longitude.toFixed(4),
    place.timezone || "auto"
  ];
  return `${CACHE_PREFIX}${parts.map(encodeURIComponent).join(":")}`;
}

function readCache(key) {
  try {
    const cached = JSON.parse(sessionStorage.getItem(key));
    return cached?.rows && cached?.meta ? cached : null;
  } catch {
    return null;
  }
}

function writeCache(key, result) {
  try {
    sessionStorage.setItem(key, JSON.stringify(result));
    const keys = Array.from({length: sessionStorage.length}, (_, index) => sessionStorage.key(index))
      .filter(item => item?.startsWith(CACHE_PREFIX));
    while (keys.length > CACHE_MAX) sessionStorage.removeItem(keys.shift());
  } catch {
    // Storage can be unavailable in private browsing; comparison still works.
  }
}

function latestDateFromError(text) {
  const matches = [...text.matchAll(/\b(\d{4}-\d{2}-\d{2})\b/g)].map(match => match[1]);
  return matches.length ? matches[matches.length - 1] : null;
}

async function loadArchive(place, values) {
  const key = cacheKey(place, values);
  const cached = readCache(key);
  if (cached) return {...cached, cached: true};

  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  url.search = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    start_date: isoDate(values.fetchStart, 1, 1),
    end_date: isoDate(values.fetchEnd, 12, 31),
    daily: "temperature_2m_max,temperature_2m_min",
    timezone: place.timezone || "auto",
    models: "era5"
  });

  let response = await fetchWithRetry(url);
  if (!response.ok && response.status === 400) {
    const text = await response.text();
    const availableEnd = latestDateFromError(text);
    if (availableEnd && availableEnd < url.searchParams.get("end_date")) {
      url.searchParams.set("end_date", availableEnd);
      response = await fetchWithRetry(url);
    } else {
      throw new Error(`La fuente rechazó el periodo solicitado (${response.status}).`);
    }
  }
  requireOk(response);

  const data = await response.json();
  const dates = data.daily?.time;
  const field = values.kind === "max" ? "temperature_2m_max" : "temperature_2m_min";
  const temperatures = data.daily?.[field];
  if (!Array.isArray(dates) || !Array.isArray(temperatures) || dates.length !== temperatures.length) {
    throw new Error("La fuente no devolvió una serie diaria válida.");
  }

  const years = new Map();
  dates.forEach((date, index) => {
    const year = Number(date.slice(0, 4));
    const value = temperatures[index];
    const row = years.get(year) || {year, days: 0, counts: {}};
    if (Number.isFinite(value)) {
      row.days += 1;
      values.candidateThresholds.forEach(threshold => {
        row.counts[threshold] = (row.counts[threshold] || 0) + Number(value > threshold);
      });
    }
    years.set(year, row);
  });

  const rows = [...years.values()]
    .filter(row => row.days >= (isLeapYear(row.year) ? 351 : 350))
    .sort((a, b) => a.year - b.year);
  const result = {
    rows,
    meta: {
      source: SOURCE,
      timezone: data.timezone || place.timezone || "auto",
      firstDate: dates[0] || null,
      lastDate: dates.at(-1) || null,
      latestCompleteYear: rows.at(-1)?.year ?? null
    }
  };
  writeCache(key, result);
  return {...result, cached: false};
}

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function adaptiveComparisonThresholds(firstRows, secondRows, values) {
  const rows = [...firstRows, ...secondRows].filter(row => row.year >= values.start && row.year <= values.end);
  const totalDays = rows.reduce((sum, row) => sum + row.days, 0);
  if (!totalDays) throw new Error("No hay temperaturas suficientes para ajustar los umbrales de la comparación.");
  const exceedances = threshold => rows.reduce((sum, row) => sum + (row.counts[threshold] || 0), 0);
  const highest = [...CANDIDATE_THRESHOLDS].reverse().find(threshold => exceedances(threshold) > 0);
  if (!Number.isFinite(highest)) throw new Error("El rango de temperaturas queda fuera de los límites disponibles.");
  const climateStart = CANDIDATE_THRESHOLDS.find(threshold => exceedances(threshold) <= totalDays * 0.1) ?? highest;
  let lowest = Math.max(climateStart, highest - (MAX_THRESHOLD_LINES - 1));
  lowest = Math.min(lowest, highest - (MIN_THRESHOLD_LINES - 1));
  lowest = Math.max(lowest, CANDIDATE_THRESHOLDS[0]);
  return Array.from({length: highest - lowest + 1}, (_, index) => lowest + index);
}

function baselineMedians(rows, values) {
  const baselineRows = rows.filter(row => row.year >= values.baselineStart && row.year <= values.baselineEnd);
  const medians = Object.fromEntries(values.thresholds.map(threshold => [
    threshold,
    median(baselineRows.map(row => row.counts[threshold]))
  ]));
  return {medians, years: baselineRows.length};
}

async function compare() {
  try {
    const values = readInputs();
    if (!state.a || !state.b) throw new Error("Selecciona ambas ubicaciones.");
    $("compare-button").disabled = true;
    $("comparison").hidden = true;
    setStatus("Cargando la primera serie…");
    const first = await loadArchive(state.a, values);
    setStatus("Cargando la segunda serie…");
    const second = await loadArchive(state.b, values);

    const requestedBase = values.baseThreshold ?? state.pendingBase;
    state.thresholds = adaptiveComparisonThresholds(first.rows, second.rows, values);
    buildThresholdControls(true, requestedBase);
    values.thresholds = [...state.thresholds];
    values.baseThreshold = Number($("compare-base").value);
    state.pendingBase = null;

    state.lastResult = {first, second, values};
    render(first, second, values);
    $("comparison").hidden = false;
    if (usePhoneCharts()) requestAnimationFrame(() => $("comparison").scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }));
    setStatus(first.cached && second.cached
      ? "Comparación lista (ambas series se recuperaron de la caché de esta sesión)."
      : "Comparación lista.");
  } catch (error) {
    if (error.inputId) {
      document.querySelector(".advanced-config").open = true;
      requestAnimationFrame(() => $(error.inputId)?.focus());
    }
    setStatus(`No se pudo completar la comparación: ${error.message}`, true);
  } finally {
    ready();
  }
}

function rerenderLastResult() {
  if (!state.lastResult) return;
  try {
    const values = readInputs();
    const sameData = values.kind === state.lastResult.values.kind
      && values.start === state.lastResult.values.start
      && values.end === state.lastResult.values.end
      && values.mode === state.lastResult.values.mode
      && values.baseline === state.lastResult.values.baseline;
    if (sameData) render(state.lastResult.first, state.lastResult.second, values);
    else {
      state.lastResult = null;
      $("comparison").hidden = true;
      if (state.a && state.b) setStatus("Las opciones cambiaron. Pulsa Comparar para actualizar los datos.");
    }
  } catch {
    state.lastResult = null;
    $("comparison").hidden = true;
  }
}

function displayRows(firstRows, secondRows, values) {
  const firstMap = new Map(firstRows.map(row => [row.year, row]));
  const secondMap = new Map(secondRows.map(row => [row.year, row]));
  const years = [...new Set([...firstMap.keys(), ...secondMap.keys()])]
    .filter(year => year >= values.start && year <= values.end)
    .sort((a, b) => a - b);
  const firstBaseline = baselineMedians(firstRows, values);
  const secondBaseline = baselineMedians(secondRows, values);

  if (values.mode === "anomaly" && (firstBaseline.years < 20 || secondBaseline.years < 20)) {
    throw new Error(`No hay suficientes años completos del periodo ${values.baseline} para calcular anomalías comparables.`);
  }

  const rows = years.map(year => {
    const first = firstMap.get(year)?.counts || null;
    const second = secondMap.get(year)?.counts || null;
    if (values.mode === "absolute") return {year, a: first, b: second, rawA: first, rawB: second};

    return {
      year,
      a: first && Object.fromEntries(values.thresholds.map(threshold => [threshold, first[threshold] - firstBaseline.medians[threshold]])),
      b: second && Object.fromEntries(values.thresholds.map(threshold => [threshold, second[threshold] - secondBaseline.medians[threshold]])),
      rawA: first,
      rawB: second
    };
  });
  return {rows, firstBaseline, secondBaseline};
}

function formatNumber(value, digits = 0) {
  return Number(value).toLocaleString("es-ES", {maximumFractionDigits: digits, minimumFractionDigits: digits});
}

function usePhoneCharts() {
  return window.matchMedia("(max-width: 760px)").matches;
}

function signed(value) {
  if (!Number.isFinite(value)) return "—";
  return `${value > 0 ? "+" : ""}${formatNumber(value, Number.isInteger(value) ? 0 : 1)}`;
}

function render(first, second, values) {
  const selected = selectedThresholds();
  if (!selected.length) throw configurationError("Selecciona al menos un umbral visible.", "threshold-main");
  const {rows, firstBaseline, secondBaseline} = displayRows(first.rows, second.rows, values);
  const common = rows.filter(row => row.rawA && row.rawB);
  if (!common.length) throw new Error("No hay años completos comunes para las dos ubicaciones en el periodo elegido.");

  const latest = common.at(-1);
  const base = values.baseThreshold;
  const rawA = latest.rawA[base];
  const rawB = latest.rawB[base];
  const difference = values.mode === "absolute" ? rawA - rawB : latest.a[base] - latest.b[base];
  const ratio = rawB === 0 ? null : rawA / rawB;
  const kindLabel = values.kind === "max" ? "Días con Tmax" : "Noches con Tmin";
  const firstName = shortLocationName(state.a);
  const secondName = shortLocationName(state.b);
  const firstNameHtml = escapeHtml(firstName);
  const secondNameHtml = escapeHtml(secondName);
  const modeLabel = values.mode === "absolute"
    ? "recuento anual"
    : `diferencia frente a la mediana ${values.baseline}`;

  const firstValue = values.mode === "absolute" ? rawA : latest.a[base];
  const secondValue = values.mode === "absolute" ? rawB : latest.b[base];
  const valueSuffix = values.mode === "absolute" ? "" : " días";
  const metricDetail = values.mode === "absolute"
    ? `En ${latest.year}`
    : `En ${latest.year}; referencia: ${formatNumber(firstBaseline.medians[base], 1)}`;
  const secondMetricDetail = values.mode === "absolute"
    ? `En ${latest.year}`
    : `En ${latest.year}; referencia: ${formatNumber(secondBaseline.medians[base], 1)}`;

  $("compare-title").textContent = `${firstName} vs. ${secondName} · ${kindLabel} >${base} °C`;
  $("compare-subtitle").textContent = values.mode === "absolute"
    ? `Cada línea muestra el número de superaciones en un año completo. ${firstName} usa línea continua y ${secondName}, discontinua.`
    : `Cada valor es el recuento anual menos la mediana propia de cada ubicación en ${values.baseline}. ${firstName} usa línea continua y ${secondName}, discontinua; cero representa su clima de referencia.`;
  $("compare-summary").innerHTML = `
    <article class="metric">
      <span class="label">${escapeHtml(locationName(state.a))} · &gt;${base} °C</span>
      <strong class="value">${values.mode === "absolute" ? formatNumber(firstValue) : signed(firstValue)}${valueSuffix}</strong>
      <small>${metricDetail}</small>
    </article>
    <article class="metric night">
      <span class="label">${escapeHtml(locationName(state.b))} · &gt;${base} °C</span>
      <strong class="value">${values.mode === "absolute" ? formatNumber(secondValue) : signed(secondValue)}${valueSuffix}</strong>
      <small>${secondMetricDetail}</small>
    </article>
    <article class="metric">
      <span class="label">${values.mode === "absolute" ? `Diferencia ${firstNameHtml} − ${secondNameHtml}` : `Diferencia entre anomalías: ${firstNameHtml} − ${secondNameHtml}`} · &gt;${base} °C</span>
      <strong class="value">${signed(difference)} días</strong>
      <small>${ratio === null ? `Razón ${firstNameHtml}/${secondNameHtml} no disponible (${secondNameHtml} = 0)` : `El recuento de ${firstNameHtml} equivale al ${formatNumber(ratio * 100)} % del de ${secondNameHtml}`} · ${latest.year}</small>
    </article>`;

  drawChart(rows, selected, `${firstName} frente a ${secondName} · ${kindLabel}: ${modeLabel}`, values.mode);
  renderSourceNote(first.meta, second.meta, values, common);
}

function renderSourceNote(firstMeta, secondMeta, values, commonRows) {
  const latestCommon = commonRows.at(-1)?.year;
  const timezones = firstMeta.timezone === secondMeta.timezone
    ? firstMeta.timezone
    : `${firstMeta.timezone} (${shortLocationName(state.a)}) y ${secondMeta.timezone} (${shortLocationName(state.b)})`;
  const baselineText = values.mode === "anomaly"
    ? ` Las anomalías usan la mediana de ${values.baseline} calculada por separado para cada ubicación.`
    : "";
  $("compare-source-note").textContent = `Fuente: ERA5 mediante Open-Meteo, en las coordenadas elegidas. Umbrales compartidos ajustados al rango observado de ambas ubicaciones: > ${values.thresholds[0]}–${values.thresholds.at(-1)} °C. Último año completo común mostrado: ${latestCommon ?? "no disponible"}. Zona horaria diaria: ${timezones}.${baselineText} Los umbrales son estrictos: un valor igual al límite no cuenta. La caché dura únicamente esta sesión del navegador.`;
}

function thresholdColor(index, count) {
  return `hsl(${index * 250 / Math.max(1, count - 1)},70%,${38 + index * 18 / Math.max(1, count - 1)}%)`;
}

function pathFor(rows, side, threshold, x, y) {
  let drawing = false;
  return rows.map((row, index) => {
    const value = row[side]?.[threshold];
    if (!Number.isFinite(value)) {
      drawing = false;
      return "";
    }
    const command = drawing ? "L" : "M";
    drawing = true;
    return `${command}${x(index).toFixed(2)},${y(value).toFixed(2)}`;
  }).join(" ");
}

function drawChart(rows, thresholds, label, mode) {
  const compact = usePhoneCharts();
  const legendColumns = compact ? 2 : 6;
  const legendRowHeight = compact ? 20 : 18;
  const legendRows = Math.ceil(thresholds.length / legendColumns);
  const width = compact ? 420 : 1060;
  const height = compact ? 360 + legendRows * legendRowHeight : 460;
  const padding = compact
    ? {left: 48, right: 14, top: 44 + legendRows * legendRowHeight, bottom: 44}
    : {left: 58, right: 20, top: 55 + legendRows * legendRowHeight, bottom: 48};
  const values = rows.flatMap(row => thresholds.flatMap(threshold => [row.a?.[threshold], row.b?.[threshold]]))
    .filter(Number.isFinite);
  let minimum = mode === "absolute" ? 0 : Math.min(0, ...values);
  let maximum = Math.max(mode === "absolute" ? 1 : 0, ...values);
  if (minimum === maximum) maximum = minimum + 1;
  const span = maximum - minimum;
  minimum = mode === "absolute" ? 0 : Math.floor(minimum - span * 0.06);
  maximum = Math.ceil(maximum + span * 0.06);

  const x = index => padding.left + index * (width - padding.left - padding.right) / Math.max(1, rows.length - 1);
  const y = value => height - padding.bottom - (value - minimum) * (height - padding.top - padding.bottom) / Math.max(1, maximum - minimum);
  let grid = "";
  const tickCount = compact ? 4 : 5;
  for (let index = 0; index <= tickCount; index += 1) {
    const value = minimum + (maximum - minimum) * index / tickCount;
    const yy = y(value);
    grid += `<line class="grid" x1="${padding.left}" x2="${width - padding.right}" y1="${yy}" y2="${yy}"${Math.abs(value) < (maximum - minimum) / 100 ? ' style="stroke:#7f8c84;stroke-width:1.5"' : ""}/>`;
    grid += `<text class="axis" x="${padding.left - 8}" y="${yy + 4}" text-anchor="end">${formatNumber(value, Math.abs(value) < 10 && !Number.isInteger(value) ? 1 : 0)}</text>`;
  }

  let series = "";
  let legend = "";
  thresholds.forEach((threshold, index) => {
    const color = thresholdColor(index, thresholds.length);
    const firstPath = pathFor(rows, "a", threshold, x, y);
    const secondPath = pathFor(rows, "b", threshold, x, y);
    series += `<path class="compare-a" d="${firstPath}" style="fill:none;stroke:${color};stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round"><title>${escapeHtml(locationName(state.a))}: >${threshold} °C</title></path>`;
    series += `<path class="compare-b" d="${secondPath}" style="fill:none;stroke:${color};stroke-width:2.5;stroke-dasharray:8 5;stroke-linecap:round;stroke-linejoin:round"><title>${escapeHtml(locationName(state.b))}: >${threshold} °C</title></path>`;
    const legendX = padding.left + (index % legendColumns) * (compact ? 175 : 155);
    const legendY = 22 + Math.floor(index / legendColumns) * legendRowHeight;
    legend += `<line x1="${legendX}" x2="${legendX + 22}" y1="${legendY}" y2="${legendY}" style="stroke:${color};stroke-width:3"/><text class="legend" x="${legendX + 28}" y="${legendY + 4}">&gt;${threshold} °C</text>`;
  });

  const labelEvery = Math.max(1, Math.ceil(rows.length / (compact ? 4 : 8)));
  const yearLabels = rows.map((row, index) => {
    if (index !== 0 && index !== rows.length - 1 && index % labelEvery !== 0) return "";
    const anchor = index === rows.length - 1 ? "end" : "middle";
    return `<text class="axis" x="${x(index)}" y="${height - 15}" text-anchor="${anchor}">${row.year}</text>`;
  }).join("");
  const zeroLabel = mode === "anomaly"
    ? `<line x1="${padding.left}" x2="${width - padding.right}" y1="${y(0)}" y2="${y(0)}" style="stroke:#7f8c84;stroke-width:1.5"/><text class="legend" x="${padding.left + 8}" y="${y(0) - 7}">mediana de referencia</text>`
    : "";

  const firstLegendX = compact ? padding.left : width - 330;
  const secondLegendX = compact ? Math.floor(width / 2) + 4 : width - 205;
  const stationLegendY = padding.top - 16;
  const firstLegendName = escapeHtml(chartLocationName(state.a, compact ? 18 : 32));
  const secondLegendName = escapeHtml(chartLocationName(state.b, compact ? 18 : 32));

  $("compare-chart").innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="compare-svg-title compare-svg-desc">
    <title id="compare-svg-title">${escapeHtml(label)}</title>
    <desc id="compare-svg-desc">Líneas continuas para ${escapeHtml(locationName(state.a))}; líneas discontinuas para ${escapeHtml(locationName(state.b))}.</desc>
    ${grid}${zeroLabel}${series}${legend}${yearLabels}
    <line x1="${firstLegendX}" x2="${firstLegendX + 30}" y1="${stationLegendY}" y2="${stationLegendY}" style="stroke:#405249;stroke-width:2.5"/>
    <text class="legend" x="${firstLegendX + 36}" y="${stationLegendY + 4}">${firstLegendName}</text>
    <line x1="${secondLegendX}" x2="${secondLegendX + 30}" y1="${stationLegendY}" y2="${stationLegendY}" style="stroke:#405249;stroke-width:2.5;stroke-dasharray:8 5"/>
    <text class="legend" x="${secondLegendX + 36}" y="${stationLegendY + 4}">${secondLegendName}</text>
  </svg>`;
}

$("station-a").oninput = () => queueSearch("a");
$("station-b").oninput = () => queueSearch("b");
$("station-a").onkeydown = event => { if (event.key === "Enter") search("a"); };
$("station-b").onkeydown = event => { if (event.key === "Enter") search("b"); };
$("compare-button").onclick = compare;
$("compare-kind").onchange = () => {
  state.pendingBase = null;
  resetThresholdControls();
  state.lastResult = null;
  $("comparison").hidden = true;
  if (state.a && state.b) setStatus("La serie cambió. Pulsa Comparar para descargarla.");
};
$("compare-mode").onchange = updateModeControls;
$("compare-baseline").onchange = rerenderLastResult;
$("compare-base").onchange = () => {
  const selected = $("threshold-controls").querySelector(`input[value="${$("compare-base").value}"]`);
  if (selected) selected.checked = true;
  rerenderLastResult();
};
function comparisonPeriodChanged() {
  state.lastResult = null;
  $("comparison").hidden = true;
  resetThresholdControls();
  if (state.a && state.b) setStatus("El periodo cambió. Pulsa Comparar para recalcular los umbrales.");
}
$("compare-start").onchange = comparisonPeriodChanged;
$("compare-end").onchange = comparisonPeriodChanged;
$("threshold-main").onclick = () => setThresholdPreset("main");
$("threshold-all").onclick = () => setThresholdPreset("all");
$("threshold-none").onclick = () => setThresholdPreset("base");

function restoreQuery() {
  const params = new URLSearchParams(location.search);
  const hasA = params.has("latA") && params.has("lonA");
  const hasB = params.has("latB") && params.has("lonB");
  const latA = hasA ? Number(params.get("latA")) : NaN;
  const lonA = hasA ? Number(params.get("lonA")) : NaN;
  const latB = hasB ? Number(params.get("latB")) : NaN;
  const lonB = hasB ? Number(params.get("lonB")) : NaN;
  if (Number.isFinite(latA) && Number.isFinite(lonA)) choose("a", {name: params.get("nameA") || `${latA.toFixed(3)} / ${lonA.toFixed(3)}`, latitude: latA, longitude: lonA, timezone: params.get("tzA") || "auto"});
  if (Number.isFinite(latB) && Number.isFinite(lonB)) choose("b", {name: params.get("nameB") || `${latB.toFixed(3)} / ${lonB.toFixed(3)}`, latitude: latB, longitude: lonB, timezone: params.get("tzB") || "auto"});
  [["compare-start", "start"], ["compare-end", "end"], ["compare-kind", "kind"], ["compare-mode", "mode"], ["compare-baseline", "baseline"]].forEach(([id, key]) => { if (params.has(key)) $(id).value = params.get(key); });
  state.pendingBase = params.has("base") && Number.isFinite(Number(params.get("base"))) ? Number(params.get("base")) : null;
  resetThresholdControls();
  updateModeControls();
  if (params.get("run") === "1" && state.a && state.b) setTimeout(compare, 0);
  return Boolean(state.a || state.b);
}

resetThresholdControls();
if (!restoreQuery()) { queueSearch("a"); queueSearch("b"); }

let lastCompactChartLayout = usePhoneCharts();
let chartResizeTimer = null;
window.addEventListener("resize", () => {
  const compact = usePhoneCharts();
  if (compact === lastCompactChartLayout) return;
  lastCompactChartLayout = compact;
  clearTimeout(chartResizeTimer);
  chartResizeTimer = setTimeout(() => {
    if (state.lastResult && !$("comparison").hidden) rerenderLastResult();
  }, 150);
});
