/* GitHub Pages: demo by default. Local pairing is explicit, memory-only and read-only. */
(() => {
  'use strict';

  // Embedded or opener-controlled Pages views never request local-network access.
  if (('top' in window && window.top !== window.self) || window.opener != null) {
    window.NetWatchPages = Object.freeze({
      getSnapshot: () => Promise.resolve(window.NetWatchDemo.snapshot()),
      decorateStatus: () => {
        const label = document.getElementById('live-text');
        if (label) label.textContent = 'Demonstração';
      },
      currentMode: () => 'demo'
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
  let introDescription;

  function fetchLocal(token) {
    return fetch(LOCAL_API + '/api/connections', {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
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
    if (introDescription) introDescription.textContent = mode === 'live'
      ? 'Conectado ao coletor local, em modo somente leitura.'
      : 'Esta é uma demonstração com dados fictícios. Conecte o coletor Linux local para ver sua máquina.';
  }

  function updateLiveIndicator(collectionStatus = 'ok') {
    const label = document.getElementById('live-text');
    if (!label || collectionStatus === 'error') return;
    if (mode === 'demo') label.textContent = 'Demonstração';
    else if (collectionStatus !== 'partial') label.textContent = 'Ao vivo';
  }

  window.NetWatchPages = Object.freeze({
    getSnapshot() {
      return mode === 'live'
        ? fetchLocal(activeToken)
        : Promise.resolve(window.NetWatchDemo.snapshot());
    },
    decorateStatus: updateLiveIndicator,
    currentMode: () => mode
  });

  document.addEventListener('DOMContentLoaded', () => {
    const headerRight = document.querySelector('.header-right');
    if (!headerRight) return;

    // One small entry point; the floating menu is outside the optical header's
    // overflow:hidden, so it cannot be clipped by the Liquid Glass compositor.
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'pages-source-trigger';
    trigger.textContent = 'Fonte';
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', 'pages-source-menu');
    trigger.setAttribute('aria-label', 'Fonte dos dados: abrir opções de conexão');
    headerRight.appendChild(trigger);

    const menu = document.createElement('section');
    menu.id = 'pages-source-menu';
    menu.className = 'pages-source-menu';
    menu.hidden = true;
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-modal', 'false');
    menu.setAttribute('aria-label', 'Origem da telemetria');
    menu.innerHTML = `
      <div class="pages-source-intro">
        <strong>Fonte dos dados</strong>
        <p>Esta é uma demonstração com dados fictícios. Conecte o coletor Linux local para ver sua máquina.</p>
      </div>
      <form class="pages-connection-form" autocomplete="off">
        <label for="pages-pairing-code">Código do coletor</label>
        <input id="pages-pairing-code" type="password" name="pairing"
          autocomplete="off" autocapitalize="off" spellcheck="false"
          placeholder="Cole o código local" aria-describedby="pages-pairing-help"
          maxlength="512" required>
        <small id="pages-pairing-help">Conexão somente leitura; o navegador pode solicitar permissão de rede local.</small>
        <button type="submit" class="pages-connect-btn">Conectar meu computador</button>
      </form>
      <button class="pages-disconnect-btn" type="button" hidden>Desconectar e usar demonstração</button>
      <p class="pages-connection-status" role="status" aria-live="polite"></p>
    `;
    document.body.appendChild(menu);

    statusElement = menu.querySelector('.pages-connection-status');
    connectForm = menu.querySelector('.pages-connection-form');
    disconnectButton = menu.querySelector('.pages-disconnect-btn');
    pairingInput = menu.querySelector('#pages-pairing-code');
    introDescription = menu.querySelector('.pages-source-intro p');
    updateControls();

    function positionMenu() {
      if (menu.hidden) return;
      const anchor = trigger.getBoundingClientRect();
      const width = menu.getBoundingClientRect().width;
      const height = menu.getBoundingClientRect().height;
      const gap = 8;
      const left = Math.max(12, Math.min(anchor.right - width, window.innerWidth - width - 12));
      const below = anchor.bottom + gap;
      const top = below + height > window.innerHeight - 12 && anchor.top >= height + gap
        ? anchor.top - height - gap
        : below;
      menu.style.left = left + 'px';
      menu.style.top = Math.max(12, top) + 'px';
    }

    function closeMenu(restoreFocus = false) {
      if (menu.hidden) return;
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      pairingInput.value = '';
      if (restoreFocus) trigger.focus();
    }

    function openMenu() {
      updateControls();
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      positionMenu();
      (mode === 'live' ? disconnectButton : pairingInput).focus({ preventScroll: true });
    }

    trigger.addEventListener('click', () => {
      if (menu.hidden) openMenu();
      else closeMenu();
    });
    document.addEventListener('click', event => {
      if (!menu.hidden && !menu.contains(event.target) && !trigger.contains(event.target)) {
        closeMenu();
      }
    });
    document.addEventListener('keydown', event => {
      if (!menu.hidden && event.key === 'Escape') {
        event.preventDefault();
        closeMenu(true);
      }
    });
    window.addEventListener('resize', positionMenu);
    window.addEventListener('scroll', positionMenu, { passive: true });

    connectForm.addEventListener('submit', async event => {
      event.preventDefault();
      const secret = pairingInput.value.trim();
      if (secret.length < 32 || secret.length > 512) {
        message('Código inválido. Consulte o arquivo de pareamento do coletor.', 'error');
        return;
      }
      const button = connectForm.querySelector('button[type="submit"]');
      button.disabled = true;
      message('Solicitando acesso ao coletor local. Autorize a rede local se solicitado.');
      try {
        // A local-network prompt can only follow an explicit visitor action.
        await fetchLocal(secret);
        activeToken = secret;
        pairingInput.value = '';
        mode = 'live';
        updateControls();
        message('Conectado. Os dados são lidos diretamente do seu computador.', 'success');
        closeMenu();
        window.NetWatchChangeSource?.();
      } catch (error) {
        message('Não foi possível conectar. Confira o coletor, o código e a permissão de rede local. ' +
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
      message('Desconectado. Dados fictícios de demonstração.', 'info');
      closeMenu();
      window.NetWatchChangeSource?.();
    });
  });
})();
