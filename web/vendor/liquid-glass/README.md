# Pinned Liquid Glass Web optical engine

- Upstream: https://github.com/Meapri/liquid-glass-web
- Commit: `1613f8311dbc31bc2331afcfe51a143c56dd6308` (2026-05-31)
- License: MIT, see `LICENSE`
- Build: `npm ci --ignore-scripts` and `npm run build:lib` against the exact upstream source, using Vite 6.4.2, with built ESM and its worker copied here.
- Runtime: self-hosted assets only; NetWatch has no npm runtime dependencies.
- This is a web implementation of optical glass (Snell-law-inspired displacement map, specular lighting, chromatic dispersion), not Apple proprietary compositor code.

Source commit and license are pinned to ensure reproducibility and attribution.
