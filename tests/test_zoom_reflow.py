"""Avoid sticky header obscuring data when browser text is zoomed."""
from pathlib import Path
import re
import unittest

CSS = (Path(__file__).resolve().parents[1] / "web/style.css").read_text(encoding="utf-8")

class ZoomReflowTests(unittest.TestCase):
    def test_header_not_sticky_at_zoom_equivalent_width(self):
        self.assertRegex(
            CSS,
            r"@media\s*\(max-width:\s*1024px\)\s*\{\s*\.app-header\s*\{\s*position:\s*relative;\s*top:\s*auto;",
        )

if __name__ == "__main__":
    unittest.main()
