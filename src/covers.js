import { KramSpectral } from './spectral.js';

/* degattis studios journal covers: generative posters. Four pattern styles (stepped contours, maze, dither glow,
   scribble) x palettes x layout choices, seeded per post plus a per-visit salt so they reshuffle. */
var Covers = (function(){
  var FONT = '"Inter Tight","Helvetica Neue",Arial,sans-serif';
  // brand colours and neutrals only: Halo paper, plum ink, cobalt, lilac, stone, sand
  var PALS = {
    stone:     {bg:'#d6d3da', a:'#221b29', big:'#4a6ff0', list:'#221b29', line:'#221b29', ink:'#221b29'},
    paper:     {bg:'#f4f3f6', a:'#4a6ff0', big:'#221b29', list:'#221b29', line:'#4a6ff0', ink:'#221b29'},
    plum:      {bg:'#221b29', a:'#4a6ff0', b:'#3a3142', big:'#ecebf0', list:'#cfcde0', line:'#6d4c7d', ink:'#ecebf0'},
    halo:      {bg:'#ecebf0', a:'#6d4c7d', b:'#cfcde0', big:'#4a6ff0', list:'#221b29', line:'#6d4c7d', ink:'#221b29'},
    cobalt:    {bg:'#4a6ff0', a:'#221b29', big:'#ecebf0', list:'#221b29', line:'#221b29', ink:'#221b29'},
    sand:      {bg:'#cfccc6', a:'#221b29', big:'#6d4c7d', list:'#221b29', line:'#3a3340', ink:'#221b29'},
    lilac:     {bg:'#9e8fc4', a:'#221b29', big:'#ecebf0', list:'#221b29', line:'#ecebf0', ink:'#221b29'}
  };
  var STYLES = {contour:['cobalt','sand','plum','halo','lilac'], maze:['stone','halo','sand'], dither:['halo','plum'], scribble:['paper','stone']};
  function hash(s){ var h = 2166136261; for (var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function noise(r){
    var N = 48, g = []; for (var i = 0; i < N*N; i++) g.push(r());
    function v(x, y){ x = ((x % N) + N) % N; y = ((y % N) + N) % N; return g[(y|0)*N + (x|0)]; }
    function s(t){ return t*t*(3 - 2*t); }
    function n(x, y){ var xi = Math.floor(x), yi = Math.floor(y), fx = s(x - xi), fy = s(y - yi);
      var a = v(xi, yi), b = v(xi + 1, yi), c = v(xi, yi + 1), d = v(xi + 1, yi + 1); return a + (b - a)*fx + (c - a)*fy + (a - b - c + d)*fx*fy; }
    return function(x, y){ return n(x, y)*.6 + n(x*2.1 + 7, y*2.1 + 3)*.28 + n(x*4.3 + 1, y*4.3 + 9)*.12; };
  }
  function contourLines(x, W, H, r, color, cell, levels, scale, onlyLevel){
    var nz = noise(r), cols = Math.ceil(W/cell) + 1, rows = Math.ceil(H/cell) + 1, lv = [], i, j;
    for (i = 0; i < cols; i++){ lv[i] = []; for (j = 0; j < rows; j++) lv[i][j] = Math.floor(nz(i*cell/W*scale, j*cell/W*scale)*levels); }
    x.strokeStyle = color; x.lineWidth = Math.max(1, W/520); x.beginPath();
    for (i = 0; i < cols - 1; i++) for (j = 0; j < rows - 1; j++){
      var a = lv[i][j];
      if (a !== lv[i + 1][j] && (onlyLevel == null || Math.max(a, lv[i + 1][j]) === onlyLevel)){ x.moveTo((i + 1)*cell, j*cell); x.lineTo((i + 1)*cell, (j + 1)*cell); }
      if (a !== lv[i][j + 1] && (onlyLevel == null || Math.max(a, lv[i][j + 1]) === onlyLevel)){ x.moveTo(i*cell, (j + 1)*cell); x.lineTo((i + 1)*cell, (j + 1)*cell); }
    }
    x.stroke();
  }
  var P = {
    contour: function(x, W, H, r, p){ contourLines(x, W, H, r, p.line, Math.max(3, Math.round(W/120)), 9, 2.4 + r()*1.6); },
    maze: function(x, W, H, r, p){
      var holes = [], k = 5 + (r()*5|0), i; for (i = 0; i < k; i++) holes.push([r()*W, r()*H, (.09 + r()*.16)*W]);
      var c = Math.max(3, Math.round(W/150)); x.strokeStyle = p.a; x.lineWidth = c*.38; x.lineCap = 'butt'; x.beginPath();
      for (var gx = 0; gx < W; gx += c) for (var gy = 0; gy < H; gy += c){
        var f = 0; for (i = 0; i < holes.length; i++){ var dx = gx - holes[i][0], dy = gy - holes[i][1]; f += holes[i][2]*holes[i][2]/(dx*dx + dy*dy + 1); }
        if (f > 1) continue;
        if (r() < .5){ x.moveTo(gx + c/2, gy); x.arc(gx, gy, c/2, 0, Math.PI/2); x.moveTo(gx + c, gy + c/2); x.arc(gx + c, gy + c, c/2, -Math.PI/2, -Math.PI, true); }
        else { x.moveTo(gx + c/2, gy); x.arc(gx + c, gy, c/2, Math.PI, Math.PI/2, true); x.moveTo(gx, gy + c/2); x.arc(gx, gy + c, c/2, -Math.PI/2, 0); }
      }
      x.stroke();
    },
    dither: function(x, W, H, r, p){
      var c = Math.max(3, Math.round(W/95)), rx = W*(.0 + r()*.08), ry = H*(.22 + r()*.12), rw = W*(.75 + r()*.2), rh = H*(.35 + r()*.15), g = [], i;
      for (i = 0; i < 3 + (r()*3|0); i++) g.push([r()*W, r()*H*.9, (.12 + r()*.22)*W]);
      for (var gx = 0; gx < W; gx += c) for (var gy = 0; gy < H; gy += c){
        var inR = gx > rx && gx < rx + rw && gy > ry && gy < ry + rh, edge = inR ? Math.min(gx - rx, rx + rw - gx, gy - ry, ry + rh - gy)/(c*4) : 0;
        var gg = 0; for (i = 0; i < g.length; i++){ var dx = gx - g[i][0], dy = gy - g[i][1]; gg += Math.exp(-(dx*dx + dy*dy)/(2*g[i][2]*g[i][2])); }
        if (inR){ var s = c*Math.min(.95, .55 + edge*.4); x.fillStyle = p.b || p.a; x.fillRect(gx + (c - s)/2, gy + (c - s)/2, s, s); }
        if (gg > .12){ var s2 = c*Math.min(1, Math.sqrt(gg)*.95); x.fillStyle = p.a; x.fillRect(gx + (c - s2)/2, gy + (c - s2)/2, s2, s2); }
      }
      contourLines(x, W, H, r, p.line, Math.max(3, Math.round(W/110)), 4, 2.2, 2);
    },
    scribble: function(x, W, H, r, p){
      var cx = W*(.35 + r()*.3), cy = H*(.3 + r()*.3), R = Math.min(W, H)*(.26 + r()*.1), ax = cx, ay = cy, a = r()*6.28, st = W/240, nz = noise(r);
      x.strokeStyle = p.line; x.lineWidth = W/95; x.lineCap = x.lineJoin = 'round'; x.beginPath(); x.moveTo(ax, ay);
      for (var i = 0; i < 1600; i++){
        a += (nz(i*.05, 1.3) - .5)*1.6; var dx = ax - cx, dy = ay - cy, d = Math.hypot(dx, dy);
        if (d > R) a += ((Math.atan2(-dy, -dx) - a + 9.42) % 6.28 - 3.14)*.25;
        ax += Math.cos(a)*st; ay += Math.sin(a)*st; x.lineTo(ax, ay);
      }
      x.stroke();
    }
  };
  function wrap(x, text, maxW){ var w = text.split(' '), lines = [], cur = ''; w.forEach(function(t){ var n = cur ? cur + ' ' + t : t; if (x.measureText(n).width > maxW && cur){ lines.push(cur); cur = t; } else cur = n; }); if (cur) lines.push(cur); return lines; }
  function bigWords(title, r){
    var STOP = {the:1, a:1, an:1, of:1, and:1, to:1, from:1, in:1, on:1, for:1, with:1, by:1};
    var w = title.replace(/[,.:]/g, '').split(/\s+/).filter(function(t){ return !STOP[t.toLowerCase()] && (t.length > 1 || /\d/.test(t)); });
    if (w.length <= 3) return w;
    var out = [w[0], w[Math.floor(w.length/2)], w[w.length - 1]];
    return r() < .5 ? out : [w[0], w[w.length - 1]];
  }
  function draw(canvas, post, salt){
    var x = canvas.getContext('2d'), W = canvas.width, H = canvas.height; if (W < 4 || H < 4) return;
    var r = KramSpectral.rng(hash(post.id) + (salt || 0)*7919), names = Object.keys(STYLES), style = names[(r()*names.length)|0];
    var pal = PALS[STYLES[style][(r()*STYLES[style].length)|0]], m = W*.05, land = W > H*1.15;
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.fillStyle = pal.bg; x.fillRect(0, 0, W, H);
    var words = bigWords(post.title, r), bigS = Math.min(W*(land ? .14 : .25), H*(land ? .3 : .19)), behind = style === 'contour' && r() < .6;
    x.font = '700 ' + bigS + 'px ' + FONT; var widest = 0; words.forEach(function(w){ widest = Math.max(widest, x.measureText(w).width*.955); });
    if (widest > W - m*1.6) bigS *= (W - m*1.6)/widest;
    function big(){
      x.fillStyle = pal.big; x.font = '700 ' + bigS + 'px ' + FONT; x.textBaseline = 'alphabetic';
      if ('letterSpacing' in x) x.letterSpacing = (-bigS*.045).toFixed(1) + 'px';
      var n = words.length, gap = (H - m*2 - bigS*.75)/Math.max(1, n - 1);
      words.forEach(function(w, i){ var y = n === 1 ? H*.45 : m + bigS*.75 + gap*i; x.fillText(w, m - bigS*.04, y); });
      if ('letterSpacing' in x) x.letterSpacing = '0px';
    }
    if (behind) big();
    P[style](x, W, H, r, pal);
    if (!behind) big();
    // long word list
    var listOn = r() < .8, items = (post.words || []).slice();
    if (listOn && items.length){
      var ls = Math.max(9, H/(land ? 22 : 34)), lx = r() < .5 ? W*.5 : m, y = m + ls; x.font = '500 ' + ls + 'px ' + FONT; x.fillStyle = pal.list;
      if ('letterSpacing' in x) x.letterSpacing = (-ls*.02).toFixed(1) + 'px';
      var k = 0; while (y < H - m*1.6 && k < 80){ x.fillText(items[k % items.length], lx, y); y += ls*1.02; k++; }
      if ('letterSpacing' in x) x.letterSpacing = '0px';
    }
    // small paragraph and footer
    var ps = Math.max(7, W/(land ? 110 : 70)); x.font = '500 ' + ps + 'px ' + FONT; x.fillStyle = pal.ink;
    if (r() < .75){ var lines = wrap(x, post.dek + ' ' + post.tag + ', ' + post.date + '.', W*(land ? .22 : .34)), py = H*(.38 + r()*.2), px = listOn && lx === m ? W*.56 : m;
      lines.forEach(function(l, i){ x.fillText(l, px, py + i*ps*1.3); }); }
    x.font = '600 ' + ps + 'px ' + FONT; x.fillText('degattis studios journal', m, H - m*.8);
    var dw = x.measureText(post.date).width; x.fillText(post.date, W - m - dw, H - m*.8);
  }
  return {draw:draw};
})();

export { Covers };
