/* KRAM Spectral — frosted, reeded-glass colour fields.
   Pipeline: low-res colour field (anisotropic blur via downscale) → progressive upscale
   → reeded-glass strips → fog veil → halftone screen → grain. */
(function (g) {
  'use strict';
  var TAU = Math.PI * 2;
  var PALETTES = {
    halo:   { name: 'Halo',   bg: '#ecebf0', ink: '#221b29', colors: ['#6d4c7d', '#8a4d78', '#e9553a', '#f07b5a', '#dfe39b', '#c9c9b8', '#9e8fc4', '#cfcde0'] },
    echo:   { name: 'Echo',   bg: '#eeeeea', ink: '#1b1d24', colors: ['#f08fcf', '#b79af5', '#6e9ef2', '#73d0e6', '#a9e9c6', '#e3eea0', '#c3b2ff'] },
    dawn:   { name: 'Dawn',   bg: '#f3eee9', ink: '#2a1d1a', colors: ['#ffab86', '#ff8db5', '#f6cf87', '#d2a8ff', '#ffc9da', '#ffe3a8'] },
    pool:   { name: 'Pool',   bg: '#ecf0f1', ink: '#122033', colors: ['#5ccfe6', '#4c86ff', '#93e5cf', '#bfeaff', '#7b98ff', '#2545ff'] },
    fig:    { name: 'Fig',    bg: '#f2ece6', ink: '#2b1414', colors: ['#ff6a47', '#ff9c78', '#c93a5c', '#ffcc98', '#93406f'] },
    cobalt: { name: 'Cobalt', bg: '#edeef2', ink: '#10163a', colors: ['#2545ff', '#5b74ff', '#9aaaff', '#cdd5ff', '#3a2bd6'] },
    night:  { name: 'Night',  bg: '#15161b', ink: '#eceef5', colors: ['#f08fcf', '#8f7bff', '#3f6bff', '#46c6e0', '#8be3b5'] }
  };
  var DEFAULTS = {
    seed: 7, palette: 'halo', layout: 'ring', count: 8, size: 1, spread: 1, cx: 0.5, cy: 0.5,
    blur: 0.5, streak: 0.6, reed: 0.5, reedWidth: 0.014, veil: 0.1, edge: 0.18,
    grain: 0.35, halftone: 0.35, motion: 1, spin: 0, pointer: null, under: null
  };

  function rng(seed) {
    var a = (seed * 2654435761) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hexRgb(h) { h = h.replace('#', ''); var n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgba(h, a) { var c = hexRgb(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function isDark(h) { var c = hexRgb(h); return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) < 110; }
  function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; }

  var FILTER_OK = (function () {
    try { var x = mk(2, 2).getContext('2d'); x.filter = 'blur(1px)'; return x.filter === 'blur(1px)'; } catch (e) { return false; }
  })();

  function genBlobs(o, P) {
    var r = rng(o.seed * 9973 + 17), n = Math.max(1, o.count | 0), out = [], i;
    function pick() { return P.colors[Math.floor(r() * P.colors.length)]; }
    var L = o.layout;
    if (L === 'orbit') {
      for (i = 0; i < n; i++) {
        out.push({ ring: true, x: o.cx, y: o.cy, rad: (0.07 + (i / Math.max(1, n - 1)) * 0.36) * o.size * o.spread,
          w: (0.018 + r() * 0.03) * o.size, c1: pick(), ph: r() * TAU, sp: 0.5 + r() });
      }
      out.push({ x: o.cx, y: o.cy, rad: 0.06 * o.size, c1: pick(), c2: pick(), ph: 0, sp: 0.4, sq: false });
      return out;
    }
    var cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols);
    for (i = 0; i < n; i++) {
      var x, y, rad;
      if (L === 'ring') {
        var a = i / n * TAU + o.seed * 0.37 - TAU / 4, R = 0.3 * o.spread;
        x = o.cx + Math.cos(a) * R; y = o.cy + Math.sin(a) * R;
        rad = 0.115 * o.size * (0.85 + r() * 0.35);
      } else if (L === 'grid') {
        var c = i % cols, rr = Math.floor(i / cols);
        x = o.cx + ((c + 0.5) / cols - 0.5) * 0.72 * o.spread;
        y = o.cy + ((rr + 0.5) / rows - 0.5) * 0.72 * o.spread;
        rad = 0.3 / cols * o.size * (0.85 + r() * 0.3);
      } else if (L === 'column') {
        x = o.cx + (r() - 0.5) * 0.1;
        y = o.cy + ((n === 1 ? 0.5 : i / (n - 1)) - 0.5) * 0.78 * o.spread;
        rad = Math.min(0.14, 0.42 / n + 0.03) * o.size * (0.8 + r() * 0.5);
      } else {
        x = o.cx + (r() - 0.5) * 0.74 * o.spread; y = o.cy + (r() - 0.5) * 0.74 * o.spread;
        rad = (0.06 + r() * 0.12) * o.size;
      }
      out.push({ x: x, y: y, rad: rad, c1: pick(), c2: pick(), c3: pick(), ph: r() * TAU, sp: 0.6 + r() * 0.8, sq: r() < 0.75 });
    }
    return out;
  }

  function Spectral(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.o = {};
    this.bufs = [];
    this.set(Object.assign({}, DEFAULTS, opts || {}));
  }
  Spectral.prototype.set = function (patch) {
    var o = this.o, k, dirtyBlobs = false, dirtyStrips = false, dirtyTex = false;
    for (k in patch) {
      if (o[k] === patch[k]) continue;
      if (/^(seed|palette|layout|count|size|spread|cx|cy)$/.test(k)) dirtyBlobs = true;
      if (/^(seed|reedWidth)$/.test(k)) dirtyStrips = true;
      if (k === 'palette') dirtyTex = true;
      o[k] = patch[k];
    }
    this.P = PALETTES[o.palette] || PALETTES.halo;
    if (dirtyBlobs || !this.blobs) this.blobs = genBlobs(o, this.P);
    if (dirtyStrips) this.strips = null;
    if (dirtyTex) this.tex = null;
    return this;
  };
  Spectral.prototype.buf = function (i, w, h) {
    var b = this.bufs[i];
    if (!b) { b = this.bufs[i] = mk(w, h); }
    else if (b.width !== w || b.height !== h) { b.width = w; b.height = h; }
    return b;
  };
  Spectral.prototype.ensure = function (W, H) {
    var o = this.o, P = this.P;
    if (!this.strips || this.stripsW !== W) {
      var r = rng(o.seed + 3), base = Math.max(2, o.reedWidth * W), x = 0, s = [];
      while (x < W) { var w = base * (0.55 + r() * 0.9); s.push({ x: x, w: w, j: r() - 0.5, dy: r() - 0.5 }); x += w; }
      this.strips = s; this.stripsW = W;
      var rib = mk(W, 1), rc = rib.getContext('2d');
      s.forEach(function (st) {
        var gr = rc.createLinearGradient(st.x, 0, st.x + st.w, 0);
        gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.18, 'rgba(255,255,255,0.9)');
        gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(0.92, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        rc.fillStyle = gr; rc.fillRect(st.x, 0, st.w + 1, 1);
      });
      this.rib = rib;
      var fib = mk(W, 1), fc = fib.getContext('2d'), fd = fc.createImageData(W, 1), fr = rng(o.seed + 5), v = 128;
      for (var q = 0; q < W; q++) { v += (fr() - 0.5) * 90; v = v * 0.86 + 128 * 0.14; var u = Math.max(0, Math.min(255, v + (fr() - 0.5) * 40)); fd.data[q * 4] = fd.data[q * 4 + 1] = fd.data[q * 4 + 2] = u; fd.data[q * 4 + 3] = 255; }
      fc.putImageData(fd, 0, 0); this.fiber = fib;
    }
    if (!this.tex || this.texW !== W) {
      var cell = Math.max(2, Math.round(W / 300));
      var t = mk(cell, cell), tc = t.getContext('2d');
      tc.fillStyle = P.bg; tc.fillRect(0, 0, cell, cell);
      tc.globalCompositeOperation = 'destination-out';
      tc.beginPath(); tc.arc(cell / 2, cell / 2, cell * 0.4, 0, TAU); tc.fill();
      var pat = this.ctx.createPattern(t, 'repeat');
      try { pat.setTransform(new DOMMatrix().rotate(45)); } catch (e) {}
      var n = mk(220, 220), nc = n.getContext('2d'), id = nc.createImageData(220, 220), d = id.data, rr = rng(11);
      for (var i = 0; i < d.length; i += 4) { var v = rr() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
      nc.putImageData(id, 0, 0);
      this.tex = { half: pat, grain: this.ctx.createPattern(n, 'repeat') };
      this.texW = W;
    }
  };
  Spectral.prototype.render = function (t) {
    t = t || 0;
    var o = this.o, P = this.P, c = this.canvas, ctx = this.ctx, W = c.width, H = c.height;
    if (W < 2 || H < 2) return;
    this.ensure(W, H);
    var dark = isDark(P.bg), m = Math.min(W, H);
    // 1. colour field at low resolution; extra vertical downscale = vertical smear
    var ds = Math.max(1.5, (3 + o.blur * 16) * m / 900), vy = 1 + o.streak * 2.6;
    var aw = Math.max(4, Math.ceil(W / ds)), ah = Math.max(3, Math.ceil(H / (ds * vy)));
    var A = this.buf(0, aw, ah), ac = A.getContext('2d');
    ac.globalCompositeOperation = 'source-over'; ac.filter = 'none';
    ac.fillStyle = P.bg; ac.fillRect(0, 0, aw, ah);
    ac.globalCompositeOperation = dark ? 'screen' : 'multiply';
    if (FILTER_OK) ac.filter = 'blur(' + (0.6 + o.blur * 0.8).toFixed(2) + 'px)';
    var kx = aw / W, ky = ah / H, mot = o.motion, pt = o.pointer;
    for (var i = 0; i < this.blobs.length; i++) {
      var b = this.blobs[i];
      var x = b.x + Math.sin(t * 0.00025 * b.sp + b.ph) * 0.012 * mot;
      var y = b.y + Math.cos(t * 0.0002 * b.sp + b.ph * 1.3) * 0.016 * mot;
      if (o.spin && !b.ring) { // orbit: each shape travels along the layout's own path around its centre
        var ang = t * o.spin, px = x - o.cx, py = y - o.cy, ca = Math.cos(ang), sa = Math.sin(ang);
        x = o.cx + px * ca - py * sa; y = o.cy + px * sa + py * ca;
      }
      if (pt && !b.ring) {
        var dx = x - pt.x, dy = y - pt.y, d2 = dx * dx + dy * dy + 1e-4, f = (pt.s || 1) * 0.07 * Math.exp(-d2 / 0.05) / Math.sqrt(d2);
        x += dx * f; y += dy * f;
      }
      var rx = b.rad * m * kx, ry = b.rad * m * ky;
      ac.save(); ac.translate(x * aw, y * ah); ac.scale(rx, ry);
      if (b.ring) {
        ac.beginPath(); ac.arc(0, 0, 1, 0, TAU);
        ac.lineWidth = b.w / b.rad; ac.strokeStyle = b.c1; ac.globalAlpha = 0.9; ac.stroke();
      } else {
        // colour runs top to bottom inside each shape, with a pale bloom at its heart
        var gr = ac.createLinearGradient(0, -1, 0, 1);
        gr.addColorStop(0, b.c1); gr.addColorStop(0.55, b.c2); gr.addColorStop(1, b.c3 || b.c2);
        ac.fillStyle = gr; ac.globalAlpha = 0.94; ac.beginPath();
        if (b.sq && ac.roundRect) ac.roundRect(-0.92, -0.92, 1.84, 1.84, 0.42); else ac.arc(0, 0, 1, 0, TAU);
        ac.fill();
        var bl = ac.createRadialGradient(0, -0.1, 0, 0, 0, 0.75);
        bl.addColorStop(0, dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.3)'); bl.addColorStop(1, 'rgba(255,255,255,0)');
        var op = ac.globalCompositeOperation; ac.globalCompositeOperation = 'source-over';
        ac.fillStyle = bl; ac.globalAlpha = 1; ac.fill(); ac.globalCompositeOperation = op;
      }
      ac.restore();
    }
    ac.filter = 'none'; ac.globalAlpha = 1; ac.globalCompositeOperation = 'source-over';
    // 2. progressive upscale to half resolution (smooth, cheap blur)
    var tw = Math.ceil(W / 2), th = Math.ceil(H / 2), cur = A, bi = 1;
    while (cur.width < tw || cur.height < th) {
      var nw = Math.min(tw, cur.width * 2), nh = Math.min(th, cur.height * 2);
      var B = this.buf(bi++, nw, nh), bc = B.getContext('2d');
      bc.imageSmoothingEnabled = true; bc.imageSmoothingQuality = 'high';
      bc.drawImage(cur, 0, 0, nw, nh); cur = B;
    }
    // 3. reeded glass: each rib shows a magnified, offset slice
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    var sx = cur.width / W, sy = cur.height / H, mag = 1 + o.reed * 1.6, S = this.strips;
    for (var s = 0; s < S.length; s++) {
      var st = S[s], ccx = st.x + st.w / 2 + st.j * st.w * o.reed * 1.4, sw = st.w * mag;
      ctx.drawImage(cur, (ccx - sw / 2) * sx, 0, sw * sx, cur.height, st.x, 0, st.w + 0.75, H);
    }
    // 3b. an image (e.g. a logo) blurred the same way as the shapes (downscaled with the same vertical smear),
    // laid in after the ribs so its letters stay level, then glazed by the same sheen, veil and grain.
    // under: {img, cx, cy, w, h, soft, parts}; w and h cap its size as fractions of the canvas;
    // soft (0-1) is its blur relative to the shapes' (1 = identical). parts: [{y0, y1, soft}] blurs
    // horizontal bands of the image separately (y0/y1 as fractions of its height). blend picks the canvas
    // composite mode (default multiply on light paper; 'source-over' keeps white parts white).
    var u = o.under;
    if (u && u.img && u.img.naturalWidth) {
      var ar = u.img.naturalWidth / u.img.naturalHeight, lw = Math.min(W * (u.w || 0.8), H * (u.h || 0.5) * ar), lh = lw / ar;
      var lx = (u.cx == null ? 0.5 : u.cx) * W - lw / 2, ly = (u.cy == null ? 0.5 : u.cy) * H - lh / 2;
      var parts = u.parts || [{ y0: 0, y1: 1, soft: u.soft }], iw = u.img.naturalWidth, ih = u.img.naturalHeight;
      ctx.globalCompositeOperation = u.blend || (dark ? 'screen' : 'multiply'); ctx.globalAlpha = u.alpha == null ? 1 : u.alpha;
      for (var pi = 0; pi < parts.length; pi++) {
        var pt2 = parts[pi], sf = pt2.soft == null ? 1 : pt2.soft;
        var lds = Math.max(1, ds * sf), lbw = Math.max(4, Math.ceil(W / lds)), lbh = Math.max(3, Math.ceil(H / (lds * vy)));
        var LB = this.buf(18 + pi, lbw, lbh), lc = LB.getContext('2d'), lkx = lbw / W, lky = lbh / H;
        lc.clearRect(0, 0, lbw, lbh);
        if (FILTER_OK) lc.filter = 'blur(' + (0.6 + o.blur * 0.8).toFixed(2) + 'px)';
        lc.drawImage(u.img, 0, pt2.y0 * ih, iw, (pt2.y1 - pt2.y0) * ih, lx * lkx, (ly + pt2.y0 * lh) * lky, lw * lkx, (pt2.y1 - pt2.y0) * lh * lky);
        lc.filter = 'none';
        ctx.drawImage(LB, 0, 0, W, H);
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
    if (o.streak > 0) { ctx.globalAlpha = Math.min(1, o.streak * 0.9); ctx.globalCompositeOperation = dark ? 'overlay' : 'soft-light'; ctx.drawImage(this.fiber, 0, 0, W, H); }
    if (o.reed > 0) { ctx.globalAlpha = o.reed * 0.16; ctx.globalCompositeOperation = dark ? 'screen' : 'soft-light'; ctx.drawImage(this.rib, 0, 0, W, H); }
    // 4. fog veil + soft edge mask
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = o.veil; ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
    if (o.edge > 0) {
      var eg = ctx.createRadialGradient(W / 2, H / 2, m * 0.25, W / 2, H / 2, Math.hypot(W, H) * 0.58);
      eg.addColorStop(0, rgba(P.bg, 0)); eg.addColorStop(1, rgba(P.bg, 1));
      ctx.globalAlpha = o.edge; ctx.fillStyle = eg; ctx.fillRect(0, 0, W, H);
    }
    // 5. halftone screen (gaps take the paper colour) and grain
    if (o.halftone > 0) { ctx.globalAlpha = o.halftone * 0.6 * Math.min(1, W / 900); ctx.fillStyle = this.tex.half; ctx.fillRect(0, 0, W, H); }
    if (o.grain > 0) { ctx.globalAlpha = o.grain * 0.32; ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = this.tex.grain; ctx.fillRect(0, 0, W, H); }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  };

  /* Fit a canvas to its CSS box at device pixel ratio (capped). Returns true if resized. */
  function fit(canvas, maxDpr) {
    var r = canvas.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, maxDpr || 2);
    var w = Math.max(2, Math.round(r.width * d)), h = Math.max(2, Math.round(r.height * d));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; return true; }
    return false;
  }
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  g.KramSpectral = {
    PALETTES: PALETTES, DEFAULTS: DEFAULTS, rng: rng, fit: fit, reducedMotion: reduced,
    create: function (canvas, opts) { return new Spectral(canvas, opts); },
    /* Render a static canvas sized to its CSS box. */
    still: function (canvas, opts, maxDpr) { fit(canvas, maxDpr || 1.5); var s = new Spectral(canvas, opts); s.render(0); return s; }
  };
})(window);

export const KramSpectral = window.KramSpectral;
export default KramSpectral;
