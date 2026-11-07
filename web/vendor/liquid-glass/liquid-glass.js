function Dt(s) {
  const e = qt(s);
  if (e) return e;
  const t = Math.min(s.width, s.height), i = Math.max(s.width, s.height), r = i / Math.max(1, t), n = s.radius / Math.max(1, t), o = s.textLength ?? 0;
  return t <= 92 && n > 0.42 && (o <= 32 || i <= 360) ? "control" : t <= 88 && r >= 4.5 ? "bar" : t <= 92 && (n > 0.42 || o <= 18) ? "control" : t >= 260 || s.width * s.height > 14e4 && r < 4 ? "panel" : "card";
}
function qt(s) {
  const e = s.tagName?.toLowerCase() ?? "", t = s.role?.toLowerCase() ?? "", i = s.ariaLabel?.toLowerCase() ?? "", r = s.className?.toLowerCase() ?? "", n = (s.buttonCount ?? 0) + (s.inputCount ?? 0), o = s.linkCount ?? 0, a = Math.min(s.width, s.height), l = s.radius / Math.max(1, a);
  return t === "tablist" || i.includes("tab") || r.includes("tabbar") || r.includes("segmented") ? "selection" : e === "button" || t === "button" || t === "switch" || t === "slider" || t === "checkbox" || t === "radio" || Ye(r, ["chip", "tag", "badge", "pill", "button", "btn", "control"]) || Ye(r, ["action", "cta"]) && (a <= 104 || l > 0.36) || (i.includes("chip") || i.includes("tag") || i.includes("badge")) && a <= 112 ? "control" : e === "nav" && n >= 2 && o === 0 ? "selection" : e === "header" || e === "nav" || e === "footer" || t === "navigation" || t === "toolbar" || t === "banner" ? "bar" : e === "aside" || t === "dialog" || t === "menu" || t === "menubar" || t === "listbox" || t === "complementary" || r.includes("sheet") || r.includes("popover") || r.includes("menu") || r.includes("panel") ? "panel" : e === "article" || e === "section" || r.includes("card") || r.includes("widget") || r.includes("notification") ? "card" : null;
}
function Ye(s, e) {
  if (!s) return !1;
  const t = s.split(/[^a-z0-9]+/).filter(Boolean);
  return e.some((i) => t.includes(i));
}
let zt = 0;
const Ke = /* @__PURE__ */ new WeakMap();
function Ut(s) {
  const e = Ke.get(s);
  if (e && e.isConnected) return e;
  const t = "http://www.w3.org/2000/svg", i = document.createElementNS(t, "svg");
  i.setAttribute("aria-hidden", "true"), i.setAttribute("width", "0"), i.setAttribute("height", "0"), i.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;";
  const r = document.createElementNS(t, "defs");
  return i.appendChild(r), (s.nodeType === 9 ? s.body ?? s : s).appendChild(i), Ke.set(s, r), r;
}
const b = "http://www.w3.org/2000/svg";
class Ve {
  id;
  filter;
  defs;
  feImageDisp;
  feImageSpec;
  feBlur;
  feDispR;
  feDispG;
  feDispB;
  feSaturate;
  chromaticEnabled;
  constructor(e) {
    this.defs = Ut(e.root), this.id = `lg-filter-${++zt}`, this.chromaticEnabled = e.chromaticAberration > 0.12, this.filter = document.createElementNS(b, "filter"), this.filter.setAttribute("id", this.id);
    const t = e.displacementPadding / e.width * 100, i = e.displacementPadding / e.height * 100;
    if (this.filter.setAttribute("x", `${-t}%`), this.filter.setAttribute("y", `${-i}%`), this.filter.setAttribute("width", `${100 + t * 2}%`), this.filter.setAttribute("height", `${100 + i * 2}%`), this.filter.setAttribute("filterUnits", "objectBoundingBox"), this.filter.setAttribute("primitiveUnits", "userSpaceOnUse"), this.filter.setAttribute("color-interpolation-filters", "sRGB"), this.feBlur = document.createElementNS(b, "feGaussianBlur"), this.feBlur.setAttribute("in", "SourceGraphic"), this.feBlur.setAttribute("stdDeviation", String(e.blur)), this.feBlur.setAttribute("edgeMode", "duplicate"), this.feBlur.setAttribute("result", "blurred"), this.filter.appendChild(this.feBlur), this.feImageDisp = document.createElementNS(b, "feImage"), this.feImageDisp.setAttribute("href", e.displacementMapUrl), this.feImageDisp.setAttribute("x", String(-e.displacementPadding)), this.feImageDisp.setAttribute("y", String(-e.displacementPadding)), this.feImageDisp.setAttribute(
      "width",
      String(e.width + e.displacementPadding * 2)
    ), this.feImageDisp.setAttribute(
      "height",
      String(e.height + e.displacementPadding * 2)
    ), this.feImageDisp.setAttribute("preserveAspectRatio", "none"), this.feImageDisp.setAttribute("result", "dispMap"), this.filter.appendChild(this.feImageDisp), this.chromaticEnabled) {
      const n = e.chromaticAberration, o = 2 * e.refraction, a = Te(b, "blurred", "onlyR", [
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        0
      ]), l = Te(b, "blurred", "onlyG", [
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        0
      ]), c = Te(b, "blurred", "onlyB", [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        0,
        1,
        0
      ]);
      this.filter.appendChild(a), this.filter.appendChild(l), this.filter.appendChild(c), this.feDispR = ae(b, "onlyR", "dispMap", o * (1 - 0.35 * n), "dispR"), this.feDispG = ae(b, "onlyG", "dispMap", o, "dispG"), this.feDispB = ae(b, "onlyB", "dispMap", o * (1 + 0.35 * n), "dispB"), this.filter.appendChild(this.feDispR), this.filter.appendChild(this.feDispG), this.filter.appendChild(this.feDispB);
      const u = Le(b, "dispR", "dispG", "screen", "dispRG"), f = Le(b, "dispRG", "dispB", "screen", "distorted");
      this.filter.appendChild(u), this.filter.appendChild(f);
    } else
      this.feDispR = null, this.feDispB = null, this.feDispG = ae(b, "blurred", "dispMap", 2 * e.refraction, "distorted"), this.filter.appendChild(this.feDispG);
    this.feSaturate = document.createElementNS(b, "feColorMatrix"), this.feSaturate.setAttribute("in", "distorted"), this.feSaturate.setAttribute("type", "saturate"), this.feSaturate.setAttribute("values", String(e.saturation / 100)), this.feSaturate.setAttribute("result", "saturated"), this.filter.appendChild(this.feSaturate);
    const r = document.createElementNS(b, "feComponentTransfer");
    r.setAttribute("in", "saturated"), r.setAttribute("result", "brightened");
    for (const n of ["R", "G", "B"]) {
      const o = document.createElementNS(b, `feFunc${n}`);
      o.setAttribute("type", "linear"), o.setAttribute("slope", "1.05"), o.setAttribute("intercept", "0"), r.appendChild(o);
    }
    if (this.filter.appendChild(r), e.specularMapUrl) {
      this.feImageSpec = document.createElementNS(b, "feImage"), this.feImageSpec.setAttribute("href", e.specularMapUrl), this.feImageSpec.setAttribute("x", "0"), this.feImageSpec.setAttribute("y", "0"), this.feImageSpec.setAttribute("width", String(e.width)), this.feImageSpec.setAttribute("height", String(e.height)), this.feImageSpec.setAttribute("preserveAspectRatio", "none"), this.feImageSpec.setAttribute("result", "specMap"), this.filter.appendChild(this.feImageSpec);
      const n = Le(b, "brightened", "specMap", "screen", "final");
      this.filter.appendChild(n);
    } else
      this.feImageSpec = null;
    this.defs.appendChild(this.filter);
  }
  get url() {
    return `url(#${this.id})`;
  }
  updateDisplacement(e, t, i, r) {
    this.feImageDisp.setAttribute("href", e), this.feImageDisp.setAttribute("x", String(-r)), this.feImageDisp.setAttribute("y", String(-r)), this.feImageDisp.setAttribute("width", String(t + r * 2)), this.feImageDisp.setAttribute("height", String(i + r * 2));
    const n = r / t * 100, o = r / i * 100;
    this.filter.setAttribute("x", `${-n}%`), this.filter.setAttribute("y", `${-o}%`), this.filter.setAttribute("width", `${100 + n * 2}%`), this.filter.setAttribute("height", `${100 + o * 2}%`);
  }
  updateSpecular(e, t, i) {
    !this.feImageSpec || !e || (this.feImageSpec.setAttribute("href", e), this.feImageSpec.setAttribute("width", String(t)), this.feImageSpec.setAttribute("height", String(i)));
  }
  updateRefraction(e) {
    if (this.chromaticEnabled && this.feDispR && this.feDispB) {
      const t = 2 * e;
      this.feDispR.setAttribute("scale", String(t * 0.82)), this.feDispG.setAttribute("scale", String(t)), this.feDispB.setAttribute("scale", String(t * 1.18));
    } else
      this.feDispG.setAttribute("scale", String(2 * e));
  }
  updateBlur(e) {
    this.feBlur.setAttribute("stdDeviation", String(e));
  }
  updateSaturation(e) {
    this.feSaturate.setAttribute("values", String(e / 100));
  }
  destroy() {
    this.filter.remove();
  }
}
function ae(s, e, t, i, r) {
  const n = document.createElementNS(s, "feDisplacementMap");
  return n.setAttribute("in", e), n.setAttribute("in2", t), n.setAttribute("scale", String(i)), n.setAttribute("xChannelSelector", "R"), n.setAttribute("yChannelSelector", "G"), n.setAttribute("result", r), n;
}
function Te(s, e, t, i) {
  const r = document.createElementNS(s, "feColorMatrix");
  return r.setAttribute("in", e), r.setAttribute("type", "matrix"), r.setAttribute("values", i.join(" ")), r.setAttribute("result", t), r;
}
function Le(s, e, t, i, r) {
  const n = document.createElementNS(s, "feBlend");
  return n.setAttribute("in", e), n.setAttribute("in2", t), n.setAttribute("mode", i), n.setAttribute("result", r), n;
}
const Ot = 2;
let k = null, Wt = 0, de = 0;
const U = /* @__PURE__ */ new Map();
function Nt() {
  return de < Ot && typeof Worker < "u" && typeof OffscreenCanvas < "u";
}
function Gt() {
  if (k) return k;
  if (!Nt()) return null;
  try {
    k = new Worker(new URL(
      /* @vite-ignore */
      "" + new URL("assets/MapWorker-tpM-Txsc.js", import.meta.url).href,
      import.meta.url
    ), {
      type: "module",
      name: "liquid-glass-map-worker"
    }), k.onmessage = (s) => {
      const e = s.data, t = U.get(e.id);
      t && (U.delete(e.id), e.ok ? t.resolve(e.result) : t.reject(new Error(e.error)));
    }, k.onerror = () => {
      de++, je(new Error("[liquid-glass] map worker failed")), Ze();
    }, k.onmessageerror = () => {
      de++, je(new Error("[liquid-glass] map worker message failed")), Ze();
    };
  } catch {
    de++, k = null;
  }
  return k;
}
function je(s) {
  for (const e of U.values()) e.reject(s);
  U.clear();
}
function Ze() {
  k?.terminate(), k = null;
}
function wt(s) {
  const e = Gt();
  if (!e) return null;
  const t = ++Wt, i = { ...s, id: t };
  return new Promise((r, n) => {
    U.set(t, {
      resolve: (o) => r(o),
      reject: n
    });
    try {
      e.postMessage(i);
    } catch (o) {
      U.delete(t), n(o instanceof Error ? o : new Error(String(o)));
    }
  });
}
function $t(s) {
  return wt({ kind: "displacement", params: s });
}
function Ht(s) {
  return wt({ kind: "specular", params: s });
}
const Je = 8.5, Xt = 1.15;
function xt(s) {
  const { cx: e, cy: t, halfW: i, halfH: r, r: n } = s, o = Math.max(0, i - n), a = Math.max(0, r - n), l = s.lensDepth ?? 0;
  function c(d, p) {
    const h = Math.abs(d - e), m = Math.abs(p - t), y = i - h, v = r - m;
    if (y <= 0 || v <= 0) return 0;
    const w = h - o, x = m - a;
    if (w > 0 && x > 0) {
      const W = Math.sqrt(w * w + x * x);
      return W > n ? 0 : n - W;
    }
    return Math.min(y, v);
  }
  function u(d, p) {
    let h = (d - e) / i, m = (p - t) / r;
    h < -1 ? h = -1 : h > 1 && (h = 1), m < -1 ? m = -1 : m > 1 && (m = 1);
    const v = 1 - (1 - h * h) * (1 - m * m);
    return l * (1 - Math.pow(v, Xt));
  }
  function f(d, p) {
    let m = (u(d + 0.5, p) - u(d - 0.5, p)) / 1, y = (u(d, p + 0.5) - u(d, p - 0.5)) / (2 * 0.5);
    const v = Math.sqrt(m * m + y * y);
    if (v > Je) {
      const x = Je / v;
      m *= x, y *= x;
    }
    const w = Math.sqrt(m * m + y * y + 1);
    return { nx: -m / w, ny: -y / w, nz: 1 / w };
  }
  return { sdf: c, lensNormal: f };
}
const et = "image/webp", tt = 1;
async function Oe(s) {
  const e = await Qt(s);
  return Yt(e);
}
async function Qt(s) {
  return s instanceof HTMLCanvasElement ? new Promise((e, t) => {
    s.toBlob(
      (i) => {
        i ? e(i) : t(new Error("[liquid-glass] failed to encode canvas"));
      },
      et,
      tt
    );
  }) : s.convertToBlob({ type: et, quality: tt });
}
function Yt(s) {
  return typeof FileReader > "u" ? Promise.resolve(URL.createObjectURL(s)) : new Promise((e, t) => {
    const i = new FileReader();
    i.onload = () => e(String(i.result)), i.onerror = () => t(i.error ?? new Error("[liquid-glass] failed to read encoded canvas")), i.readAsDataURL(s);
  });
}
const Kt = 1.5, Vt = 1.95, jt = 30, it = 1.7, Zt = 0, Jt = -1, ei = 3, ti = 0.84, ii = 0.18, si = 255, ri = 0, ni = -0.42, oi = 1.42, ai = 1.95, li = 0.4;
function We(s, e) {
  const t = s.getContext("2d", e);
  if (!t) throw new Error("[liquid-glass] 2d canvas context unavailable");
  return t;
}
function Ne(s, e) {
  if (typeof OffscreenCanvas < "u") return new OffscreenCanvas(s, e);
  const t = document.createElement("canvas");
  return t.width = s, t.height = e, t;
}
function st(s) {
  const e = s.pixelRatio, t = e < 0.9 ? 2 : 1, i = e * t, r = Math.max(1, Math.round(s.width * i)), n = Math.max(1, Math.round(s.height * i)), o = Math.max(0, Math.min(Math.min(r, n) / 2, s.radius * i)), a = Math.max(8, Math.ceil(s.refraction)), l = Math.ceil(a * i), c = r + l * 2, u = n + l * 2, f = Ne(c, u), d = We(f, { willReadFrequently: !1 }), p = d.createImageData(c, u), h = p.data, m = Math.min(r, n) / 2, y = Math.max(0.3, Math.min(1.6, s.thickness / jt)), v = m * Vt * y, w = xt({
    cx: l + r / 2,
    cy: l + n / 2,
    halfW: r / 2,
    halfH: n / 2,
    r: o,
    lensDepth: v
  }), x = 1 / Kt;
  for (let T = 0; T < u; T++) {
    const re = T * c * 4, N = T + 0.5;
    for (let C = 0; C < c; C++) {
      const G = C + 0.5, M = re + C * 4;
      if (w.sdf(G, N) <= 0) {
        h[M] = 128, h[M + 1] = 128, h[M + 2] = 128, h[M + 3] = 255;
        continue;
      }
      const { nx: Qe, ny: $, nz: H } = w.lensNormal(G, N), I = -H, X = 1 - x * x * (1 - I * I);
      let Q = 0, ne = 0;
      if (X >= 0) {
        const oe = x * I + Math.sqrt(X);
        Q = -oe * Qe * it, ne = -oe * $ * it;
      }
      h[M] = Math.max(1, Math.min(255, Math.round(128 + Q * 127))), h[M + 1] = Math.max(1, Math.min(255, Math.round(128 + ne * 127))), h[M + 2] = 128, h[M + 3] = 255;
    }
  }
  return d.putImageData(p, 0, 0), (t > 1 ? Mt(f, c, u, t) : Oe(f)).then((T) => ({
    url: T,
    padding: a,
    totalWidth: c / i,
    totalHeight: u / i
  }));
}
async function rt(s) {
  const e = s.pixelRatio, t = e < 1.1 ? 2 : 1, i = e * t, r = Math.max(2, Math.round(s.width * i)), n = Math.max(2, Math.round(s.height * i)), o = Math.max(0, Math.min(Math.min(r, n) / 2, s.radius * i)), a = Math.max(0, s.intensity), l = Ne(r, n), c = We(l), u = c.createImageData(r, n), f = u.data, d = Math.min(3.6 * i, Math.max(2, o * 0.64)), p = xt({ cx: r / 2, cy: n / 2, halfW: r / 2, halfH: n / 2, r: o });
  for (let h = 0; h < n; h++)
    for (let m = 0; m < r; m++) {
      const y = m + 0.5, v = h + 0.5, w = p.sdf(y, v);
      if (w <= 0) continue;
      let x = 0;
      const W = (y - r / 2) / (r / 2), T = (v - n / 2) / (n / 2), re = W - ri, N = T - ni, C = Math.max(0, 1 - Math.sqrt(re * re + N * N) / oi);
      if (C > 0 && (x += Math.pow(C, ai) * li), w < d) {
        const $ = (p.sdf(y + 0.75, v) - p.sdf(y - 0.75, v)) / 1.5, H = (p.sdf(y, v + 0.75) - p.sdf(y, v - 0.75)) / (2 * 0.75), I = Math.sqrt($ * $ + H * H) || 1, X = -$ / I * Zt + -H / I * Jt, Q = 1 - w / d, ne = Q * Q, oe = X > 0 ? Math.pow(X, ei) : 0;
        x += (ti * oe + ii) * ne;
      }
      const G = Math.min(255, x * a * si);
      if (G <= 0) continue;
      const M = (h * r + m) * 4;
      f[M] = 255, f[M + 1] = 255, f[M + 2] = 255, f[M + 3] = G;
    }
  return c.putImageData(u, 0, 0), t > 1 ? Mt(l, r, n, t) : Oe(l);
}
function Mt(s, e, t, i) {
  const r = Math.max(1, Math.round(e / i)), n = Math.max(1, Math.round(t / i)), o = Ne(r, n), a = We(o, { willReadFrequently: !0 });
  return a.clearRect(0, 0, r, n), a.imageSmoothingEnabled = !0, a.imageSmoothingQuality = "high", a.drawImage(s, 0, 0, e, t, 0, 0, r, n), Oe(o);
}
function ci(s) {
  return $t(s)?.catch(() => st(s)) ?? st(s);
}
function ui(s) {
  return Ht(s)?.catch(() => rt(s)) ?? rt(s);
}
const hi = 64, V = /* @__PURE__ */ new Map(), j = /* @__PURE__ */ new Map();
function Rt(s) {
  return s <= 0.6 ? 8 : 4;
}
function E(s, e) {
  return Math.max(e, Math.round(s / e) * e);
}
function At(s) {
  for (; s.size > hi; ) {
    const e = s.keys().next().value;
    if (e === void 0) break;
    s.delete(e);
  }
}
function kt(s, e, t) {
  s.delete(e), s.set(e, t);
}
function di(s) {
  const e = Rt(s.pixelRatio);
  return `d:${E(s.width, e)}x${E(s.height, e)}_r${E(s.radius, 2)}_t${E(s.thickness, 2)}_p${s.pixelRatio.toFixed(3)}_f${E(s.refraction, 2)}`;
}
function fi(s) {
  const e = Rt(s.pixelRatio);
  return `s:${E(s.width, e)}x${E(s.height, e)}_r${E(s.radius, 2)}_t${E(s.thickness, 2)}_p${s.pixelRatio.toFixed(3)}_i${s.intensity.toFixed(2)}`;
}
function le(s) {
  const e = di(s), t = V.get(e);
  if (t !== void 0)
    return kt(V, e, t), t;
  const i = ci(s);
  return V.set(e, i), At(V), i;
}
function Ce(s) {
  const e = fi(s), t = j.get(e);
  if (t !== void 0)
    return kt(j, e, t), t;
  const i = ui(s);
  return j.set(e, i), At(j), i;
}
function cs() {
  V.clear(), j.clear();
}
const Ae = /* @__PURE__ */ new Set(), L = /* @__PURE__ */ new Set(), ge = /* @__PURE__ */ new WeakMap(), nt = /* @__PURE__ */ new WeakMap(), O = /* @__PURE__ */ new WeakMap();
let D = 0, ee = -1e6, te = -1e6, ye = !1, ie = !0;
const Et = 220, pi = 280;
let fe = 0, pe = 0, B = 0, P = 0, _ = 0, Z = null;
function mi() {
  return Z || typeof IntersectionObserver > "u" || (Z = new IntersectionObserver(
    (s) => {
      for (const e of s) {
        const t = e.target;
        e.isIntersecting ? (L.add(t), be(!0)) : (L.delete(t), O.delete(t), (ge.get(t) ?? 0) !== 0 && (ge.set(t, 0), t.style.setProperty("--lg-glow", "0")));
      }
    },
    { rootMargin: `${Et}px` }
  )), Z;
}
function be(s = !1) {
  ie = !0, s && ke();
}
function Ge(s) {
  L.delete(s), Ae.delete(s), O.delete(s);
}
function _t() {
  ie = !1;
  for (const s of Array.from(L)) {
    if (!s.isConnected) {
      Ge(s);
      continue;
    }
    O.set(s, s.getBoundingClientRect());
  }
}
function ke() {
  D || (D = requestAnimationFrame(gi));
}
function gi() {
  D = 0, ie && _t();
  for (const s of Array.from(L)) {
    if (!s.isConnected) {
      Ge(s);
      continue;
    }
    const e = O.get(s);
    if (!e || e.width === 0 || e.height === 0) continue;
    const t = Math.max(e.left - ee, 0, ee - e.right), i = Math.max(e.top - te, 0, te - e.bottom), r = Math.sqrt(t * t + i * i), n = Math.max(0, Math.min(1, 1 - r / Et));
    if (n === 0 && (ge.get(s) ?? 0) === 0) continue;
    ge.set(s, n);
    const o = Math.max(0, Math.min(1, (ee - e.left) / e.width)), a = Math.max(0, Math.min(1, (te - e.top) / e.height));
    s.style.setProperty("--lg-pointer-x", o.toFixed(4)), s.style.setProperty("--lg-pointer-y", a.toFixed(4)), s.style.setProperty("--lg-glow", n.toFixed(4));
  }
}
function Tt(s) {
  ee = s.clientX, te = s.clientY, ke();
}
function ve() {
  ee = -1e6, te = -1e6, ke();
}
function Se() {
  be(!0);
}
function yi() {
  !ye || Ae.size > 0 || (window.removeEventListener("pointermove", Tt), window.removeEventListener("blur", ve), document.removeEventListener("pointerleave", ve), window.removeEventListener("pointerdown", Lt), window.removeEventListener("pointerup", we), window.removeEventListener("pointercancel", we), window.removeEventListener("scroll", Se, { capture: !0 }), window.removeEventListener("resize", Se), D && (cancelAnimationFrame(D), D = 0), _ && (cancelAnimationFrame(_), _ = 0), ye = !1, ie = !0);
}
function Lt(s) {
  fe = s.clientX, pe = s.clientY, B = 1, _ || (_ = requestAnimationFrame($e));
}
function we() {
  B = 0, _ || (_ = requestAnimationFrame($e));
}
function $e() {
  _ = 0;
  const s = B > P;
  P += (B - P) * (s ? 0.4 : 0.12), P < 4e-3 && B === 0 && (P = 0), ie && _t();
  for (const e of Array.from(L)) {
    if (!e.isConnected) {
      Ge(e);
      continue;
    }
    const t = O.get(e);
    if (!t || t.width === 0 || t.height === 0) continue;
    const i = Math.max(t.left - fe, 0, fe - t.right), r = Math.max(t.top - pe, 0, pe - t.bottom), n = Math.sqrt(i * i + r * r), o = Math.max(0, 1 - n / pi), a = P * o * o;
    if (a === 0 && (nt.get(e) ?? 0) === 0) continue;
    nt.set(e, a);
    const l = Math.max(0, Math.min(1, (fe - t.left) / t.width)), c = Math.max(0, Math.min(1, (pe - t.top) / t.height));
    e.style.setProperty("--lg-illum", a.toFixed(4)), e.style.setProperty("--lg-illum-x", l.toFixed(4)), e.style.setProperty("--lg-illum-y", c.toFixed(4));
  }
  (P > 0 || B > 0) && (_ = requestAnimationFrame($e));
}
function bi(s) {
  if (typeof window > "u") return;
  Ae.add(s), be();
  const e = mi();
  e ? e.observe(s) : (L.add(s), be()), ye || (window.addEventListener("pointermove", Tt, { passive: !0 }), window.addEventListener("blur", ve), document.addEventListener("pointerleave", ve), window.addEventListener("pointerdown", Lt, { passive: !0 }), window.addEventListener("pointerup", we, { passive: !0 }), window.addEventListener("pointercancel", we, { passive: !0 }), window.addEventListener("scroll", Se, { passive: !0, capture: !0 }), window.addEventListener("resize", Se, { passive: !0 }), ye = !0), ke();
}
function vi(s) {
  Ae.delete(s), L.delete(s), O.delete(s), Z?.unobserve(s), s.style.removeProperty("--lg-glow"), s.style.removeProperty("--lg-pointer-x"), s.style.removeProperty("--lg-pointer-y"), s.style.removeProperty("--lg-illum"), s.style.removeProperty("--lg-illum-x"), s.style.removeProperty("--lg-illum-y"), yi();
}
function Si() {
  return typeof navigator < "u" ? navigator.userAgent : "";
}
function He() {
  return /Android/i.test(Si());
}
function Ee() {
  if (typeof navigator > "u") return !1;
  const s = navigator;
  return s.userAgentData?.mobile === !0 || /Android|iPhone|iPad|iPod|Mobile/i.test(s.userAgent);
}
function Ct() {
  return typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia("(hover: none)").matches;
}
function wi() {
  return typeof navigator < "u" ? navigator.hardwareConcurrency ?? 4 : 4;
}
function xi() {
  return typeof navigator < "u" ? navigator.deviceMemory ?? 4 : 4;
}
function Mi() {
  return typeof window < "u" && window.devicePixelRatio || 1;
}
function Ri(s = {}) {
  const e = s.mobile ?? Ee(), t = s.hardwareConcurrency ?? wi(), i = s.deviceMemory ?? xi(), r = s.devicePixelRatio ?? Mi(), n = s.visibleGlassCount ?? 1;
  if (!e)
    return t <= 4 || i <= 4 ? "balanced" : "high";
  let o = 0;
  (s.android ?? He()) && (o += 1), (s.hoverNone ?? Ct()) && (o += 1), i <= 3 ? o += 3 : i <= 4 ? o += 2 : i <= 6 && (o += 1), t <= 4 ? o += 2 : t <= 6 && (o += 1), r >= 3 ? o += 1.5 : r >= 2.5 && (o += 1), n >= 24 ? o += 2 : n >= 14 && (o += 1);
  const a = s.profile === "auto" ? void 0 : s.profile, l = Math.max(0, s.width ?? 0) * Math.max(0, s.height ?? 0);
  return (a === "card" || a === "panel") && n >= 14 && (o += 1), l >= 14e4 && n >= 8 && (o += 1), o >= 7 ? "low" : "balanced";
}
const Ai = `#version 300 es
in vec2 a_pos;                 // 0..1 over the box
uniform vec2 u_viewport;       // CSS px
uniform vec2 u_box_origin;     // box top-left, CSS px (viewport coords)
uniform vec2 u_box_size;       // CSS px
out vec2 v_uv;
void main() {
  v_uv = a_pos;
  vec2 px = u_box_origin + a_pos * u_box_size;     // viewport px
  vec2 ndc = (px / u_viewport) * 2.0 - 1.0;
  ndc.y = -ndc.y;                                   // screen → clip space
  gl_Position = vec4(ndc, 0.0, 1.0);
}`, ki = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_scene;
uniform sampler2D u_disp;
uniform sampler2D u_spec;
uniform bool  u_hasSpec;
uniform vec2  u_scene_px;
uniform vec2  u_box_origin;
uniform vec2  u_box_size;
uniform float u_pad;
uniform float u_refraction;
uniform float u_blur;
uniform float u_chroma;
uniform float u_sat;
uniform float u_radius;
uniform vec4  u_tint;

vec3 sat(vec3 c, float s) {
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  return mix(vec3(l), c, s);
}

// Signed coverage of a rounded rect, ~1px antialiased edge.
float roundedMask(vec2 p, vec2 half_, float r) {
  vec2 q = abs(p) - (half_ - r);
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  return clamp(0.5 - d, 0.0, 1.0);
}

void main() {
  vec2 half_ = u_box_size * 0.5;
  vec2 p = (v_uv - 0.5) * u_box_size;
  float cover = roundedMask(p, half_, min(u_radius, min(half_.x, half_.y)));
  if (cover < 0.003) { outColor = vec4(0.0); return; }

  // Map box-uv → padded displacement-map uv, decode the encoded shift.
  vec2 padFrac = u_pad / (u_box_size + 2.0 * u_pad);
  vec2 dispUv = mix(padFrac, 1.0 - padFrac, v_uv);
  vec2 shift = (texture(u_disp, dispUv).rg - 0.5078431) * 2.0;
  vec2 shiftPx = shift * u_refraction;

  vec2 sceneUv = (u_box_origin + v_uv * u_box_size + shiftPx) / u_scene_px;
  vec2 ca = shiftPx * u_chroma * 0.6 / u_scene_px;
  vec2 b = vec2(u_blur) / u_scene_px;

  vec3 acc = vec3(0.0);
  float wsum = 0.0;
  for (int i = -2; i <= 2; i++) {
    float w = 1.0 - abs(float(i)) * 0.28;
    vec2 o = vec2(float(i)) * b * 0.6;
    acc.r += texture(u_scene, sceneUv + ca + o).r * w;
    acc.g += texture(u_scene, sceneUv + o).g * w;
    acc.b += texture(u_scene, sceneUv - ca + o).b * w;
    wsum += w;
  }
  vec3 col = acc / wsum;
  col = sat(col, u_sat) * 1.05;
  col = mix(col, u_tint.rgb, u_tint.a);             // glass tint

  if (u_hasSpec) {
    vec4 s = texture(u_spec, v_uv);
    col = 1.0 - (1.0 - col) * (1.0 - s.rgb * s.a);  // screen-blend rim
  }
  outColor = vec4(col * cover, cover);              // premultiplied
}`;
let ot = null, at = !1;
const Ei = He() ? 1 : Ee() ? 1.25 : 2;
function _i() {
  if (!at) {
    at = !0;
    const s = new xe();
    ot = s.usable ? s : null;
  }
  return ot;
}
class xe {
  usable = !1;
  gl = null;
  canvas;
  program = null;
  uloc = {};
  sceneTex = null;
  scenePx = [1, 1];
  boxes = /* @__PURE__ */ new Set();
  rafPending = !1;
  boundScene = null;
  constructor(e = -1) {
    this.canvas = document.createElement("canvas"), this.canvas.setAttribute("aria-hidden", "true"), this.canvas.style.cssText = `position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:${e};`;
    try {
      const t = this.canvas.getContext("webgl2", { premultipliedAlpha: !0, alpha: !0, antialias: !1 });
      if (!t || (this.gl = t, !this.initProgram())) return;
      this.usable = !0, window.addEventListener("scroll", this.requestRender, { passive: !0, capture: !0 }), window.addEventListener("resize", this.onResize, { passive: !0 });
    } catch {
    }
  }
  initProgram() {
    const e = this.gl, t = this.compile(e.VERTEX_SHADER, Ai), i = this.compile(e.FRAGMENT_SHADER, ki);
    if (!t || !i) return !1;
    const r = e.createProgram();
    if (e.attachShader(r, t), e.attachShader(r, i), e.linkProgram(r), !e.getProgramParameter(r, e.LINK_STATUS))
      return console.warn("[liquid-glass] WebGL link error:", e.getProgramInfoLog(r)), !1;
    this.program = r, e.useProgram(r);
    const n = e.createBuffer();
    e.bindBuffer(e.ARRAY_BUFFER, n), e.bufferData(e.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), e.STATIC_DRAW);
    const o = e.getAttribLocation(r, "a_pos");
    e.enableVertexAttribArray(o), e.vertexAttribPointer(o, 2, e.FLOAT, !1, 0, 0);
    for (const a of [
      "u_scene",
      "u_disp",
      "u_spec",
      "u_hasSpec",
      "u_scene_px",
      "u_box_origin",
      "u_box_size",
      "u_pad",
      "u_refraction",
      "u_blur",
      "u_chroma",
      "u_sat",
      "u_radius",
      "u_tint",
      "u_viewport"
    ])
      this.uloc[a] = e.getUniformLocation(r, a);
    return !0;
  }
  compile(e, t) {
    const i = this.gl, r = i.createShader(e);
    return i.shaderSource(r, t), i.compileShader(r), i.getShaderParameter(r, i.COMPILE_STATUS) ? r : (console.warn("[liquid-glass] WebGL shader error:", i.getShaderInfoLog(r)), null);
  }
  static sceneSource(e) {
    return e instanceof HTMLCanvasElement && e.width && e.height || e instanceof HTMLImageElement && e.complete && e.naturalWidth || e instanceof HTMLVideoElement && e.readyState >= 2 ? e : null;
  }
  /** Register a glass box against the shared scene. Returns null (→ caller uses
   * the CSS fallback) if the scene isn't uploadable or differs from the bound
   * one. The refractor's `canvas` must be in the DOM (the caller appends it). */
  register(e, t, i) {
    if (!this.usable) return null;
    if (this.boundScene) {
      if (this.boundScene !== t)
        return null;
    } else {
      if (!xe.sceneSource(t)) return null;
      this.boundScene = t, this.recaptureScene();
    }
    const r = { el: e, getParams: i, cached: null, dispTex: null, specTex: null, dispUrl: "", specUrl: null, refreshId: 0 };
    return this.boxes.add(r), this.refresh(r).catch(() => {
      this.boxes.delete(r);
    }), {
      refresh: () => {
        this.refresh(r).catch(() => {
          this.requestRender();
        });
      },
      destroy: () => {
        this.boxes.delete(r);
        const n = this.gl;
        n && (r.dispTex && n.deleteTexture(r.dispTex), r.specTex && n.deleteTexture(r.specTex)), this.requestRender();
      }
    };
  }
  /** Recompute a box's cached params + (re)load its map textures. Cheap; called
   * on register and when size/options change — NOT per frame. */
  async refresh(e) {
    const t = ++e.refreshId, i = await e.getParams();
    !this.boxes.has(e) || t !== e.refreshId || (e.cached = i, i.displacementMapUrl !== e.dispUrl && (e.dispUrl = i.displacementMapUrl, this.uploadFromUrl(i.displacementMapUrl, (r) => {
      e.dispTex = r, this.requestRender();
    })), i.specularMapUrl !== e.specUrl && (e.specUrl = i.specularMapUrl, i.specularMapUrl ? this.uploadFromUrl(i.specularMapUrl, (r) => {
      e.specTex = r, this.requestRender();
    }) : e.specTex = null), this.requestRender());
  }
  recaptureScene() {
    if (!this.gl || !this.boundScene) return;
    const e = xe.sceneSource(this.boundScene);
    if (!e) return;
    const t = this.boundScene.getBoundingClientRect();
    this.scenePx = [Math.max(1, t.width || window.innerWidth), Math.max(1, t.height || window.innerHeight)], this.sceneTex = this.uploadImage(e, this.sceneTex), this.requestRender();
  }
  /** Refresh the texture after the app repaints the scene (e.g. animated bg). */
  refreshScene() {
    this.recaptureScene();
  }
  uploadImage(e, t) {
    const i = this.gl, r = t ?? i.createTexture();
    return i.bindTexture(i.TEXTURE_2D, r), i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL, 1), i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0), i.texImage2D(i.TEXTURE_2D, 0, i.RGBA, i.RGBA, i.UNSIGNED_BYTE, e), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_MIN_FILTER, i.LINEAR), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_MAG_FILTER, i.LINEAR), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_WRAP_S, i.CLAMP_TO_EDGE), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_WRAP_T, i.CLAMP_TO_EDGE), r;
  }
  uploadFromUrl(e, t) {
    const i = new Image();
    i.onload = () => t(this.uploadImage(i, null)), i.onerror = () => t(null), i.src = e;
  }
  onResize = () => {
    this.recaptureScene(), this.requestRender();
  };
  requestRender = () => {
    this.rafPending || !this.usable || (this.rafPending = !0, requestAnimationFrame(() => {
      this.rafPending = !1, this.render();
    }));
  };
  render() {
    const e = this.gl;
    if (!e || !this.program || !this.sceneTex) return;
    const t = Math.min(Ei, window.devicePixelRatio || 1), i = window.innerWidth, r = window.innerHeight, n = Math.round(i * t), o = Math.round(r * t);
    (this.canvas.width !== n || this.canvas.height !== o) && (this.canvas.width = n, this.canvas.height = o), e.viewport(0, 0, n, o), e.clearColor(0, 0, 0, 0), e.clear(e.COLOR_BUFFER_BIT), e.useProgram(this.program), e.enable(e.BLEND), e.blendFunc(e.ONE, e.ONE_MINUS_SRC_ALPHA), e.activeTexture(e.TEXTURE0), e.bindTexture(e.TEXTURE_2D, this.sceneTex), e.uniform1i(this.uloc.u_scene, 0), e.uniform2f(this.uloc.u_scene_px, this.scenePx[0], this.scenePx[1]), e.uniform2f(this.uloc.u_viewport, i, r);
    for (const a of this.boxes) {
      if (!a.dispTex || !a.cached) continue;
      const l = a.el.getBoundingClientRect();
      if (l.right < 0 || l.bottom < 0 || l.left > i || l.top > r || l.width < 1 || l.height < 1) continue;
      const c = a.cached;
      e.activeTexture(e.TEXTURE1), e.bindTexture(e.TEXTURE_2D, a.dispTex), e.uniform1i(this.uloc.u_disp, 1), e.activeTexture(e.TEXTURE2), e.bindTexture(e.TEXTURE_2D, a.specTex ?? a.dispTex), e.uniform1i(this.uloc.u_spec, 2), e.uniform1i(this.uloc.u_hasSpec, a.specTex ? 1 : 0), e.uniform2f(this.uloc.u_box_origin, l.left, l.top), e.uniform2f(this.uloc.u_box_size, l.width, l.height), e.uniform1f(this.uloc.u_pad, c.displacementPadding), e.uniform1f(this.uloc.u_refraction, c.refraction), e.uniform1f(this.uloc.u_blur, c.blur), e.uniform1f(this.uloc.u_chroma, c.chromaticAberration), e.uniform1f(this.uloc.u_sat, c.saturation / 100), e.uniform1f(this.uloc.u_radius, c.radius), e.uniform4f(this.uloc.u_tint, c.tint[0], c.tint[1], c.tint[2], c.tint[3]), e.drawArrays(e.TRIANGLE_STRIP, 0, 4);
    }
  }
}
const q = [];
let qe = !1;
const Ti = 6;
function lt() {
  return typeof performance < "u" && typeof performance.now == "function" ? performance.now() : Date.now();
}
function Pe() {
  qe = !1;
  const s = lt();
  do {
    const e = q.shift();
    if (!e) break;
    try {
      Promise.resolve(e()).catch(() => {
      });
    } catch {
    }
  } while (q.length && lt() - s < Ti);
  q.length && Pt();
}
function Pt() {
  qe || (qe = !0, typeof requestIdleCallback == "function" ? requestIdleCallback(() => Pe(), { timeout: 250 }) : typeof requestAnimationFrame == "function" ? requestAnimationFrame(() => Pe()) : setTimeout(Pe, 16));
}
function Li(s) {
  return q.push(s), Pt(), () => {
    const e = q.indexOf(s);
    e >= 0 && q.splice(e, 1);
  };
}
let ce = null;
const Y = /* @__PURE__ */ new Map();
function Ci(s, e) {
  if (typeof ResizeObserver > "u") return null;
  ce || (ce = new ResizeObserver((i) => {
    for (const r of i) {
      const n = Y.get(r.target);
      if (n)
        for (const o of n) o(r);
    }
  }));
  let t = Y.get(s);
  return t || (t = /* @__PURE__ */ new Set(), Y.set(s, t), ce.observe(s, { box: "border-box" })), t.add(e), () => {
    const i = Y.get(s);
    i && (i.delete(e), i.size === 0 && (Y.delete(s), ce?.unobserve(s)));
  };
}
const Fe = /* @__PURE__ */ new Map();
function ct(s, e, t = {}) {
  if (typeof IntersectionObserver > "u") return null;
  const i = Pi(t);
  let r = Fe.get(i);
  if (!r) {
    const o = /* @__PURE__ */ new Map();
    r = { observer: new IntersectionObserver((l) => {
      for (const c of l) {
        const u = o.get(c.target);
        if (u)
          for (const f of u) f(c);
      }
    }, t), targets: o }, Fe.set(i, r);
  }
  let n = r.targets.get(s);
  return n || (n = /* @__PURE__ */ new Set(), r.targets.set(s, n), r.observer.observe(s)), n.add(e), () => {
    const o = r?.targets.get(s);
    !o || !r || (o.delete(e), o.size === 0 && (r.targets.delete(s), r.observer.unobserve(s)), r.targets.size === 0 && (r.observer.disconnect(), Fe.delete(i)));
  };
}
function Pi(s) {
  const e = s.rootMargin ?? "0px", t = Array.isArray(s.threshold) ? s.threshold.join(",") : s.threshold ?? 0;
  return `${e}|${t}`;
}
const Fi = {
  regular: {
    light: "rgba(255, 255, 255, 0.14)",
    // light, transparent — content shines through
    dark: "rgba(0, 0, 0, 0.2)"
  },
  clear: {
    light: "rgba(255, 255, 255, 0.04)",
    dark: "rgba(0, 0, 0, 0.04)"
  },
  tinted: {
    // Legacy shortcut. Official Apple guidance uses Regular/Clear plus tinting.
    light: "rgba(255, 255, 255, 0.32)",
    dark: "rgba(30, 30, 36, 0.42)"
  }
}, Ii = {
  regular: 4.5,
  // light frost — kept low so the backdrop keeps structure to bend
  clear: 2.5,
  // near-transparent for bold media
  tinted: 11
}, g = {
  radius: 22,
  // Apple's standard corner radius
  thickness: 44,
  // lens depth — drives how pronounced/thick the edge lensing is
  refraction: 46,
  // edge lensing strength (px) — concentrated at the border
  chromaticAberration: 0.03,
  // light frost, backdrop reads through so the lensing is visible
  saturation: 150,
  // gentle lift, backdrop stays close to natural
  variant: "regular",
  profile: "auto",
  preset: "auto",
  scheme: "auto",
  specular: !0,
  specularIntensity: 0.5,
  edges: !0,
  refractBackground: null,
  backdropSource: null,
  applyRadius: !0,
  mapPixelRatio: 2,
  quality: "auto",
  lazy: !1,
  lazyMargin: "200px",
  root: null,
  fallbackFilter: "blur(20px) saturate(1.8)",
  respectReducedMotion: !0
}, Bi = 80, Di = 0.2, qi = 0.15, zi = 0.3, Ui = 0.65, Oi = 0.3, Wi = 0.6, Ni = 200, Gi = 0.32, ut = {
  // Navigation bar / header — functional layer, content is the hero. Quiet
  // lensing, but a legibility frost that holds even when the bar is short.
  bar: {
    thickness: 0.42,
    refraction: 0.3,
    blur: 0.95,
    specular: 0.5,
    shadow: 0.7,
    blurReferenceShortSide: 150,
    minBlurScale: 0.72
  },
  // Small controls (buttons, switches, sliders, media controls) — thinner glass
  // ⇒ less pronounced lensing than a card; clear so bold symbols/content shine
  // through (low frost).
  control: {
    thickness: 0.9,
    refraction: 0.9,
    blur: 0.75,
    specular: 1,
    shadow: 0.65,
    blurReferenceShortSide: 140,
    minBlurScale: 0.45
  },
  // Cards — the reference (separation without competing with content).
  card: {
    thickness: 1,
    refraction: 1,
    blur: 1,
    specular: 1,
    shadow: 1,
    blurReferenceShortSide: Ni,
    minBlurScale: Gi
  },
  // Large sidebars, sheets, menus, panels — thicker, more substantial material:
  // MORE pronounced lensing/refraction, a softer (heavier) scatter, richer
  // highlights. The lens stays edge-concentrated so the large body still reads.
  panel: {
    thickness: 1.2,
    refraction: 1.18,
    blur: 1.15,
    specular: 1.12,
    shadow: 1.5,
    blurReferenceShortSide: 260,
    minBlurScale: 0.5
  },
  // Selected capsule — lifted from the same plane, slightly below a card so it
  // never becomes a separate glass-on-glass object.
  selection: {
    thickness: 0.95,
    refraction: 0.88,
    blur: 0.9,
    specular: 1,
    shadow: 0.6,
    blurReferenceShortSide: 150,
    minBlurScale: 0.55
  }
}, $i = {
  subtle: {
    thickness: 0.82,
    refraction: 0.78,
    blur: 0.82,
    specular: 0.78
  },
  balanced: {
    thickness: 1,
    refraction: 1,
    blur: 1,
    specular: 1
  },
  vivid: {
    thickness: 1.08,
    refraction: 1.12,
    blur: 1.08,
    specular: 1.14
  },
  dramatic: {
    thickness: 1.18,
    refraction: 1.28,
    blur: 1.16,
    specular: 1.28
  }
}, ht = typeof navigator < "u" && /Chrome\//.test(navigator.userAgent), Hi = typeof CSS < "u" && typeof CSS.supports == "function" && CSS.supports("background-image", "-moz-element(#lg)"), R = Ee(), Xi = He(), dt = Ct();
let Qi = 0;
const Ie = /* @__PURE__ */ new Set();
let ft = !1;
function Yi(s) {
  return Ie.add(s), !ft && typeof window < "u" && (ft = !0, window.addEventListener(
    "resize",
    () => {
      for (const e of Ie)
        try {
          e();
        } catch {
        }
    },
    { passive: !0 }
  )), () => Ie.delete(s);
}
const me = /* @__PURE__ */ new Set();
let pt = !1, ue = null, mt = typeof window < "u" ? window.scrollY : 0, Be = 0, Me = 0, se = !1, he = null;
const gt = 320, Ki = 1.15, Vi = 650, ji = 2500, yt = 180;
function _e() {
  return typeof performance < "u" && typeof performance.now == "function" ? performance.now() : Date.now();
}
function Zi() {
  return _e() < Me;
}
function ze(s = Vi) {
  Me = Math.max(Me, _e() + s);
}
function Ji(s) {
  const e = _e();
  if (typeof window < "u") {
    const t = window.scrollY;
    if (Be > 0) {
      const i = Math.max(1, e - Be);
      Math.abs(t - mt) / i >= Ki && ze();
    }
    mt = t, Be = e;
  }
  typeof WheelEvent < "u" && s instanceof WheelEvent && Math.abs(s.deltaY) >= 90 && ze();
}
function Ft() {
  if (typeof window > "u") return;
  ue !== null && window.clearTimeout(ue);
  const s = Zi() ? Math.max(gt, Me - _e()) : gt;
  ue = window.setTimeout(() => {
    ue = null, se = !1, Re(!0);
  }, s);
}
function K(s) {
  me.size !== 0 && (Ji(s), se = !0, Ft());
}
function es() {
  if (!(he || typeof PerformanceObserver > "u" || typeof window > "u"))
    try {
      he = new PerformanceObserver((s) => {
        s.getEntries().length !== 0 && (ze(ji), se && Ft());
      }), he.observe({ entryTypes: ["longtask"] });
    } catch {
      he = null;
    }
}
function bt(s) {
  if (me.add(s), !pt && typeof window < "u") {
    pt = !0, es();
    const e = (t) => {
      t.pointerType !== "mouse" && K(t);
    };
    window.addEventListener(
      "scroll",
      K,
      { passive: !0, capture: !0 }
    ), window.addEventListener("touchstart", K, { passive: !0, capture: !0 }), window.addEventListener("touchmove", K, { passive: !0, capture: !0 }), window.addEventListener("pointerdown", e, { passive: !0, capture: !0 }), window.addEventListener("wheel", K, { passive: !0, capture: !0 });
  }
  return () => {
    me.delete(s), me.size;
  };
}
const J = /* @__PURE__ */ new Set(), It = R ? 180 : 96, ts = R ? 220 : 140;
let vt = !1, De = 0, z = null, F = null, St = 0;
function is() {
  for (const s of J)
    try {
      s();
    } catch {
    }
}
function Re(s = !1) {
  if (typeof window > "u" || typeof requestAnimationFrame != "function" || se && !s) return;
  const e = typeof performance < "u" ? performance.now() : Date.now(), t = It - (e - St);
  if (!s && t > 0) {
    z === null && (z = window.setTimeout(() => {
      z = null, Re(!0);
    }, t));
    return;
  }
  De || (De = requestAnimationFrame(() => {
    De = 0, St = typeof performance < "u" ? performance.now() : Date.now(), is();
  }));
}
function ss(s) {
  return J.add(s), !vt && typeof window < "u" && (vt = !0, window.addEventListener(
    "scroll",
    () => {
      J.size !== 0 && (Re(!1), F !== null && window.clearTimeout(F), F = window.setTimeout(() => {
        F = null, !se && Re(!0);
      }, ts));
    },
    { passive: !0, capture: !0 }
  )), () => {
    J.delete(s), J.size === 0 && (z !== null && window.clearTimeout(z), F !== null && window.clearTimeout(F), z = null, F = null);
  };
}
function rs(s) {
  const e = s.match(/rgba?\(([^)]+)\)/);
  if (!e) return null;
  const t = e[1].split(",").map((r) => parseFloat(r));
  return (t.length > 3 ? t[3] : 1) >= 0.5 ? (0.2126 * t[0] + 0.7152 * t[1] + 0.0722 * t[2]) / 255 : null;
}
function A(s) {
  return String(Math.round(s * 1e3) / 1e3);
}
function ns(s) {
  const e = s.match(/rgba?\(([^)]+)\)/);
  if (!e) return [1, 1, 1, 0];
  const t = e[1].split(",").map((i) => parseFloat(i));
  return [(t[0] || 0) / 255, (t[1] || 0) / 255, (t[2] || 0) / 255, t[3] == null ? 1 : t[3]];
}
function os(s) {
  return s.id || (s.id = `lg-scene-${++Qi}`), s.id;
}
function as(s) {
  s.removeAttribute("id"), s.setAttribute("aria-hidden", "true"), s.setAttribute("inert", ""), s.style.pointerEvents = "none", s.querySelectorAll("[id]").forEach((e) => e.removeAttribute("id"));
}
class S {
  static autoQualityInstances = /* @__PURE__ */ new Set();
  static autoQualityRaf = 0;
  static requestAutoQualityRecalc() {
    S.autoQualityRaf || typeof requestAnimationFrame != "function" || (S.autoQualityRaf = requestAnimationFrame(() => {
      S.autoQualityRaf = 0;
      const e = Array.from(S.autoQualityInstances).filter(
        (t) => t.autoQualityVisible && !t.destroyed && !t.suspended
      ).length;
      for (const t of S.autoQualityInstances)
        t.destroyed || t.refreshAutoQuality(e);
    }));
  }
  element;
  options;
  quality;
  root;
  filter = null;
  unsubElementResize = null;
  unsubLazyIntersection = null;
  unsubAutoQualityIntersection = null;
  mqlScheme = null;
  mqlListener = null;
  currentWidth = 0;
  currentHeight = 0;
  destroyed = !1;
  suspended = !1;
  usesFallback = !1;
  /** True when prefers-reduced-transparency is honored — keep the glass calm. */
  reducedTransparency = !1;
  /** Injected child layer for the enhanced fallback (specular rim / refraction). */
  fxLayer = null;
  /** Brief frost veil used to hide CSS-frost → SVG-filter restore snaps. */
  scrollSafeLayer = null;
  scrollSafeLayerTimer = null;
  /** backdropSource refraction state (Firefox -moz-element / Safari DOM clone). */
  backdropSceneEl = null;
  refractClone = null;
  backdropMode = null;
  backdropSyncRaf = 0;
  /** Primary GPU refraction (shared WebGL canvas) is active for this element. */
  usesGpu = !1;
  gpuHandle = null;
  /** Tracks devicePixelRatio so a browser-zoom / monitor switch re-bakes maps. */
  lastDpr = typeof window < "u" && window.devicePixelRatio || 1;
  /** Cancels a queued (time-sliced) initial build if it hasn't run yet. */
  pendingBuild = null;
  /** Unsubscribe from the shared window-resize listener. */
  unsubResize = null;
  /** Unsubscribe from the shared mobile scroll-safe listener. */
  unsubScrollSafe = null;
  /** Unsubscribe from the shared backdrop sampling listener. */
  unsubBackdropSampling = null;
  regenTimer = null;
  /** Invalidates async map encodes that finish after a newer build wins. */
  buildGeneration = 0;
  /** Backdrop-aware shadow multiplier (1 = neutral; >1 darker backdrop). */
  shadowAdapt = 1;
  /** Resolved light/dark for scheme:'adaptive' (null = fall back to OS). */
  resolvedAdaptiveScheme = null;
  backdropSampleKey = "";
  backdropSampleAt = 0;
  backdropSampleLum = null;
  autoQualityVisible = !0;
  scrollSafeMode = "svg";
  scrollSafeSubscriber = {
    setMode: (e) => this.setScrollSafeMode(e),
    restoreScore: () => this.scrollSafeRestoreScore()
  };
  constructor(e, t = {}) {
    this.element = e, this.options = this.resolve(t), this.quality = "balanced", this.root = this.resolveRoot();
    const i = getComputedStyle(e);
    i.position === "static" && (e.style.position = "relative"), i.isolation !== "isolate" && (e.style.isolation = "isolate"), i.overflow === "visible" && (e.style.overflow = "hidden");
    const r = e.getBoundingClientRect();
    this.currentWidth = Math.max(1, r.width), this.currentHeight = Math.max(1, r.height), this.quality = this.resolveQuality(1), this.applyTint(), this.options.applyRadius && (e.style.borderRadius = `${this.computedRadius()}px`), this.reducedTransparency = this.options.respectReducedMotion && typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-transparency: reduce)").matches, this.usesFallback = this.shouldFallback(), this.usesFallback && !this.reducedTransparency && this.tryInstallGpu() ? this.usesGpu = !0 : this.usesFallback ? this.applyFallback() : this.options.lazy && typeof IntersectionObserver < "u" ? this.setupLazy() : this.scheduleBuild(() => this.installFilter()), this.unsubElementResize = Ci(e, this.onElementResize), this.unsubResize = Yi(this.onWindowResize), this.options.quality === "auto" && this.setupAutoQualityTracking(), this.shouldUseScrollSafe() && (this.unsubScrollSafe = bt(this.scrollSafeSubscriber)), this.options.scheme === "auto" && typeof window.matchMedia == "function" && (this.mqlScheme = window.matchMedia("(prefers-color-scheme: dark)"), this.mqlListener = () => this.applyTint(), this.mqlScheme.addEventListener("change", this.mqlListener)), !this.reducedTransparency && !dt && bi(this.element), !this.reducedTransparency && typeof requestAnimationFrame == "function" && requestAnimationFrame(() => {
      this.destroyed || this.adaptToBackdrop();
    }), this.refreshBackdropSamplingSubscription();
  }
  update(e) {
    const t = this.options, i = this.quality;
    if (this.options = this.resolve({ ...this.optionsAsInput(), ...e }), this.quality = this.resolveQuality(this.currentVisibleAutoQualityCount()), t.quality !== this.options.quality && (this.options.quality === "auto" ? this.setupAutoQualityTracking() : this.teardownAutoQualityTracking()), this.applyTint(), this.refreshBackdropSamplingSubscription(), this.options.applyRadius && (this.element.style.borderRadius = `${this.computedRadius()}px`), i !== this.quality || t.specular !== this.options.specular || this.usesFallback !== this.shouldFallback()) {
      this.rebuild();
      return;
    }
    if (i !== this.quality && this.refreshScrollSafeSubscription(), this.usesGpu) {
      this.gpuHandle?.refresh();
      return;
    }
    this.filter && (this.filter.updateBlur(this.effectiveBlur()), this.filter.updateRefraction(this.effectiveRefraction()), this.filter.updateSaturation(this.options.saturation)), (t.radius !== this.options.radius || t.thickness !== this.options.thickness || t.profile !== this.options.profile || t.preset !== this.options.preset || t.specularIntensity !== this.options.specularIntensity || Math.max(
      8,
      Math.ceil(
        t.refraction * this.opticalTuningFor(t.profile).refraction * this.presetTuningFor(t.preset, t.profile).refraction
      )
    ) !== Math.max(8, Math.ceil(this.profiledRefraction()))) && this.scheduleRegen();
  }
  /**
   * Re-read the backdrop and re-resolve the content-aware shadow and, for
   * `scheme: 'adaptive'`, the light/dark appearance. The engine already does
   * this on layout and on scroll; call it manually when the content *behind* a
   * stationary adaptive element changes (a theme swap, a background image load,
   * a recolored hero) and you want the glass to glide to the new appearance.
   * Works on the fallback path too; only the reduced-transparency path opts out.
   */
  syncToBackdrop() {
    this.adaptToBackdrop(!0);
  }
  /**
   * Live-override the lensing (displacement) strength in px WITHOUT rebuilding
   * the maps — a cheap per-frame GPU attribute change for morph / materialize
   * animations (e.g. `LiquidMenu` ramping the refraction as the menu grows).
   * Pass `null` to restore the configured value.
   */
  flexRefraction(e) {
    this.filter && this.filter.updateRefraction(e == null ? this.effectiveRefraction() : Math.max(0, e));
  }
  get resolved() {
    const e = this.resolveOpticalProfile(), t = this.resolveMaterialPreset();
    return {
      profile: e,
      preset: t,
      variant: this.options.variant,
      scheme: this.resolveScheme(),
      radius: this.computedRadius(),
      thickness: this.computedThickness(),
      refraction: this.effectiveRefraction(),
      blur: this.effectiveBlur(),
      saturation: this.options.saturation,
      specularIntensity: this.profiledSpecularIntensity(),
      tint: this.options.tint ?? this.variantTint(),
      usesFallback: this.usesFallback,
      quality: this.quality,
      width: this.currentWidth,
      height: this.currentHeight
    };
  }
  /** The configured (size-capped) lensing strength in px. */
  get configuredRefraction() {
    return this.effectiveRefraction();
  }
  /** Detach the GPU filter but keep the instance alive (cheap show/hide). */
  suspend() {
    this.suspended || this.destroyed || (this.setScrollSafeMode("svg"), this.suspended = !0, this.cancelPendingBuild(), this.removeScrollSafeTransitionLayer(), this.removeFallbackFx(), this.teardownGpu(), this.element.style.backdropFilter = "none", this.element.style.webkitBackdropFilter = "none");
  }
  /** Re-attach the previously built filter. No pixel work if size is unchanged. */
  resume() {
    if (!(!this.suspended || this.destroyed)) {
      if (this.suspended = !1, this.usesFallback && !this.reducedTransparency && this.tryInstallGpu())
        this.usesGpu = !0;
      else if (this.usesFallback)
        this.applyFallback();
      else if (this.filter) {
        const e = this.filter.url;
        this.element.style.backdropFilter = e, this.element.style.webkitBackdropFilter = e;
      } else
        this.installFilter();
      this.refreshScrollSafeSubscription(), S.requestAutoQualityRecalc();
    }
  }
  destroy() {
    this.destroyed || (this.destroyed = !0, this.regenTimer !== null && (clearTimeout(this.regenTimer), this.regenTimer = null), this.unsubElementResize?.(), this.unsubElementResize = null, this.unsubLazyIntersection?.(), this.unsubLazyIntersection = null, this.teardownAutoQualityTracking(), this.mqlScheme && this.mqlListener && this.mqlScheme.removeEventListener("change", this.mqlListener), this.unsubBackdropSampling?.(), this.unsubBackdropSampling = null, this.unsubResize?.(), this.unsubResize = null, this.unsubScrollSafe?.(), this.unsubScrollSafe = null, this.setScrollSafeMode("svg"), this.cancelPendingBuild(), this.removeScrollSafeTransitionLayer(), this.removeFallbackFx(), this.teardownGpu(), this.filter?.destroy(), this.filter = null, vi(this.element), this.element.style.backdropFilter = "", this.element.style.webkitBackdropFilter = "", this.options.edges && (this.element.style.boxShadow = ""));
  }
  // ── internals ────────────────────────────────────────────────────────────
  resolveQuality(e = 1) {
    return this.options.quality !== "auto" ? this.options.quality : Ri({
      mobile: R,
      android: Xi,
      hoverNone: dt,
      hardwareConcurrency: typeof navigator < "u" ? navigator.hardwareConcurrency : void 0,
      deviceMemory: typeof navigator < "u" ? navigator.deviceMemory : void 0,
      devicePixelRatio: typeof window < "u" ? window.devicePixelRatio || 1 : void 0,
      visibleGlassCount: e,
      profile: this.resolveOpticalProfile(),
      width: this.currentWidth,
      height: this.currentHeight
    });
  }
  currentVisibleAutoQualityCount() {
    return Math.max(
      1,
      Array.from(S.autoQualityInstances).filter(
        (e) => e.autoQualityVisible && !e.destroyed && !e.suspended
      ).length
    );
  }
  setupAutoQualityTracking() {
    if (S.autoQualityInstances.add(this), !!R) {
      if (this.unsubAutoQualityIntersection || typeof IntersectionObserver > "u") {
        S.requestAutoQualityRecalc();
        return;
      }
      this.unsubAutoQualityIntersection = ct(
        this.element,
        (e) => {
          const t = e.isIntersecting;
          this.autoQualityVisible !== t && (this.autoQualityVisible = t, S.requestAutoQualityRecalc());
        },
        { rootMargin: "0px" }
      ), S.requestAutoQualityRecalc();
    }
  }
  teardownAutoQualityTracking() {
    S.autoQualityInstances.delete(this), this.unsubAutoQualityIntersection?.(), this.unsubAutoQualityIntersection = null, this.autoQualityVisible = !0, S.requestAutoQualityRecalc();
  }
  refreshAutoQuality(e) {
    if (this.options.quality !== "auto") return;
    const t = this.resolveQuality(e);
    t !== this.quality && (this.quality = t, this.rebuild());
  }
  shouldUseScrollSafe() {
    if (!R || !ht || this.options.quality !== "auto" || this.reducedTransparency || this.usesFallback || this.usesGpu || this.suspended) return !1;
    const e = this.resolveOpticalProfile(), t = Math.min(this.currentWidth, this.currentHeight), i = this.currentWidth * this.currentHeight;
    return e === "control" || e === "selection" ? t >= 64 && i >= 24e3 : e === "bar" ? t >= 56 && i >= 32e3 : e === "card" || e === "panel";
  }
  refreshScrollSafeSubscription() {
    const e = this.shouldUseScrollSafe();
    e && !this.unsubScrollSafe ? this.unsubScrollSafe = bt(this.scrollSafeSubscriber) : !e && this.unsubScrollSafe && (this.unsubScrollSafe(), this.unsubScrollSafe = null, this.setScrollSafeMode("svg"));
  }
  refreshBackdropSamplingSubscription() {
    const e = this.options.scheme === "adaptive" && !this.reducedTransparency;
    e && !this.unsubBackdropSampling ? this.unsubBackdropSampling = ss(this.onBackdropScroll) : !e && this.unsubBackdropSampling && (this.unsubBackdropSampling(), this.unsubBackdropSampling = null);
  }
  scrollSafeRestoreScore() {
    if (this.destroyed || this.suspended || !this.filter) return -1e6;
    if (typeof window > "u") return 0;
    const e = this.element.getBoundingClientRect(), t = window.innerWidth || 1, i = window.innerHeight || 1, r = Math.max(0, Math.min(e.right, t) - Math.max(e.left, 0)), n = Math.max(0, Math.min(e.bottom, i) - Math.max(e.top, 0)), o = r * n;
    if (o <= 0) return -1e6;
    const a = Math.max(1, e.width * e.height), l = o / a, c = e.left + e.width / 2, u = e.top + e.height / 2, f = Math.hypot(
      (c - t / 2) / t,
      (u - i / 2) / i
    ), d = this.resolveOpticalProfile(), p = d === "control" || d === "selection" ? 80 : d === "bar" ? 70 : d === "card" ? 35 : 25, h = Math.min(40, a / 12e3);
    return p + l * 60 - f * 45 - h;
  }
  scrollSafeCssForMode(e) {
    return e === "frost" ? this.profiledFallbackFilter() : this.filter?.url ?? "none";
  }
  setScrollSafeMode(e) {
    if (e === this.scrollSafeMode) return;
    const t = this.scrollSafeMode;
    if (this.scrollSafeMode = e, this.destroyed || this.suspended || this.usesFallback || this.usesGpu || e === "svg" && !this.filter) return;
    t === "frost" && e === "svg" ? this.startScrollSafeTransitionLayer(this.profiledFallbackFilter()) : e === "frost" && this.removeScrollSafeTransitionLayer();
    const i = this.scrollSafeCssForMode(e);
    this.element.style.backdropFilter = i, this.element.style.webkitBackdropFilter = i;
  }
  startScrollSafeTransitionLayer(e) {
    if (this.reducedTransparency || typeof window > "u") return;
    this.scrollSafeLayerTimer !== null && (window.clearTimeout(this.scrollSafeLayerTimer), this.scrollSafeLayerTimer = null);
    let t = this.scrollSafeLayer;
    t || (t = document.createElement("div"), t.className = "lg-scroll-safe-layer", t.setAttribute("aria-hidden", "true"), this.element.insertBefore(t, this.element.firstChild), this.scrollSafeLayer = t), t.style.transition = "none", t.style.opacity = "1", t.style.setProperty("--lg-scroll-safe-filter", e), t.style.setProperty("--lg-scroll-safe-duration", `${yt}ms`), t.style.setProperty(
      "--lg-scroll-safe-tint",
      this.element.style.backgroundColor || this.options.tint || this.variantTint()
    ), requestAnimationFrame(() => {
      this.scrollSafeLayer === t && (t.style.transition = "", t.style.opacity = "0");
    }), this.scrollSafeLayerTimer = window.setTimeout(() => {
      this.scrollSafeLayer === t && (t.remove(), this.scrollSafeLayer = null), this.scrollSafeLayerTimer = null;
    }, yt + 80);
  }
  removeScrollSafeTransitionLayer() {
    this.scrollSafeLayerTimer !== null && typeof window < "u" && (window.clearTimeout(this.scrollSafeLayerTimer), this.scrollSafeLayerTimer = null), this.scrollSafeLayer?.remove(), this.scrollSafeLayer = null;
  }
  resolveRoot() {
    if (this.options.root) return this.options.root;
    const e = this.element.getRootNode();
    return e instanceof ShadowRoot ? e : document;
  }
  shouldFallback() {
    return !!(!ht || this.quality === "low" || this.options.respectReducedMotion && typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-transparency: reduce)").matches);
  }
  /** Queue an expensive build (map gen / specular) on the time-sliced scheduler,
   * cancelling any build already pending for this element. */
  scheduleBuild(e) {
    this.cancelPendingBuild(), this.pendingBuild = Li(() => {
      if (this.pendingBuild = null, !this.destroyed && !this.suspended) return e();
    });
  }
  cancelPendingBuild() {
    this.buildGeneration++, this.pendingBuild && (this.pendingBuild(), this.pendingBuild = null);
  }
  isBuildCurrent(e) {
    return !this.destroyed && !this.suspended && e === this.buildGeneration;
  }
  applyFallback() {
    this.usesFallback = !0;
    const e = this.options.fallbackFilter === g.fallbackFilter ? this.profiledFallbackFilter() : this.options.fallbackFilter;
    this.element.style.backdropFilter = e, this.element.style.webkitBackdropFilter = e, this.fallbackEnhanced() && this.scheduleBuild(() => this.installFallbackFx());
  }
  profiledFallbackFilter() {
    const e = Math.max(4, Math.min(22, this.effectiveBlur() * 1.45)), t = Math.max(1, Math.min(2, this.options.saturation / 100));
    return `blur(${A(e)}px) saturate(${A(t)})`;
  }
  /** Enhancements active on the fallback path (Safari/Firefox), but not for the
   * deliberately-calm reduced-transparency path. */
  fallbackEnhanced() {
    return this.usesFallback && !this.reducedTransparency && this.quality !== "low";
  }
  /**
   * Bring the Safari/Firefox fallback as close to Liquid Glass as the platform
   * allows. Two layers, injected as a single inset child behind the content:
   *   • refraction — if `refractBackground` is set, a copy of the page's fixed
   *     backdrop displaced by the SAME SVG filter, applied as a regular
   *     `filter:` (which Safari supports). This is real lensing of that
   *     backdrop. Otherwise…
   *   • specular rim — the baked rim/gloss PNG, screen-blended over the frost,
   *     restoring the crisp light edge the SVG filter would have added.
   * The pointer light, adaptive scheme and content-aware shadow are already
   * enabled on this path; this adds the parts that lived inside the filter.
   */
  /**
   * Primary GPU path: render this element's refraction through the shared WebGL
   * canvas (same on every browser). Needs `backdropSource` to resolve to an
   * uploadable scene (<canvas>/<img>/<video>) and WebGL2. The element becomes a
   * transparent window — its tint/refraction come from the shader, while its
   * box-shadow, rim light and text stay CSS. Returns false to fall through to
   * the native filter / CSS fallback.
   */
  tryInstallGpu() {
    const e = this.resolveBackdropSource();
    if (!e) return !1;
    const t = _i();
    if (!t) return !1;
    t.canvas.isConnected || document.body.appendChild(t.canvas);
    const i = t.register(this.element, e, () => this.gpuParams());
    return i ? (this.gpuHandle = i, this.element.style.backgroundColor = "transparent", this.dropOwnBackdrop(), !0) : !1;
  }
  async gpuParams() {
    const [e, t] = await Promise.all([
      le({
        width: this.currentWidth,
        height: this.currentHeight,
        radius: this.computedRadius(),
        thickness: this.computedThickness(),
        pixelRatio: this.displacementDpr(),
        refraction: this.profiledRefraction()
      }),
      this.options.specular ? this.specularMapUrl() : Promise.resolve(null)
    ]);
    return {
      displacementMapUrl: e.url,
      displacementPadding: e.padding,
      specularMapUrl: t,
      refraction: this.effectiveRefraction(),
      blur: this.effectiveBlur(),
      chromaticAberration: this.effectiveChromatic(),
      saturation: this.options.saturation,
      radius: this.computedRadius(),
      tint: ns(this.options.tint ?? this.variantTint())
    };
  }
  teardownGpu() {
    this.gpuHandle && (this.gpuHandle.destroy(), this.gpuHandle = null, this.usesGpu = !1);
  }
  async installFallbackFx() {
    const e = ++this.buildGeneration;
    if (this.removeFallbackFx(), !this.fallbackEnhanced() || this.suspended) return;
    const t = this.resolveBackdropSource();
    if (t) {
      await this.installBackdropRefraction(t, e);
      return;
    }
    const i = document.createElement("div");
    if (i.setAttribute("aria-hidden", "true"), i.style.cssText = "position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:-1;", this.options.refractBackground) {
      this.dropOwnBackdrop(), i.style.background = this.options.refractBackground, i.style.backgroundSize = "cover";
      const r = await this.buildRefractFilter(e);
      if (!r || !this.isBuildCurrent(e)) return;
      this.setLayerFilter(i, r);
    } else if (this.options.specular) {
      const r = await this.specularMapUrl();
      if (!this.isBuildCurrent(e)) return;
      i.style.backgroundImage = `url("${r}")`, i.style.backgroundSize = "100% 100%", i.style.mixBlendMode = "screen";
    } else
      return;
    this.element.insertBefore(i, this.element.firstChild), this.fxLayer = i;
  }
  /**
   * Real refraction sourced from a designated scene element — the cross-engine
   * route to Chromium-level lensing. The lens layer is glass-sized (so the
   * shared displacement map aligns 1:1) and carries the scene as its source:
   *   • Firefox → `-moz-element(#scene)` paints the LIVE scene as the lens image;
   *   • others  → a position-synced DOM clone of the scene.
   * A regular `filter:` (supported everywhere) then displaces that source with
   * the same map Chromium runs in backdrop-filter, so the result matches.
   */
  async installBackdropRefraction(e, t) {
    const i = document.createElement("div");
    if (i.setAttribute("aria-hidden", "true"), i.style.cssText = "position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:-1;overflow:hidden;", Hi) {
      const n = os(e);
      i.style.backgroundImage = `-moz-element(#${n})`, i.style.backgroundRepeat = "no-repeat", this.backdropMode = "moz";
    } else {
      const n = e.cloneNode(!0);
      as(n), n.style.position = "absolute", n.style.margin = "0", n.style.transformOrigin = "top left", this.refractClone = n, i.appendChild(n), this.backdropMode = "clone";
    }
    const r = await this.buildRefractFilter(t);
    !r || !this.isBuildCurrent(t) || (this.setLayerFilter(i, r), this.dropOwnBackdrop(), this.element.insertBefore(i, this.element.firstChild), this.fxLayer = i, this.backdropSceneEl = e, this.syncBackdropRefraction(), window.addEventListener("scroll", this.onBackdropRefractSync, {
      passive: !0,
      capture: !0
    }), window.addEventListener("resize", this.onBackdropRefractSync, { passive: !0 }));
  }
  /** Keep the scene source aligned with where the scene really is on screen. */
  syncBackdropRefraction() {
    if (!this.fxLayer || !this.backdropSceneEl) return;
    const e = this.element.getBoundingClientRect(), t = this.backdropSceneEl.getBoundingClientRect(), i = t.left - e.left, r = t.top - e.top;
    this.backdropMode === "moz" ? (this.fxLayer.style.backgroundPosition = `${A(i)}px ${A(r)}px`, this.fxLayer.style.backgroundSize = `${A(t.width)}px ${A(t.height)}px`) : this.refractClone && (this.refractClone.style.left = `${A(i)}px`, this.refractClone.style.top = `${A(r)}px`, this.refractClone.style.width = `${A(t.width)}px`, this.refractClone.style.height = `${A(t.height)}px`);
  }
  onBackdropRefractSync = () => {
    this.backdropSyncRaf || (this.backdropSyncRaf = requestAnimationFrame(() => {
      this.backdropSyncRaf = 0, this.destroyed || this.syncBackdropRefraction();
    }));
  };
  /** Resolve `backdropSource` to a usable scene element, or null. */
  resolveBackdropSource() {
    const e = this.options.backdropSource;
    if (!e) return null;
    const t = typeof e == "string" ? this.root.querySelector(e) : e;
    return !t || t === this.element || t.contains(this.element) ? (t && console.warn(
      "[liquid-glass] backdropSource must be a separate element behind the glass, not the glass or an ancestor."
    ), null) : t;
  }
  async buildRefractFilter(e) {
    const [t, i] = await Promise.all([
      le({
        width: this.currentWidth,
        height: this.currentHeight,
        radius: this.computedRadius(),
        thickness: this.computedThickness(),
        pixelRatio: this.displacementDpr(),
        refraction: this.profiledRefraction()
      }),
      this.options.specular ? this.specularMapUrl() : Promise.resolve(null)
    ]);
    return this.isBuildCurrent(e) ? (this.filter?.destroy(), this.filter = new Ve({
      refraction: this.effectiveRefraction(),
      chromaticAberration: 0,
      // single pass on the fallback path
      blur: this.effectiveBlur(),
      saturation: this.options.saturation,
      width: this.currentWidth,
      height: this.currentHeight,
      displacementMapUrl: t.url,
      displacementPadding: t.padding,
      specularMapUrl: i,
      root: this.root
    }), this.filter.url) : null;
  }
  setLayerFilter(e, t) {
    e.style.webkitFilter = t, e.style.filter = t;
  }
  dropOwnBackdrop() {
    this.element.style.backdropFilter = "none", this.element.style.webkitBackdropFilter = "none";
  }
  removeFallbackFx() {
    window.removeEventListener(
      "scroll",
      this.onBackdropRefractSync,
      { capture: !0 }
    ), window.removeEventListener("resize", this.onBackdropRefractSync), this.backdropSyncRaf && (cancelAnimationFrame(this.backdropSyncRaf), this.backdropSyncRaf = 0), this.refractClone = null, this.backdropSceneEl = null, this.backdropMode = null, this.fxLayer?.remove(), this.fxLayer = null;
  }
  specularMapUrl() {
    return Ce({
      width: this.currentWidth,
      height: this.currentHeight,
      radius: this.computedRadius(),
      thickness: this.computedThickness(),
      pixelRatio: this.specularDpr(),
      intensity: this.profiledSpecularIntensity()
    });
  }
  setupLazy() {
    this.unsubLazyIntersection = ct(
      this.element,
      (e) => {
        const t = e.isIntersecting;
        if (!(this.destroyed || this.suspended))
          if (t)
            if (!this.filter)
              this.scheduleBuild(() => this.installFilter());
            else {
              const i = this.scrollSafeCssForMode(this.scrollSafeMode);
              this.element.style.backdropFilter = i, this.element.style.webkitBackdropFilter = i;
            }
          else
            this.cancelPendingBuild(), this.filter && (this.element.style.backdropFilter = "none", this.element.style.webkitBackdropFilter = "none");
      },
      { rootMargin: this.options.lazyMargin }
    );
  }
  effectiveChromatic() {
    return this.quality === "high" ? this.options.chromaticAberration : 0;
  }
  /**
   * Refraction is an inward displacement in px. The lensing lives in the rim
   * band, so if the displacement grows larger than that band, the backdrop
   * mapping folds back on itself and the fold reads as a hard caustic outline
   * just inside the edge (the "inner rectangle"). To stay a clean lens we cap the
   * displacement to the rim band width — Apple's lensing is bounded by the
   * material's thickness, not arbitrarily strong. Also capped to a fraction of
   * the short side so tiny controls stay coherent.
   */
  effectiveRefraction() {
    const e = Math.min(this.currentWidth, this.currentHeight) * 0.78;
    return Math.min(this.profiledRefraction(), e);
  }
  /**
   * Backdrop blur is an absolute stdDeviation, so a fixed value looks stronger
   * on a short element (a nav bar) than on a regular card. Treat a 200px-short
   * surface as the reference and scale shorter controls down automatically,
   * while still preserving a small amount of frost on tiny pills.
   */
  effectiveBlur() {
    const e = Math.min(this.currentWidth, this.currentHeight), t = this.opticalTuning(), i = this.presetTuning(), r = Math.max(t.minBlurScale, Math.min(1, e / t.blurReferenceShortSide)), n = e * 0.14, o = Math.min(this.options.blur * t.blur * i.blur * r, n);
    return R ? Math.min(o * 0.85, 9) : o;
  }
  /**
   * The displacement map is a smooth gradient that feImage bilinear-upscales to
   * the element box, so it can render well below 1× with no visible loss. Keep
   * the default output around 0.3×; the map is supersampled before downscale, so
   * the rim stays smooth while canvas area / encode work drops aggressively.
   */
  displacementDpr() {
    const e = this.options.mapPixelRatio * (R ? qi : Di);
    return R ? Math.min(e, zi) : e;
  }
  /**
   * The specular rim stays sharper than the displacement map, but mobile can
   * sample it lower; the rim is screen-blended and supersampled before encode.
   */
  specularDpr() {
    const e = this.options.mapPixelRatio * (R ? Oi : Ui);
    return R ? Math.min(e, Wi) : e;
  }
  async installFilter() {
    if (this.suspended) return;
    this.cancelPendingBuild();
    const e = this.buildGeneration, [t, i] = await Promise.all([
      le({
        width: this.currentWidth,
        height: this.currentHeight,
        radius: this.computedRadius(),
        thickness: this.computedThickness(),
        pixelRatio: this.displacementDpr(),
        refraction: this.profiledRefraction()
      }),
      this.options.specular ? Ce({
        width: this.currentWidth,
        height: this.currentHeight,
        radius: this.computedRadius(),
        thickness: this.computedThickness(),
        pixelRatio: this.specularDpr(),
        intensity: this.profiledSpecularIntensity()
      }) : Promise.resolve(null)
    ]);
    if (!this.isBuildCurrent(e)) return;
    this.filter?.destroy(), this.filter = new Ve({
      refraction: this.effectiveRefraction(),
      chromaticAberration: this.effectiveChromatic(),
      blur: this.effectiveBlur(),
      saturation: this.options.saturation,
      width: this.currentWidth,
      height: this.currentHeight,
      displacementMapUrl: t.url,
      displacementPadding: t.padding,
      specularMapUrl: i,
      root: this.root
    });
    const r = this.scrollSafeCssForMode(this.scrollSafeMode);
    this.element.style.backdropFilter = r, this.element.style.webkitBackdropFilter = r;
  }
  rebuild() {
    this.cancelPendingBuild(), this.filter?.destroy(), this.filter = null, this.removeFallbackFx(), this.removeScrollSafeTransitionLayer(), this.teardownGpu(), this.usesFallback = this.shouldFallback(), this.usesFallback && !this.reducedTransparency && !this.suspended && this.tryInstallGpu() ? this.usesGpu = !0 : this.usesFallback ? this.applyFallback() : this.suspended || this.installFilter(), this.refreshScrollSafeSubscription();
  }
  /**
   * Re-derive everything size-dependent after a resize (window/orientation/DPR/
   * layout). Debounced and routed by the active path so a resizing element stays
   * correct in every environment:
   *   • GPU   → refresh the shared-canvas box (new map at the new size);
   *   • frost → re-apply the profiled CSS blur + rebuild the specular overlay;
   *   • native→ regenerate the displacement/specular maps and live filter attrs.
   */
  scheduleRegen() {
    this.destroyed || (this.regenTimer !== null && clearTimeout(this.regenTimer), this.regenTimer = window.setTimeout(() => {
      this.regenerateAfterResize();
    }, Bi));
  }
  async regenerateAfterResize() {
    if (this.regenTimer = null, this.destroyed || this.suspended) return;
    if (this.usesGpu) {
      this.gpuHandle?.refresh(), this.refreshScrollSafeSubscription();
      return;
    }
    if (this.usesFallback) {
      this.applyFallback(), this.adaptToBackdrop(), this.refreshScrollSafeSubscription();
      return;
    }
    if (!this.filter) return;
    const e = ++this.buildGeneration, [t, i] = await Promise.all([
      le({
        width: this.currentWidth,
        height: this.currentHeight,
        radius: this.computedRadius(),
        thickness: this.computedThickness(),
        pixelRatio: this.displacementDpr(),
        refraction: this.profiledRefraction()
      }),
      this.options.specular ? Ce({
        width: this.currentWidth,
        height: this.currentHeight,
        radius: this.computedRadius(),
        thickness: this.computedThickness(),
        pixelRatio: this.specularDpr(),
        intensity: this.profiledSpecularIntensity()
      }) : Promise.resolve(null)
    ]);
    !this.isBuildCurrent(e) || !this.filter || (this.filter.updateDisplacement(t.url, this.currentWidth, this.currentHeight, t.padding), this.filter.updateBlur(this.effectiveBlur()), this.filter.updateRefraction(this.effectiveRefraction()), i && this.filter.updateSpecular(i, this.currentWidth, this.currentHeight), this.adaptToBackdrop(), this.refreshScrollSafeSubscription());
  }
  applyTint() {
    const e = this.options.tint ?? this.variantTint();
    this.element.style.backgroundColor = this.usesGpu ? "transparent" : e, this.element.dataset.scheme = this.resolveScheme(), this.options.scheme === "adaptive" && (this.element.dataset.adaptive = ""), this.usesGpu && this.gpuHandle?.refresh(), this.applyEdges();
  }
  /**
   * The edge is defined OPTICALLY — by lensing and the light-responsive specular
   * rim ("Liquid Glass defines itself through lensing … bends, shapes and
   * concentrates light"), NOT by a drawn white outline. So the inset border is
   * just a whisper baseline (so a bare element still reads over a flat backdrop),
   * plus a profile-scaled float shadow that is also backdrop-aware: Apple's glass
   * "is aware of what's behind it and increases the opacity of its shadow when it
   * is over text … lowers it over a solid light background."
   */
  applyEdges() {
    if (!this.options.edges) return;
    const e = this.resolveScheme() === "dark", t = this.opticalTuning().shadow, i = (4 * t).toFixed(1), r = (12 * t).toFixed(1), o = Math.min(
      e ? 0.44 : 0.2,
      (e ? 0.22 : 0.085) * Math.pow(t, 0.7) * this.shadowAdapt
    ).toFixed(3), a = e ? `0 ${i}px ${r}px rgba(0, 0, 0, ${o})` : `0 ${i}px ${r}px rgba(20, 24, 46, ${o})`, l = e ? "inset 0 0 0 0.5px rgba(255,255,255,0.07), inset 0 1.5px 2px rgba(255,255,255,0.1), inset 0 -3px 6px rgba(0,0,0,0.16)" : "inset 0 0 0 0.5px rgba(255,255,255,0.1), inset 0 1.5px 2px rgba(255,255,255,0.18), inset 0 -3px 6px rgba(0,0,0,0.06)";
    this.element.style.boxShadow = `${l}, ${a}`;
  }
  /**
   * Adapt to the content behind the element by sampling its backdrop luminance
   * (one sample drives both effects):
   *  - content-aware SHADOW: darker/busier content casts a deeper shadow for
   *    separation, a solid light background a fainter one;
   *  - adaptive SCHEME (`scheme: 'adaptive'`): Apple's glass "automatically
   *    adapts to what's beneath it" — a light appearance over dark content, a
   *    dark one over light content, so it stays legible.
   * Resolvable solid backgrounds adapt; gradients/images fall back to neutral.
   */
  adaptToBackdrop(e = !1) {
    if (this.reducedTransparency) return;
    const t = this.sampleBackdropLuminance(e);
    if (this.options.edges) {
      const i = t == null ? 1 : 1.4 - t * 0.8;
      Math.abs(i - this.shadowAdapt) >= 0.03 && (this.shadowAdapt = i, this.applyEdges());
    }
    if (this.options.scheme === "adaptive") {
      let i;
      t == null ? i = null : t >= 0.55 ? i = "light" : t <= 0.45 ? i = "dark" : i = this.resolvedAdaptiveScheme, i !== this.resolvedAdaptiveScheme && (this.resolvedAdaptiveScheme = i, this.applyTint());
    }
  }
  onWindowResize = () => {
    const e = window.devicePixelRatio || 1;
    Math.abs(e - this.lastDpr) < 0.01 || (this.lastDpr = e, this.scheduleRegen());
  };
  onElementResize = (e) => {
    const t = e.borderBoxSize?.[0], i = t ? t.inlineSize : e.contentRect.width, r = t ? t.blockSize : e.contentRect.height;
    Math.abs(i - this.currentWidth) < 0.5 && Math.abs(r - this.currentHeight) < 0.5 || (this.currentWidth = Math.max(1, i), this.currentHeight = Math.max(1, r), this.options.applyRadius && (this.element.style.borderRadius = `${this.computedRadius()}px`), this.scheduleRegen());
  };
  onBackdropScroll = () => {
    this.destroyed || this.adaptToBackdrop();
  };
  sampleBackdropLuminance(e = !1) {
    const t = this.element.getBoundingClientRect();
    if (t.width === 0 || t.height === 0) return null;
    const i = typeof performance < "u" ? performance.now() : Date.now(), r = R ? 24 : 12, n = [
      Math.round(t.left / r),
      Math.round(t.top / r),
      Math.round(t.width / r),
      Math.round(t.height / r),
      window.innerWidth,
      window.innerHeight
    ].join(":");
    if (!e && n === this.backdropSampleKey && i - this.backdropSampleAt < It)
      return this.backdropSampleLum;
    const o = [
      [t.left + t.width / 2, t.top + t.height / 2],
      [t.left + 8, t.top + 8],
      [t.right - 8, t.bottom - 8]
    ], a = this.element.style.pointerEvents;
    this.element.style.pointerEvents = "none";
    let l = 0, c = 0;
    for (const [f, d] of o)
      if (!(f < 0 || d < 0 || f > window.innerWidth || d > window.innerHeight))
        for (const p of document.elementsFromPoint(f, d)) {
          if (p === this.element || this.element.contains(p)) continue;
          const h = rs(getComputedStyle(p).backgroundColor);
          if (h != null) {
            l += h, c++;
            break;
          }
        }
    this.element.style.pointerEvents = a;
    const u = c ? l / c : null;
    return this.backdropSampleKey = n, this.backdropSampleAt = i, this.backdropSampleLum = u, u;
  }
  variantTint() {
    const e = this.resolveScheme();
    return Fi[this.options.variant][e];
  }
  resolveScheme() {
    const e = this.options.scheme;
    return e === "light" || e === "dark" ? e : e === "adaptive" && this.resolvedAdaptiveScheme ? this.resolvedAdaptiveScheme : typeof window.matchMedia == "function" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  computedRadius() {
    return Math.min(
      this.options.radius,
      Math.min(this.currentWidth, this.currentHeight) / 2
    );
  }
  /** Rim band, capped under half the short side so small pills keep lens volume. */
  computedThickness() {
    const e = Math.min(this.currentWidth, this.currentHeight) * 0.46;
    return Math.max(
      2,
      Math.min(this.options.thickness * this.opticalTuning().thickness * this.presetTuning().thickness, e)
    );
  }
  profiledRefraction() {
    return this.options.refraction * this.opticalTuning().refraction * this.presetTuning().refraction;
  }
  profiledSpecularIntensity() {
    return Math.max(
      0,
      this.options.specularIntensity * this.opticalTuning().specular * this.presetTuning().specular
    );
  }
  opticalTuning() {
    return ut[this.resolveOpticalProfile()];
  }
  opticalTuningFor(e) {
    return ut[e === "auto" ? this.resolveAutoOpticalProfile() : e];
  }
  presetTuning() {
    return this.presetTuningFor(this.options.preset, this.options.profile);
  }
  presetTuningFor(e, t) {
    return $i[e === "auto" ? this.resolveAutoMaterialPreset(t) : e];
  }
  resolveAutoMaterialPreset(e) {
    const t = e === "auto" ? this.resolveAutoOpticalProfile() : e;
    return t === "control" || t === "selection" ? "vivid" : "balanced";
  }
  resolveMaterialPreset() {
    return this.options.preset === "auto" ? this.resolveAutoMaterialPreset(this.options.profile) : this.options.preset;
  }
  resolveOpticalProfile() {
    return this.options.profile === "auto" ? this.resolveAutoOpticalProfile() : this.options.profile;
  }
  resolveAutoOpticalProfile() {
    const e = typeof this.element.className == "string" ? this.element.className.toLowerCase() : "";
    return Dt({
      tagName: this.element.tagName,
      role: this.element.getAttribute("role"),
      ariaLabel: this.element.getAttribute("aria-label"),
      className: e,
      textLength: this.element.textContent?.trim().length ?? 0,
      buttonCount: this.element.querySelectorAll('button,[role="button"]').length,
      linkCount: this.element.querySelectorAll("a[href]").length,
      inputCount: this.element.querySelectorAll('input,select,textarea,[role="slider"]').length,
      width: this.currentWidth,
      height: this.currentHeight,
      radius: this.computedRadius()
    });
  }
  resolve(e) {
    const t = e.radius;
    let i;
    if (t === "pill")
      i = 9999;
    else if (t === "auto" || t === void 0) {
      const n = getComputedStyle(this.element), o = parseFloat(n.borderTopLeftRadius);
      i = Number.isFinite(o) && o > 0 ? o : g.radius;
    } else
      i = t;
    const r = e.variant ?? g.variant;
    return {
      radius: i,
      thickness: e.thickness ?? g.thickness,
      refraction: e.refraction ?? g.refraction,
      chromaticAberration: e.chromaticAberration ?? g.chromaticAberration,
      blur: e.blur ?? Ii[r],
      saturation: e.saturation ?? g.saturation,
      variant: r,
      profile: e.profile ?? g.profile,
      preset: e.preset ?? g.preset,
      scheme: e.scheme ?? g.scheme,
      tint: e.tint ?? null,
      specular: e.specular ?? g.specular,
      specularIntensity: e.specularIntensity ?? g.specularIntensity,
      edges: e.edges ?? g.edges,
      refractBackground: e.refractBackground ?? g.refractBackground,
      backdropSource: e.backdropSource ?? g.backdropSource,
      applyRadius: e.applyRadius ?? g.applyRadius,
      mapPixelRatio: e.mapPixelRatio ?? g.mapPixelRatio,
      quality: e.quality ?? g.quality,
      // On mobile, default to lazy so off-screen glass tears its filter down —
      // only what's on screen costs GPU during scroll. Explicit `lazy` wins.
      lazy: e.lazy ?? (R ? !0 : g.lazy),
      lazyMargin: e.lazyMargin ?? g.lazyMargin,
      root: e.root ?? g.root,
      fallbackFilter: e.fallbackFilter ?? g.fallbackFilter,
      respectReducedMotion: e.respectReducedMotion ?? g.respectReducedMotion
    };
  }
  optionsAsInput() {
    const e = this.options;
    return {
      radius: e.radius,
      thickness: e.thickness,
      refraction: e.refraction,
      chromaticAberration: e.chromaticAberration,
      blur: e.blur,
      saturation: e.saturation,
      variant: e.variant,
      profile: e.profile,
      preset: e.preset,
      scheme: e.scheme,
      tint: e.tint ?? void 0,
      specular: e.specular,
      specularIntensity: e.specularIntensity,
      edges: e.edges,
      refractBackground: e.refractBackground ?? void 0,
      backdropSource: e.backdropSource ?? void 0,
      applyRadius: e.applyRadius,
      mapPixelRatio: e.mapPixelRatio,
      quality: e.quality,
      lazy: e.lazy,
      lazyMargin: e.lazyMargin,
      root: e.root ?? void 0,
      fallbackFilter: e.fallbackFilter,
      respectReducedMotion: e.respectReducedMotion
    };
  }
}
class Xe {
  /**
   * Attach spatial interaction to every element matching `selector`
   * (default `.lg-interactive`). Returns the created instances.
   */
  static initAll(e = ".lg-interactive") {
    return Array.from(document.querySelectorAll(e)).map(
      (t) => new Xe(t)
    );
  }
  element;
  rafId = null;
  isHovered = !1;
  reduceMotion = !1;
  previousWillChange = null;
  // Smoothing states for fluid tilt.
  targetX = 0.5;
  targetY = 0.5;
  currentX = 0.5;
  currentY = 0.5;
  constructor(e) {
    this.element = e, this.reduceMotion = typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, e.addEventListener("pointerenter", this.onEnter), e.addEventListener("pointermove", this.onMove), e.addEventListener("pointerleave", this.onLeave), e.style.setProperty("--lg-tilt-x", "0deg"), e.style.setProperty("--lg-tilt-y", "0deg");
  }
  // ── Hover: 3D parallax tilt ──────────────────────────────────────────────
  onEnter = () => {
    this.isHovered = !0, this.reduceMotion || (this.previousWillChange = this.element.style.willChange, this.element.style.willChange = "transform", this.rafId === null && this.loop());
  };
  onLeave = () => {
    this.isHovered = !1, this.targetX = 0.5, this.targetY = 0.5;
  };
  onMove = (e) => {
    if (!this.isHovered || this.reduceMotion) return;
    const t = this.element.getBoundingClientRect();
    this.targetX = (e.clientX - t.left) / t.width, this.targetY = (e.clientY - t.top) / t.height;
  };
  loop = () => {
    this.currentX += (this.targetX - this.currentX) * 0.15, this.currentY += (this.targetY - this.currentY) * 0.15;
    const e = (0.5 - this.currentY) * 20, t = (this.currentX - 0.5) * 20;
    if (this.element.style.setProperty("--lg-tilt-x", `${e.toFixed(2)}deg`), this.element.style.setProperty("--lg-tilt-y", `${t.toFixed(2)}deg`), !this.isHovered && Math.abs(this.targetX - this.currentX) < 1e-3 && Math.abs(this.targetY - this.currentY) < 1e-3) {
      this.rafId = null, this.element.style.setProperty("--lg-tilt-x", "0deg"), this.element.style.setProperty("--lg-tilt-y", "0deg"), this.element.style.willChange = this.previousWillChange ?? "", this.previousWillChange = null;
      return;
    }
    this.rafId = requestAnimationFrame(this.loop);
  };
  destroy() {
    this.element.removeEventListener("pointerenter", this.onEnter), this.element.removeEventListener("pointermove", this.onMove), this.element.removeEventListener("pointerleave", this.onLeave), this.rafId !== null && cancelAnimationFrame(this.rafId), this.element.style.willChange = this.previousWillChange ?? "";
  }
}
function us(s = {}) {
  const e = s.root ?? document, t = s.attribute ?? "data-liquid-glass", i = s.interactiveSelector === void 0 ? ".lg-interactive" : s.interactiveSelector, r = Array.from(e.querySelectorAll(`[${t}]`)), n = Ee() && r.length >= 12 ? { lazy: !0, lazyMargin: "80px" } : {}, o = /* @__PURE__ */ new Map();
  for (const l of r) {
    if (o.has(l)) continue;
    let c = {};
    const u = l.getAttribute(t);
    if (u)
      try {
        c = JSON.parse(u);
      } catch (f) {
        s.onError ? s.onError(l, f) : console.warn("[liquid-glass] invalid", t, "JSON on", l, f);
        continue;
      }
    o.set(l, new S(l, { ...n, ...s.defaults, ...c }));
  }
  const a = [];
  if (i)
    for (const l of Array.from(e.querySelectorAll(i)))
      a.push(new Xe(l));
  return {
    instances: o,
    interactives: a,
    get: (l) => o.get(l),
    destroy() {
      for (const l of o.values()) l.destroy();
      o.clear();
    }
  };
}
const Bt = "cubic-bezier(0.34, 1.56, 0.64, 1)", Ue = "cubic-bezier(0.4, 0, 1, 1)";
class hs {
  trigger;
  menu;
  placement;
  offset;
  dismiss;
  open_ = !1;
  anim = null;
  glass;
  lensRaf = 0;
  reduceMotion;
  constructor(e, t, i = {}) {
    this.trigger = e, this.menu = t, this.placement = i.placement ?? "bottom-start", this.offset = i.offset ?? 10, this.glass = i.glass ?? null, this.dismiss = i.dismissOnOutside ?? !0, this.reduceMotion = typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, t.style.position = "fixed", t.style.visibility = "hidden", t.style.pointerEvents = "none", t.style.zIndex = "1200", t.dataset.lgMenu = "closed", t.parentElement !== document.body && document.body.appendChild(t), e.addEventListener("click", this.onTriggerClick), this.dismiss && (document.addEventListener("pointerdown", this.onDocPointerDown, !0), document.addEventListener("keydown", this.onKeyDown));
  }
  get isOpen() {
    return this.open_;
  }
  open() {
    this.open_ || (this.open_ = !0, this.menu.dataset.lgMenu = "open", this.menu.style.visibility = "visible", this.menu.style.pointerEvents = "auto", this.position(), this.morph(!0));
  }
  close() {
    this.open_ && (this.open_ = !1, this.menu.dataset.lgMenu = "closed", this.morph(!1));
  }
  toggle() {
    this.open_ ? this.close() : this.open();
  }
  destroy() {
    this.trigger.removeEventListener("click", this.onTriggerClick), document.removeEventListener("pointerdown", this.onDocPointerDown, !0), document.removeEventListener("keydown", this.onKeyDown), this.anim?.cancel(), this.lensRaf && cancelAnimationFrame(this.lensRaf);
  }
  // ── internals ─────────────────────────────────────────────────────────────
  onTriggerClick = (e) => {
    e.stopPropagation(), this.toggle();
  };
  onDocPointerDown = (e) => {
    if (!this.open_) return;
    const t = e.target;
    this.menu.contains(t) || this.trigger.contains(t) || this.close();
  };
  onKeyDown = (e) => {
    e.key === "Escape" && this.close();
  };
  /** Anchor the (fixed-positioned) menu to the trigger per placement. */
  position() {
    const e = this.trigger.getBoundingClientRect(), t = this.menu.getBoundingClientRect(), i = this.offset, r = this.placement.startsWith("bottom");
    let n;
    this.placement.endsWith("end") ? n = e.right - t.width : this.placement.endsWith("start") ? n = e.left : n = e.left + e.width / 2 - t.width / 2;
    const o = r ? e.bottom + i : e.top - t.height - i, a = window.innerWidth - t.width - 8;
    this.menu.style.left = `${Math.max(8, Math.min(n, a))}px`, this.menu.style.top = `${Math.max(8, o)}px`;
  }
  /** Grow out of (open) / collapse into (close) the trigger. */
  morph(e) {
    const t = this.trigger.getBoundingClientRect(), i = this.menu.getBoundingClientRect(), r = Math.max(0, Math.min(i.width, t.left + t.width / 2 - i.left)), n = Math.max(0, Math.min(i.height, t.top + t.height / 2 - i.top));
    if (this.menu.style.transformOrigin = `${r}px ${n}px`, this.anim?.cancel(), this.reduceMotion) {
      this.menu.style.transform = "", this.menu.style.clipPath = "", this.glass?.flexRefraction(e ? null : 0), e || this.hideAfterClose();
      return;
    }
    const o = Math.max(
      Math.hypot(r, n),
      Math.hypot(i.width - r, n),
      Math.hypot(r, i.height - n),
      Math.hypot(i.width - r, i.height - n)
    ), a = {
      clipPath: `circle(0px at ${r}px ${n}px)`,
      transform: "scale(0.96)",
      opacity: 0,
      filter: "brightness(1.3) saturate(1.25)"
    }, l = {
      clipPath: `circle(${o}px at ${r}px ${n}px)`,
      transform: "scale(1)",
      opacity: 1,
      filter: "brightness(1) saturate(1)"
    }, c = e ? 480 : 240;
    this.anim = this.menu.animate(e ? [a, l] : [l, a], {
      duration: c,
      easing: e ? Bt : Ue,
      fill: "forwards"
    }), e || (this.anim.onfinish = () => this.hideAfterClose()), this.rampLens(e, c);
  }
  /**
   * Ramp the menu's lensing so the refraction grows in as it materialises (open)
   * / recedes as it collapses (close) — "modulating the light bending and
   * lensing." Cheap per-frame displacement-scale change, no map rebuild.
   */
  rampLens(e, t) {
    if (!this.glass) return;
    this.lensRaf && cancelAnimationFrame(this.lensRaf);
    const i = this.glass.configuredRefraction, r = e ? 0 : i, n = e ? i : 0, o = performance.now(), a = () => {
      const l = Math.min(1, (performance.now() - o) / t), c = 1 - Math.pow(1 - l, 3);
      this.glass.flexRefraction(r + (n - r) * c), l < 1 ? this.lensRaf = requestAnimationFrame(a) : (this.lensRaf = 0, e && this.glass.flexRefraction(null));
    };
    this.lensRaf = requestAnimationFrame(a);
  }
  hideAfterClose() {
    this.open_ || (this.menu.style.visibility = "hidden", this.menu.style.pointerEvents = "none", this.menu.style.transform = "", this.menu.style.clipPath = "");
  }
}
class ds {
  sheet;
  scrim;
  gap;
  dismissOnScrim;
  open_ = !1;
  openedAt = 0;
  anim = null;
  scrimAnim = null;
  reduceMotion;
  constructor(e, t = {}) {
    this.sheet = e, this.gap = t.bottomGap ?? 24, this.dismissOnScrim = t.dismissOnScrim ?? !0, this.reduceMotion = typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, e.style.position = "fixed", e.style.left = "50%", e.style.bottom = `${this.gap}px`, e.style.transform = "translateX(-50%)", e.style.visibility = "hidden", e.style.zIndex = "1201", e.dataset.lgSheet = "closed", e.parentElement !== document.body && document.body.appendChild(e), this.scrim = document.createElement("div"), Object.assign(this.scrim.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(0, 0, 0, 0.32)",
      opacity: "0",
      visibility: "hidden",
      zIndex: "1200",
      pointerEvents: "none"
    }), document.body.appendChild(this.scrim), this.dismissOnScrim && (this.scrim.addEventListener("click", this.onDismiss), document.addEventListener("keydown", this.onKey));
  }
  get isOpen() {
    return this.open_;
  }
  present() {
    if (!this.open_) {
      if (this.open_ = !0, this.openedAt = performance.now(), this.sheet.dataset.lgSheet = "open", this.sheet.style.visibility = "visible", this.scrim.style.visibility = "visible", this.scrim.style.pointerEvents = "auto", this.scrimAnim?.cancel(), this.scrimAnim = this.scrim.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 300,
        easing: "ease",
        fill: "forwards"
      }), this.anim?.cancel(), this.reduceMotion) {
        this.sheet.style.transform = "translateX(-50%)";
        return;
      }
      this.anim = this.sheet.animate(
        [
          { transform: "translateX(-50%) translateY(110%) scale(0.96)", opacity: 0.4 },
          { transform: "translateX(-50%) translateY(0) scale(1)", opacity: 1 }
        ],
        { duration: 540, easing: Bt, fill: "forwards" }
      );
    }
  }
  dismiss() {
    if (this.open_) {
      if (this.open_ = !1, this.sheet.dataset.lgSheet = "closed", this.scrim.style.pointerEvents = "none", this.scrimAnim?.cancel(), this.scrimAnim = this.scrim.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 260,
        easing: Ue,
        fill: "forwards"
      }), this.scrimAnim.onfinish = () => {
        this.open_ || (this.scrim.style.visibility = "hidden");
      }, this.anim?.cancel(), this.reduceMotion) {
        this.sheet.style.visibility = "hidden";
        return;
      }
      this.anim = this.sheet.animate(
        [
          { transform: "translateX(-50%) translateY(0) scale(1)", opacity: 1 },
          { transform: "translateX(-50%) translateY(110%) scale(0.96)", opacity: 0.4 }
        ],
        { duration: 300, easing: Ue, fill: "forwards" }
      ), this.anim.onfinish = () => {
        this.open_ || (this.sheet.style.visibility = "hidden");
      };
    }
  }
  toggle() {
    this.open_ ? this.dismiss() : this.present();
  }
  destroy() {
    this.scrim.removeEventListener("click", this.onDismiss), document.removeEventListener("keydown", this.onKey), this.anim?.cancel(), this.scrimAnim?.cancel(), this.scrim.remove();
  }
  onDismiss = () => {
    performance.now() - this.openedAt < 300 || this.dismiss();
  };
  onKey = (e) => {
    e.key === "Escape" && this.dismiss();
  };
}
const ls = "cubic-bezier(0.34, 1.4, 0.5, 1)";
class fs {
  container;
  items;
  indicator;
  index = -1;
  anim = null;
  reduceMotion;
  onChange;
  constructor(e, t) {
    this.container = e, this.items = typeof t.items == "string" ? Array.from(e.querySelectorAll(t.items)) : t.items, this.onChange = t.onChange, this.reduceMotion = typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, getComputedStyle(e).position === "static" && (e.style.position = "relative"), this.indicator = document.createElement("div"), Object.assign(this.indicator.style, {
      position: "absolute",
      left: "0",
      top: "0",
      borderRadius: "9999px",
      background: t.tint ?? "rgba(255, 255, 255, 0.18)",
      boxShadow: "inset 0 0 0 0.5px rgba(255, 255, 255, 0.25)",
      pointerEvents: "none",
      zIndex: "0",
      willChange: "transform, width"
    }), e.insertBefore(this.indicator, e.firstChild);
    for (const i of this.items)
      getComputedStyle(i).position === "static" && (i.style.position = "relative"), i.style.zIndex = "1", i.addEventListener("click", () => this.select(this.items.indexOf(i)));
    this.select(t.initial ?? 0, !0);
  }
  get selectedIndex() {
    return this.index;
  }
  select(e, t = !1) {
    const i = this.items[e];
    if (!i) return;
    const r = e !== this.index;
    this.index = e;
    const n = i.offsetLeft, o = i.offsetTop, a = i.offsetWidth, l = i.offsetHeight, c = `translate(${n}px, ${o}px)`, u = `${a}px`, f = `${l}px`;
    if (this.anim?.cancel(), t || this.reduceMotion)
      this.indicator.style.transform = c, this.indicator.style.width = u, this.indicator.style.height = f;
    else {
      const d = this.indicator.style.transform || c, p = this.indicator.style.width || u, h = this.indicator.style.height || f;
      this.anim = this.indicator.animate(
        [
          { transform: d, width: p, height: h },
          { transform: c, width: u, height: f }
        ],
        { duration: 460, easing: ls, fill: "forwards" }
      ), this.indicator.style.transform = c, this.indicator.style.width = u, this.indicator.style.height = f;
    }
    for (let d = 0; d < this.items.length; d++)
      this.items[d].classList.toggle("lg-selected", d === e);
    r && this.onChange?.(e, i);
  }
  destroy() {
    this.anim?.cancel(), this.indicator.remove();
  }
}
export {
  S as LiquidGlass,
  Xe as LiquidInteractive,
  hs as LiquidMenu,
  fs as LiquidSelection,
  ds as LiquidSheet,
  us as autoEnhance,
  cs as clearMapCache,
  Dt as resolveLiquidGlassAutoProfile
};
//# sourceMappingURL=liquid-glass.js.map
