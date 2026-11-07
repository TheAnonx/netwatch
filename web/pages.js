/* GitHub Pages mode: demo by default; optional, explicit read-only local connection.
 * The pairing code exists only in this page's memory and is never persisted,
 * included in URLs or sent to GitHub Pages.
 */
(() => {
  'use strict';
  // A public site on a shared origin must not be remotely controlled through
  // an iframe or opener window. Embedded views remain demonstration-only.
  if (('top' in window && window.top !== window.self) || window.opener != null) {
    window.NetWatchPages = Object.freeze({
      getSnapshot: () => Promise.resolve(window.NetWatchDemo.snapshot()),
      decorateStatus: () => {
        const label = document.getElementById('live-text');
        if (label) label.textContent = 'Demonstração';
      },
      currentMode: () => 'demo'
    });
    document.addEventListener('DOMContentLoaded', () => {
      const message = document.createElement('p');
      message.className = 'pages-embedded-warning';
      message.textContent = 'Prévia demonstrativa: a conexão local está desativada em páginas incorporadas ou abertas por outro site.';
      document.querySelector('.app-header')?.before(message);
    });
    return;
  }
  const LOCAL_API = 'http://127.0.0.1:9876';
  let activeToken = '';
  let mode = 'demo';
  let statusElement;
  let connectForm;
  let disconnectButton;
  let pairingInput;

  function fetchLocal(token) {
    return fetch(LOCAL_API + '/api/connections', {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      // Chrome's Local Network Access prompt is allowed only after user gesture.
      targetAddressSpace: 'loopback',
      headers: { 'X-NetWatch-Read-Token': token }
    }).then(async response => {
      if (!response.ok) throw new Error('Coletor recusou o acesso (HTTP ' + response.status + ')');
      const payload = await response.json();
      if (!payload || payload.status === 'error' || !payload.summary ||
          !Array.isArray(payload.connections) || !payload.sources) {
        throw new Error('O coletor retornou dados indisponíveis ou incompatíveis');
      }
      return payload;
    });
  }

  function message(text, kind = 'info') {
    if (!statusElement) return;
    statusElement.textContent = text;
    statusElement.dataset.kind = kind;
  }

  function updateControls() {
    connectForm.hidden = mode === 'live';
    disconnectButton.hidden = mode !== 'live';
  }

  function updateLiveIndicator(collectionStatus = 'ok') {
    const label = document.getElementById('live-text');
    if (!label || collectionStatus === 'error') return;
    if (mode === 'demo') label.textContent = 'Demonstração';
    else if (collectionStatus !== 'partial') label.textContent = 'Ao vivo';
  }

  const source = {
    getSnapshot() {
      if (mode === 'live') return fetchLocal(activeToken);
      return Promise.resolve(window.NetWatchDemo.snapshot());
    },
    decorateStatus: updateLiveIndicator,
    currentMode: () => mode
  };
  Object.freeze(source);
  window.NetWatchPages = source;

  document.addEventListener('DOMContentLoaded', () => {
    const panel = document.createElement('section');
    panel.className = 'pages-connection';
    panel.setAttribute('aria-label', 'Origem da telemetria');
    panel.innerHTML = `
      <div class="pages-connection-copy">
        <strong>Prévia demonstrativa</strong>
        <p>Dados fictícios. Nenhuma informação da sua máquina é coletada
        até você conectar um coletor local.</p>
      </div>
      <form class="pages-connection-form" autocomplete="off">
        <label for="pages-pairing-code">Código de pareamento do coletor</label>
        <div class="pages-connection-actions">
          <input id="pages-pairing-code" type="password" name="pairing"
            autocomplete="off" autocapitalize="off" spellcheck="false"
            placeholder="Cole o código local" aria-describedby="pages-pairing-help"
            maxlength="512" required>
          <button type="submit" class="pages-connect-btn">Conectar meu computador</button>
        </div>
        <small id="pages-pairing-help">Necessário executar o NetWatch localmente.
        A conexão é somente leitura e pode solicitar permissão de rede local do navegador.</small>
      </form>
      <button class="pages-disconnect-btn" type="button" hidden>
        Desconectar e mostrar demonstração
      </button>
      <p class="pages-connection-status" role="status" aria-live="polite"></p>
    `;
    const header = document.querySelector('.app-header');
    header.parentNode.insertBefore(panel, header);

    statusElement = panel.querySelector('.pages-connection-status');
    connectForm = panel.querySelector('.pages-connection-form');
    disconnectButton = panel.querySelector('.pages-disconnect-btn');
    pairingInput = panel.querySelector('#pages-pairing-code');
    message('Demonstração: todas as conexões e taxas são fictícias.');
    updateControls();

    connectForm.addEventListener('submit', async event => {
      event.preventDefault();
      const secret = pairingInput.value.trim();
      if (secret.length < 32 || secret.length > 512) {
        message('Código inválido. Consulte o arquivo de pareamento gerado pelo coletor.', 'error');
        return;
      }
      const button = connectForm.querySelector('button[type="submit"]');
      button.disabled = true;
      message('Solicitando acesso ao coletor local. Confirme a permissão do navegador, se necessário.');
      try {
        // Only an explicit click may trigger Chrome's loopback permission prompt.
        await fetchLocal(secret);
        activeToken = secret;
        pairingInput.value = '';
        mode = 'live';
        updateControls();
        message('Conectado ao seu computador. Os dados são lidos diretamente do loopback.', 'success');
        window.NetWatchChangeSource?.();
      } catch (error) {
        message('Não foi possível conectar. Verifique o coletor, o código, a origem autorizada e a permissão de rede local. ' +
          String(error.message || ''), 'error');
      } finally {
        button.disabled = false;
      }
    });

    disconnectButton.addEventListener('click', () => {
      activeToken = '';
      pairingInput.value = '';
      mode = 'demo';
      updateControls();
      message('Desconectado. Exibindo dados fictícios de demonstração.');
      window.NetWatchChangeSource?.();
    });
  });
})();
