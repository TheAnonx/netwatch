"""Accessible, keyboard-operable controls in the NetWatch dashboard."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT/'web/index.html').read_text(encoding='utf-8')
CSS = (ROOT/'web/style.css').read_text(encoding='utf-8')
JS = (ROOT/'web/app.js').read_text(encoding='utf-8')

class AccessibilityRegressions(unittest.TestCase):
    def test_controls_have_descriptive_labels(self):
        for fragment in [
            'id="search-input" aria-label="Buscar conexões"',
            'id="search-clear" aria-label="Limpar busca"',
            'id="btn-close-drawer" aria-label="Fechar detalhes"',
            'id="btn-kill-cancel-x" aria-label="Fechar confirmação"',
        ]:
            with self.subTest(fragment=fragment):
                self.assertIn(fragment, HTML)

    def test_pause_state_uses_existing_header_controls(self):
        self.assertNotIn('id="freeze-banner"', HTML)
        self.assertNotIn('id="btn-unfreeze-banner"', HTML)
        self.assertIn('id="live-indicator" role="status" aria-live="polite"', HTML)
        self.assertIn("DOM.liveIndicator.classList.toggle('is-paused', AppState.isFrozen)", JS)
        self.assertIn("textContent = 'Retomar'", JS)
        self.assertIn("textContent = 'Pausado'", JS)
        self.assertIn("textContent = 'Congelar'", JS)
        self.assertIn("textContent = 'Ao vivo'", JS)
        self.assertNotIn("DOM.freezeBanner", JS)
        self.assertNotIn("DOM.btnUnfreezeBanner", JS)
        self.assertIn(".live-status.is-paused .live-text", CSS)
        self.assertNotIn(".freeze-banner", CSS)

    def test_kpi_cells_accept_keyboard_activation(self):
        self.assertIn("cell.setAttribute('role', 'button')", JS)
        self.assertIn("cell.tabIndex = 0", JS)
        self.assertIn("cell.addEventListener('keydown'", JS)
        self.assertIn("cell.click()", JS)

    def test_danger_hover_keeps_readable_contrast(self):
        self.assertIn('.btn-danger:hover {\n  background: var(--negative);\n  color: #1b1020;', CSS)

    def test_inspector_targets_meet_minimum_size(self):
        self.assertIn("min-height: 28px", CSS)
        self.assertIn("min-width: 44px", CSS)

if __name__ == '__main__':
    unittest.main()
