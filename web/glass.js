/**
 * NetWatch optical glass layer.
 * Uses the MIT-licensed liquid-glass-web engine pinned under ./vendor/.
 *
 * The data-table logic, API, event handlers, and process controls remain
 * entirely in app.js / server.py. This module only creates visual surfaces.
 */
import { LiquidGlass } from './vendor/liquid-glass/liquid-glass.js';

const surfaces = new Map();
const pendingVisibility = [];
let alive = true;
let errors = 0;
let selectionObserver;

const GLASS_LEVELS = Object.freeze({ off: 0, low: 1, balanced: 2, full: 3 });
let activeMode = 'low';

function setupQualityControl() {
  // Release policy: always use the lightweight optical preset.
  // Preserve the OS accessibility preference for reduced transparency.
  return window.matchMedia('(prefers-reduced-transparency: reduce)').matches ? 'off' : 'low';
}

const shared = Object.freeze({
  scheme: 'dark',
  variant: 'regular',
  respectReducedMotion: true,
  edges: true,
  specular: true,
  saturation: 140,
  mapPixelRatio: 1.25
});

const definitions = [
  {
    selector: '.app-header',
    minLevel: 1,
    options: { profile: 'bar', preset: 'dramatic', quality: 'high', radius: 20,
      refraction: 85, thickness: 58, blur: 5, chromaticAberration: 0.055, specularIntensity: 0.85 }
  },
  {
    selector: '.kpis-strip',
    minLevel: 2,
    options: { profile: 'panel', preset: 'vivid', quality: 'balanced', radius: 18,
      refraction: 64, thickness: 43, blur: 5, specularIntensity: 0.72 }
  },
  {
    selector: '.panel-box',
    minLevel: 3,
    options: { profile: 'card', preset: 'vivid', quality: 'balanced', radius: 18,
      refraction: 64, thickness: 42, blur: 4.5, specularIntensity: 0.8 }
  },
  {
    selector: '.table-section',
    minLevel: 3,
    options: { profile: 'panel', preset: 'balanced', quality: 'balanced', radius: 18,
      refraction: 51, thickness: 36, blur: 4.5, specularIntensity: 0.55, lazy: true }
  },
  {
    selector: '.filter-chip',
    minLevel: 3,
    options: { profile: 'control', preset: 'vivid', quality: 'balanced', radius: 'pill',
      refraction: 65, thickness: 42, blur: 4, chromaticAberration: 0.045, specularIntensity: 0.78 },
    selectable: true
  },
  {
    selector: '.tab-btn',
    minLevel: 3,
    options: { profile: 'selection', preset: 'vivid', quality: 'balanced', radius: 'pill',
      refraction: 62, thickness: 42, blur: 3, chromaticAberration: 0.045, specularIntensity: 0.65 },
    selectable: true
  },
  {
    selector: '#btn-refresh, #btn-freeze',
    minLevel: 3,
    options: { profile: 'control', preset: 'vivid', quality: 'high', radius: 'pill',
      refraction: 72, thickness: 48, blur: 3, chromaticAberration: 0.055, specularIntensity: 0.92 },
  },
  {
    selector: '.drawer',
    minLevel: 3,
    options: { profile: 'panel', preset: 'vivid', quality: 'balanced', radius: 20,
      refraction: 61, thickness: 44, blur: 5, specularIntensity: 0.75 },
    visibilityParent: '#drawer-backdrop'
  },
  {
    selector: '.modal-box',
    minLevel: 3,
    options: { profile: 'panel', preset: 'vivid', quality: 'balanced', radius: 20,
      refraction: 66, thickness: 43, blur: 5, specularIntensity: 0.75 },
    visibilityParent: '#kill-modal-backdrop'
  }
];

function selectedTint(element) {
  return element.classList.contains('active')
    ? 'rgba(124, 187, 255, 0.24)'
    : 'rgba(33, 54, 86, 0.10)';
}

function install(element, definition) {
  if (!alive || surfaces.has(element)) return;
  element.classList.add('liquid-glass');

  const options = { ...shared, ...definition.options };
  if (activeMode === 'low') options.mapPixelRatio = 1;
  if (activeMode === 'full') options.mapPixelRatio = 1.5;
  if (definition.selectable) options.tint = selectedTint(element);

  try {
    const material = new LiquidGlass(element, options);
    surfaces.set(element, material);
  } catch (error) {
    errors += 1;
    element.classList.remove('liquid-glass');
    console.warn('[NetWatch glass] a surface could not initialize; CSS fallback remains', error);
  }
}

function installVisibleOnOpen(definition, element) {
  const parent = document.querySelector(definition.visibilityParent);
  if (!parent) return;
  const update = () => {
    if (parent.classList.contains('active')) install(element, definition);
  };
  const observer = new MutationObserver(update);
  observer.observe(parent, { attributes: true, attributeFilter: ['class'] });
  pendingVisibility.push(observer);
  update();
}

function installSurfaces() {
  activeMode = setupQualityControl();
  const supported = window.CSS?.supports?.('backdrop-filter', 'blur(1px)');
  for (const definition of supported && activeMode !== 'off' ? definitions : []) {
    if (definition.minLevel > GLASS_LEVELS[activeMode]) continue;
    for (const element of document.querySelectorAll(definition.selector)) {
      if (definition.visibilityParent) {
        installVisibleOnOpen(definition, element);
      } else {
        install(element, definition);
      }
    }
  }
  const selects = [...document.querySelectorAll('.filter-chip, .tab-btn')]
    .filter(element => surfaces.has(element));
  if (selects.length) selectionObserver = new MutationObserver(changes => {
    for (const change of changes) {
      if (change.attributeName !== 'class') continue;
      const material = surfaces.get(change.target);
      if (material) material.update({ tint: selectedTint(change.target) });
    }
  });
  for (const el of selects) selectionObserver.observe(el, { attributes: true, attributeFilter: ['class'] });
  document.body.classList.toggle('glass-optics-ready', surfaces.size > 0);
  window.netwatchGlass = Object.freeze({
    get mode() { return activeMode; },
    get count() { return surfaces.size; },
    get errors() { return errors; },
    get ready() { return surfaces.size > 0; },
    details: () => Array.from(surfaces, ([el, material]) => ({
      target: el.id || el.className,
      profile: material.resolved?.profile,
      quality: material.resolved?.quality,
      filter: getComputedStyle(el).backdropFilter
    }))
  });
}

function cleanup() {
  alive = false;
  selectionObserver?.disconnect();
  pendingVisibility.forEach(observer => observer.disconnect());
  surfaces.forEach(material => material.destroy());
  surfaces.clear();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', installSurfaces, { once: true });
} else {
  installSurfaces();
}
window.addEventListener('pagehide', cleanup, { once: true });
