const $ = id => document.getElementById(id);
const YEAR_NOW = new Date().getFullYear();
const CANDIDATE_THRESHOLDS = Array.from({length: 121}, (_, index) => index - 60);
const BAND_HALF_WIDTH = 5;
const BAND_CENTER_THRESHOLDS = CANDIDATE_THRESHOLDS.slice(BAND_HALF_WIDTH, -BAND_HALF_WIDTH);
const MIN_THRESHOLD_LINES = 5;
const MAX_THRESHOLD_LINES = 9;
const SOURCE = "era5-open-meteo";
const CACHE_PREFIX = "calor-compare-session-v4:";
const CACHE_MAX = 8;
const BASELINES = {
  "1981-2010": [1981, 2010],
  "1991-2020": [1991, 2020]
};
const state = {
  a: null,
  b: null,
  timers: {},
  controllers: {},
  thresholds: {max: [], min: []},
  pendingThresholds: {max: null, min: null},
  lastResult: null,
  comparisonRun: 0
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

function currentThresholds(kind) {
  return state.thresholds[kind] || [];
}

function automaticThreshold(thresholds) {
  return thresholds.find(value => value % 5 === 0) ?? thresholds[Math.floor(thresholds.length / 2)];
}

function temperatureBand(threshold) {
  return {lower: threshold - BAND_HALF_WIDTH, center: threshold, upper: threshold + BAND_HALF_WIDTH};
}

function thresholdSelectId(kind) {
  return kind === "max" ? "compare-max-threshold" : "compare-min-threshold";
}

function resetThresholdSelectors() {
  state.thresholds = {max: [], min: []};
  ["max", "min"].forEach(kind => {
    const select = $(thresholdSelectId(kind));
    select.replaceChildren(new Option("Automático según las ubicaciones", "auto", true, true));
    select.disabled = true;
  });
}

function populateThresholdSelector(kind, preferredThreshold = null) {
  const thresholds = currentThresholds(kind);
  if (!thresholds.length) throw new Error(`No se pudo ajustar el umbral de ${kind === "max" ? "días" : "noches"}.`);
  const automatic = automaticThreshold(thresholds);
  const previous = Number($(thresholdSelectId(kind)).value);
  const selected = [preferredThreshold, previous, automatic]
    .find(value => Number.isFinite(value) && thresholds.includes(value)) ?? automatic;
  const options = thresholds.map(value => {
    const band = temperatureBand(value);
    return new Option(`${value} °C · área ${band.lower}–${band.upper} °C${value === automatic ? " · automático" : ""}`, value);
  });
  const select = $(thresholdSelectId(kind));
  select.replaceChildren(...options);
  select.value = String(selected);
  select.disabled = false;
  return selected;
}

function selectedThreshold(kind) {
  const value = Number($(thresholdSelectId(kind)).value);
  return Number.isFinite(value) ? value : null;
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
  state.pendingThresholds = {max: null, min: null};
  resetThresholdSelectors();
  $("comparison").hidden = true;
  ready();
  const query = $(`station-${which}`).value.trim();
  $(`chosen-${which}`).textContent = "Selecciona una sugerencia.";
  setStatus("Selecciona ambas ubicaciones.");
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
  const mode = $("compare-mode").value;
  const baseline = $("compare-baseline").value;
  const baselineYears = BASELINES[baseline];
  const maxThreshold = selectedThreshold("max");
  const minThreshold = selectedThreshold("min");

  if (!Number.isInteger(start) || !Number.isInteger(end) || start > end || start < 1940 || end > YEAR_NOW) {
    const inputId = !Number.isInteger(start) || start < 1940 || start > end ? "compare-start" : "compare-end";
    throw configurationError("Revisa el periodo de años.", inputId);
  }
  if (!baselineYears) throw configurationError("Selecciona un periodo de referencia válido.", "compare-baseline");
  if (currentThresholds("max").length && !currentThresholds("max").includes(maxThreshold)) throw configurationError("Selecciona un umbral diurno válido.", "compare-max-threshold");
  if (currentThresholds("min").length && !currentThresholds("min").includes(minThreshold)) throw configurationError("Selecciona un umbral nocturno válido.", "compare-min-threshold");

  return {
    start,
    end,
    mode,
    baseline,
    baselineStart: baselineYears[0],
    baselineEnd: baselineYears[1],
    maxThreshold,
    minThreshold,
    candidateThresholds: CANDIDATE_THRESHOLDS,
    fetchStart: mode === "anomaly" ? Math.min(start, baselineYears[0]) : start,
    fetchEnd: mode === "anomaly" ? Math.max(end, baselineYears[1]) : end,
    source: SOURCE
  };
}

function cacheKey(place, values) {
  const parts = [
    SOURCE,
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
    return Array.isArray(cached?.rowsByKind?.max) && Array.isArray(cached?.rowsByKind?.min) && cached?.meta ? cached : null;
  } catch {
    return null;
  }
}

function writeCache(key, result) {
  try {
    const keys = Array.from({length: sessionStorage.length}, (_, index) => sessionStorage.key(index))
      .filter(item => item?.startsWith(CACHE_PREFIX));
    while (keys.length >= CACHE_MAX) sessionStorage.removeItem(keys.shift());
    sessionStorage.setItem(key, JSON.stringify(result));
  } catch {
    // Storage can be unavailable in private browsing; comparison still works.
  }
}

function latestDateFromError(text) {
  const matches = [...text.matchAll(/\b(\d{4}-\d{2}-\d{2})\b/g)].map(match => match[1]);
  return matches.length ? matches[matches.length - 1] : null;
}

function aggregateAnnualCounts(dates, temperatures, candidateThresholds) {
  const years = new Map();
  dates.forEach((date, index) => {
    const year = Number(date.slice(0, 4));
    const value = temperatures[index];
    const row = years.get(year) || {year, days: 0, counts: {}};
    if (Number.isFinite(value)) {
      row.days += 1;
      candidateThresholds.forEach(threshold => {
        row.counts[threshold] = (row.counts[threshold] || 0) + Number(value > threshold);
      });
    }
    years.set(year, row);
  });
  return [...years.values()]
    .filter(row => row.days >= (isLeapYear(row.year) ? 351 : 350))
    .sort((a, b) => a.year - b.year);
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
  }).toString();

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
  const maxima = data.daily?.temperature_2m_max;
  const minima = data.daily?.temperature_2m_min;
  if (!Array.isArray(dates) || !Array.isArray(maxima) || !Array.isArray(minima) || dates.length !== maxima.length || dates.length !== minima.length) {
    throw new Error("La fuente no devolvió series diarias válidas de máximas y mínimas.");
  }
  const maxRows = aggregateAnnualCounts(dates, maxima, values.candidateThresholds);
  const minRows = aggregateAnnualCounts(dates, minima, values.candidateThresholds);
  const result = {
    rowsByKind: {
      max: maxRows,
      min: minRows
    },
    meta: {
      source: SOURCE,
      timezone: data.timezone || place.timezone || "auto",
      firstDate: dates[0] || null,
      lastDate: dates.at(-1) || null,
      latestCompleteYear: {
        max: maxRows.at(-1)?.year ?? null,
        min: minRows.at(-1)?.year ?? null
      }
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

function adaptiveComparisonThresholds(firstRows, secondRows, values, kind) {
  const rows = [...firstRows, ...secondRows].filter(row => row.year >= values.start && row.year <= values.end);
  const totalDays = rows.reduce((sum, row) => sum + row.days, 0);
  if (!totalDays) throw new Error(`No hay temperaturas suficientes para ajustar los umbrales de ${kind === "max" ? "días" : "noches"}.`);
  const exceedances = threshold => rows.reduce((sum, row) => sum + (row.counts[threshold] || 0), 0);
  const highest = [...BAND_CENTER_THRESHOLDS].reverse().find(threshold => exceedances(threshold) > 0);
  if (!Number.isFinite(highest)) throw new Error("El rango de temperaturas queda fuera de los límites disponibles.");
  const climateStart = BAND_CENTER_THRESHOLDS.find(threshold => exceedances(threshold) <= totalDays * 0.1) ?? highest;
  let lowest = Math.max(climateStart, highest - (MAX_THRESHOLD_LINES - 1));
  lowest = Math.min(lowest, highest - (MIN_THRESHOLD_LINES - 1));
  lowest = Math.max(lowest, BAND_CENTER_THRESHOLDS[0]);
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

function updateComparisonUrl(values) {
  const url = new URL(location.href);
  url.search = new URLSearchParams({
    nameA: shortLocationName(state.a),
    latA: state.a.latitude,
    lonA: state.a.longitude,
    tzA: state.a.timezone || "auto",
    nameB: shortLocationName(state.b),
    latB: state.b.latitude,
    lonB: state.b.longitude,
    tzB: state.b.timezone || "auto",
    start: values.start,
    end: values.end,
    mode: values.mode,
    baseline: values.baseline,
    baseMax: values.maxThreshold,
    baseMin: values.minThreshold,
    run: 1
  });
  history.replaceState(null, "", url);
}

function comparisonUiSignature() {
  return ["station-a", "station-b", "compare-start", "compare-end", "compare-mode", "compare-baseline"]
    .map(id => $(id).value)
    .join("\u0000");
}

async function compare() {
  const runId = ++state.comparisonRun;
  let firstPlace = null;
  let secondPlace = null;
  let uiSignature = null;
  const isCurrent = () => runId === state.comparisonRun
    && state.a === firstPlace
    && state.b === secondPlace
    && comparisonUiSignature() === uiSignature;
  try {
    const values = readInputs();
    if (!state.a || !state.b) throw new Error("Selecciona ambas ubicaciones.");
    firstPlace = state.a;
    secondPlace = state.b;
    uiSignature = comparisonUiSignature();
    $("compare-button").disabled = true;
    $("comparison").hidden = true;
    setStatus("Cargando la primera serie…");
    const first = await loadArchive(firstPlace, values);
    if (!isCurrent()) return;
    setStatus("Cargando la segunda serie…");
    const second = await loadArchive(secondPlace, values);
    if (!isCurrent()) return;

    const requestedMax = values.maxThreshold ?? state.pendingThresholds.max;
    const requestedMin = values.minThreshold ?? state.pendingThresholds.min;
    state.thresholds.max = adaptiveComparisonThresholds(first.rowsByKind.max, second.rowsByKind.max, values, "max");
    state.thresholds.min = adaptiveComparisonThresholds(first.rowsByKind.min, second.rowsByKind.min, values, "min");
    values.maxThreshold = populateThresholdSelector("max", requestedMax);
    values.minThreshold = populateThresholdSelector("min", requestedMin);
    state.pendingThresholds = {max: null, min: null};

    state.lastResult = {first, second, values};
    render(first, second, values);
    updateComparisonUrl(values);
    $("comparison").hidden = false;
    if (usePhoneCharts()) requestAnimationFrame(() => $("comparison").scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }));
    setStatus(first.cached && second.cached
      ? "Comparación lista (ambas series se recuperaron de la caché de esta sesión)."
      : "Comparación lista.");
  } catch (error) {
    if (firstPlace && !isCurrent()) return;
    if (error.inputId) {
      document.querySelector(".advanced-config").open = true;
      requestAnimationFrame(() => $(error.inputId)?.focus());
    }
    setStatus(`No se pudo completar la comparación: ${error.message}`, true);
  } finally {
    if (runId === state.comparisonRun) ready();
  }
}

function rerenderLastResult() {
  if (!state.lastResult) return;
  try {
    const values = readInputs();
    const sameData = values.start === state.lastResult.values.start
      && values.end === state.lastResult.values.end
      && values.mode === state.lastResult.values.mode
      && values.baseline === state.lastResult.values.baseline;
    if (sameData) {
      render(state.lastResult.first, state.lastResult.second, values);
      state.lastResult.values = values;
      updateComparisonUrl(values);
    }
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
  const years = Array.from({length: values.end - values.start + 1}, (_, index) => values.start + index);
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
      a: first && Object.fromEntries(values.thresholds.map(threshold => [
        threshold,
        first[threshold] - firstBaseline.medians[values.anomalyReferenceThreshold ?? threshold]
      ])),
      b: second && Object.fromEntries(values.thresholds.map(threshold => [
        threshold,
        second[threshold] - secondBaseline.medians[values.anomalyReferenceThreshold ?? threshold]
      ])),
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

function comparisonChartLayout() {
  const viewport = Math.max(320, document.documentElement.clientWidth || window.innerWidth);
  const phone = viewport <= 620;
  const shellWidth = Math.min(1220, viewport - (phone ? 24 : 32));
  const availableWidth = shellWidth - (phone ? 30 : 46);
  const width = Math.max(320, Math.min(1060, Math.round(availableWidth)));
  const stackLegend = phone && width < 376;
  let height = phone
    ? Math.max(320, Math.min(360, Math.round(width * .7)))
    : (viewport <= 950 ? Math.max(360, Math.min(410, Math.round(width * .55))) : 410);
  if (stackLegend) height = Math.max(height, 340);
  return {phone, stackLegend, width, height};
}

function niceTickScale(dataMinimum, dataMaximum, targetIntervals, absolute) {
  if (!absolute && Math.abs(dataMaximum - dataMinimum) < Number.EPSILON) {
    return {minimum: -1, maximum: 1, ticks: [-1, 0, 1]};
  }
  const range = Math.max(Number.EPSILON, dataMaximum - dataMinimum);
  const roughStep = range / targetIntervals;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const fraction = roughStep / magnitude;
  const niceFraction = fraction <= 1 ? 1 : (fraction <= 2 ? 2 : (fraction <= 5 ? 5 : 10));
  const step = Math.max(absolute ? 1 : Number.EPSILON, niceFraction * magnitude);
  let minimum = absolute ? 0 : Math.floor(dataMinimum / step) * step;
  let maximum = Math.ceil(dataMaximum / step) * step;
  const epsilon = step / 1000;
  if (Math.abs(maximum - dataMaximum) < epsilon) maximum += step;
  if (!absolute && Math.abs(minimum - dataMinimum) < epsilon) minimum -= step;
  if (maximum <= minimum) maximum = minimum + step;
  const ticks = [];
  for (let value = minimum; value <= maximum + epsilon; value += step) {
    ticks.push(Math.abs(value) < epsilon ? 0 : value);
  }
  return {minimum, maximum, ticks};
}

function signed(value) {
  if (!Number.isFinite(value)) return "—";
  return `${value > 0 ? "+" : ""}${formatNumber(value, Number.isInteger(value) ? 0 : 1)}`;
}

function comparisonSpec(kind) {
  return kind === "max"
    ? {unit: "días", title: "Días", variable: "Tmax", thresholdKey: "maxThreshold"}
    : {unit: "noches", title: "Noches", variable: "Tmin", thresholdKey: "minThreshold"};
}

function renderKindComparison(first, second, values, kind) {
  const spec = comparisonSpec(kind);
  const threshold = values[spec.thresholdKey];
  if (!Number.isFinite(threshold)) throw configurationError(`Selecciona un umbral de ${spec.unit} válido.`, thresholdSelectId(kind));
  const band = temperatureBand(threshold);
  const kindValues = {
    ...values,
    thresholds: [band.lower, band.center, band.upper],
    anomalyReferenceThreshold: band.center
  };
  const {rows, firstBaseline, secondBaseline} = displayRows(first.rowsByKind[kind], second.rowsByKind[kind], kindValues);
  const common = rows.filter(row => row.rawA && row.rawB);
  if (!common.length) throw new Error(`No hay años completos comunes para comparar ${spec.unit} en el periodo elegido.`);

  const latest = common.at(-1);
  const rawA = latest.rawA[threshold];
  const rawB = latest.rawB[threshold];
  const firstValue = values.mode === "absolute" ? rawA : latest.a[threshold];
  const secondValue = values.mode === "absolute" ? rawB : latest.b[threshold];
  const difference = firstValue - secondValue;
  const firstName = shortLocationName(state.a);
  const secondName = shortLocationName(state.b);
  const firstNameHtml = escapeHtml(firstName);
  const secondNameHtml = escapeHtml(secondName);
  const valueA = values.mode === "absolute" ? formatNumber(firstValue) : signed(firstValue);
  const valueB = values.mode === "absolute" ? formatNumber(secondValue) : signed(secondValue);
  const detail = values.mode === "absolute"
    ? (rawB === 0 ? `${secondNameHtml} no registra superaciones.` : `${firstNameHtml} equivale al ${formatNumber(rawA / rawB * 100)} % de ${secondNameHtml}.`)
    : `Medianas ${values.baseline}: ${firstNameHtml} ${formatNumber(firstBaseline.medians[threshold], 1)}; ${secondNameHtml} ${formatNumber(secondBaseline.medians[threshold], 1)}.`;

  $(`compare-${kind}-title`).textContent = `${spec.title} con ${spec.variable} > ${threshold} °C`;
  $(`compare-${kind}-subtitle`).textContent = values.mode === "absolute"
    ? `La raya muestra el recuento anual sobre ${threshold} °C. La superficie queda entre los recuentos sobre ${band.lower} °C y ${band.upper} °C: compara umbrales, no representa incertidumbre. ${firstName} es naranja y ${secondName} azul.`
    : `La raya muestra la diferencia del recuento > ${threshold} °C frente a su mediana ${values.baseline}. La superficie aplica esa misma referencia central a > ${band.lower} °C y > ${band.upper} °C: compara umbrales, no incertidumbre. ${firstName} es naranja y ${secondName} azul.`;

  drawTemperatureBandChart(`compare-${kind}-chart`, rows, band, kind, values.mode, values.start, values.end);
  return {
    common,
    band,
    card: `<article class="metric comparison-metric">
      <span class="label">${spec.title} · raya ${spec.variable} &gt; ${threshold} °C · área ${band.lower}–${band.upper} °C · ${latest.year}${values.mode === "anomaly" ? " · frente a mediana" : ""}</span>
      <div class="comparison-values">
        <div class="comparison-city"><span class="city-swatch city-a-swatch" aria-hidden="true"></span><span>${firstNameHtml}</span><strong>${valueA}<span class="unit"> ${spec.unit}</span></strong></div>
        <div class="comparison-city"><span class="city-swatch city-b-swatch" aria-hidden="true"></span><span>${secondNameHtml}</span><strong>${valueB}<span class="unit"> ${spec.unit}</span></strong></div>
      </div>
      <small>Diferencia ${firstNameHtml} − ${secondNameHtml}: ${signed(difference)} ${spec.unit}. ${detail} Valores de la raya central; superficie entre &gt; ${band.lower} °C y &gt; ${band.upper} °C.</small>
    </article>`
  };
}

function render(first, second, values) {
  const maxResult = renderKindComparison(first, second, values, "max");
  const minResult = renderKindComparison(first, second, values, "min");
  $("compare-summary").innerHTML = maxResult.card + minResult.card;
  renderSourceNote(first.meta, second.meta, values, maxResult.common, minResult.common);
}

function renderSourceNote(firstMeta, secondMeta, values, maxCommonRows, minCommonRows) {
  const latestMax = maxCommonRows.at(-1)?.year;
  const latestMin = minCommonRows.at(-1)?.year;
  const timezones = firstMeta.timezone === secondMeta.timezone
    ? firstMeta.timezone
    : `${firstMeta.timezone} (${shortLocationName(state.a)}) y ${secondMeta.timezone} (${shortLocationName(state.b)})`;
  const baselineText = values.mode === "anomaly"
    ? ` Las anomalías restan la mediana ${values.baseline} del umbral central, calculada por separado para cada ubicación.`
    : "";
  const maxBand = temperatureBand(values.maxThreshold);
  const minBand = temperatureBand(values.minThreshold);
  $("compare-source-note").textContent = `Fuente: ERA5 mediante Open-Meteo, en las coordenadas elegidas. Superficies mostradas: Tmax ${maxBand.lower}–${maxBand.upper} °C con raya > ${maxBand.center} °C, y Tmin ${minBand.lower}–${minBand.upper} °C con raya > ${minBand.center} °C. Las temperaturas centrales se ajustan al clima de ambas ubicaciones. Las superficies muestran sensibilidad al umbral, no incertidumbre; que se solapen significa que coinciden sus rangos de recuentos, no necesariamente los mismos días. Últimos años completos comunes: ${latestMax ?? "no disponible"} para días y ${latestMin ?? "no disponible"} para noches. Zona horaria diaria: ${timezones}.${baselineText} Los umbrales son estrictos: un valor igual al límite no cuenta. Las dos series se descargan juntas y la caché dura únicamente esta sesión del navegador.`;
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

function bandPathFor(rows, side, lowerThreshold, upperThreshold, x, y) {
  const paths = [];
  let segment = [];
  const closeSegment = () => {
    if (!segment.length) return;
    const upperCurve = segment.map(point => `${x(point.index).toFixed(2)},${y(Math.max(point.lowerValue, point.upperValue)).toFixed(2)}`);
    const lowerCurve = [...segment].reverse().map(point => `${x(point.index).toFixed(2)},${y(Math.min(point.lowerValue, point.upperValue)).toFixed(2)}`);
    paths.push(`M${upperCurve.join(" L")} L${lowerCurve.join(" L")} Z`);
    segment = [];
  };
  rows.forEach((row, index) => {
    if (segment.length && row.year !== segment.at(-1).year + 1) closeSegment();
    const lowerValue = row[side]?.[lowerThreshold];
    const upperValue = row[side]?.[upperThreshold];
    if (Number.isFinite(lowerValue) && Number.isFinite(upperValue)) segment.push({index, year: row.year, lowerValue, upperValue});
    else closeSegment();
  });
  closeSegment();
  return paths.join(" ");
}

function lastFinitePoint(rows, side, threshold) {
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const value = rows[index][side]?.[threshold];
    if (Number.isFinite(value)) return {index, value, year: rows[index].year};
  }
  return null;
}

function drawTemperatureBandChart(id, rows, band, kind, mode, startYear, endYear) {
  const layout = comparisonChartLayout();
  const compact = layout.phone;
  const {width, height} = layout;
  const padding = compact
    ? {left: 48, right: 14, top: layout.stackLegend ? 92 : 68, bottom: 44}
    : {left: 58, right: 20, top: 62, bottom: 48};
  const thresholds = [band.lower, band.center, band.upper];
  const values = rows.flatMap(row => thresholds.flatMap(threshold => [row.a?.[threshold], row.b?.[threshold]]))
    .filter(Number.isFinite);
  if (!values.length) throw new Error("No hay valores suficientes para dibujar la comparación.");
  const dataMinimum = mode === "absolute" ? 0 : Math.min(0, ...values);
  const dataMaximum = Math.max(mode === "absolute" ? 1 : 0, ...values);
  const scale = niceTickScale(dataMinimum, dataMaximum, compact || width < 700 ? 4 : 5, mode === "absolute");
  const {minimum, maximum} = scale;

  const x = index => padding.left + index * (width - padding.left - padding.right) / Math.max(1, rows.length - 1);
  const y = value => height - padding.bottom - (value - minimum) * (height - padding.top - padding.bottom) / Math.max(1, maximum - minimum);
  let grid = "";
  scale.ticks.forEach(value => {
    const yy = y(value);
    grid += `<line class="grid" x1="${padding.left}" x2="${width - padding.right}" y1="${yy}" y2="${yy}"${Math.abs(value) < (maximum - minimum) / 100 ? ' style="stroke:#7f8c84;stroke-width:1.5"' : ""}/>`;
    grid += `<text class="axis" x="${padding.left - 8}" y="${yy + 4}" text-anchor="end">${formatNumber(value, Math.abs(value) < 10 && !Number.isInteger(value) ? 1 : 0)}</text>`;
  });

  const labelEvery = Math.max(1, Math.ceil(rows.length / (compact ? 4 : (width < 700 ? 6 : 8))));
  const yearLabels = rows.map((row, index) => {
    if (index !== 0 && index !== rows.length - 1 && index % labelEvery !== 0) return "";
    const anchor = index === rows.length - 1 ? "end" : "middle";
    return `<text class="axis" x="${x(index)}" y="${height - 15}" text-anchor="${anchor}">${row.year}</text>`;
  }).join("");
  const zeroLabel = mode === "anomaly"
    ? `<line x1="${padding.left}" x2="${width - padding.right}" y1="${y(0)}" y2="${y(0)}" style="stroke:#7f8c84;stroke-width:1.5"/><text class="legend" x="${padding.left + 8}" y="${y(0) - 7}">mediana de referencia</text>`
    : "";

  const firstPath = pathFor(rows, "a", band.center, x, y);
  const secondPath = pathFor(rows, "b", band.center, x, y);
  const firstArea = bandPathFor(rows, "a", band.lower, band.upper, x, y);
  const secondArea = bandPathFor(rows, "b", band.lower, band.upper, x, y);
  const firstPoint = lastFinitePoint(rows, "a", band.center);
  const secondPoint = lastFinitePoint(rows, "b", band.center);
  const firstLegendX = padding.left;
  const secondLegendX = layout.stackLegend ? padding.left : (compact ? Math.floor(width / 2) + 4 : padding.left + 250);
  const firstLegendY = 18;
  const secondLegendY = layout.stackLegend ? 45 : 18;
  const firstLegendName = escapeHtml(chartLocationName(state.a, compact ? 18 : 32));
  const secondLegendName = escapeHtml(chartLocationName(state.b, compact ? 18 : 32));
  const spec = comparisonSpec(kind);
  const modeDescription = mode === "absolute" ? "recuento anual" : `diferencia respecto a la mediana ${$("compare-baseline").value}`;
  const bandDescription = mode === "absolute"
    ? `la superficie une el recuento que supera ${band.lower} °C con el que supera ${band.upper} °C`
    : `la superficie aplica la mediana del umbral central a los recuentos que superan ${band.lower} °C y ${band.upper} °C`;
  const firstMarker = firstPoint ? `<circle class="compare-area-point compare-city-a-point" cx="${x(firstPoint.index)}" cy="${y(firstPoint.value)}" r="4"><title>${firstPoint.year}: ${formatNumber(firstPoint.value, Number.isInteger(firstPoint.value) ? 0 : 1)} ${spec.unit} &gt; ${band.center} °C</title></circle>` : "";
  const secondMarker = secondPoint ? `<circle class="compare-area-point compare-city-b-point" cx="${x(secondPoint.index)}" cy="${y(secondPoint.value)}" r="4"><title>${secondPoint.year}: ${formatNumber(secondPoint.value, Number.isInteger(secondPoint.value) ? 0 : 1)} ${spec.unit} &gt; ${band.center} °C</title></circle>` : "";

  $(id).innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${kind}-svg-title ${kind}-svg-desc">
    <title id="${kind}-svg-title">${spec.title}: áreas ${spec.variable} ${band.lower}–${band.upper} °C y rayas &gt; ${band.center} °C; ${escapeHtml(shortLocationName(state.a))} frente a ${escapeHtml(shortLocationName(state.b))}</title>
    <desc id="${kind}-svg-desc">En ${modeDescription}, ${bandDescription}; la raya representa las superaciones de ${band.center} °C. Es una banda de sensibilidad al umbral, no de incertidumbre. ${escapeHtml(locationName(state.a))} aparece en naranja con raya continua y ${escapeHtml(locationName(state.b))} en azul con raya discontinua, entre ${startYear} y ${endYear}.</desc>
    ${grid}
    <g class="compare-area-layer">
      <path class="compare-area compare-temperature-band compare-city-a-area" d="${firstArea}"><title>${escapeHtml(locationName(state.a))}: área entre ${spec.variable} &gt; ${band.lower} °C y &gt; ${band.upper} °C</title></path>
      <path class="compare-area compare-temperature-band compare-city-b-area" d="${secondArea}"><title>${escapeHtml(locationName(state.b))}: área entre ${spec.variable} &gt; ${band.lower} °C y &gt; ${band.upper} °C</title></path>
    </g>
    ${zeroLabel}
    <path class="compare-area-outline compare-central-line compare-city-a-outline" d="${firstPath}"><title>${escapeHtml(locationName(state.a))}: raya ${spec.variable} &gt; ${band.center} °C</title></path>
    <path class="compare-area-outline compare-central-line compare-city-b-outline" d="${secondPath}"><title>${escapeHtml(locationName(state.b))}: raya ${spec.variable} &gt; ${band.center} °C</title></path>
    ${firstMarker}${secondMarker}${yearLabels}
    <rect class="area-legend-swatch compare-city-a-area" x="${firstLegendX}" y="${firstLegendY}" width="22" height="12"/><line class="compare-area-outline compare-city-a-outline" x1="${firstLegendX}" x2="${firstLegendX + 22}" y1="${firstLegendY + 6}" y2="${firstLegendY + 6}"/><text class="legend" x="${firstLegendX + 29}" y="${firstLegendY + 11}">${firstLegendName}</text>
    <rect class="area-legend-swatch compare-city-b-area" x="${secondLegendX}" y="${secondLegendY}" width="22" height="12"/><line class="compare-area-outline compare-city-b-outline" x1="${secondLegendX}" x2="${secondLegendX + 22}" y1="${secondLegendY + 6}" y2="${secondLegendY + 6}"/><text class="legend" x="${secondLegendX + 29}" y="${secondLegendY + 11}">${secondLegendName}</text>
  </svg>`;
}

$("station-a").oninput = () => queueSearch("a");
$("station-b").oninput = () => queueSearch("b");
$("station-a").onkeydown = event => { if (event.key === "Enter") search("a"); };
$("station-b").onkeydown = event => { if (event.key === "Enter") search("b"); };
$("compare-button").onclick = compare;
$("compare-mode").onchange = updateModeControls;
$("compare-baseline").onchange = rerenderLastResult;
$("compare-max-threshold").onchange = rerenderLastResult;
$("compare-min-threshold").onchange = rerenderLastResult;
function comparisonPeriodChanged() {
  state.lastResult = null;
  $("comparison").hidden = true;
  state.pendingThresholds = {max: null, min: null};
  resetThresholdSelectors();
  if (state.a && state.b) setStatus("El periodo cambió. Pulsa Comparar para recalcular los umbrales.");
}
$("compare-start").onchange = comparisonPeriodChanged;
$("compare-end").onchange = comparisonPeriodChanged;

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
  [["compare-start", "start"], ["compare-end", "end"]].forEach(([id, key]) => { if (params.has(key)) $(id).value = params.get(key); });
  [["compare-mode", "mode"], ["compare-baseline", "baseline"]].forEach(([id, key]) => {
    const requested = params.get(key);
    if (requested && [...$(id).options].some(option => option.value === requested)) $(id).value = requested;
  });
  const legacyBase = params.has("base") ? Number(params.get("base")) : NaN;
  const requestedMax = params.has("baseMax") ? Number(params.get("baseMax")) : NaN;
  const requestedMin = params.has("baseMin") ? Number(params.get("baseMin")) : NaN;
  state.pendingThresholds = {
    max: Number.isFinite(requestedMax) ? requestedMax : (params.get("kind") !== "min" && Number.isFinite(legacyBase) ? legacyBase : null),
    min: Number.isFinite(requestedMin) ? requestedMin : (params.get("kind") === "min" && Number.isFinite(legacyBase) ? legacyBase : null)
  };
  resetThresholdSelectors();
  updateModeControls();
  if (params.get("run") === "1" && state.a && state.b) setTimeout(compare, 0);
  return Boolean(state.a || state.b);
}

resetThresholdSelectors();
if (!restoreQuery()) { queueSearch("a"); queueSearch("b"); }

let chartResizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(chartResizeTimer);
  chartResizeTimer = setTimeout(() => {
    if (state.lastResult && !$("comparison").hidden) rerenderLastResult();
  }, 150);
});
