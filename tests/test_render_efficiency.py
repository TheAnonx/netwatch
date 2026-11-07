"""Rendering regressions: avoid rebuilding unchanged visual nodes every telemetry tick."""
from pathlib import Path
import unittest

APP = (Path(__file__).resolve().parents[1] / 'web' / 'app.js').read_text(encoding='utf-8')

class RenderEfficiencyTests(unittest.TestCase):
    def test_reused_table_markup(self):
        self.assertIn("function setMarkupIfChanged(", APP)
        self.assertIn("setMarkupIfChanged(DOM.tbody,", APP)
        self.assertIn("setMarkupIfChanged(DOM.interfacesBar,", APP)
        self.assertIn("setMarkupIfChanged(DOM.topProcessesList,", APP)
        self.assertIn("setMarkupIfChanged(DOM.topCountriesList,", APP)

    def test_canvas_not_resized_on_every_refresh(self):
        self.assertIn("if (canvas.width !== pixelWidth)", APP)
        self.assertIn("if (canvas.height !== pixelHeight)", APP)
        self.assertIn("ctx.setTransform(dpr, 0, 0, dpr, 0, 0)", APP)

    def test_unchanged_kpi_does_not_replace_text(self):
        self.assertIn("function setTextIfChanged(", APP)
        self.assertIn("setTextIfChanged(DOM.kpiTotal,", APP)
        self.assertIn("setTextIfChanged(DOM.kpiProcesses,", APP)

if __name__ == '__main__':
    unittest.main()
