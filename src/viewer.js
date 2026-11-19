import * as THREE from 'three';
import { KramSpectral } from './spectral.js';
import { FINISHES, product } from './data.js';

/* KRAM Viewer: one WebGL renderer shared by every page. mount() moves the live canvas into a container;
   snapshot() renders a still PNG (renders, thumbnails, CAD line drawings). */
var Viewer = (function(){
  var T = THREE, KS = KramSpectral, ok = false;
  var renderer, scene, cam, metal, cobalt, slotM, paperMats = {}, lineMat, built = {}, current = null, currentId = null;
  var host = null, visible = true, user = {x:0, y:0}, vel = {x:0, y:0}, zoom = 1, inspecting = false, auto = true, dragging = false;
  var camP, lookP, camT, lookT, tmp, eu, io = null, onChange = null;
  var brushTex, blastTex;

  function init(){
    if (ok) return true;
    try {
      if (!T) return false;
      renderer = new T.WebGLRenderer({antialias:true, alpha:true, preserveDrawingBuffer:true});
    } catch (e) { return false; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = .95;
    renderer.domElement.className = 'gl';
    scene = new T.Scene(); cam = new T.PerspectiveCamera(30, 1, .1, 200);
    camP = new T.Vector3(0, 0, 15); lookP = new T.Vector3(); camT = new T.Vector3(); lookT = new T.Vector3(); tmp = new T.Vector3(); eu = new T.Euler();
    var ec = document.createElement('canvas'); ec.width = 1024; ec.height = 512;
    // neutral photo studio, so steel reads as steel: bright sky, grey horizon, dark floor, hard softboxes
    var x = ec.getContext('2d'), sky = x.createLinearGradient(0, 0, 0, 512);
    sky.addColorStop(0, '#ececf0'); sky.addColorStop(.16, '#8d8d95'); sky.addColorStop(.28, '#f6f6f8'); sky.addColorStop(.4, '#4a4a51'); sky.addColorStop(.5, '#c9c9ce'); sky.addColorStop(.58, '#1b1b1f'); sky.addColorStop(.8, '#55555c'); sky.addColorStop(1, '#8a8a92');
    x.fillStyle = sky; x.fillRect(0, 0, 1024, 512);
    x.fillStyle = '#ffffff'; x.fillRect(180, 40, 220, 90); x.fillRect(620, 60, 160, 70); x.fillRect(430, 0, 120, 40); x.fillRect(0, 236, 1024, 10);
    x.fillStyle = '#0c0c0f'; x.fillRect(320, 130, 36, 300); x.fillRect(800, 170, 28, 260);
    var et = new T.CanvasTexture(ec); et.mapping = T.EquirectangularReflectionMapping; et.encoding = T.sRGBEncoding;
    scene.environment = new T.PMREMGenerator(renderer).fromEquirectangular(et).texture;
    var key = new T.DirectionalLight(0xffffff, .55); key.position.set(3, 8, 6); scene.add(key);
    scene.add(new T.HemisphereLight(0xffffff, 0xd8d8e0, .3));
    function texCanvas(fn){ var c = document.createElement('canvas'); c.width = c.height = 512; fn(c.getContext('2d')); var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t; }
    var r1 = KS.rng(5), r2 = KS.rng(9);
    brushTex = texCanvas(function(g){ g.fillStyle = '#8a8a8a'; g.fillRect(0,0,512,512); for (var y = 0; y < 512; y++){ var v = 100 + (r1()*80|0); g.fillStyle = 'rgb('+v+','+v+','+v+')'; g.globalAlpha = .35 + r1()*.5; g.fillRect(0,y,512,1); } });
    blastTex = texCanvas(function(g){ var d = g.createImageData(512,512); for (var i = 0; i < d.data.length; i += 4){ var v = 110 + (r2()*90|0); d.data[i] = d.data[i+1] = d.data[i+2] = v; d.data[i+3] = 255; } g.putImageData(d,0,0); });
    brushTex.repeat.set(.5,.5);
    metal = new T.MeshPhysicalMaterial({color:0xf0f0f2, metalness:1, roughness:.09, envMapIntensity:1.3});
    cobalt = new T.MeshPhysicalMaterial({color:0xe23f22, metalness:.05, roughness:.34, clearcoat:.55, clearcoatRoughness:.12, envMapIntensity:.22, emissive:0x6a1404, emissiveIntensity:.2});
    cobalt.toneMapped = false; // the vermilion part keeps its true colour instead of being softened by tone mapping
    slotM = new T.MeshStandardMaterial({color:0x3a0d06, metalness:.3, roughness:.55});
    lineMat = new T.LineBasicMaterial({color:0x16181f});
    ok = true; return true;
  }

  function finish(id){
    var f = FINISHES.filter(function(x){ return x.id === id; })[0] || FINISHES[0];
    metal.color.setHex(f.color); metal.roughness = f.rough; metal.metalness = f.metal;
    metal.roughnessMap = f.id === 'brushed' ? brushTex : f.id === 'blasted' ? blastTex : null;
    metal.bumpMap = metal.roughnessMap; metal.bumpScale = f.id === 'brushed' ? .0025 : .004; metal.needsUpdate = true;
  }

  /* ---- geometry ---- */
  function stadium(s, cx, cy, w, h, ccw){ var r = h/2; s.moveTo(cx-w/2+r, cy-h/2); s.lineTo(cx+w/2-r, cy-h/2); s.absarc(cx+w/2-r, cy, r, -Math.PI/2, Math.PI/2, false); s.lineTo(cx-w/2+r, cy+h/2); s.absarc(cx-w/2+r, cy, r, Math.PI/2, Math.PI*1.5, false); return s; }
  function rrect(s, cx, cy, w, h, r){ s.moveTo(cx-w/2+r, cy-h/2); s.lineTo(cx+w/2-r, cy-h/2); s.absarc(cx+w/2-r, cy-h/2+r, r, -Math.PI/2, 0, false); s.lineTo(cx+w/2, cy+h/2-r); s.absarc(cx+w/2-r, cy+h/2-r, r, 0, Math.PI/2, false); s.lineTo(cx-w/2+r, cy+h/2); s.absarc(cx-w/2+r, cy+h/2-r, r, Math.PI/2, Math.PI, false); s.lineTo(cx-w/2, cy-h/2+r); s.absarc(cx-w/2+r, cy-h/2+r, r, Math.PI, Math.PI*1.5, false); return s; }
  function extrude(shape, depth, bev){ var g = new T.ExtrudeGeometry(shape, {depth:depth, bevelEnabled:true, bevelThickness:bev, bevelSize:bev, bevelSegments:4, curveSegments:64}); g.translate(0,0,-depth/2); return g; }
  function screw(r, h){ var g = new T.Group();
    var head = new T.Mesh(new T.CylinderGeometry(r*.96, r, h, 56), cobalt); head.rotation.x = Math.PI/2; g.add(head);
    var dome = new T.Mesh(new T.SphereGeometry(r*.96, 48, 12, 0, Math.PI*2, 0, Math.PI*.22), cobalt); dome.rotation.x = Math.PI/2; dome.position.z = h/2 - r*.23; g.add(dome);
    var slot = new T.Mesh(new T.BoxGeometry(r*1.75, r*.22, h*.5), slotM); slot.position.z = h/2 + r*.02; slot.rotation.z = -.6; g.add(slot);
    return g; }
  function hexBolt(r, h){ var g = new T.Group(); var b = new T.Mesh(new T.CylinderGeometry(r, r, h, 6), cobalt); b.rotation.x = Math.PI/2; g.add(b);
    var c = new T.Mesh(new T.CylinderGeometry(r*.42, r*.42, h*.2, 24), slotM); c.rotation.x = Math.PI/2; c.position.z = h/2; g.add(c); return g; }
  function printTex(p, w, h, mode){
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    KS.create(c, Object.assign({}, p.art, {edge:.15})).render(0);
    var x = c.getContext('2d'); x.fillStyle = '#fff';
    if (mode === 'poster'){
      x.font = '700 ' + (w*.2) + 'px "Inter Tight", Arial, sans-serif'; x.fillText('kram.', w*.06, h*.17);
      x.font = '500 ' + (w*.022) + 'px "Inter Tight", Arial, sans-serif'; x.fillStyle = 'rgba(34,27,41,.62)';
      x.fillText('KR-001  KR-002  KR-003  KR-004  KR-005  KR-006  KR-007  KR-008  KR-009  KR-010', w*.06, h*.95);
      x.fillText('COLLECTION 001 · OBJECTS OF INTEREST', w*.06, h*.92);
    } else {
      x.font = '700 ' + (w*.12) + 'px "Inter Tight", Arial, sans-serif'; x.fillText('kram.', w*.08, h*.12);
      x.strokeStyle = 'rgba(255,255,255,.95)'; x.lineWidth = w*.006;
      for (var i = 0; i < 12; i++){ var cx = w*(.22 + (i%3)*.28), cy = h*(.27 + Math.floor(i/3)*.19); x.beginPath(); x.arc(cx, cy, w*.11, 0, Math.PI*2); x.stroke(); }
      x.fillStyle = '#e9553a'; x.beginPath(); x.arc(w*.86, h*.93, w*.04, 0, Math.PI*2); x.fill();
    }
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t;
  }
  var B = {
    'loop-opener': function(){
      var g = new T.Group(), s = stadium(new T.Shape(), 0, 0, 8.4, 3.2);
      var hole = rrect(new T.Path(), -2.1, 0, 2.1, 1.35, .6); s.holes.push(hole);
      var k = new T.Path(); k.absarc(3.15, 0, .42, 0, Math.PI*2, true); s.holes.push(k);
      g.add(new T.Mesh(extrude(s, .4, .07), metal));
      var sc = screw(.42, .2); sc.position.set(.9, 0, .32); g.add(sc);
      return {g:g, focus:new T.Vector3(.9,0,.3), present:[-.35,.5,0]};
    },
    'bolt-ring': function(){
      var inner = new T.Group(), pts = [], ri = 1.0, ro = 1.22, hw = .35, c = .07, i;
      function arc(cx,cy,a0,a1){ for (i = 0; i <= 6; i++){ var a = a0 + (a1-a0)*i/6; pts.push(new T.Vector2(cx + Math.cos(a)*c, cy + Math.sin(a)*c)); } }
      arc(ri+c,-hw+c,Math.PI,Math.PI*1.5); arc(ro-c,-hw+c,-Math.PI/2,0); arc(ro-c,hw-c,0,Math.PI/2); arc(ri+c,hw-c,Math.PI/2,Math.PI); pts.push(pts[0].clone());
      inner.add(new T.Mesh(new T.LatheGeometry(pts, 128), metal));
      var b = new T.Group(), seat = new T.Mesh(new T.CylinderGeometry(.36,.36,.06,48), metal); b.add(seat);
      var bolt = new T.Mesh(new T.CylinderGeometry(.3,.3,.22,6), cobalt); bolt.position.y = .13; b.add(bolt);
      var cap = new T.Mesh(new T.CylinderGeometry(.13,.13,.03,24), slotM); cap.position.y = .25; b.add(cap);
      b.position.set(0, 0, ro); b.rotation.x = Math.PI/2; inner.add(b);
      return {g:inner, focus:new T.Vector3(0,0,ro), present:[.55,.35,0]};
    },
    'fold-clip': function(){
      var g = new T.Group(), cl = [], i, t = .09;
      for (i = 0; i <= 24; i++) cl.push([-3.1 + i*(5.2/24), 0]);
      for (i = 1; i <= 28; i++){ var a = -Math.PI/2 + Math.PI*i/28; cl.push([2.1 + Math.cos(a)*.58, .58 + Math.sin(a)*.58]); }
      for (i = 1; i <= 24; i++){ var u = i/24; cl.push([2.1 - u*4.6, 1.16 - u*.42]); }
      for (i = 1; i <= 6; i++){ var v = i/6; cl.push([-2.5 - v*.45, .74 + v*v*.18]); }
      var outA = [], inA = [];
      for (i = 0; i < cl.length; i++){ var p = cl[i], q = cl[Math.min(cl.length-1, i+1)], o = cl[Math.max(0, i-1)];
        var dx = q[0]-o[0], dy = q[1]-o[1], L = Math.hypot(dx,dy) || 1, nx = -dy/L, ny = dx/L;
        outA.push(new T.Vector2(p[0]+nx*t/2, p[1]+ny*t/2)); inA.push(new T.Vector2(p[0]-nx*t/2, p[1]-ny*t/2)); }
      var geo = new T.ExtrudeGeometry(new T.Shape(outA.concat(inA.reverse())), {depth:2.0, bevelEnabled:true, bevelThickness:.02, bevelSize:.02, bevelSegments:2, curveSegments:8}); geo.translate(.4,-.58,-1);
      g.add(new T.Mesh(geo, metal));
      var rv = new T.Mesh(new T.CylinderGeometry(.26,.26,.12,40), cobalt); rv.position.set(2.1,.6,0); rv.rotation.z = -.08; g.add(rv);
      return {g:g, focus:new T.Vector3(2.1,.6,0), present:[.4,-.6,0]};
    },
    'key-tag': function(){
      var g = new T.Group(), s = rrect(new T.Shape(), 0, 0, 5, 2.4, .6);
      var h = new T.Path(); h.absarc(-1.75, 0, .38, 0, Math.PI*2, true); s.holes.push(h);
      g.add(new T.Mesh(extrude(s, .3, .05), metal));
      var sc = screw(.36, .18); sc.position.set(1.25, 0, .25); g.add(sc);
      var ring = new T.Mesh(new T.TorusGeometry(1.0, .07, 16, 96), metal); ring.position.set(-2.55, 0, 0); ring.rotation.y = Math.PI/2.6; g.add(ring);
      return {g:g, focus:new T.Vector3(1.25,0,.25), present:[-.3,.45,0]};
    },
    'desk-tray': function(){
      var g = new T.Group(), W = 7.2, H = 4.4, R = .8, wall = .16, dep = 1.0;
      var base = rrect(new T.Shape(), 0, 0, W, H, R); var bm = new T.Mesh(extrude(base, .16, .03), metal); bm.position.z = -dep/2 + .08; g.add(bm);
      var rim = rrect(new T.Shape(), 0, 0, W, H, R); rim.holes.push(rrect(new T.Path(), 0, 0, W - wall*2, H - wall*2, R - wall));
      var rm = new T.Mesh(extrude(rim, dep, .03), metal); g.add(rm);
      [-1, 1].forEach(function(sx){ var sc = screw(.2, .1); sc.position.set(sx*(W/2 - .9), H/2 - wall/2, dep/2 + .03); sc.scale.set(1,1,1); g.add(sc); });
      return {g:g, focus:new T.Vector3(W/2 - .9, H/2 - wall/2, dep/2), present:[-1.0,.35,0]};
    },
    'disc-pendant': function(){
      var g = new T.Group(), pts = [], ri = .42, ro = 1.9, hw = .2, c = .06, i;
      function arc(cx,cy,a0,a1){ for (i = 0; i <= 6; i++){ var a = a0 + (a1-a0)*i/6; pts.push(new T.Vector2(cx + Math.cos(a)*c, cy + Math.sin(a)*c)); } }
      arc(ri+c,-hw+c,Math.PI,Math.PI*1.5); arc(ro-c,-hw+c,-Math.PI/2,0); arc(ro-c,hw-c,0,Math.PI/2); arc(ri+c,hw-c,Math.PI/2,Math.PI); pts.push(pts[0].clone());
      var disc = new T.Mesh(new T.LatheGeometry(pts, 128), metal); disc.rotation.x = Math.PI/2; g.add(disc);
      var hb = hexBolt(.62, .55); g.add(hb);
      var bail = new T.Mesh(new T.TorusGeometry(.36, .08, 16, 64), metal); bail.position.set(0, 2.2, 0); bail.rotation.y = Math.PI/2; g.add(bail);
      return {g:g, focus:new T.Vector3(0,0,.28), present:[0,.4,0]};
    },
    'carabiner': function(){
      var g = new T.Group(), s = stadium(new T.Shape(), 0, 0, 6.2, 2.8), hole = new T.Path(); stadium(hole, 0, 0, 5.0, 1.6); s.holes.push(hole);
      g.add(new T.Mesh(extrude(s, .55, .08), metal));
      var sl = new T.Mesh(new T.CylinderGeometry(.46, .46, 2.2, 40), cobalt); sl.rotation.z = Math.PI/2; sl.position.set(.2, -1.1, 0); g.add(sl);
      return {g:g, focus:new T.Vector3(.2,-1.1,.4), present:[-.2,.5,0]};
    },
    'ashtray': function(){
      var g = new T.Group(), pts = [[0,0],[2.15,0],[2.3,.08],[2.42,.85],[2.36,.95],[2.12,.95],[1.95,.32],[1.85,.26],[0,.26]].map(function(p){ return new T.Vector2(p[0], p[1]); });
      g.add(new T.Mesh(new T.LatheGeometry(pts, 128), metal));
      var bar = new T.Mesh(new T.CylinderGeometry(.16,.16,1.3,32), cobalt); bar.rotation.z = Math.PI/2; bar.position.set(2.15, 1.02, 0); bar.rotation.y = 0; g.add(bar);
      g.position.y = -.45;
      var w = new T.Group(); w.add(g);
      return {g:w, focus:new T.Vector3(2.15,.57,0), present:[.6,.4,0]};
    },
    'sticker-sheet': function(p){
      var tx = printTex(p, 768, 1086, 'sticker'), g = new T.Group(), m = new T.MeshStandardMaterial({map:tx, emissiveMap:tx, emissive:0xffffff, emissiveIntensity:.45, roughness:.55, metalness:0});
      g.add(new T.Mesh(new T.BoxGeometry(4.2, 5.94, .04), [m.clone(), m.clone(), m.clone(), m.clone(), m, new T.MeshStandardMaterial({color:0xf3f3ef, roughness:.8})]));
      return {g:g, focus:null, present:[-.12,-.35,0], paper:true};
    },
    'poster': function(p){
      var geo = new T.PlaneGeometry(4.2, 5.94, 24, 1), pos = geo.attributes.position;
      for (var i = 0; i < pos.count; i++){ var xx = pos.getX(i); pos.setZ(i, Math.sin((xx/4.2 + .5)*Math.PI)*.18 - .1); }
      geo.computeVertexNormals();
      var tx = printTex(p, 900, 1273, 'poster'), m = new T.MeshStandardMaterial({map:tx, emissiveMap:tx, emissive:0xffffff, emissiveIntensity:.45, roughness:.85, metalness:0, side:T.DoubleSide});
      var g = new T.Group(); g.add(new T.Mesh(geo, m));
      return {g:g, focus:null, present:[-.08,-.4,0], paper:true};
    }
  };
  /* adjustable shapes for catalogue items without a bespoke builder (p.build = {type, ...}) */
  function lathe(pts){ return new T.LatheGeometry(pts.map(function(q){ return new T.Vector2(q[0], q[1]); }), 128); }
  function bandPts(ri, ro, hw){ var pts = [], c = Math.min(.07, (ro - ri)/3, hw/2), i;
    function arc(cx, cy, a0, a1){ for (i = 0; i <= 6; i++){ var a = a0 + (a1 - a0)*i/6; pts.push([cx + Math.cos(a)*c, cy + Math.sin(a)*c]); } }
    arc(ri + c, -hw + c, Math.PI, Math.PI*1.5); arc(ro - c, -hw + c, -Math.PI/2, 0); arc(ro - c, hw - c, 0, Math.PI/2); arc(ri + c, hw - c, Math.PI/2, Math.PI); pts.push(pts[0]); return pts; }
  var GEN = {
    plate: function(p, o){
      var g = new T.Group(), s = new T.Shape();
      if (o.shape === 'circle') s.absarc(0, 0, o.w/2, 0, Math.PI*2, false); else if (o.shape === 'stadium') stadium(s, 0, 0, o.w, o.h); else rrect(s, 0, 0, o.w, o.h, o.r || .4);
      (o.holes || []).forEach(function(hl){ var h = new T.Path(); h.absarc(hl[0], hl[1], hl[2], 0, Math.PI*2, true); s.holes.push(h); });
      if (o.slot) s.holes.push(rrect(new T.Path(), o.slot[0], o.slot[1], o.slot[2], o.slot[3], Math.min(o.slot[2], o.slot[3])/2 - .01));
      var t = o.t || .35; g.add(new T.Mesh(extrude(s, t, Math.min(.06, t/4)), metal));
      var sc = o.screws || [[0, 0]], sr = o.sr || .36;
      sc.forEach(function(q){ var k = screw(sr, sr*.5); k.position.set(q[0], q[1], t/2 + .07); g.add(k); });
      if (o.ring){ var rg = new T.Mesh(new T.TorusGeometry(o.ring[2], .07, 16, 96), metal); rg.position.set(o.ring[0], o.ring[1], 0); rg.rotation.y = Math.PI/2.6; g.add(rg); }
      return {g:g, focus:new T.Vector3(sc[0][0], sc[0][1], t/2), present:o.present || [-.3, .45, 0]};
    },
    band: function(p, o){
      var inner = new T.Group(), ro = o.ro || 1.22;
      inner.add(new T.Mesh(new T.LatheGeometry(bandPts(o.ri || 1, ro, o.hw || .35).map(function(q){ return new T.Vector2(q[0], q[1]); }), 128), metal));
      var bs = o.bs || .3, b = new T.Group(); var bolt = new T.Mesh(new T.CylinderGeometry(bs, bs, bs*.7, o.round ? 40 : 6), cobalt); bolt.position.y = bs*.35; b.add(bolt);
      b.position.set(0, 0, ro - .02); b.rotation.x = Math.PI/2; inner.add(b);
      return {g:inner, focus:new T.Vector3(0, 0, ro), present:o.present || [.55, .35, 0]};
    },
    tray: function(p, o){
      var g = new T.Group(), W = o.w, H = o.h, R = o.r, wall = .16, dep = o.d || 1;
      var bm = new T.Mesh(extrude(rrect(new T.Shape(), 0, 0, W, H, R), .16, .03), metal); bm.position.z = -dep/2 + .08; g.add(bm);
      var rim = rrect(new T.Shape(), 0, 0, W, H, R); rim.holes.push(rrect(new T.Path(), 0, 0, W - wall*2, H - wall*2, Math.max(.05, R - wall)));
      g.add(new T.Mesh(extrude(rim, dep, .03), metal));
      var k = screw(.2, .1); k.position.set(W/2 - Math.max(.5, R*.6), H/2 - wall/2, dep/2 + .03); g.add(k);
      return {g:g, focus:k.position.clone(), present:[-1.0, .35, 0]};
    },
    dish: function(p, o){
      var R = o.r, h = o.h, g = new T.Group();
      g.add(new T.Mesh(lathe([[0, 0], [R*.9, 0], [R*.96, h*.1], [R, h*.9], [R*.97, h], [R*.88, h], [R*.8, h*.32], [R*.75, h*.26], [0, h*.26]]), metal));
      var bar = new T.Mesh(new T.CylinderGeometry(.13, .13, R*.6, 32), cobalt); bar.rotation.z = Math.PI/2; bar.position.set(R*.9, h + .1, 0); g.add(bar);
      g.position.y = -h/2; var w = new T.Group(); w.add(g);
      return {g:w, focus:new T.Vector3(R*.9, h/2 + .1, 0), present:[.6, .4, 0]};
    },
    rod: function(p, o){
      var g = new T.Group(), L = o.len, r = o.r;
      var body = new T.Mesh(new T.CylinderGeometry(r, r*(o.taper || 1), L, 48), metal); g.add(body);
      var cap = new T.Mesh(new T.CylinderGeometry(r*1.02, r*1.02, L*.16, 48), cobalt); cap.position.y = L/2 + L*.08; g.add(cap);
      if (o.clip){ var c = new T.Mesh(new T.BoxGeometry(r*.5, L*.4, r*.35), metal); c.position.set(0, L*.25, r*1.15); g.add(c); }
      if (o.knob){ var kb = new T.Mesh(new T.SphereGeometry(r*1.3, 32, 16), metal); kb.position.y = L/2 + L*.16 + r*.9; g.add(kb); }
      g.rotation.z = o.lie ? Math.PI/2.4 : 0;
      return {g:g, focus:new T.Vector3(0, L/2 + L*.08, 0), present:[.25, .5, .2]};
    },
    paper: function(p, o){
      var geo = new T.PlaneGeometry(o.w, o.h, 24, 1), pos = geo.attributes.position;
      for (var i = 0; i < pos.count; i++){ var xx = pos.getX(i); pos.setZ(i, Math.sin((xx/o.w + .5)*Math.PI)*.15 - .08); }
      geo.computeVertexNormals();
      var tx = printTex(p, Math.round(900*o.w/Math.max(o.w, o.h)), Math.round(900*o.h/Math.max(o.w, o.h)), o.mode || 'poster');
      var m = new T.MeshStandardMaterial({map:tx, emissiveMap:tx, emissive:0xffffff, emissiveIntensity:.45, roughness:.85, metalness:0, side:T.DoubleSide});
      var g = new T.Group(); g.add(new T.Mesh(geo, m));
      return {g:g, focus:null, present:[-.08, -.4, 0], paper:true};
    }
  };
  function get(id){
    if (built[id]) return built[id];
    var p = product(id), o = B[id] ? B[id](p) : GEN[p.build.type](p, p.build), n = new T.Group(); n.add(o.g);
    var box = new T.Box3().setFromObject(o.g), size = new T.Vector3(), ctr = new T.Vector3(); box.getSize(size); box.getCenter(ctr);
    o.g.position.sub(ctr); var sc = 6.6 / Math.max(size.x, size.y, size.z); n.scale.setScalar(sc);
    // CAD line drawing: edges of every mesh, shown instead of the solids for drawings
    o.lines = [];
    o.g.updateMatrixWorld(true);
    var meshes = []; o.g.traverse(function(m){ if (m.isMesh) meshes.push(m); });
    meshes.forEach(function(m){ var l = new T.LineSegments(new T.EdgesGeometry(m.geometry, 22), lineMat); l.position.copy(m.position); l.quaternion.copy(m.quaternion); l.scale.copy(m.scale); l.visible = false; m.parent.add(l); o.lines.push({l:l, m:m}); });
    o.node = n; built[id] = o; return o;
  }
  function setWire(o, on){ o.lines.forEach(function(x){ x.l.visible = on; x.m.visible = !on; }); }

  function show(id){
    if (!ok) return;
    if (current) scene.remove(current.node);
    current = get(id); currentId = id; scene.add(current.node);
    user.x = user.y = vel.x = vel.y = 0; zoom = 1; inspecting = false; auto = true;
    applyPose(current, user);
    if (onChange) onChange();
  }
  function applyPose(o, u){ eu.set(o.present[0] + u.x, o.present[1] + u.y, o.present[2], 'YXZ'); o.node.quaternion.setFromEuler(eu); }

  /* ---- live view ---- */
  function size(){ if (!host) return; var r = host.getBoundingClientRect(); if (r.width < 2) return; renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(r.width, r.height, false); cam.aspect = r.width / r.height; cam.fov = cam.aspect < .9 ? 40 : 30; cam.updateProjectionMatrix(); }
  var down = null;
  function pd(e){ if (!host) return; down = {x:e.clientX, y:e.clientY, lx:e.clientX, ly:e.clientY}; dragging = true; auto = false; host.classList.add('drag'); try { host.setPointerCapture(e.pointerId); } catch (_) {} }
  function pm(e){ if (!down) return; var dx = e.clientX - down.lx, dy = e.clientY - down.ly; down.lx = e.clientX; down.ly = e.clientY; vel.y = dx*.008; vel.x = dy*.008; user.y += vel.y; user.x = Math.max(-1.5, Math.min(1.5, user.x + vel.x)); }
  function pu(){ if (!down) return; down = null; dragging = false; if (host) host.classList.remove('drag'); setTimeout(function(){ if (!dragging && !inspecting) auto = true; }, 2500); }
  function wh(e){ if (!e.ctrlKey) return; e.preventDefault(); zoom = Math.max(.5, Math.min(1.6, zoom*(1 + e.deltaY*.01))); }
  function mount(el){
    if (!init()) return false;
    if (host === el) { size(); return true; }
    unmount();
    host = el; el.appendChild(renderer.domElement);
    el.addEventListener('pointerdown', pd); el.addEventListener('pointermove', pm); el.addEventListener('pointerup', pu); el.addEventListener('pointercancel', pu); el.addEventListener('wheel', wh, {passive:false});
    if ('IntersectionObserver' in window){ io = new IntersectionObserver(function(es){ visible = es[0].isIntersecting; }); io.observe(el); }
    size(); camP.set(0, 0, 15); return true;
  }
  function unmount(){
    if (!host) return;
    host.removeEventListener('pointerdown', pd); host.removeEventListener('pointermove', pm); host.removeEventListener('pointerup', pu); host.removeEventListener('pointercancel', pu); host.removeEventListener('wheel', wh);
    if (io) io.disconnect(); io = null;
    if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    host = null;
  }
  function frame(ts){
    requestAnimationFrame(frame);
    if (!ok || !host || !visible || !current || document.hidden) return;
    if (!dragging){ vel.x *= .92; vel.y *= .92; user.y += vel.y; user.x = Math.max(-1.5, Math.min(1.5, user.x + vel.x)); if (auto && !KS.reducedMotion) user.y += .004; }
    applyPose(current, user);
    current.node.updateMatrixWorld();
    var far = cam.aspect < .9 ? 1.35 : 1;
    if (inspecting && current.focus){ tmp.copy(current.focus); current.g.localToWorld(tmp); lookT.copy(tmp); camT.set(tmp.x*.5, tmp.y*.5 + .3, tmp.z + 6*zoom); }
    else { lookT.set(0,0,0); camT.set(0, 0, 15*zoom*far); }
    camP.lerp(camT, .08); lookP.lerp(lookT, .08); cam.position.copy(camP); cam.lookAt(lookP);
    renderer.render(scene, cam);
  }
  requestAnimationFrame(frame);
  window.addEventListener('resize', function(){ size(); });

  /* ---- stills ---- */
  function snapshot(id, opt){
    if (!init()) return null;
    opt = opt || {};
    var o = get(id), prev = current, prevCam = cam.position.clone(), w = opt.w || 640, h = opt.h || 640;
    if (current) scene.remove(current.node);
    scene.add(o.node); finish(opt.finish || 'polished'); setWire(o, !!opt.wire);
    applyPose(o, {x:(opt.ax || 0), y:(opt.ay || 0)}); o.node.updateMatrixWorld(true);
    renderer.setPixelRatio(1); renderer.setSize(w, h, false); cam.aspect = w/h; cam.fov = 30; cam.updateProjectionMatrix();
    if (opt.detail && o.focus){ tmp.copy(o.focus); o.g.localToWorld(tmp); cam.position.set(tmp.x*.5, tmp.y*.5 + .3, tmp.z + 5.5); cam.lookAt(tmp); }
    else { cam.position.set(0, 0, opt.dist || (opt.wire ? 12 : 18)); cam.lookAt(0,0,0); }
    renderer.render(scene, cam);
    var url = renderer.domElement.toDataURL('image/png');
    setWire(o, false); scene.remove(o.node);
    if (prev){ scene.add(prev.node); applyPose(prev, user); }
    finish(liveFinish); cam.position.copy(prevCam); size();
    return url;
  }
  var liveFinish = 'polished';
  return {
    available: function(){ return init(); },
    mount: mount, unmount: unmount, show: show,
    finish: function(id){ liveFinish = id; if (ok) finish(id); },
    inspect: function(on){ inspecting = !!on && !!(current && current.focus); zoom = 1; if (inspecting){ user.x = user.y = vel.x = vel.y = 0; auto = false; } else auto = true; return inspecting; },
    zoomBy: function(f){ zoom = Math.max(.5, Math.min(1.6, zoom*f)); },
    hasFocus: function(id){ return !!(ok && get(id).focus); },
    isPaper: function(id){ return ok && !!get(id).paper; },
    snapshot: snapshot,
    current: function(){ return currentId; },
    onChange: function(fn){ onChange = fn; }
  };
})();

export { Viewer };
