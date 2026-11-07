/* Public GitHub Pages preview fixture. All addresses use RFC 5737 documentation ranges.
 * This file is shipped ONLY with the static Pages artifact, never read from the host.
 * No real process names, tokens, cache entries or host IPs are embedded here.
 */
(() => {
  'use strict';

  const base = [
    { proto: 'tcp', state: 'ESTAB', direction: 'OUTBOUND', proc: 'browser-demo',
      pid: 1234, local: ['192.0.2.10', '53012'], peer: ['203.0.113.8', '443'],
      geo: ['Exemplo EUA', 'Operadora fictícia'], recv: 0, send: 0 },
    { proto: 'tcp', state: 'ESTAB', direction: 'OUTBOUND', proc: 'browser-demo',
      pid: 1234, local: ['192.0.2.10', '53013'], peer: ['198.51.100.20', '443'],
      geo: ['Exemplo Brasil', 'Rede demonstrativa'], recv: 0, send: 0 },
    { proto: 'tcp', state: 'LISTEN', direction: 'LISTEN', proc: 'web-demo',
      pid: 2345, local: ['127.0.0.1', '8080'], peer: ['0.0.0.0', '*'],
      geo: null, recv: 0, send: 0 },
    { proto: 'udp', state: 'UNCONN', direction: 'BOUND', proc: 'resolver-demo',
      pid: 3456, local: ['192.0.2.10', '5353'], peer: ['0.0.0.0', '*'],
      geo: null, recv: 0, send: 0 },
    { proto: 'tcp', state: 'ESTAB', direction: 'LOCAL', proc: 'service-demo',
      pid: 2345, local: ['127.0.0.1', '4444'], peer: ['127.0.0.1', '5555'],
      geo: null, recv: 0, send: 0 },
    { proto: 'unix', state: 'ESTAB', direction: 'LOCAL', proc: 'desktop-demo',
      pid: 4567, local: ['/run/user/demo/bus', ''], peer: ['', ''],
      geo: null, recv: 0, send: 0 },
    { proto: 'raw', state: 'UNCONN', direction: 'RAW', proc: null,
      pid: null, local: ['*', '58'], peer: ['*', '*'],
      geo: null, recv: 0, send: 0 },
    { proto: 'tcp', state: 'TIME-WAIT', direction: 'UNKNOWN', proc: null,
      pid: null, local: ['192.0.2.10', '53014'], peer: ['203.0.113.99', '443'],
      geo: null, recv: 0, send: 0 },
  ];

  const endpoint = (tuple, iface = '') => {
    const [ip, port] = tuple;
    return { ip, port, raw: (ip || '*') + ':' + (port || '*'),
      port_int: /^\d+$/.test(port) ? Number(port) : 0,
      iface, service: '' };
  };

  const connections = base.map((row, index) => ({
    proto: row.proto,
    socket_type: row.proto === 'unix' ? 'u_str' : '',
    state: row.state,
    direction: row.direction,
    process_name: row.proc || 'Não identificado',
    pid: row.pid, identity_verified: false, start_ticks: null,
    user: '', cmdline: '', exe: '', hostname: '',
    app_category: row.proc?.includes('browser') ? 'Navegador Web' :
      row.proc?.includes('resolver') ? 'Sistema Operacional' : 'Geral',
    local: endpoint(row.local, row.proto === 'tcp' || row.proto === 'udp' ? 'demo0' : ''),
    peer: endpoint(row.peer),
    geo: row.geo ? { status: 'success', country: row.geo[0],
      city: '', isp: row.geo[1], org: row.geo[1], as: '' } : null,
    peer_is_public: row.geo !== null,
    recv_q: String(row.recv), send_q: String(row.send),
    owners: row.pid ? [{ pid: row.pid, name: row.proc }] : [],
    id: index + 1
  }));

  function snapshot() {
    const now = Date.now();
    // Deterministic illustrative trend; these values NEVER reflect the host.
    const history = Array.from({ length: 30 }, (_, idx) => {
      const k = Math.floor(now / 2000) - 29 + idx;
      const rx = Math.round(75 + 25 * (1 + Math.sin(k / 4)));
      const tx = Math.round(20 + 9 * (1 + Math.cos(k / 3)));
      return { timestamp: (k * 2), time: new Date(k * 2000).toLocaleTimeString('pt-BR'),
        total_conns: 5 + (k % 4), rx_kbps: rx, tx_kbps: tx };
    });
    const counts = {};
    for (const row of connections) {
      counts[row.proto] = (counts[row.proto] || 0) + 1;
      counts[row.direction] = (counts[row.direction] || 0) + 1;
    }
    return {
      status: 'ok',
      demo: true,
      timestamp: new Date(now).toISOString(),
      sources: Object.fromEntries(['inet', 'raw', 'unix', 'interfaces'].map(k =>
        [k, { status: 'ok' }])),
      errors: {},
      summary: {
        total: connections.length,
        tcp: counts.tcp || 0, udp: counts.udp || 0,
        raw: counts.raw || 0, unix: counts.unix || 0,
        outbound: counts.OUTBOUND || 0, inbound: counts.INBOUND || 0,
        listen: counts.LISTEN || 0, bound: counts.BOUND || 0,
        local: counts.LOCAL || 0, unknown: counts.UNKNOWN || 0,
        established: connections.filter(row => row.state === 'ESTAB').length,
        unique_processes: new Set(connections.map(row => row.pid).filter(Boolean)).size,
        unidentified_sockets: connections.filter(row => !row.pid).length
      },
      bandwidth: { available: true,
        total_rx_bps: history.at(-1).rx_kbps * 125,
        total_tx_bps: history.at(-1).tx_kbps * 125,
        rate_scope: 'demo', interfaces: {} },
      history,
      connections: structuredClone(connections),
      top_processes: [
        { name: 'browser-demo', count: 2 },
        { name: 'web-demo', count: 1 },
        { name: 'resolver-demo', count: 1 },
        { name: 'service-demo', count: 1 },
        { name: 'desktop-demo', count: 1 }
      ],
      top_countries: [
        { country: 'Exemplo EUA', count: 1 },
        { country: 'Exemplo Brasil', count: 1 }
      ],
      interfaces: [{ name: 'demo0', is_up: true,
        addresses: [{ family: 'inet', ip: '192.0.2.10' }] }]
    };
  }

  window.NetWatchDemo = Object.freeze({ snapshot });
})();
