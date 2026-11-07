"""NetWatch typography regression checks for dense operational data."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
STYLE = (ROOT / "web" / "style.css").read_text(encoding="utf-8")
SCRIPT = (ROOT / "web" / "app.js").read_text(encoding="utf-8")


class ReadabilityTests(unittest.TestCase):
    def test_no_sub_12px_declared_text(self):
        for source, text in [("style.css", STYLE), ("app.js", SCRIPT)]:
            with self.subTest(source=source):
                self.assertNotRegex(text, r"font-size:\s*(?:10|11)px\b")

    def test_data_table_readable_body(self):
        self.assertRegex(STYLE, r"\.data-table\s*\{[^}]*font-size:\s*13px;")


if __name__ == "__main__":
    unittest.main()
