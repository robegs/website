const $ = (id) => document.getElementById(id);
const MIN_THRESHOLD_LINES = 5;
const MAX_THRESHOLD_LINES = 9;
const CURRENT_YEAR = new Date().getFullYear();
const CACHE_PREFIX = "calor-main-session-v3:";
const state = { station: null, rows: [], maxThresholds: [], minThresholds: [], source: "era5", baseline: null, searchTimer: null, searchAbort: null, lastRender: null };

const MAX_TEXTS = [
  "Los episodios extremos son excepcionales y el periodo reciente queda claramente por debajo de la referencia.", "Los episodios extremos son excepcionales y el periodo reciente queda algo por debajo de la referencia.", "Los episodios extremos son excepcionales y no muestran un cambio apreciable.", "Los episodios extremos son excepcionales, con un aumento moderado.", "Los episodios extremos son excepcionales, con un aumento claro.", "Los episodios extremos son excepcionales, pero el aumento reciente es muy marcado.",
  "Los episodios extremos son puntuales y el periodo reciente queda claramente por debajo de la referencia.", "Los episodios extremos son puntuales y han disminuido ligeramente.", "Los episodios extremos son puntuales y se mantienen cerca de la referencia.", "Los episodios extremos son puntuales, con un aumento moderado.", "Los episodios extremos son puntuales, con un aumento claro.", "Los episodios extremos son puntuales, con una intensificación muy marcada.",
  "Los episodios extremos son habituales, aunque el periodo reciente queda claramente por debajo de la referencia.", "Los episodios extremos son habituales y han disminuido ligeramente.", "Los episodios extremos son habituales y se mantienen cerca de la referencia.", "Los episodios extremos son habituales, con un aumento moderado.", "Los episodios extremos son habituales, con un aumento claro.", "Los episodios extremos son habituales, con una intensificación muy marcada.",
  "Los episodios extremos son frecuentes, aunque el periodo reciente queda claramente por debajo de la referencia.", "Los episodios extremos son frecuentes y han disminuido ligeramente.", "Los episodios extremos son frecuentes y se mantienen cerca de la referencia.", "Los episodios extremos son frecuentes, con un aumento moderado.", "Los episodios extremos son frecuentes, con un aumento claro.", "Los episodios extremos son frecuentes y el periodo reciente destaca de forma muy marcada."
];
const MIN_TEXTS = MAX_TEXTS.map((text) => text.replaceAll("episodios extremos", "noches cálidas").replaceAll("Los ", "Las ").replaceAll("son habituales", "son habituales").replaceAll("son frecuentes", "son frecuentes"));

$("end-year").value = CURRENT_YEAR - 1;
resetFocusSelectors();

function setStatus(text, error = false) { $("status").textContent = text; $("status").classList.toggle("error", error); }
function stationName(place) { return [place.name, place.admin1, place.country].filter(Boolean).join(", "); }
function escapeHtml(value) { const node = document.createElement("div"); node.textContent = value; return node.innerHTML; }
function iso(year, month, day) { return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`; }
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function mean(values) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null; }
function quantile(values, q) { if (!values.length) return null; const sorted = [...values].sort((a, b) => a - b); const index = (sorted.length - 1) * q, lower = Math.floor(index), fraction = index - lower; return sorted[lower + 1] === undefined ? sorted[lower] : sorted[lower] + fraction * (sorted[lower + 1] - sorted[lower]); }
function median(values) { return quantile(values, 0.5); }
function formatNumber(value, digits = 0) { return value == null || !Number.isFinite(value) ? "—" : new Intl.NumberFormat("es-ES", { maximumFractionDigits: digits }).format(value); }
function formatDate(value) { return value ? new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(new Date(`${value}T12:00:00Z`)) : "—"; }
function usePhoneCharts() { return window.matchMedia("(max-width: 760px)").matches; }

function adaptiveThresholds(values) {
  const finite = values.filter(Number.isFinite);
  if (!finite.length) throw new Error("No hay temperaturas suficientes para ajustar los umbrales.");
  const observedMaximum = finite.reduce((highest, value) => Math.max(highest, value), -Infinity);
  const highest = Math.ceil(observedMaximum) - 1;
  const climateStart = Math.floor(quantile(finite, 0.9));
  let lowest = Math.max(climateStart, highest - (MAX_THRESHOLD_LINES - 1));
  lowest = Math.min(lowest, highest - (MIN_THRESHOLD_LINES - 1));
  return Array.from({ length: highest - lowest + 1 }, (_, index) => lowest + index);
}

function climateValues(data, field, start, end) {
  return data[field].filter((value, index) => {
    const year = Number(data.time[index]?.slice(0, 4));
    return year >= start && year <= end && Number.isFinite(value);
  });
}

function automaticThreshold(thresholds) {
  return thresholds.find((threshold) => threshold % 5 === 0) ?? thresholds[Math.floor(thresholds.length / 2)];
}

function resetFocusSelectors() {
  [["focus-max", "Tmax"], ["focus-min", "Tmin"]].forEach(([id, label]) => {
    $(id).replaceChildren(new Option(`Automático según ${label} de la ubicación`, "auto", true, true));
  });
  state.maxThresholds = [];
  state.minThresholds = [];
}

function populateFocusSelector(id, label, thresholds, requested) {
  const automatic = automaticThreshold(thresholds);
  const options = [new Option(`Automático (>${automatic} °C)`, "auto")];
  thresholds.forEach((threshold) => options.push(new Option(`${label} > ${threshold} °C`, threshold)));
  $(id).replaceChildren(...options);
  const manual = Number.isFinite(requested) && thresholds.includes(requested);
  $(id).value = manual ? String(requested) : "auto";
  return manual ? requested : automatic;
}

function retryDelay(value, attempt) {
  if (value && value.trim()) {
    const seconds = Number(value);
    if (Number.isFinite(seconds) && seconds > 0) return Math.min(seconds * 1000, 30000);
    const date = Date.parse(value), difference = date - Date.now();
    if (Number.isFinite(difference) && difference > 0) return Math.min(difference, 30000);
  }
  return Math.min(1500 * (2 ** attempt), 12000);
}
async function fetchWithRetry(url, options) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, options);
    if (response.status !== 429 || attempt === 3) return response;
    const delay = retryDelay(response.headers.get("Retry-After"), attempt);
    setStatus(`La fuente pública está limitando consultas. Nuevo intento en ${Math.ceil(delay / 1000)} s…`);
    await sleep(delay);
  }
}
function checked(response) {
  if (response.status === 429) throw new Error("La fuente pública ha limitado temporalmente las consultas porque recibió demasiadas solicitudes. Espera unos minutos o vuelve a usar una consulta guardada en esta sesión.");
  if (!response.ok) throw new Error(`La fuente devolvió ${response.status}.`);
  return response;
}

function cacheKey(source, place, start, end) { return `${CACHE_PREFIX}${source}:${place.latitude.toFixed(4)}:${place.longitude.toFixed(4)}:${place.timezone || "auto"}:${start}:${end}`; }
function readCache(key) { try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; } }
function writeCache(key, data) { try { sessionStorage.setItem(key, JSON.stringify(data)); } catch { /* Cache is optional. */ } }

function invalidateStation() { state.station = null; resetFocusSelectors(); $("analyse-button").disabled = true; $("selected-station").textContent = "Selecciona una sugerencia para analizar esta ubicación."; }
function queueSearch() { clearTimeout(state.searchTimer); const query = $("station-search").value.trim(); if (query.length < 2) { $("search-results").replaceChildren(); return; } state.searchTimer = setTimeout(searchStations, 300); }
async function searchStations() {
  const query = $("station-search").value.trim();
  if (!query) return;
  state.searchAbort?.abort(); state.searchAbort = new AbortController(); $("search-results").replaceChildren();
  try {
    const cache = `${CACHE_PREFIX}geo:${query.toLowerCase()}`, cached = readCache(cache);
    let results = cached;
    if (!results) {
      const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
      url.search = new URLSearchParams({ name: query, count: "8", language: "es", format: "json" });
      const payload = await fetchWithRetry(url, { signal: state.searchAbort.signal }).then(checked).then((r) => r.json());
      results = payload.results || []; writeCache(cache, results);
    }
    if (query !== $("station-search").value.trim()) return;
    if (!results.length) return setStatus("No se encontraron ubicaciones.", true);
    const fragment = document.createDocumentFragment();
    results.forEach((place) => {
      const button = document.createElement("button"); button.type = "button"; button.className = "result";
      button.innerHTML = `${escapeHtml(stationName(place))}<small>${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)} · ${escapeHtml(place.timezone || "zona automática")}</small>`;
      button.onclick = () => selectStation(place); fragment.append(button);
    });
    $("search-results").append(fragment); setStatus("Selecciona una ubicación.");
  } catch (error) { if (error.name !== "AbortError") setStatus(`No se pudo buscar: ${error.message}`, true); }
}
function selectStation(place) {
  state.station = place;
  $("station-search").value = stationName(place);
  $("search-results").replaceChildren();
  $("selected-station").textContent = `Seleccionado: ${stationName(place)} · ${place.timezone || "zona automática"}.`;
  $("analyse-button").disabled = false;
  setStatus("Todo listo con la configuración predeterminada. Pulsa Analizar.");
}

function configurationError(message, inputId) {
  const error = new Error(message);
  error.inputId = inputId;
  return error;
}

function baselineRange() {
  if ($("baseline").value !== "custom") { const [start, end] = $("baseline").value.split("-").map(Number); return { start, end, label: `${start}–${end}` }; }
  const start = Number($("baseline-start").value), end = Number($("baseline-end").value);
  if (!Number.isInteger(start) || !Number.isInteger(end) || start > end || end >= CURRENT_YEAR) throw configurationError("El periodo de referencia personalizado no es válido.", "baseline-start");
  return { start, end, label: `${start}–${end}` };
}
function inputs() {
  const start = Number($("start-year").value), end = Number($("end-year").value), source = $("data-source").value, baseline = baselineRange();
  const maxThreshold = $("focus-max").value === "auto" ? null : Number($("focus-max").value);
  const minThreshold = $("focus-min").value === "auto" ? null : Number($("focus-min").value);
  if (!Number.isInteger(start) || !Number.isInteger(end) || start > end || start < 1940 || end >= CURRENT_YEAR) {
    const inputId = !Number.isInteger(start) || start < 1940 || start > end ? "start-year" : "end-year";
    throw configurationError(`El histórico debe terminar como máximo en ${CURRENT_YEAR - 1}.`, inputId);
  }
  const requestStart = Math.min(start, baseline.start), requestEnd = Math.max(end, baseline.end);
  if (source === "nasa" && requestStart < 1981) throw configurationError("NASA POWER comienza en 1981. Elige un histórico y un periodo de referencia posteriores.", "start-year");
  if (maxThreshold !== null && !Number.isFinite(maxThreshold)) throw configurationError("Selecciona un umbral diurno válido.", "focus-max");
  if (minThreshold !== null && !Number.isFinite(minThreshold)) throw configurationError("Selecciona un umbral nocturno válido.", "focus-min");
  return { start, end, source, baseline, maxThreshold, minThreshold, requestStart, requestEnd };
}

async function loadOpenMeteo(start, end) {
  const place = state.station, key = cacheKey("era5", place, start, end), cached = readCache(key); if (cached) return cached;
  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  url.search = new URLSearchParams({ latitude: place.latitude, longitude: place.longitude, start_date: start, end_date: end, daily: "temperature_2m_max,temperature_2m_min", timezone: place.timezone || "auto", models: "era5" });
  let response = await fetchWithRetry(url);
  if (!response.ok) { const detail = await response.text(), match = detail.match(/to (\d{4}-\d{2}-\d{2})/); if (response.status === 400 && match) { url.searchParams.set("end_date", match[1]); response = await fetchWithRetry(url); } }
  const payload = await checked(response).json(), daily = payload.daily;
  if (!daily?.time || !daily.temperature_2m_max || !daily.temperature_2m_min) throw new Error("ERA5 no devolvió las temperaturas diarias esperadas.");
  const data = { time: daily.time, max: daily.temperature_2m_max, min: daily.temperature_2m_min, timezone: payload.timezone || place.timezone || "auto" }; writeCache(key, data); return data;
}
async function loadNasa(start, end) {
  const place = state.station, key = cacheKey("nasa", place, start, end), cached = readCache(key); if (cached) return cached;
  const url = new URL("https://power.larc.nasa.gov/api/temporal/daily/point");
  url.search = new URLSearchParams({ parameters: "T2M_MAX,T2M_MIN", community: "RE", longitude: place.longitude, latitude: place.latitude, start: start.replaceAll("-", ""), end: end.replaceAll("-", ""), format: "JSON", "time-standard": "UTC" });
  const payload = await fetchWithRetry(url).then(checked).then((r) => r.json()), max = payload.properties?.parameter?.T2M_MAX, min = payload.properties?.parameter?.T2M_MIN;
  if (!max || !min) throw new Error("NASA POWER no devolvió las temperaturas diarias esperadas.");
  const keys = Object.keys(max).sort(), data = { time: keys.map((k) => `${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6, 8)}`), max: keys.map((k) => max[k] > -900 ? max[k] : null), min: keys.map((k) => min[k] > -900 ? min[k] : null), timezone: "UTC" }; writeCache(key, data); return data;
}
function loadData(source, start, end) { return source === "nasa" ? loadNasa(start, end) : loadOpenMeteo(start, end); }

function aggregateAnnual(data, maxThresholds, minThresholds) {
  const years = new Map();
  data.time.forEach((date, index) => {
    const year = Number(date.slice(0, 4)), row = years.get(year) || { year, maxDays: 0, minDays: 0, max: {}, min: {} }, max = data.max[index], min = data.min[index];
    if (Number.isFinite(max)) { row.maxDays++; maxThresholds.forEach((t) => row.max[t] = (row.max[t] || 0) + (max > t)); }
    if (Number.isFinite(min)) { row.minDays++; minThresholds.forEach((t) => row.min[t] = (row.min[t] || 0) + (min > t)); }
    years.set(year, row);
  });
  return [...years.values()].sort((a, b) => a.year - b.year);
}
function yearlyStats(data, field, threshold, cutoff, range) {
  const years = new Map();
  data.time.forEach((date, index) => {
    const year = Number(date.slice(0, 4)); if (year < range.start || year > range.end) return;
    const value = data[field][index], row = years.get(year) || { year, annualDays: 0, annual: 0, ytdDays: 0, ytd: 0 };
    if (Number.isFinite(value)) { row.annualDays++; row.annual += value > threshold; if (date.slice(5) <= cutoff) { row.ytdDays++; row.ytd += value > threshold; } }
    years.set(year, row);
  });
  return [...years.values()].filter((row) => row.annualDays >= 350);
}
function latestDate(data, field) { for (let i = data.time.length - 1; i >= 0; i--) if (Number.isFinite(data[field][i])) return data.time[i]; return null; }
function currentSnapshot(history, current, field, threshold, historicalRange, baseline) {
  const latest = latestDate(current, field); if (!latest) throw new Error("No hay datos del año actual para calcular la comparación.");
  const cutoff = latest.slice(5), currentValues = current.time.map((date, i) => ({ date, value: current[field][i] })).filter((row) => row.date <= latest && Number.isFinite(row.value)), seen = currentValues.filter((row) => row.value > threshold).length;
  const historical = yearlyStats(history, field, threshold, cutoff, historicalRange).filter((row) => row.ytdDays >= currentValues.length - 5), reference = yearlyStats(history, field, threshold, cutoff, baseline).filter((row) => row.ytdDays >= currentValues.length - 5);
  const ranking = historical.map((row) => row.ytd), referenceYtd = reference.map((row) => row.ytd), remainders = reference.map((row) => Math.max(0, row.annual - row.ytd));
  const below = ranking.filter((value) => value < seen).length, ties = ranking.filter((value) => value === seen).length, referenceMedian = median(referenceYtd), rank = 1 + ranking.filter((value) => value > seen).length, percentile = ranking.length ? 100 * (below + .5 * ties) / ranking.length : null;
  return { field, threshold, latest, cutoff, seen, rank, rankTotal: ranking.length + 1, ties, percentile, referenceMedian, delta: referenceMedian == null ? null : seen - referenceMedian, expected: seen + median(remainders), low: seen + quantile(remainders, 0.1), high: seen + quantile(remainders, 0.9), referenceYears: reference.length, currentValues };
}
function projectionForThresholds(history, current, field, thresholds, baseline) { return thresholds.map((threshold) => currentSnapshot(history, current, field, threshold, baseline, baseline)); }

function cumulativeProfile(history, snapshot, baseline) {
  const groups = new Map();
  history.time.forEach((date, index) => {
    const year = Number(date.slice(0, 4)); if (year < baseline.start || year > baseline.end) return;
    const group = groups.get(year) || { days: 0, values: [] }, value = history[snapshot.field][index];
    if (Number.isFinite(value)) { group.days++; group.values.push({ key: date.slice(5), value }); } groups.set(year, group);
  });
  const years = [...groups.values()].filter((group) => group.days >= 350), points = snapshot.currentValues.map((row, index) => {
    const key = row.date.slice(5), distribution = years.map((year) => year.values.filter((item) => item.key <= key && item.value > snapshot.threshold).length), current = snapshot.currentValues.slice(0, index + 1).filter((item) => item.value > snapshot.threshold).length;
    return { date: row.date, current, low: quantile(distribution, 0.1), median: median(distribution), high: quantile(distribution, 0.9) };
  });
  return points;
}

function heatIndicators(current, maxThreshold, minThreshold) {
  const latest = [latestDate(current, "max"), latestDate(current, "min")].filter(Boolean).sort().at(-1), rows = current.time.map((date, i) => ({ date, max: current.max[i], min: current.min[i] })).filter((row) => row.date <= latest), hot = rows.filter((row) => Number.isFinite(row.max) && row.max > maxThreshold);
  let runs = [], run = [];
  rows.forEach((row) => { const previous = run.at(-1), consecutive = previous && (new Date(row.date) - new Date(previous.date)) === 86400000; if (row.max > maxThreshold) { if (!consecutive) { if (run.length) runs.push(run); run = []; } run.push(row); } else { if (run.length) runs.push(run); run = []; } }); if (run.length) runs.push(run);
  const heatwaves = runs.filter((items) => items.length >= 3), degreeDays = rows.reduce((sum, row) => sum + (Number.isFinite(row.max) ? Math.max(0, row.max - maxThreshold) : 0), 0), compound = rows.filter((row) => row.max > maxThreshold && row.min > minThreshold).length;
  return { heatwaves: heatwaves.length, longest: Math.max(0, ...runs.map((items) => items.length)), heatwaveDays: heatwaves.reduce((sum, items) => sum + items.length, 0), degreeDays, first: hot.at(0)?.date, last: hot.at(-1)?.date, compound };
}

function movingMedian(rows, field, threshold) { return rows.map((_, index) => { const values = rows.slice(index - 2, index + 3).map((row) => row[field][threshold]); return values.length === 5 ? median(values) : null; }); }
function color(index, length) { return `hsl(${index * 250 / Math.max(1, length - 1)},70%,${38 + index * 18 / Math.max(1, length - 1)}%)`; }

function renderSummary(max, min, baseline) {
  const card = (title, snapshot) => `<article class="metric"><span class="label">${title}</span><strong class="value">${snapshot.seen}</strong><small>Puesto ${snapshot.rank} de ${snapshot.rankTotal}${snapshot.ties ? ` · ${snapshot.ties} empate${snapshot.ties === 1 ? "" : "s"}` : ""} · percentil ${formatNumber(snapshot.percentile)}</small></article>`;
  $("current-title").textContent = `Datos hasta ${formatDate(max.latest)} · referencia ${baseline.label}`;
  $("current-summary").innerHTML = `${card(`Días con Tmax > ${max.threshold} °C`, max)}${card(`Noches con Tmin > ${min.threshold} °C`, min)}<article class="metric"><span class="label">Diferencia frente a ${baseline.label}</span><strong class="value">${max.delta >= 0 ? "+" : ""}${formatNumber(max.delta)} / ${min.delta >= 0 ? "+" : ""}${formatNumber(min.delta)}</strong><small>días / noches respecto a la mediana a igual fecha</small></article><article class="metric"><span class="label">Estimación final</span><strong class="value">${formatNumber(max.expected)} / ${formatNumber(min.expected)}</strong><small>intervalos 10–90%: ${formatNumber(max.low)}–${formatNumber(max.high)} / ${formatNumber(min.low)}–${formatNumber(min.high)}</small></article>`;
  const direction = max.delta > 0 || min.delta > 0 ? "más cálido" : "similar o menos cálido";
  $("current-narrative").innerHTML = `<p><strong>Lectura:</strong> Hasta la misma fecha, el año actual está resultando ${direction} que la referencia ${baseline.label}. El rango de la estimación final refleja cómo varió el resto de la temporada en los años de referencia; no es un pronóstico meteorológico.</p>`;
}
function renderProgress(id, points, title, threshold) {
  $(id.replace("progress", "progress-title")).textContent = `${title} > ${threshold} °C`;
  const compact = usePhoneCharts(), width = compact ? 420 : 720, height = compact ? 360 : 300, p = { l: 42, r: 14, t: 28, b: 40 }, top = Math.max(1, ...points.flatMap((point) => [point.current, point.high || 0])), x = (i) => p.l + i * (width - p.l - p.r) / Math.max(1, points.length - 1), y = (value) => height - p.b - value * (height - p.t - p.b) / top, line = (key) => points.map((point, i) => `${x(i)},${y(point[key])}`).join(" "), upper = points.map((point, i) => `${x(i)},${y(point.high)}`).join(" "), lower = [...points].reverse().map((point, reverseIndex) => `${x(points.length - 1 - reverseIndex)},${y(point.low)}`).join(" ");
  let grid = ""; for (let i = 0; i <= 4; i++) { const value = Math.round(top * i / 4), yy = y(value); grid += `<line class="grid" x1="${p.l}" x2="${width - p.r}" y1="${yy}" y2="${yy}"/><text class="axis" x="${p.l - 6}" y="${yy + 4}" text-anchor="end">${value}</text>`; }
  const months = points.map((point, i) => ({ point, i })).filter(({ point, i }) => i === 0 || (point.date.slice(8) === "01" && (!compact || (Number(point.date.slice(5, 7)) - 1) % 2 === 0))).map(({ point, i }) => `<text class="axis" x="${x(i)}" y="${height - 12}" text-anchor="middle">${new Intl.DateTimeFormat("es-ES", { month: "short" }).format(new Date(`${point.date}T12:00:00Z`))}</text>`).join("");
  const tooltips = points.filter((_, i) => i % 7 === 0 || i === points.length - 1).map((point, i) => `<circle cx="${x(points.indexOf(point))}" cy="${y(point.current)}" r="3" class="current-point"><title>${point.date}: ${point.current}; mediana ${formatNumber(point.median, 1)}</title></circle>`).join("");
  const legend = compact
    ? `<line class="current-line" x1="42" x2="58" y1="15" y2="15"/><text class="legend" x="64" y="19">actual</text><line class="baseline-line" x1="120" x2="136" y1="15" y2="15"/><text class="legend" x="142" y="19">mediana</text><rect class="range-band" x="226" y="9" width="16" height="10"/><text class="legend" x="248" y="19">rango 10–90%</text>`
    : `<text class="legend" x="${p.l}" y="16">— año actual   — mediana   ▨ rango 10–90%</text>`;
  $(id).innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img"><title>Acumulado actual frente al rango histórico</title>${grid}<polygon class="range-band" points="${upper} ${lower}"/><polyline class="baseline-line" points="${line("median")}"/><polyline class="current-line" points="${line("current")}"/>${tooltips}${months}${legend}</svg>`;
}
function renderIndicators(indicators, maxThreshold, minThreshold) {
  const items = [["Olas de calor", indicators.heatwaves, `≥3 días seguidos con Tmax > ${maxThreshold} °C`], ["Racha más larga", `${indicators.longest} días`, "incluye rachas de uno o dos días"], ["Días en olas", indicators.heatwaveDays, "días pertenecientes a olas de calor"], ["Intensidad acumulada", `${formatNumber(indicators.degreeDays, 1)} °C·día`, `exceso sobre ${maxThreshold} °C`], ["Temporada observada", `${formatDate(indicators.first)} – ${formatDate(indicators.last)}`, "primer y último día sobre el umbral"], ["Días y noches compuestos", indicators.compound, `Tmax > ${maxThreshold} °C y Tmin > ${minThreshold} °C`]];
  $("heat-indicators").innerHTML = items.map(([label, value, note]) => `<article class="indicator"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join("");
}
function renderAnnual(id, rows, thresholds, smoothed, field, label, projections) {
  const compact = usePhoneCharts(), legendColumns = compact ? 2 : 6, legendRowHeight = compact ? 20 : 17, legendRows = Math.ceil(thresholds.length / legendColumns), width = compact ? 420 : 1040, height = compact ? 380 + legendRows * legendRowHeight : 420, p = { l: compact ? 42 : 50, r: compact ? 14 : 24, t: compact ? 34 + legendRows * legendRowHeight : 60, b: compact ? 46 : 42 }, values = [...rows.flatMap((row) => thresholds.map((t) => row[field][t] || 0)), ...projections.flatMap((item) => [item.high || 0])], top = Math.max(1, ...values), x = (i) => p.l + i * (width - p.l - p.r) / Math.max(1, rows.length), y = (value) => height - p.b - value * (height - p.t - p.b) / top, points = (items) => items.map((value, i) => value == null ? "" : `${x(i)},${y(value)}`).join(" ");
  let svg = "", legend = ""; for (let i = 0; i <= 4; i++) { const value = Math.round(top * i / 4), yy = y(value); svg += `<line class="grid" x1="${p.l}" x2="${width - p.r}" y1="${yy}" y2="${yy}"/><text class="axis" x="${p.l - 7}" y="${yy + 4}" text-anchor="end">${value}</text>`; }
  thresholds.forEach((threshold, index) => {
    const stroke = color(index, thresholds.length), annual = rows.map((row) => row[field][threshold] || 0), projection = projections.find((item) => item.threshold === threshold), px = x(rows.length);
    svg += `<polyline class="series" style="stroke:${stroke}" points="${points(annual)}"/>`;
    if (smoothed.includes(threshold)) svg += `<polyline class="average" style="stroke:${stroke}" points="${points(movingMedian(rows, field, threshold))}"/>`;
    if (projection?.expected != null) { svg += `<line class="projection-whisker" style="stroke:${stroke}" x1="${px}" x2="${px}" y1="${y(projection.low)}" y2="${y(projection.high)}"/><line class="projection-link" style="stroke:${stroke}" x1="${x(rows.length - 1)}" y1="${y(annual.at(-1))}" x2="${px}" y2="${y(projection.expected)}"/><path fill="${stroke}" d="M ${px} ${y(projection.expected) - 5} l 5 5 l -5 5 l -5 -5 Z"><title>${CURRENT_YEAR}: ${formatNumber(projection.expected)} (${formatNumber(projection.low)}–${formatNumber(projection.high)})</title></path>`; if (smoothed.includes(threshold)) svg += `<text class="projection-label" x="${px - 3}" y="${y(projection.expected) - 8}" text-anchor="end">${formatNumber(projection.expected)}</text>`; }
    legend += `<text class="legend" x="${p.l + (index % legendColumns) * (compact ? 180 : 155)}" y="${18 + Math.floor(index / legendColumns) * legendRowHeight}" fill="${stroke}">● &gt;${threshold} °C${smoothed.includes(threshold) ? " · mediana 5a" : ""}</text>`;
  });
  const labelEvery = Math.max(1, Math.ceil(rows.length / (compact ? 4 : 8))), years = rows.map((row, i) => ({ row, i })).filter(({ i }) => i === 0 || (i > 0 && i < rows.length - 1 && i % labelEvery === 0)).map(({ row, i }) => `<text class="axis" x="${x(i)}" y="${height - 15}" text-anchor="middle">${row.year}</text>`).join("");
  $(id).innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img"><title>${label} anuales por encima de cada umbral</title>${svg}${legend}${years}<text class="axis" x="${x(rows.length)}" y="${height - 15}" text-anchor="end">${CURRENT_YEAR} est.</text></svg>`;
}
function renderExplanation(id, library, rows, field, threshold, baseline) {
  const reference = rows.filter((row) => row.year >= baseline.start && row.year <= baseline.end).map((row) => row[field][threshold]), recent = rows.slice(-10).map((row) => row[field][threshold]), referenceMean = mean(reference), recentMean = mean(recent), record = Math.max(...rows.map((row) => row[field][threshold])), ratio = referenceMean ? recentMean / referenceMean : recentMean ? 2 : 1, trend = ratio <= .75 ? 0 : ratio <= .95 ? 1 : ratio < 1.15 ? 2 : ratio < 1.4 ? 3 : ratio < 1.8 ? 4 : 5, intensity = record === 0 ? 0 : record <= 2 ? 1 : record <= 6 ? 2 : 3;
  $(id).innerHTML = `<p><strong>Lectura automática:</strong> ${library[intensity * 6 + trend]} Para &gt;${threshold} °C, la media de ${baseline.label} es ${formatNumber(referenceMean, 1)} y la de los últimos diez años mostrados es ${formatNumber(recentMean, 1)} ${field === "max" ? "días" : "noches"} por año.</p>`;
}

function renderAll(history, current, config) {
  const maxThresholds = adaptiveThresholds(climateValues(history, "max", config.start, config.end));
  const minThresholds = adaptiveThresholds(climateValues(history, "min", config.start, config.end));
  config.maxThreshold = populateFocusSelector("focus-max", "Tmax", maxThresholds, config.maxThreshold);
  config.minThreshold = populateFocusSelector("focus-min", "Tmin", minThresholds, config.minThreshold);
  const allRows = aggregateAnnual(history, maxThresholds, minThresholds), rows = allRows.filter((row) => row.year >= config.start && row.year <= config.end && row.year < CURRENT_YEAR); if (!rows.length) throw new Error("No hay años completos en el periodo seleccionado."); state.rows = rows; state.maxThresholds = maxThresholds; state.minThresholds = minThresholds; state.source = config.source; state.baseline = config.baseline;
  const historicalRange = { start: config.start, end: config.end }, max = currentSnapshot(history, current, "max", config.maxThreshold, historicalRange, config.baseline), min = currentSnapshot(history, current, "min", config.minThreshold, historicalRange, config.baseline), maxProjections = projectionForThresholds(history, current, "max", maxThresholds, config.baseline), minProjections = projectionForThresholds(history, current, "min", minThresholds, config.baseline);
  renderSummary(max, min, config.baseline); renderProgress("max-progress", cumulativeProfile(history, max, config.baseline), "Tmax", config.maxThreshold); renderProgress("min-progress", cumulativeProfile(history, min, config.baseline), "Tmin", config.minThreshold); renderIndicators(heatIndicators(current, config.maxThreshold, config.minThreshold), config.maxThreshold, config.minThreshold); renderAnnual("max-chart", rows, maxThresholds, maxThresholds.filter((threshold) => threshold % 5 === 0), "max", "Días", maxProjections); renderAnnual("min-chart", rows, minThresholds, minThresholds.filter((threshold) => threshold % 5 === 0), "min", "Noches", minProjections); renderExplanation("max-explanation", MAX_TEXTS, rows, "max", config.maxThreshold, config.baseline); renderExplanation("min-explanation", MIN_TEXTS, rows, "min", config.minThreshold, config.baseline);
  const source = config.source === "nasa" ? "NASA POWER (datos diarios en UTC, rejilla global desde 1981)" : `ERA5 mediante Open-Meteo (zona diaria ${history.timezone}, punto de rejilla)`;
  $("source-eyebrow").textContent = `ANÁLISIS CLIMÁTICO · ${config.source === "nasa" ? "NASA POWER" : "ERA5"}`; $("source-note").textContent = `Fuente: ${source}. Ubicación: ${stationName(state.station)} (${state.station.latitude.toFixed(4)}, ${state.station.longitude.toFixed(4)}). Umbrales ajustados al rango observado: Tmax > ${maxThresholds[0]}–${maxThresholds.at(-1)} °C y Tmin > ${minThresholds[0]}–${minThresholds.at(-1)} °C. Último dato actual: ${max.latest}. No son necesariamente observaciones de una estación física.`;
  state.lastRender = { history, current, config: { ...config, baseline: { ...config.baseline } } };
}

async function analyse() {
  try {
    const config = inputs(); if (!state.station) throw new Error("Selecciona una ubicación."); $("analyse-button").disabled = true; $("analysis").hidden = true; state.lastRender = null;
    setStatus(`Cargando histórico de ${config.source === "nasa" ? "NASA POWER" : "ERA5"}…`); const history = await loadData(config.source, iso(config.requestStart, 1, 1), iso(config.requestEnd, 12, 31));
    setStatus("Cargando datos del año actual…"); const current = await loadData(config.source, iso(CURRENT_YEAR, 1, 1), new Date().toISOString().slice(0, 10));
    renderAll(history, current, config); $("analysis").hidden = false; setStatus(`Análisis listo para ${stationName(state.station)}.`);
    if (usePhoneCharts()) requestAnimationFrame(() => $("analysis").scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }));
  } catch (error) {
    if (error.inputId) {
      document.querySelector(".advanced-config").open = true;
      requestAnimationFrame(() => $(error.inputId)?.focus());
    }
    setStatus(`No se pudo completar el análisis: ${error.message}`, true);
  } finally { $("analyse-button").disabled = !state.station; }
}
function downloadCsv() { if (!state.rows.length) return; const header = ["año", "días_tmax", "días_tmin", ...state.maxThresholds.map((t) => `Tmax > ${t} °C`), ...state.minThresholds.map((t) => `Tmin > ${t} °C`)], rows = state.rows.map((row) => [row.year, row.maxDays, row.minDays, ...state.maxThresholds.map((t) => row.max[t] ?? 0), ...state.minThresholds.map((t) => row.min[t] ?? 0)]), csv = [header, ...rows].map((row) => row.join(",")).join("\n"), link = document.createElement("a"); link.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })); link.download = `calor_${state.source}.csv`; link.click(); URL.revokeObjectURL(link.href); }
async function share() { const config = inputs(), url = new URL(location.href); Object.entries({ name: stationName(state.station), lat: state.station.latitude, lon: state.station.longitude, tz: state.station.timezone || "auto", source: config.source, start: config.start, end: config.end, baseline: $("baseline").value, baselineStart: config.baseline.start, baselineEnd: config.baseline.end, max: $("focus-max").value, min: $("focus-min").value, run: 1 }).forEach(([key, value]) => url.searchParams.set(key, value)); try { await navigator.clipboard.writeText(url); } catch { const box = document.createElement("textarea"); box.value = url; document.body.append(box); box.select(); document.execCommand("copy"); box.remove(); } $("share-button").textContent = "Enlace copiado"; setTimeout(() => $("share-button").textContent = "Copiar enlace", 1600); }

function restoreFocusPreference(id, key, label, params) {
  if (!params.has(key)) return;
  const value = params.get(key);
  if (value === "auto") { $(id).value = "auto"; return; }
  const threshold = Number(value);
  if (!Number.isFinite(threshold)) return;
  $(id).add(new Option(`${label} > ${threshold} °C`, threshold));
  $(id).value = String(threshold);
}
function restoreUrl() {
  const params = new URLSearchParams(location.search);
  const hasCoordinates = params.has("lat") && params.has("lon");
  const lat = hasCoordinates ? Number(params.get("lat")) : NaN;
  const lon = hasCoordinates ? Number(params.get("lon")) : NaN;
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    selectStation({ name: params.get("name") || "Ubicación compartida", latitude: lat, longitude: lon, timezone: params.get("tz") || "auto" });
  }
  [["data-source", "source"], ["start-year", "start"], ["end-year", "end"], ["baseline", "baseline"], ["baseline-start", "baselineStart"], ["baseline-end", "baselineEnd"]].forEach(([id, key]) => { if (params.has(key)) $(id).value = params.get(key); });
  restoreFocusPreference("focus-max", "max", "Tmax", params);
  restoreFocusPreference("focus-min", "min", "Tmin", params);
  $("custom-baseline").hidden = $("baseline").value !== "custom";
  if (params.get("run") === "1" && state.station) setTimeout(analyse, 0);
}

function markAnalysisStale() {
  if ($("analysis").hidden) return;
  $("analysis").hidden = true;
  state.rows = [];
  state.lastRender = null;
  setStatus("La configuración avanzada cambió. Pulsa Analizar para actualizar el resultado.");
}

$("search-button").onclick = searchStations;
$("station-search").oninput = () => { invalidateStation(); queueSearch(); };
$("station-search").onkeydown = (event) => { if (event.key === "Enter") searchStations(); };
$("analyse-button").onclick = analyse;
$("download-button").onclick = downloadCsv;
$("share-button").onclick = share;
$("baseline").onchange = () => { $("custom-baseline").hidden = $("baseline").value !== "custom"; markAnalysisStale(); };
$("data-source").onchange = () => { if ($("data-source").value === "nasa" && Number($("start-year").value) < 1981) $("start-year").value = 1981; markAnalysisStale(); };
["start-year", "end-year", "baseline-start", "baseline-end", "focus-max", "focus-min"].forEach((id) => $(id).addEventListener("change", markAnalysisStale));
restoreUrl(); if (!state.station) queueSearch();

let lastCompactChartLayout = usePhoneCharts();
let chartResizeTimer = null;
window.addEventListener("resize", () => {
  const compact = usePhoneCharts();
  if (compact === lastCompactChartLayout) return;
  lastCompactChartLayout = compact;
  clearTimeout(chartResizeTimer);
  chartResizeTimer = setTimeout(() => {
    if (state.lastRender && !$("analysis").hidden) renderAll(state.lastRender.history, state.lastRender.current, state.lastRender.config);
  }, 150);
});
