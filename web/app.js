/**
 * NetWatch — visualização e filtros de telemetria de sockets.
 * Modo local e modo público demonstrativo compartilham o mesmo renderer.
 */

const AppState = {
  activeDirection: 'ALL',
  activeChip: 'ALL',
  searchQuery: '',
  filterProto: 'ALL',
  filterState: 'ALL',
  sortColumn: 'direction',
  sortAscending: true,
  currentPage: 1,
  pageSize: 25,
  refreshInterval: 2000,
  timerId: null,
  isFetching: false,
  isFrozen: false,
  rawSnapshot: null,
  filteredConnections: [],
  selectedConnection: null,
  sessionToken: null,
  lastError: null
};

// DOM Elements
const DOM = {
  // Bandwidth & Live Header
  bwDownVal: document.getElementById('bw-down-val'),
  bwUpVal: document.getElementById('bw-up-val'),
  interfacesBar: document.getElementById('interfaces-bar'),
  btnRefresh: document.getElementById('btn-refresh'),
  refreshInterval: document.getElementById('refresh-interval'),
  liveIndicator: document.getElementById('live-indicator'),
  liveText: document.getElementById('live-text'),
  btnFreeze: document.getElementById('btn-freeze'),

  // KPI
  kpiTotal: document.getElementById('kpi-total'),
  kpiProtoBreakdown: document.getElementById('kpi-proto-breakdown'),
  kpiOutbound: document.getElementById('kpi-outbound'),
  kpiInbound: document.getElementById('kpi-inbound'),
  kpiListen: document.getElementById('kpi-listen'),
  kpiLocal: document.getElementById('kpi-local'),
  kpiProcesses: document.getElementById('kpi-processes'),

  // Insights & Canvas
  timelineCanvas: document.getElementById('timeline-canvas'),
  chartLatestStatus: document.getElementById('chart-latest-status'),
  topProcessesList: document.getElementById('top-processes-list'),
  topCountriesList: document.getElementById('top-countries-list'),

  // Filter Chips & Tabs
  chipsBar: document.querySelector('.chips-bar'),
  directionTabs: document.getElementById('direction-tabs'),
  tabCountAll: document.getElementById('count-all'),
  tabCountOutbound: document.getElementById('count-outbound'),
  tabCountInbound: document.getElementById('count-inbound'),
  tabCountListen: document.getElementById('count-listen'),
  tabCountLocal: document.getElementById('count-local'),
  searchInput: document.getElementById('search-input'),
  searchClear: document.getElementById('search-clear'),
  filterProto: document.getElementById('filter-proto'),
  filterState: document.getElementById('filter-state'),
  btnExportCsv: document.getElementById('btn-export-csv'),
  btnExportJson: document.getElementById('btn-export-json'),

  // Table & Sorting
  table: document.getElementById('connections-table'),
  tbody: document.getElementById('connections-tbody'),
  emptyState: document.getElementById('empty-state'),
  showingText: document.getElementById('table-showing-text'),
  pageSizeSelect: document.getElementById('page-size-select'),
  btnPagePrev: document.getElementById('btn-page-prev'),
  btnPageNext: document.getElementById('btn-page-next'),
  pageCurrentInfo: document.getElementById('page-current-info'),

  // Drawer / Inspector
  drawerBackdrop: document.getElementById('drawer-backdrop'),
  inspectorDrawer: document.getElementById('inspector-drawer'),
  btnCloseDrawer: document.getElementById('btn-close-drawer'),
  modalDirBadge: document.getElementById('modal-dir-badge'),
  modalTitle: document.getElementById('modal-title'),
  modalProcName: document.getElementById('modal-proc-name'),
  modalProcPid: document.getElementById('modal-proc-pid'),
  modalProcUser: document.getElementById('modal-proc-user'),
  modalProcCat: document.getElementById('modal-proc-cat'),
  modalProcCmd: document.getElementById('modal-proc-cmd'),
  modalProcExe: document.getElementById('modal-proc-exe'),
  exeWrap: document.getElementById('exe-wrap'),
  modalProto: document.getElementById('modal-proto'),
  modalState: document.getElementById('modal-state'),
  modalLocalAddr: document.getElementById('modal-local-addr'),
  modalLocalPort: document.getElementById('modal-local-port'),
  modalPeerAddr: document.getElementById('modal-peer-addr'),
  modalPeerPort: document.getElementById('modal-peer-port'),
  modalHostname: document.getElementById('modal-hostname'),
  modalIface: document.getElementById('modal-iface'),
  modalRecvq: document.getElementById('modal-recvq'),
  modalSendq: document.getElementById('modal-sendq'),
  modalGeoCountry: document.getElementById('modal-geo-country'),
  modalGeoCity: document.getElementById('modal-geo-city'),
  modalGeoOrg: document.getElementById('modal-geo-org'),
  modalGeoIsp: document.getElementById('modal-geo-isp'),
  modalDirExplainer: document.getElementById('modal-dir-explainer'),
  btnCopyInfo: document.getElementById('btn-copy-info'),
  btnKillProc: document.getElementById('btn-kill-proc'),
  btnKillPidText: document.getElementById('btn-kill-pid'),

  // Kill Modal
  killModalBackdrop: document.getElementById('kill-modal-backdrop'),
  killModalName: document.getElementById('kill-modal-name'),
  killModalPid: document.getElementById('kill-modal-pid'),
  chkForceKill: document.getElementById('chk-force-kill'),
  btnKillConfirm: document.getElementById('btn-kill-confirm'),
  btnKillCancel: document.getElementById('btn-kill-cancel'),
  btnKillCancelX: document.getElementById('btn-kill-cancel-x'),

  // Toast
  toastContainer: document.getElementById('toast-container')
};

// Text-only category labels (no emoji icons as per taste-skill)
const CATEGORY_TAGS = {
  "Navegador Web": "Web",
  "Dev & IA": "Dev",
  "Rede & VPN": "VPN",
  "Contêineres": "Docker",
  "Comunicação": "Chat",
  "Jogos & Mídia": "Midia",
  "Sistema Operacional": "Sistema",
  "Pilha de Rede do Kernel": "Kernel",
  "Nuvem & Backup": "Nuvem",
  "Geral": "App"
};

// Format byte queue numbers
function formatBytes(bytes) {
  const n = parseInt(bytes, 10);
  if (isNaN(n) || n === 0) return '0 B';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// Format Bandwidth Rate
function formatRate(bps) {
  const rate = parseFloat(bps) || 0;
  if (rate < 1024) return `${rate.toFixed(0)} B/s`;
  if (rate < 1024 * 1024) return `${(rate / 1024).toFixed(1)} KB/s`;
  return `${(rate / (1024 * 1024)).toFixed(2)} MB/s`;
}

// Do not rebuild unchanged visual fragments on every polling cycle.
const renderedMarkup = new WeakMap();
function setMarkupIfChanged(element, markup) {
  if (renderedMarkup.get(element) === markup) return false;
  element.innerHTML = markup;
  renderedMarkup.set(element, markup);
  return true;
}

function setTextIfChanged(element, value) {
  const next = String(value);
  if (element.textContent !== next) element.textContent = next;
}


function setCollectionStatus(mode, detail = '') {
  const paused = AppState.isFrozen;
  DOM.liveIndicator.classList.toggle('is-unavailable', mode === 'error' || mode === 'partial');
  DOM.liveIndicator.title = detail;
  if (!paused) {
    DOM.liveText.textContent = mode === 'error' ? 'Indisponível' :
      mode === 'partial' ? 'Coleta parcial' :
      mode === 'loading' ? 'Coletando' : 'Ao vivo';
  }
}

function optionalField(element, value) {
  const row = element.closest('.detail-item');
  if (row) row.hidden = value === null || value === undefined || value === '' || value === '*';
  if (row && !row.hidden) element.textContent = String(value);
}

function prettyEndpoint(ep, proto = '', remote = false) {
  if (!ep) return '';
  if (remote && ['*', '0.0.0.0', '::'].includes(ep.ip)) return '';
  if (proto === 'raw') {
    return ep.port && ep.port !== '*' ? 'Protocolo raw ' + ep.port : '';
  }
  const addr = ep.ip || '';
  if (!addr || addr === '*') return ep.inode ? 'socket#' + ep.inode : '';
  const hasPort = ep.port && ep.port !== '*' && ep.port !== '';
  const address = hasPort && addr.includes(':') && !addr.startsWith('[')
    ? '[' + addr + ']' : addr;
  return hasPort ? address + ':' + ep.port : address;
}

function matchesChip(c, chip) {
  const local = Number(c.local?.port_int || 0);
  const peer = Number(c.peer?.port_int || 0);
  if (chip === 'ALL') return true;
  if (chip === 'web') return [80, 443, 8080, 8443].includes(local) || [80, 443, 8080, 8443].includes(peer);
  if (chip === 'ssh') return local === 22 || peer === 22;
  if (chip === 'dns') return local === 53 || peer === 53;
  if (chip === 'dev') return [3000, 5000, 5173, 8000, 8080, 9000, 9876].includes(local) ||
    [3000, 5000, 5173, 8000, 8080, 9000, 9876].includes(peer);
  if (chip === 'vpn') return c.app_category === 'Rede & VPN' ||
    /^(tailscale|wg|zt|tun|tap)/i.test(c.local?.iface || '');
  if (chip === 'public') return c.peer_is_public === true;
  return false;
}

function refreshAvailableFilters(conns) {
  const protocols = [...new Set(conns.map(c => c.proto).filter(Boolean))].sort();
  const states = [...new Set(conns.map(c => c.state).filter(Boolean))].sort();
  const oldProto = AppState.filterProto, oldState = AppState.filterState;
  const protoMarkup = '<option value="ALL">Protocolo: Todos</option>' +
    protocols.map(p => '<option value="' + escapeHtml(p) + '">' + escapeHtml(p.toUpperCase()) + '</option>').join('');
  const stateMarkup = '<option value="ALL">Estado: Todos</option>' +
    states.map(p => '<option value="' + escapeHtml(p) + '">' + escapeHtml(p) + '</option>').join('');
  setMarkupIfChanged(DOM.filterProto, protoMarkup);
  setMarkupIfChanged(DOM.filterState, stateMarkup);
  AppState.filterProto = protocols.includes(oldProto) ? oldProto : 'ALL';
  AppState.filterState = states.includes(oldState) ? oldState : 'ALL';
  DOM.filterProto.value = AppState.filterProto;
  DOM.filterState.value = AppState.filterState;

  const counts = {};
  for (const c of conns) counts[c.direction] = (counts[c.direction] || 0) + 1;
  for (const tab of DOM.directionTabs.querySelectorAll('.tab-btn')) {
    const dir = tab.dataset.dir;
    tab.hidden = dir !== 'ALL' && !counts[dir];
  }
  if (AppState.activeDirection !== 'ALL' && !counts[AppState.activeDirection]) {
    AppState.activeDirection = 'ALL';
    AppState.currentPage = 1;
  }
  for (const tab of DOM.directionTabs.querySelectorAll('.tab-btn')) {
    tab.classList.toggle('active', tab.dataset.dir === AppState.activeDirection);
  }

  for (const chip of DOM.chipsBar.querySelectorAll('.filter-chip')) {
    const group = chip.dataset.chip;
    chip.hidden = group !== 'ALL' && !conns.some(c => matchesChip(c, group));
    if (chip.hidden && AppState.activeChip === group) {
      AppState.activeChip = 'ALL';
      AppState.currentPage = 1;
    }
  }
  for (const chip of DOM.chipsBar.querySelectorAll('.filter-chip')) {
    chip.classList.toggle('active', chip.dataset.chip === AppState.activeChip);
  }
}

// Show Toast
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  DOM.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

// Fetch telemetry from server
async function fetchTelemetry() {
  if (AppState.isFetching || AppState.isFrozen) return;
  AppState.isFetching = true;
  try {
    let data;
    if (window.NetWatchPages) {
      data = await window.NetWatchPages.getSnapshot();
    } else {
      const res = await fetch('/api/connections', { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      data = await res.json();
    }
    if (!data || !Array.isArray(data.connections) || !data.summary ||
        data.status === 'error') throw new Error('Resposta de telemetria inválida');
    AppState.rawSnapshot = data;
    AppState.lastError = null;
    renderSnapshot(data);
    const failures = Object.entries(data.errors || {});
    setCollectionStatus(data.status,
      failures.map(([source, reason]) => source + ': ' + reason).join('; '));
    window.NetWatchPages?.decorateStatus(data.status);
  } catch (err) {
    console.error('Falha ao obter telemetria:', err);
    AppState.lastError = err.message;
    setCollectionStatus('error', 'Falha na coleta: ' + err.message);
    // Stale snapshots are not evidence that the current host still has these sockets.
    document.querySelector('.app-container').hidden = true;
  } finally {
    AppState.isFetching = false;
  }
}

function renderSnapshot(data) {
  const { summary, connections, top_processes, top_countries, interfaces, bandwidth, history } = data;
  document.querySelector('.app-container').hidden = false;
  const sources = data.sources || {};
  const inetAvailable = sources.inet?.status !== 'error';
  for (const element of [DOM.kpiOutbound, DOM.kpiInbound, DOM.kpiListen]) {
    const cell = element.closest('.kpi-cell');
    if (cell) cell.hidden = !inetAvailable;
  }
  setTextIfChanged(DOM.kpiTotal, summary.total);
  const familyCounts = ['tcp', 'udp', 'unix', 'raw']
    .filter(key => Number(summary[key]) > 0)
    .map(key => key.toUpperCase() + ': ' + summary[key]);
  setTextIfChanged(DOM.kpiProtoBreakdown, familyCounts.join(' · ') || 'Nenhum socket');
  setTextIfChanged(DOM.kpiOutbound, summary.outbound);
  setTextIfChanged(DOM.kpiInbound, summary.inbound);
  setTextIfChanged(DOM.kpiListen, summary.listen);
  setTextIfChanged(DOM.kpiLocal, summary.local);
  setTextIfChanged(DOM.kpiProcesses, summary.unique_processes);

  const meterReady = bandwidth?.available && Number.isFinite(bandwidth.total_rx_bps)
    && Number.isFinite(bandwidth.total_tx_bps);
  for (const element of [DOM.bwDownVal, DOM.bwUpVal]) {
    const meter = element.closest('.bandwidth-meter');
    if (meter) meter.hidden = !meterReady;
    if (meter) meter.title = bandwidth?.rate_scope === 'virtual_fallback' ?
      'Medição em interfaces virtuais: o total pode incluir tráfego encapsulado' :
      'Taxa medida em interfaces físicas';
  }
  if (meterReady) {
    setTextIfChanged(DOM.bwDownVal, formatRate(bandwidth.total_rx_bps));
    setTextIfChanged(DOM.bwUpVal, formatRate(bandwidth.total_tx_bps));
  }

  setTextIfChanged(DOM.tabCountAll, summary.total);
  setTextIfChanged(DOM.tabCountOutbound, summary.outbound);
  setTextIfChanged(DOM.tabCountInbound, summary.inbound);
  setTextIfChanged(DOM.tabCountListen, summary.listen);
  setTextIfChanged(DOM.tabCountLocal, summary.local);
  setTextIfChanged(document.getElementById('count-bound'), summary.bound);
  setTextIfChanged(document.getElementById('count-raw'), summary.raw);
  setTextIfChanged(document.getElementById('count-unknown'), summary.unknown);
  DOM.table.classList.toggle('no-geo', !connections.some(c => c.geo?.status === 'success'));
  renderHeaderInterfaces(interfaces);
  renderTopProcesses(top_processes);
  renderTopCountries(top_countries);
  renderTimelineChart(history);
  refreshAvailableFilters(connections);
  applyFiltersAndRenderTable();
}


// Header interfaces exist only for active, addressed interfaces.
function renderHeaderInterfaces(ifaces) {
  const active = Array.isArray(ifaces) ? ifaces.filter(i =>
    i.is_up && Array.isArray(i.addresses) && i.addresses.length && i.name !== 'lo') : [];
  DOM.interfacesBar.hidden = active.length === 0;
  setMarkupIfChanged(DOM.interfacesBar, active.map(i => {
    const address = i.addresses.find(a => a.family === 'inet') || i.addresses[0];
    return '<div class="iface-pill" title="Interface ' + escapeHtml(i.name) + '">' +
      '<span class="iface-name">' + escapeHtml(i.name) + '</span>' +
      '<span>' + escapeHtml(address.ip) + '</span></div>';
  }).join(''));
}


// Draw Canvas Timeline
function renderTimelineChart(history) {
  const panel = DOM.timelineCanvas?.closest('.panel-box');
  if (panel) panel.hidden = !Array.isArray(history) || history.length < 2;
  if (!DOM.timelineCanvas || !Array.isArray(history) || history.length < 2) return;

  const canvas = DOM.timelineCanvas;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  const pixelWidth = Math.max(1, Math.round(rect.width * dpr));
  const pixelHeight = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
  if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = rect.width;
  const h = rect.height;

  // Clear
  ctx.clearRect(0, 0, w, h);

  const n = history.length;
  if (n < 2) return;

  let maxConns = Math.max(...history.map(s => s.total_conns || 0), 10);
  let maxBw = Math.max(...history.map(s => Math.max(s.rx_kbps || 0, s.tx_kbps || 0)), 50);

  // Grid
  ctx.strokeStyle = '#222224';
  ctx.lineWidth = 1;
  for (let y = 0.25; y <= 0.75; y += 0.25) {
    ctx.beginPath();
    ctx.moveTo(0, h * y);
    ctx.lineTo(w, h * y);
    ctx.stroke();
  }

  // Draw line helper
  function drawLine(points, color) {
    ctx.beginPath();
    points.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Conns Line (Accent Blue: #4a8ad6)
  const connsPts = history.map((s, idx) => ({
    x: (idx / (n - 1)) * w,
    y: h - ((s.total_conns || 0) / maxConns) * (h - 12) - 6
  }));
  drawLine(connsPts, '#4a8ad6');

  // Download Line (Positive Green: #44a282)
  const rxPts = history.map((s, idx) => ({
    x: (idx / (n - 1)) * w,
    y: h - ((s.rx_kbps || 0) / maxBw) * (h - 12) - 6
  }));
  drawLine(rxPts, '#44a282');

  // Upload Line (Negative Red: #e5566f)
  const txPts = history.map((s, idx) => ({
    x: (idx / (n - 1)) * w,
    y: h - ((s.tx_kbps || 0) / maxBw) * (h - 12) - 6
  }));
  drawLine(txPts, '#e5566f');

  const latest = history[n - 1];
  if (latest && DOM.chartLatestStatus) {
    DOM.chartLatestStatus.textContent = `IP ${latest.total_conns} · RX ${latest.rx_kbps}K · TX ${latest.tx_kbps}K`;
  }
}

// Redraw chart on container resize
if (typeof ResizeObserver !== 'undefined') {
  const chartObserver = new ResizeObserver(() => {
    if (AppState.rawSnapshot && AppState.rawSnapshot.history) {
      renderTimelineChart(AppState.rawSnapshot.history);
    }
  });
  const canvasWrap = document.querySelector('.canvas-wrap');
  if (canvasWrap) chartObserver.observe(canvasWrap);
}

// Optional insights do not render when their source is empty.
function renderTopProcesses(topProcs) {
  const data = Array.isArray(topProcs) ? topProcs.filter(p => p && p.name && p.count > 0) : [];
  DOM.topProcessesList.closest('.panel-box').hidden = data.length === 0;
  if (!data.length) {
    setMarkupIfChanged(DOM.topProcessesList, '');
    return;
  }
  const max = data[0].count || 1;
  setMarkupIfChanged(DOM.topProcessesList, data.slice(0, 5).map(p => {
    const pct = Math.round(p.count / max * 100);
    return '<div class="insight-bar-item"><div class="bar-row-info">' +
      '<span class="bar-name">' + escapeHtml(p.name) + '</span>' +
      '<span class="bar-count">' + p.count + '</span></div>' +
      '<div class="bar-track"><div class="bar-fill" style="width:' + pct +
      '%"></div></div></div>';
  }).join(''));
}

function renderTopCountries(topCountries) {
  const data = Array.isArray(topCountries) ?
    topCountries.filter(p => p && p.country && p.count > 0) : [];
  DOM.topCountriesList.closest('.panel-box').hidden = data.length === 0;
  if (!data.length) {
    setMarkupIfChanged(DOM.topCountriesList, '');
    return;
  }
  const max = data[0].count || 1;
  setMarkupIfChanged(DOM.topCountriesList, data.slice(0, 5).map(p => {
    const pct = Math.round(p.count / max * 100);
    return '<div class="insight-bar-item"><div class="bar-row-info">' +
      '<span class="bar-name">' + escapeHtml(p.country) + '</span>' +
      '<span class="bar-count">' + p.count + '</span></div>' +
      '<div class="bar-track"><div class="bar-fill bar-fill-alt" style="width:' + pct +
      '%"></div></div></div>';
  }).join(''));
}


// Sorting logic
function sortConnections(list) {
  const col = AppState.sortColumn;
  const asc = AppState.sortAscending ? 1 : -1;

  return list.sort((a, b) => {
    let valA, valB;
    switch (col) {
      case 'direction':
        valA = a.direction; valB = b.direction;
        break;
      case 'process_name':
        valA = a.process_name.toLowerCase(); valB = b.process_name.toLowerCase();
        break;
      case 'proto':
        valA = `${a.proto} ${a.state}`; valB = `${b.proto} ${b.state}`;
        break;
      case 'local_port':
        valA = a.local.port_int; valB = b.local.port_int;
        break;
      case 'peer_ip':
        valA = a.peer.ip; valB = b.peer.ip;
        break;
      case 'country':
        valA = (a.geo && a.geo.country) || ''; valB = (b.geo && b.geo.country) || '';
        break;
      case 'queue':
        valA = parseInt(a.recv_q, 10) + parseInt(a.send_q, 10);
        valB = parseInt(b.recv_q, 10) + parseInt(b.send_q, 10);
        break;
      default:
        valA = a.direction; valB = b.direction;
    }
    if (valA < valB) return -1 * asc;
    if (valA > valB) return 1 * asc;
    return 0;
  });
}

// Apply Filters, Sort and Render Table with Pagination
function applyFiltersAndRenderTable() {
  if (!AppState.rawSnapshot || !Array.isArray(AppState.rawSnapshot.connections)) return;

  const q = AppState.searchQuery.toLowerCase().trim();
  const dir = AppState.activeDirection;
  const chip = AppState.activeChip;
  const proto = AppState.filterProto;
  const state = AppState.filterState;

  let filtered = AppState.rawSnapshot.connections.filter(c => {
    if (dir !== 'ALL' && c.direction !== dir) return false;

    if (!matchesChip(c, chip)) return false;

    if (proto !== 'ALL' && c.proto !== proto) return false;

    if (state !== 'ALL') {
      if (c.state !== state) return false;
    }

    if (q) {
      const matchProc = (c.process_name || '').toLowerCase().includes(q);
      const matchPid = c.pid ? c.pid.toString().includes(q) : false;
      const matchLocalIp = (c.local.ip || '').toLowerCase().includes(q);
      const matchLocalPort = (c.local.port || '').toString().includes(q);
      const matchPeerIp = (c.peer.ip || '').toLowerCase().includes(q);
      const matchPeerPort = (c.peer.port || '').toString().includes(q);
      const matchHost = (c.hostname || '').toLowerCase().includes(q);
      const matchUser = (c.user || '').toLowerCase().includes(q);
      const matchCountry = (c.geo && c.geo.country) ? c.geo.country.toLowerCase().includes(q) : false;
      const matchIsp = (c.geo && c.geo.isp) ? c.geo.isp.toLowerCase().includes(q) : false;
      const matchOrg = (c.geo && c.geo.org) ? c.geo.org.toLowerCase().includes(q) : false;

      if (!matchProc && !matchPid && !matchLocalIp && !matchLocalPort && 
          !matchPeerIp && !matchPeerPort && !matchHost && !matchUser && 
          !matchCountry && !matchIsp && !matchOrg) {
        return false;
      }
    }

    return true;
  });

  filtered = sortConnections(filtered);
  AppState.filteredConnections = filtered;

  const totalFiltered = filtered.length;
  DOM.showingText.textContent = `Exibindo ${totalFiltered} de ${AppState.rawSnapshot.connections.length} sockets`;

  if (totalFiltered === 0) {
    setMarkupIfChanged(DOM.tbody, '');
    DOM.emptyState.classList.remove('hidden');
    DOM.pageCurrentInfo.textContent = 'Pág. 0 de 0';
    DOM.btnPagePrev.disabled = true;
    DOM.btnPageNext.disabled = true;
    return;
  }

  DOM.emptyState.classList.add('hidden');

  let pageSize = AppState.pageSize;
  let totalPages = pageSize > 0 ? Math.ceil(totalFiltered / pageSize) : 1;
  if (AppState.currentPage > totalPages) AppState.currentPage = totalPages;
  if (AppState.currentPage < 1) AppState.currentPage = 1;

  let pageItems = filtered;
  if (pageSize > 0) {
    const startIdx = (AppState.currentPage - 1) * pageSize;
    pageItems = filtered.slice(startIdx, startIdx + pageSize);
  }

  DOM.pageCurrentInfo.textContent = `Pág. ${AppState.currentPage} de ${totalPages}`;
  DOM.btnPagePrev.disabled = AppState.currentPage <= 1;
  DOM.btnPageNext.disabled = AppState.currentPage >= totalPages;

  // Render Table Rows (Taste Skill compliant: no emojis, sentence-case, clean pills)
  setMarkupIfChanged(DOM.tbody, pageItems.map((c, pageIdx) => {
    const realIdx = pageSize > 0 ? (AppState.currentPage - 1) * pageSize + pageIdx : pageIdx;

    let pillClass = 'pill-info';
    let dirLabel = 'Saída';

    if (c.direction === 'INBOUND') {
      pillClass = 'pill-pos';
      dirLabel = 'Entrada';
    } else if (c.direction === 'LISTEN') {
      pillClass = 'pill-warn';
      dirLabel = 'Escuta TCP';
    } else if (c.direction === 'BOUND') {
      pillClass = 'pill-neutral';
      dirLabel = 'UDP vinculado';
    } else if (c.direction === 'RAW') {
      pillClass = 'pill-neutral';
      dirLabel = 'Raw';
    } else if (c.direction === 'UNKNOWN') {
      pillClass = 'pill-neutral';
      dirLabel = 'Não definida';
    } else if (c.direction === 'LOCAL') {
      pillClass = 'pill-neutral';
      dirLabel = 'Local';
    }

    const peerDisplay = prettyEndpoint(c.peer, c.proto, true);
    const localDisplay = prettyEndpoint(c.local, c.proto);
    const hostDisplay = c.hostname ? `<div class="ep-host">${escapeHtml(c.hostname)}</div>` : '';
    const localSvc = c.local.service ? `<span class="ep-service">${escapeHtml(c.local.service)}</span>` : '';
    const peerSvc = c.peer.service ? `<span class="ep-service">${escapeHtml(c.peer.service)}</span>` : '';

    const catTag = CATEGORY_TAGS[c.app_category] || 'App';
    const countryText = (c.geo && c.geo.country) ? c.geo.country : '';
    const orgText = (c.geo && (c.geo.org || c.geo.isp)) ? (c.geo.org || c.geo.isp) : '';

    return `
      <tr data-inspect-index="${realIdx}">
        <td class="col-dir">
          <span class="pill ${pillClass}">${dirLabel}</span>
        </td>
        <td class="col-proc">
          <div class="proc-cell">
            <span class="proc-name-text">${escapeHtml(c.process_name)}</span>
            <span class="proc-sub-line">${c.pid ? 'PID ' + c.pid : 'Sem PID'}${c.user ? ' · ' + escapeHtml(c.user) : ''}${catTag !== 'App' ? ' · ' + catTag : ''}</span>
          </div>
        </td>
        <td class="col-proto">
          <div>${escapeHtml(c.proto.toUpperCase() + (c.socket_type ? ' (' + c.socket_type + ')' : ''))}</div>
          <div style="font-size: 12px; color:var(--muted);">${escapeHtml(c.state)}</div>
        </td>
        <td class="col-local">
          <div class="endpoint-cell">
            <span class="ep-ip-port">${escapeHtml(localDisplay)}</span>
            ${localSvc}
          </div>
        </td>
        <td class="col-peer">
          <div class="endpoint-cell">
            <span class="ep-ip-port">${escapeHtml(peerDisplay)}</span>
            ${peerSvc}
            ${hostDisplay}
          </div>
        </td>
        <td class="col-geo">
          <div class="geo-cell">
            <span class="geo-country-line">${escapeHtml(countryText)}</span>
            <span class="geo-org-text">${escapeHtml(orgText)}</span>
          </div>
        </td>
        <td class="col-queue queue-cell">
          <div>R: ${formatBytes(c.recv_q)}</div>
          <div>S: ${formatBytes(c.send_q)}</div>
        </td>
        <td class="col-actions">
          <button class="btn-inspect" data-inspect-index="${realIdx}" type="button" aria-label="Inspecionar socket">Ver</button>
        </td>
      </tr>
    `;
  }).join(''));
}

// Inspector displays only fields actually present in the current socket snapshot.
window.openInspector = function(index) {
  const c = AppState.filteredConnections[index];
  if (!c) return;
  AppState.selectedConnection = c;
  DOM.modalTitle.textContent = c.process_name + (c.pid ? ' (PID ' + c.pid + ')' : '');
  DOM.modalDirBadge.textContent = c.direction;
  DOM.modalDirBadge.className = 'pill ' +
    (c.direction === 'INBOUND' ? 'pill-pos' :
     c.direction === 'LISTEN' ? 'pill-warn' : 'pill-neutral');
  DOM.modalProcName.textContent = c.process_name;
  optionalField(DOM.modalProcPid, c.pid);
  optionalField(DOM.modalProcUser, c.user);
  optionalField(DOM.modalProcCat, c.app_category === 'Desconhecido' ? null : c.app_category);
  DOM.modalProcCmd.closest('.cmdline-field').hidden = !c.cmdline;
  if (c.cmdline) DOM.modalProcCmd.textContent = c.cmdline;
  DOM.exeWrap.hidden = !c.exe;
  if (c.exe) DOM.modalProcExe.textContent = c.exe;

  DOM.modalProto.textContent = c.proto.toUpperCase() +
    (c.socket_type ? ' (' + c.socket_type + ')' : '');
  DOM.modalState.textContent = c.state;
  optionalField(DOM.modalLocalAddr, prettyEndpoint(c.local, c.proto));
  optionalField(DOM.modalLocalPort, c.local.port && !['unix', 'raw'].includes(c.proto) ?
    c.local.port + (c.local.service ? ' (' + c.local.service + ')' : '') : null);
  optionalField(DOM.modalPeerAddr, prettyEndpoint(c.peer, c.proto, true));
  optionalField(DOM.modalPeerPort, c.peer.port && !['unix', 'raw'].includes(c.proto) ?
    c.peer.port + (c.peer.service ? ' (' + c.peer.service + ')' : '') : null);
  optionalField(DOM.modalHostname, c.hostname);
  optionalField(DOM.modalIface, c.local.iface);
  DOM.modalRecvq.textContent = formatBytes(c.recv_q);
  DOM.modalSendq.textContent = formatBytes(c.send_q);

  const geo = c.geo?.status === 'success' ? c.geo : null;
  const geoFields = [geo?.country, geo?.city, geo?.org || geo?.as, geo?.isp];
  document.getElementById('geo-card').hidden = !geoFields.some(Boolean);
  for (const [item, value] of [
    [DOM.modalGeoCountry, geoFields[0]], [DOM.modalGeoCity, geoFields[1]],
    [DOM.modalGeoOrg, geoFields[2]], [DOM.modalGeoIsp, geoFields[3]]]) {
    optionalField(item, value);
  }

  const explanations = {
    OUTBOUND: 'Conexão de saída (direção estimada pela porta e estado).',
    INBOUND: 'Conexão de entrada (direção inferida por uma porta TCP em escuta).',
    LISTEN: 'Socket TCP em escuta para aceitar novas conexões.',
    BOUND: 'Socket UDP vinculado a um endereço, sem cliente remoto confirmado.',
    RAW: 'Socket de protocolo raw; o número associado não é necessariamente uma porta TCP/UDP.',
    LOCAL: c.proto === 'unix' ? 'Socket Unix local para comunicação entre processos.' :
      'Comunicação por endereço de loopback entre processos locais.',
    UNKNOWN: 'A direção original desta conexão não pode ser determinada com segurança.'
  };
  DOM.modalDirExplainer.textContent = explanations[c.direction] || 'Direção não identificada.';
  const canKill = !window.NetWatchPages && c.identity_verified === true && Number.isInteger(c.pid) &&
    c.pid > 1 && Number.isInteger(c.start_ticks) && c.start_ticks > 0;
  DOM.btnKillProc.hidden = !canKill;
  if (canKill) DOM.btnKillPidText.textContent = c.pid;
  DOM.drawerBackdrop.classList.add('active');
};


function closeInspector() {
  DOM.drawerBackdrop.classList.remove('active');
  AppState.selectedConnection = null;
}

function openKillModal() {
  if (window.NetWatchPages) return; // The GitHub Pages frontend is read-only.
  if (!AppState.selectedConnection?.identity_verified || !AppState.selectedConnection.start_ticks) return;
  DOM.killModalName.textContent = AppState.selectedConnection.process_name;
  DOM.killModalPid.textContent = AppState.selectedConnection.pid;
  DOM.chkForceKill.checked = false;
  DOM.killModalBackdrop.classList.add('active');
}

function closeKillModal() {
  DOM.killModalBackdrop.classList.remove('active');
}

async function confirmKillProcess() {
  if (window.NetWatchPages) return;
  const c = AppState.selectedConnection;
  if (!c || !c.identity_verified || !Number.isInteger(c.start_ticks)) return;
  const force = DOM.chkForceKill.checked;
  DOM.btnKillConfirm.disabled = true;
  try {
    if (!AppState.sessionToken) {
      const session = await fetch('/api/session', {cache: 'no-store'});
      if (!session.ok) throw new Error('Falha ao autorizar a ação');
      AppState.sessionToken = (await session.json()).csrf_token;
    }
    const res = await fetch('/api/kill', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'X-NetWatch-Token': AppState.sessionToken},
      body: JSON.stringify({pid: c.pid, force, start_ticks: c.start_ticks})
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      if (res.status === 403) AppState.sessionToken = null;
      throw new Error(result.error || 'Operação recusada');
    }
    showToast('Sinal enviado ao processo ' + c.pid + '.');
    closeKillModal();
    closeInspector();
    setTimeout(fetchTelemetry, 600);
  } catch (err) {
    showToast('Erro: ' + err.message, 'error');
  } finally {
    DOM.btnKillConfirm.disabled = false;
  }
}


function copyConnectionInfo() {
  const c = AppState.selectedConnection;
  if (!c) return;

  const text = `
Processo: ${c.process_name}${c.pid ? ' (PID: ' + c.pid + ')' : ''}
Direção: ${c.direction}
Protocolo: ${c.proto.toUpperCase()} | Estado: ${c.state}
Local: ${prettyEndpoint(c.local, c.proto)}
Remoto: ${prettyEndpoint(c.peer, c.proto, true)}
Host: ${c.hostname || '-'}
País: ${c.geo?.status === 'success' ? c.geo.country : ''}
  `.trim();

  navigator.clipboard.writeText(text).then(() => {
    showToast('Detalhes copiados.');
  }).catch(() => {
    showToast('Erro ao copiar.', 'error');
  });
}

function safeCsvCell(value) {
  const raw = String(value ?? '');
  // Avoid treating untrusted process names as spreadsheet formulas.
  const sanitized = /^[\s\u0000-\u001f]*[=+\-@]/.test(raw) ? "'" + raw : raw;
  return '"' + sanitized.replace(/"/g, '""') + '"';
}

function exportToCsv() {
  const list = AppState.filteredConnections;
  if (!list || list.length === 0) return;

  const headers = ['Direcao', 'Processo', 'PID', 'Proto', 'Estado', 'IP_Local', 'Porta_Local', 'IP_Remoto', 'Porta_Remota'];
  const rows = list.map(c => [
    c.direction, c.process_name || '', c.pid || '', c.proto.toUpperCase(),
    c.state, c.local.ip, c.local.port, c.peer.ip, c.peer.port
  ].map(safeCsvCell));

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `netwatch_conexoes.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exportado.');
}

function exportToJson() {
  if (!AppState.rawSnapshot) return;
  const jsonContent = JSON.stringify(AppState.filteredConnections, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `netwatch_conexoes.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('JSON exportado.');
}

function toggleFreeze() {
  AppState.isFrozen = !AppState.isFrozen;
  DOM.btnFreeze.classList.toggle('frozen', AppState.isFrozen);
  DOM.liveIndicator.classList.toggle('is-paused', AppState.isFrozen);

  if (AppState.isFrozen) {
    DOM.btnFreeze.querySelector('.toggle-text').textContent = 'Retomar';
    DOM.btnFreeze.title = 'Retomar visualização ao vivo';
    DOM.liveText.textContent = 'Pausado';
    showToast('Visualização pausada.');
  } else {
    DOM.btnFreeze.querySelector('.toggle-text').textContent = 'Congelar';
    DOM.btnFreeze.title = 'Congelar visualização para análise';
    DOM.liveText.textContent = 'Ao vivo';
    fetchTelemetry();
    showToast('Modo ao vivo retomado.');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function setupEventListeners() {
  DOM.tbody.addEventListener('click', event => {
    const row = event.target.closest('tr[data-inspect-index]');
    if (!row) return;
    const index = Number(row.dataset.inspectIndex);
    if (Number.isSafeInteger(index) && index >= 0 &&
        index < AppState.filteredConnections.length) {
      window.openInspector(index);
    }
  });
  DOM.btnRefresh.addEventListener('click', fetchTelemetry);
  DOM.btnFreeze.addEventListener('click', toggleFreeze);

  DOM.refreshInterval.addEventListener('change', (e) => {
    AppState.refreshInterval = parseInt(e.target.value, 10);
    if (AppState.timerId) clearInterval(AppState.timerId);
    if (AppState.refreshInterval > 0) {
      AppState.timerId = setInterval(fetchTelemetry, AppState.refreshInterval);
    }
  });

  document.querySelectorAll('.kpi-cell').forEach(cell => {
    cell.setAttribute('role', 'button');
    cell.tabIndex = 0;
    cell.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        cell.click();
      }
    });
    cell.addEventListener('click', () => {
      const filter = cell.dataset.filter;
      if (filter === 'all') setDirectionTab('ALL');
      else if (filter === 'procs') DOM.searchInput.focus();
      else if (filter) setDirectionTab(filter);
    });
  });

  DOM.directionTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    setDirectionTab(btn.dataset.dir);
  });

  function setDirectionTab(dir) {
    AppState.activeDirection = dir;
    AppState.currentPage = 1;
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.dir === dir);
    });
    applyFiltersAndRenderTable();
  }

  DOM.chipsBar.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    AppState.activeChip = chip.dataset.chip;
    AppState.currentPage = 1;
    document.querySelectorAll('.filter-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.chip === AppState.activeChip);
    });
    applyFiltersAndRenderTable();
  });

  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (AppState.sortColumn === col) {
        AppState.sortAscending = !AppState.sortAscending;
      } else {
        AppState.sortColumn = col;
        AppState.sortAscending = true;
      }

      document.querySelectorAll('th.sortable').forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
        const ind = header.querySelector('.sort-indicator');
        if (ind) ind.textContent = '↕';
      });

      th.classList.add(AppState.sortAscending ? 'sort-asc' : 'sort-desc');
      const currentInd = th.querySelector('.sort-indicator');
      if (currentInd) currentInd.textContent = AppState.sortAscending ? '↑' : '↓';

      applyFiltersAndRenderTable();
    });
  });

  DOM.searchInput.addEventListener('input', (e) => {
    AppState.searchQuery = e.target.value;
    AppState.currentPage = 1;
    DOM.searchClear.classList.toggle('hidden', !AppState.searchQuery);
    applyFiltersAndRenderTable();
  });

  DOM.searchClear.addEventListener('click', () => {
    DOM.searchInput.value = '';
    AppState.searchQuery = '';
    AppState.currentPage = 1;
    DOM.searchClear.classList.add('hidden');
    applyFiltersAndRenderTable();
  });

  DOM.filterProto.addEventListener('change', (e) => {
    AppState.filterProto = e.target.value;
    AppState.currentPage = 1;
    applyFiltersAndRenderTable();
  });

  DOM.filterState.addEventListener('change', (e) => {
    AppState.filterState = e.target.value;
    AppState.currentPage = 1;
    applyFiltersAndRenderTable();
  });

  DOM.btnPagePrev.addEventListener('click', () => {
    if (AppState.currentPage > 1) {
      AppState.currentPage--;
      applyFiltersAndRenderTable();
    }
  });

  DOM.btnPageNext.addEventListener('click', () => {
    AppState.currentPage++;
    applyFiltersAndRenderTable();
  });

  DOM.pageSizeSelect.addEventListener('change', (e) => {
    AppState.pageSize = parseInt(e.target.value, 10);
    AppState.currentPage = 1;
    applyFiltersAndRenderTable();
  });

  DOM.btnExportCsv.addEventListener('click', exportToCsv);
  DOM.btnExportJson.addEventListener('click', exportToJson);

  DOM.btnCloseDrawer.addEventListener('click', closeInspector);
  DOM.drawerBackdrop.addEventListener('click', (e) => {
    if (e.target === DOM.drawerBackdrop) closeInspector();
  });

  DOM.btnCopyInfo.addEventListener('click', copyConnectionInfo);
  DOM.btnKillProc.addEventListener('click', openKillModal);

  DOM.btnKillCancel.addEventListener('click', closeKillModal);
  DOM.btnKillCancelX.addEventListener('click', closeKillModal);
  DOM.btnKillConfirm.addEventListener('click', confirmKillProcess);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (DOM.killModalBackdrop.classList.contains('active')) {
        closeKillModal();
      } else if (DOM.drawerBackdrop.classList.contains('active')) {
        closeInspector();
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  window.NetWatchRefresh = fetchTelemetry;
  window.NetWatchChangeSource = () => {
    if (AppState.isFrozen) {
      AppState.isFrozen = false;
      DOM.btnFreeze.classList.remove('frozen');
      DOM.liveIndicator.classList.remove('is-paused');
      DOM.btnFreeze.querySelector('.toggle-text').textContent = 'Congelar';
      DOM.btnFreeze.title = 'Congelar visualização para análise';
    }
    AppState.rawSnapshot = null;
    fetchTelemetry();
  };
  setupEventListeners();
  fetchTelemetry();
  AppState.timerId = setInterval(fetchTelemetry, AppState.refreshInterval);
});
