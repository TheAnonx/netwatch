"""NetWatch: assertions for the self-hosted optical glass frontend."""

from html.parser import HTMLParser
from pathlib import Path
import unittest

WEB = Path(__file__).resolve().parents[1] / "web"


class Resources(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts, self.styles, self.ids = [], [], set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        if tag == "script" and attrs.get("src"):
            self.scripts.append(attrs["src"])
        if tag == "link" and attrs.get("rel") == "stylesheet":
            self.styles.append(attrs.get("href", ""))


class TestOpticalGlass(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.index = Resources()
        cls.index.feed((WEB / "index.html").read_text(encoding="utf-8"))

    def test_local_scripts_exist(self):
        for src in self.index.scripts:
            self.assertFalse(src.startswith(("http://", "https://")))
            self.assertTrue((WEB / src.split("?", 1)[0]).is_file(), src)

    def test_local_styles_exist(self):
        for href in self.index.styles:
            if not href.startswith(("http://", "https://")):
                self.assertTrue((WEB / href.split("?", 1)[0]).is_file(), href)

    def test_existing_telemetry_controls_survive(self):
        required = {"connections-table", "connections-tbody", "btn-freeze",
                    "btn-refresh", "btn-kill-confirm", "filter-proto",
                    "search-input", "kpi-total", "timeline-canvas"}
        self.assertFalse(required - self.index.ids)

    def test_optical_engine_and_license_are_pinned(self):
        vendor = WEB / "vendor" / "liquid-glass"
        engine = (vendor / "liquid-glass.js").read_text(encoding="utf-8")
        self.assertIn("feDisplacementMap", engine)
        self.assertIn("feGaussianBlur", engine)
        self.assertTrue(list((vendor / "assets").glob("MapWorker-*.js")))
        self.assertIn("MIT License", (vendor / "LICENSE").read_text(encoding="utf-8"))
        controller = (WEB / "glass.js").read_text(encoding="utf-8")
        self.assertIn("new LiquidGlass", controller)
        self.assertIn("vendor/liquid-glass/liquid-glass.js", controller)

    def test_release_optics_are_fixed_to_low_and_accessible(self):
        html = (WEB / "index.html").read_text(encoding="utf-8")
        controller = (WEB / "glass.js").read_text(encoding="utf-8")
        self.assertNotIn('id="glass-quality"', html)
        self.assertIn("let activeMode = 'low';", controller)
        self.assertIn("return window.matchMedia('(prefers-reduced-transparency: reduce)').matches ? 'off' : 'low';", controller)
        self.assertNotIn("localStorage.getItem", controller)
        self.assertNotIn("new URLSearchParams", controller)
        self.assertIn("GLASS_LEVELS", controller)
        self.assertIn("minLevel: 3", controller)

    def test_balanced_budget_limits_compositing_surfaces(self):
        import re
        controller = (WEB / "glass.js").read_text(encoding="utf-8")
        self.assertRegex(controller, r"selector: '\.app-header',\s*minLevel: 1")
        self.assertRegex(controller, r"selector: '\.kpis-strip',\s*minLevel: 2")
        self.assertRegex(controller, r"selector: '\.panel-box',\s*minLevel: 3")

    def test_telemetry_code_is_still_separate(self):
        self.assertTrue(any(src.startswith("app.js") for src in self.index.scripts))
        self.assertTrue(any(src.startswith("glass.js") for src in self.index.scripts))
        css = (WEB / "style.css").read_text(encoding="utf-8")
        self.assertIn("optical-environment", css)
        self.assertIn("prefers-reduced-transparency", css)


if __name__ == "__main__":
    unittest.main()
