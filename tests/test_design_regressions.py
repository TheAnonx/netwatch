"""Guard against the UI anti-patterns fixed for the NetWatch release."""

from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "web/index.html").read_text(encoding="utf-8")
CSS = (ROOT / "web/style.css").read_text(encoding="utf-8")


def rule(selector: str) -> str:
    match = re.search(re.escape(selector) + r"\s*\{([^}]*)\}", CSS)
    if match is None:
        raise AssertionError(f"CSS selector not found: {selector}")
    return match.group(1)


class DesignRegressions(unittest.TestCase):
    def test_header_has_no_decorative_terminal_badge(self):
        self.assertIn('<h1 class="app-title">NetWatch</h1>', HTML)
        self.assertNotIn('badge-version', HTML)
        self.assertNotIn('.badge-version', CSS)

    def test_no_colored_zero_offset_glows(self):
        self.assertNotRegex(CSS, r"box-shadow\s*:\s*0\s+0\s+\d+px\s+rgba\(")

    def test_drawer_and_modal_use_flat_sections(self):
        self.assertEqual(HTML.count('class="detail-section"'), 3)
        self.assertIn('class="detail-section" id="geo-card"', HTML)
        self.assertIn('class="kill-target-summary"', HTML)
        self.assertNotIn('class="detail-card"', HTML)
        self.assertNotIn('class="kill-target-card"', HTML)
        self.assertNotIn("background:", rule(".detail-section"))
        self.assertNotIn("border-radius:", rule(".detail-section"))

    def test_header_rates_are_not_nested_cards(self):
        meter = rule(".bandwidth-meter")
        self.assertNotIn("background:", meter)
        self.assertNotIn("border-radius:", meter)
        self.assertNotIn("box-shadow:", meter)
        self.assertNotIn(":is(.bandwidth-meter,", CSS)

    def test_toasts_have_no_thick_side_accent(self):
        for selector in (".toast.toast-success", ".toast.toast-error"):
            self.assertIn("border-color:", rule(selector))
        self.assertNotRegex(CSS, r"border-left\s*:\s*[2-9]\d*px\s+solid")


if __name__ == "__main__":
    unittest.main()
