import * as THREE from 'three';
import { KramSpectral } from './spectral.js';
import { CATS, FINISHES, PRODUCTS, product, EDITIONS, POSTS, post } from './data.js';
import { Viewer } from './viewer.js';
import { Covers } from './covers.js';

(function(){
  'use strict';
  var KS = KramSpectral, RM = KS.reducedMotion;
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function money(n){ return '$' + n.toFixed(0); }
  function after(fn){ requestAnimationFrame(function(){ requestAnimationFrame(fn); }); }
  var GL = Viewer.available();

  /* ---------- wordmark ---------- */
  var kmN = 0;
  function kmark(kind){ var word = '<span class="wm">kram.</span>'; return kind === 'hero' ? '<span class="lock" role="img" aria-label="kram.">' + word + '</span>' : '<span class="lock" role="img" aria-label="kram"><svg class="kmk" aria-hidden="true"><use href="#kmark"/></svg>' + word + '</span>'; }
  document.querySelectorAll('[data-kmark]').forEach(function(el){ el.innerHTML = kmark(el.dataset.kmark); });
  // hero fills the screen below the header, so the shop starts just out of frame
  function barH(){ var b = document.querySelector('.bar'); if (b) document.documentElement.style.setProperty('--barH', b.offsetHeight + 'px'); }
  barH(); window.addEventListener('resize', barH);

  /* ---------- stills: spectral plates drawn when their page is visible ---------- */
  function paint(canvas, opts){ if (canvas.offsetParent === null) return; KS.still(canvas, opts, 1.5); }
  function plateHTML(extra){ return '<canvas aria-hidden="true"></canvas>' + (extra || ''); }

  /* ---------- render snapshots (cached) ---------- */
  var snaps = {}, queue = [], busy = false;
  function snapKey(id, o){ return id + '|' + JSON.stringify(o || {}); }
  function snap(id, o){ var k = snapKey(id, o); if (!(k in snaps)) snaps[k] = GL ? Viewer.snapshot(id, o) : null; return snaps[k]; }
  function snapLater(id, o, cb){ var k = snapKey(id, o); if (k in snaps){ cb(snaps[k]); return; } queue.push([id, o, cb]); pump(); }
  function pump(){ if (busy || !queue.length) return; busy = true; setTimeout(function(){ var j = queue.shift(); var url = snap(j[0], j[1]); try { j[2](url); } catch (e) {} busy = false; pump(); }, 0); }
  // stay hidden until the render has decoded, so the alt text never flashes in its place
  function fillImg(img, id, o){ if (!GL){ img.hidden = true; return; } snapLater(id, o, function(u){ if (!u) return; img.hidden = true; img.onload = function(){ img.hidden = false; }; img.src = u; }); }

  /* ---------- toast ---------- */
  var tt; function toast(msg){ var t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(function(){ t.classList.remove('on'); }, 2200); }

  /* ---------- cart: dropdown under the header, full Cart page at #cart ---------- */
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem('kram-cart') || '[]') || []; } catch (e) { cart = []; }
  cart = cart.filter(function(it){ return product(it.id); });
  function saveCart(){ try { localStorage.setItem('kram-cart', JSON.stringify(cart)); } catch (e) {} }
  function finishName(id){ var f = FINISHES.filter(function(x){ return x.id === id; })[0]; return f ? f.name : ''; }
  function option(it){ return [it.finish ? finishName(it.finish) : '', it.size || ''].filter(Boolean).join(' · '); }
  function addToCart(id, finish, size){
    var p = product(id), key = id + '|' + (finish || '') + '|' + (size || '');
    var hit = cart.filter(function(x){ return x.key === key; })[0];
    if (hit) hit.qty++; else cart.push({key:key, id:id, finish:finish || null, size:size || null, qty:1});
    saveCart(); renderCart(); if (page !== 'cart') openMini(); toast('Added ' + p.name + ' to cart');
  }
  function thumb(img, it){ fillImg(img, it.id, {finish:it.finish || 'polished', w:200, h:160, dist:16}); }
  function totals(){ var n = 0, sub = 0; cart.forEach(function(it){ n += it.qty; sub += it.qty*product(it.id).price; }); return {n:n, sub:sub}; }
  function renderCart(){
    var t = totals();
    $('cartCount').textContent = t.n; $('miniSub').textContent = money(t.sub); $('miniCheckout').disabled = !cart.length; $('miniNote').textContent = '';
    $('miniItems').innerHTML = cart.length ? cart.map(function(it, i){ var p = product(it.id);
      return '<div class="mrow"><img alt="" data-mi="' + i + '" hidden><b>' + esc(p.name) + (it.qty > 1 ? ' × ' + it.qty : '') + '</b><span>' + money(p.price*it.qty) + '</span></div>'; }).join('')
      : '<p class="mempty">Your cart is empty.</p>';
    $('miniItems').querySelectorAll('[data-mi]').forEach(function(img){ thumb(img, cart[+img.dataset.mi]); });
    if (page === 'cart') renderCartPage();
  }
  function renderCartPage(){
    var t = totals(), tb = $('cartTable');
    if (!cart.length){ tb.innerHTML = '<tbody><tr><td style="padding:24px 0;font-size:15px;color:var(--ink-2)">Your cart is empty. <a href="#shop">Back to the shop</a></td></tr></tbody>'; return; }
    tb.innerHTML = '<thead><tr><th>Product name</th><th>ID</th><th>Quantity</th><th>Option</th><th class="r">Price</th></tr></thead><tbody>'
      + cart.map(function(it, i){ var p = product(it.id);
        return '<tr><td><span class="pn"><img alt="" data-ci="' + i + '" hidden><a href="#product-' + p.id + '">' + esc(p.name) + '</a></span></td><td>' + esc(p.code) + '</td>'
          + '<td><label class="sr" for="q' + i + '" style="position:absolute;left:-9999px">Quantity for ' + esc(p.name) + '</label><input type="number" id="q' + i + '" min="0" max="99" value="' + it.qty + '"><button class="tlink" type="button" data-up="' + i + '">Update</button></td>'
          + '<td>' + (option(it) ? esc(option(it)) + '<br>' : '') + '<button class="tlink rm" type="button" data-rm="' + i + '">Remove</button></td><td class="r">' + money(p.price*it.qty) + '</td></tr>'; }).join('')
      + '</tbody><tfoot><tr><td>Subtotal</td><td></td><td></td><td></td><td class="r">' + money(t.sub) + '</td></tr><tr><td colspan="2"></td><td colspan="3"><button class="checkout" type="button" id="pageCheckout">Checkout</button></td></tr></tfoot>';
    tb.querySelectorAll('[data-ci]').forEach(function(img){ thumb(img, cart[+img.dataset.ci]); });
  }
  $('cartTable').addEventListener('click', function(e){
    var up = e.target.closest('[data-up]'), rm = e.target.closest('[data-rm]'), co = e.target.closest('#pageCheckout');
    if (up){ var i = +up.dataset.up, v = Math.max(0, Math.min(99, parseInt($('q' + i).value, 10) || 0)); if (v === 0) cart.splice(i, 1); else cart[i].qty = v; saveCart(); renderCart(); toast('Cart updated'); }
    if (rm){ cart.splice(+rm.dataset.rm, 1); saveCart(); renderCart(); }
    if (co) $('cartNote').textContent = 'Checkout isn\'t connected yet, so nothing was charged. It opens with Collection 001.';
  });
  function openMini(){ renderCart(); $('miniCart').hidden = false; $('cartBtn').setAttribute('aria-expanded', 'true'); }
  function closeMini(){ $('miniCart').hidden = true; $('cartBtn').setAttribute('aria-expanded', 'false'); }
  $('cartBtn').onclick = function(e){ e.stopPropagation(); if ($('miniCart').hidden) openMini(); else closeMini(); };
  document.addEventListener('click', function(e){ if (!$('miniCart').hidden && !e.target.closest('#miniCart') && !e.target.closest('[data-add]') && !e.target.closest('#pAdd')) closeMini(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !$('miniCart').hidden){ closeMini(); $('cartBtn').focus(); } });
  $('miniEdit').onclick = function(){ closeMini(); };
  $('miniCheckout').onclick = function(){ $('miniNote').textContent = 'Checkout isn\'t connected yet, so nothing was charged.'; };

  /* ---------- product card ---------- */
  function card(p){
    var d = document.createElement('div'); d.className = 'card'; d.dataset.id = p.id;
    d.innerHTML = '<a class="cardlink" href="#product-' + p.id + '"><div class="plate clean"><img class="snap" alt="" hidden></div><div class="ov"><span class="mono">' + p.code + '</span><b>' + esc(p.name) + '</b><span class="price">' + money(p.price) + '</span><span class="small">' + esc(p.short) + '</span></div></a><button class="quick" type="button" data-add="' + p.id + '">Add to cart</button>';
    d.querySelector('.snap').alt = p.name + ', ' + p.code + ', ' + money(p.price);
    return d;
  }
  function paintCards(root){
    root.querySelectorAll('.card').forEach(function(c){ fillImg(c.querySelector('.snap'), c.dataset.id, {w:640, h:640, dist:16.5}); });
  }
  // touch screens have no hover: the first tap shows the details, the second opens the object
  var touchOnly = window.matchMedia && window.matchMedia('(hover: none)').matches;
  document.addEventListener('click', function(e){
    if (!touchOnly) return; var l = e.target.closest('.cardlink'); if (!l) return; var c = l.parentNode;
    if (!c.classList.contains('peek')){ e.preventDefault(); document.querySelectorAll('.card.peek').forEach(function(x){ x.classList.remove('peek'); }); c.classList.add('peek'); }
  }, true);

  document.addEventListener('click', function(e){
    var b = e.target.closest('[data-add]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    var p = product(b.dataset.add); addToCart(p.id, p.finishes ? 'polished' : null, p.sizes ? 'US 9' : null);
  });

  /* ---------- home / shop ---------- */
  var cat = 'all', view = 'grid';
  CATS.forEach(function(c){ var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = c[1]; b.dataset.c = c[0]; b.onclick = function(){ cat = c[0]; renderShop(); }; $('catChips').appendChild(b); });
  function list(){ return PRODUCTS.filter(function(p){ return cat === 'all' || p.cat === cat; }); }
  function renderShop(){
    var L = list();
    $('catChips').querySelectorAll('.chip').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.c === cat); });
    $('shopCount').textContent = L.length + (L.length === 1 ? ' object' : ' objects');
    $('viewGrid').setAttribute('aria-pressed', view === 'grid'); $('viewOne').setAttribute('aria-pressed', view === 'one');
    $('grid').hidden = view !== 'grid'; $('oneWrap').hidden = view !== 'one';
    if (view === 'grid'){ Viewer.unmount(); $('grid').innerHTML = ''; L.forEach(function(p){ $('grid').appendChild(card(p)); }); after(function(){ paintCards($('grid')); }); }
    else buildSlides(L);
  }
  $('viewGrid').onclick = function(){ view = 'grid'; renderShop(); };
  $('viewOne').onclick = function(){ view = 'one'; renderShop(); };
  $('shopCta').onclick = function(){ $('shopSec').scrollIntoView({behavior: RM ? 'auto' : 'smooth'}); };

  var slideIO = null, activeSlide = -1, slideList = [];
  function buildSlides(L){
    slideList = L; var box = $('slides'); box.innerHTML = ''; activeSlide = -1;
    L.forEach(function(p, i){
      var s = document.createElement('div'); s.className = 'slide'; s.dataset.i = i;
      s.innerHTML = '<div class="stage"><div class="plate clean"><img class="snap" alt="" hidden></div><div class="host stage3d" role="img" aria-label="' + esc(p.name) + ' in 3D. Drag to turn."></div><span class="mono hint">' + (GL ? 'Drag to turn' : 'Render') + '</span></div>'
        + '<div class="info"><span class="mono">' + p.code + ' · ' + (i + 1) + ' of ' + L.length + '</span><a class="nm" href="#product-' + p.id + '">' + esc(p.name) + '</a><p class="desc">' + esc(p.copy) + '</p><span class="price" style="font-size:24px">' + money(p.price) + '</span><div class="chips"><button class="btn" type="button" data-add="' + p.id + '">Add to cart</button><a class="btn ghost" href="#product-' + p.id + '">Full details</a></div></div>';
      box.appendChild(s);
    });
    if (slideIO) slideIO.disconnect();
    slideIO = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) activate(+e.target.dataset.i); }); }, {root:box, threshold:.6});
    after(function(){
      box.querySelectorAll('.slide').forEach(function(s, i){ var p = L[i]; fillImg(s.querySelector('.snap'), p.id, {w:700, h:700}); slideIO.observe(s); });
      box.scrollTop = 0; activate(0);
    });
  }
  function activate(i){
    if (i === activeSlide || !slideList[i]) return; activeSlide = i;
    $('slCount').textContent = (i + 1) + ' / ' + slideList.length + ' · ' + slideList[i].name;
    if (!GL) return;
    var s = $('slides').children[i], host = s.querySelector('.host');
    $('slides').querySelectorAll('.snap').forEach(function(im, k){ im.style.visibility = k === i ? 'hidden' : ''; });
    Viewer.mount(host); Viewer.finish('polished'); Viewer.show(slideList[i].id);
  }
  function step(d){ var box = $('slides'), n = Math.max(0, Math.min(slideList.length - 1, activeSlide + d)); box.children[n].scrollIntoView({behavior: RM ? 'auto' : 'smooth', block:'nearest'}); }
  $('slPrev').onclick = function(){ step(-1); }; $('slNext').onclick = function(){ step(1); };
  $('slides').addEventListener('keydown', function(e){ if (e.key === 'ArrowDown' || e.key === 'ArrowRight'){ e.preventDefault(); step(1); } if (e.key === 'ArrowUp' || e.key === 'ArrowLeft'){ e.preventDefault(); step(-1); } });

  function postCard(p){ return '<a class="pcard" href="#post-' + p.id + '"><div class="plate">' + plateHTML() + '</div><div style="display:flex;justify-content:space-between;gap:8px"><span class="mono">' + esc(p.tag) + ' · ' + esc(p.date) + '</span><span class="mono" style="color:var(--accent)">Draft</span></div><b>' + esc(p.title) + '</b><span class="small">' + esc(p.dek) + '</span></a>'; }
  var coverSalt = (Math.random()*1e6)|0;
  function cover(cv, p){ if (cv.offsetParent === null) return; KS.fit(cv, 1.5); Covers.draw(cv, p, coverSalt); }
  function paintPosts(root, L){ root.querySelectorAll('.pcard').forEach(function(c, i){ cover(c.querySelector('canvas'), L[i]); }); }

  // hero
  var hc = $('heroCv'), hero = KS.create(hc, {layout:'ring', count:9, seed:4, size:1.2, spread:1.1, cx:.64, cy:.46, spin:.00005});
  var ptr = {x:.64, y:.46, s:0}, tgt = {x:.64, y:.46, s:0}, heroOn = true, last = 0;
  hc.addEventListener('pointermove', function(e){ var r = hc.getBoundingClientRect(); tgt.x = (e.clientX - r.left) / r.width; tgt.y = (e.clientY - r.top) / r.height; tgt.s = 1; });
  hc.addEventListener('pointerleave', function(){ tgt.s = 0; });
  if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ heroOn = es[0].isIntersecting; }).observe(hc);
  function heroFrame(t){
    requestAnimationFrame(heroFrame);
    if (!heroOn || page !== 'home' || t - last < 33) return; last = t;
    ptr.x += (tgt.x - ptr.x)*.08; ptr.y += (tgt.y - ptr.y)*.08; ptr.s += (tgt.s - ptr.s)*.05;
    var sp = Math.max(0, Math.min(1, (window.scrollY || 0) / (hc.clientHeight || 1)));
    hero.set({pointer: ptr.s > .01 ? {x:ptr.x, y:ptr.y, s:ptr.s} : null, veil:.1 + sp*.45, spread:1.1 + sp*.25}); hero.render(RM ? 0 : t);
    if (!RM) $('heroMark').style.transform = 'translateY(' + (sp*-30).toFixed(1) + 'px)';
  }
  requestAnimationFrame(heroFrame);

  function enterHome(){
    KS.fit(hc, 1.25); hero.render(0);
    renderShop();
  }

  /* ---------- product page: big still or live 3D on the left, details on the right, more views on scroll ---------- */
  var cur = null, curFinish = 'polished', curSize = null, mediaMode = 'images', inspecting = false;
  var RING_MM = {'US 5':'15.7', 'US 6':'16.5', 'US 7':'17.3', 'US 8':'18.1', 'US 9':'19.0', 'US 10':'19.8', 'US 11':'20.6', 'US 12':'21.4'};
  function renderMedia(){
    var p = cur;
    $('mImages').setAttribute('aria-pressed', mediaMode === 'images'); $('m3d').setAttribute('aria-pressed', mediaMode === '3d');
    $('mImagesView').hidden = mediaMode !== 'images'; $('m3dView').hidden = mediaMode !== '3d';
    $('mHint').textContent = mediaMode === 'images' ? 'Render · photos once prototypes are made' : (GL ? 'Live model' : '3D unavailable');
    if (mediaMode === 'images'){
      Viewer.unmount();
      var img = $('pMainImg'); img.alt = p.name + ' in ' + finishName(curFinish).toLowerCase(); fillImg(img, p.id, {w:1000, h:1020, finish:curFinish});
    } else {
      $('noGL').hidden = GL;
      after(function(){ if (GL){ Viewer.mount($('p3dHost')); Viewer.finish(curFinish); if (Viewer.current() !== p.id) Viewer.show(p.id); Viewer.inspect(inspecting); } });
    }
  }
  // scrolling down shows the object large and close up, one angle after another
  function renderDetails(){
    var p = cur, D = [{ay:.85, ax:-.3, dist:10.5, cap:'Three-quarter'}, {ay:1.5, ax:-.05, dist:8, cap:'Profile'}, {detail:true, cap:'The vermilion part'}, {ax:-1.15, ay:.3, dist:9, cap:'From above'}, {ay:-.6, ax:.35, dist:7, cap:'Edge and finish'}];
    $('pDetails').innerHTML = D.map(function(d, i){ return '<figure class="dfig"><div class="plate clean"><img class="snap" alt="' + esc(p.name + ', ' + d.cap.toLowerCase()) + '" hidden></div><figcaption class="mono">' + (i + 1) + ' / ' + D.length + ' · ' + esc(d.cap) + '</figcaption></figure>'; }).join('');
    after(function(){ $('pDetails').querySelectorAll('.dfig').forEach(function(f, i){ var o = Object.assign({w:1300, h:1330, finish:curFinish}, D[i]); delete o.cap; if (window.innerWidth < 600){ o.w = 800; o.h = 820; } fillImg(f.querySelector('img'), p.id, o); }); });
  }
  function renderSide(){
    var p = cur;
    $('pSizeWrap').innerHTML = p.sizes ? p.sizes.map(function(s){ return '<button type="button" data-s="' + esc(s) + '" aria-pressed="' + (s === curSize) + '">' + esc(s) + '</button>'; }).join('') : '';
    $('pFinishes').innerHTML = p.finishes.map(function(fid){ return '<button type="button" data-f="' + fid + '" aria-pressed="' + (fid === curFinish) + '" aria-label="' + finishName(fid) + '" title="' + finishName(fid) + '"><img alt="" hidden></button>'; }).join('');
    after(function(){ $('pFinishes').querySelectorAll('[data-f]').forEach(function(b){ fillImg(b.querySelector('img'), p.id, {w:220, h:220, finish:b.dataset.f, dist:16}); }); });
    var dims = (p.spec.filter(function(r){ return r[0] === 'Size'; })[0] || [])[1];
    $('pMeta').textContent = 'Shown in ' + finishName(curFinish) + (dims ? ' · ' + dims : '');
  }
  $('pSizeWrap').addEventListener('click', function(e){ var b = e.target.closest('[data-s]'); if (!b) return; curSize = b.dataset.s; $('pSizeWrap').querySelectorAll('[data-s]').forEach(function(x){ x.setAttribute('aria-pressed', x === b); }); });
  $('pFinishes').addEventListener('click', function(e){ var b = e.target.closest('[data-f]'); if (!b) return; curFinish = b.dataset.f;
    $('pFinishes').querySelectorAll('[data-f]').forEach(function(x){ x.setAttribute('aria-pressed', x === b); });
    var dims = (cur.spec.filter(function(r){ return r[0] === 'Size'; })[0] || [])[1]; $('pMeta').textContent = 'Shown in ' + finishName(curFinish) + (dims ? ' · ' + dims : '');
    Viewer.finish(curFinish); if (mediaMode === 'images') renderMedia(); renderDetails(); });
  $('mImages').onclick = function(){ mediaMode = 'images'; inspecting = false; syncInspect(); renderMedia(); };
  $('m3d').onclick = function(){ mediaMode = '3d'; renderMedia(); };
  $('zIn').onclick = function(){ Viewer.zoomBy(.85); }; $('zOut').onclick = function(){ Viewer.zoomBy(1.18); };
  function syncInspect(){ var b = $('pInspect'); b.setAttribute('aria-pressed', inspecting); b.querySelector('span').textContent = inspecting ? 'Back to full view' : 'Inspect the vermilion part'; }
  $('pInspect').onclick = function(){
    if (!GL){ var df = $('pDetails').children[2]; if (df) df.scrollIntoView({behavior: RM ? 'auto' : 'smooth', block:'center'}); return; }
    inspecting = !inspecting; if (mediaMode !== '3d'){ mediaMode = '3d'; Viewer.show(cur.id); }
    syncInspect(); renderMedia(); window.scrollTo({top:0, behavior: RM ? 'auto' : 'smooth'});
  };
  $('pAdd').onclick = function(e){ e.stopPropagation(); if (cur.sizes && !curSize){ toast('Choose a size first'); $('pSizeWrap').querySelector('button').focus(); return; } addToCart(cur.id, curFinish, cur.sizes ? curSize : null); };
  $('pBack').onclick = function(e){ if (history.length > 1 && prevPage){ e.preventDefault(); history.back(); } };
  function enterProduct(id){
    var p = product(id); if (!p){ location.hash = 'shop'; return; }
    cur = p; curFinish = 'polished'; curSize = null; inspecting = false; mediaMode = 'images';
    $('pName').textContent = p.name; $('pPrice').textContent = money(p.price);
    $('pQuips').innerHTML = (p.quips || []).map(function(q){ return '<li>' + esc(q) + '</li>'; }).join('');
    $('pCopy').textContent = p.copy;
    $('pSpec').innerHTML = [['Part', p.code]].concat(p.spec).map(function(r){ return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('');
    $('pSizeChartWrap').hidden = !p.sizes;
    $('pSizeChart').innerHTML = p.sizes ? '<thead><tr><th>Size</th><th>Inside diameter</th></tr></thead><tbody>' + p.sizes.map(function(s){ return '<tr><td>' + esc(s) + '</td><td>' + (RING_MM[s] || '—') + ' mm</td></tr>'; }).join('') + '</tbody>' : '';
    $('pInspect').hidden = !GL;
    var ps = p.post && post(p.post);
    $('pPostWrap').innerHTML = ps ? '<span class="lab">From the journal</span>' + postCard(ps) : '';
    if (ps) after(function(){ paintPosts($('pPostWrap'), [ps]); });
    renderSide(); syncInspect(); renderMedia(); renderDetails();
  }

  /* ---------- radio ---------- */
  var ed = 0, rpm = 33.333;
  var rstage = $('rstage'), rec = $('record'), disc = $('disc'), deck = $('deck'), platter = $('platter'), sleeve = $('sleeve');
  EDITIONS.forEach(function(e, i){
    var b = document.createElement('button'); b.type = 'button'; b.className = 'sl'; b.dataset.i = i;
    b.innerHTML = '<span class="plate">' + plateHTML('<span class="t wm" style="left:8%;top:7%;color:#fff;font-size:clamp(14px,1.6vw,20px)">kram.<br>radio</span><span class="t wm" style="left:8%;bottom:7%;color:#fff;font-size:clamp(12px,1.2vw,16px)">' + e.no + '</span>') + '</span><span class="mono">' + e.no + ' · ' + e.date + '</span><b>' + esc(e.title) + '</b>';
    b.onclick = function(){ setEdition(i); };
    $('crate').appendChild(b);
  });
  function edArt(e){ return {layout:e.layout, count:e.layout === 'grid' ? 9 : e.layout === 'column' ? 5 : e.layout === 'orbit' ? 6 : 8, seed:e.seed, palette:e.palette, cx:e.layout === 'ring' ? .58 : .5, cy:.56, size:e.layout === 'column' ? 1.3 : 1, streak:e.layout === 'orbit' ? .22 : .6}; }
  function drawRadioArt(){
    var e = EDITIONS[ed];
    paint($('sleeveCv'), edArt(e)); paint($('discCv'), {layout:'orbit', count:7, seed:e.seed + 1, palette:e.palette, streak:.2, edge:0, veil:.05}); paint($('rbg'), {layout:'ring', count:8, seed:2, size:1.2, veil:.25});
  }
  function setEdition(i){
    if (docked) setDocked(false);
    ed = (i + EDITIONS.length) % EDITIONS.length; var e = EDITIONS[ed];
    $('crate').querySelectorAll('.sl').forEach(function(b, k){ b.setAttribute('aria-pressed', k === ed); });
    var sb = $('crate').children[ed]; if (sb && page === 'radio') sb.scrollIntoView({behavior: RM ? 'auto' : 'smooth', block:'nearest', inline:'center'});
    $('crateCount').textContent = 'Edition ' + (ed + 1) + ' of ' + EDITIONS.length;
    $('sleeveNo').textContent = e.no;
    $('edMeta').textContent = 'Edition ' + e.no + ' · ' + e.date + (e.tracks ? ' · proposed selection' : ' · upcoming');
    $('edTitle').textContent = e.title; $('edSound').textContent = 'Deck sound: ' + e.sound;
    $('tracks').innerHTML = e.tracks ? e.tracks.map(function(t, k){ return '<li><span class="n">' + (k < 9 ? '0' : '') + (k + 1) + '</span><div><b>' + esc(t[0]) + '</b><span>' + esc(t[1]) + '</span></div></li>'; }).join('')
      : '<li><span class="n">—</span><div><b>Selection in progress</b><span>Eight tracks, chosen two weeks before release</span></div></li>';
    if (page === 'radio') drawRadioArt();
  }
  $('crPrev').onclick = function(){ setEdition(ed - 1); }; $('crNext').onclick = function(){ setEdition(ed + 1); };
  $('crate').addEventListener('keydown', function(e){ if (e.key === 'ArrowRight'){ e.preventDefault(); setEdition(ed + 1); $('crate').children[ed].focus(); } if (e.key === 'ArrowLeft'){ e.preventDefault(); setEdition(ed - 1); $('crate').children[ed].focus(); } });
  document.querySelectorAll('[data-rpm]').forEach(function(b){ b.onclick = function(){ rpm = +b.dataset.rpm; document.querySelectorAll('[data-rpm]').forEach(function(x){ x.setAttribute('aria-pressed', x === b); }); $('rpmRead').textContent = (rpm > 40 ? '45' : '33⅓') + ' rpm'; }; });

  var docked = false, rdrag = null;
  function rel(el){ var a = el.getBoundingClientRect(), b = rstage.getBoundingClientRect(); return {x:a.left - b.left + a.width/2, y:a.top - b.top + a.height/2, w:a.width}; }
  function placeRecord(anim){
    if (rstage.offsetParent === null) return;
    var p = rel(platter), s = rel(sleeve), size = p.w*.96;
    rec.style.width = rec.style.height = size + 'px';
    var home = rstage.clientWidth < 520 ? {x:s.x, y:s.y + s.w*.38} : {x:s.x + s.w*.42, y:s.y};
    var at = docked ? p : home;
    rec.classList.toggle('anim', !!anim);
    rec.style.left = (at.x - size/2) + 'px'; rec.style.top = (at.y - size/2) + 'px'; rec.style.zIndex = docked ? 4 : 1;
  }
  function angleAt(e){ var r = rec.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height/2), e.clientX - (r.left + r.width/2)); }
  rec.addEventListener('pointerdown', function(e){ e.preventDefault(); var r = rec.getBoundingClientRect();
    rdrag = {ox:e.clientX - r.left, oy:e.clientY - r.top, sx:e.clientX, sy:e.clientY, moved:false, scratch:docked, a:angleAt(e), t:performance.now()};
    rec.classList.add('drag'); rec.classList.remove('anim'); if (!docked) rec.style.zIndex = 5; try { rec.setPointerCapture(e.pointerId); } catch (_) {} });
  rec.addEventListener('pointermove', function(e){ if (!rdrag) return;
    if (Math.hypot(e.clientX - rdrag.sx, e.clientY - rdrag.sy) > 4) rdrag.moved = true;
    if (rdrag.scratch){ var a = angleAt(e), da = a - rdrag.a; if (da > Math.PI) da -= 2*Math.PI; if (da < -Math.PI) da += 2*Math.PI;
      var now = performance.now(), dt = Math.max(8, now - rdrag.t); rdrag.a = a; rdrag.t = now; angle += da; held = true; handSpeed = (da/dt) / (2*Math.PI*rpm/60000); return; }
    var b = rstage.getBoundingClientRect(); rec.style.left = (e.clientX - b.left - rdrag.ox) + 'px'; rec.style.top = (e.clientY - b.top - rdrag.oy) + 'px'; });
  function recUp(){ if (!rdrag) return; var d = rdrag; rdrag = null; rec.classList.remove('drag'); held = false;
    if (!d.moved){ setDocked(!docked); return; } if (d.scratch) return;
    var a = rel(rec), p = rel(platter); setDocked(Math.hypot(a.x - p.x, a.y - p.y) < p.w*.55); }
  rec.addEventListener('pointerup', recUp); rec.addEventListener('pointercancel', recUp);
  rec.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); setDocked(!docked); } });
  $('playBtn').onclick = function(){ setDocked(!docked); };
  function setDocked(d){
    docked = d; placeRecord(true); deck.classList.toggle('on', d);
    $('playBtn').textContent = d ? 'Take record off' : 'Put record on';
    rec.setAttribute('aria-label', d ? 'KRAM Radio record, playing. Press Enter to take it off.' : 'KRAM Radio record. Press Enter to put it on the deck.');
    $('rstatus').textContent = d ? 'Playing · Ed. ' + EDITIONS[ed].no + ' ' + EDITIONS[ed].title : 'Record in sleeve';
    if (d) audioStart(); else audioStop();
  }
  var angle = 0, speed = 0, held = false, handSpeed = 0, lastT = 0;
  function spin(t){ requestAnimationFrame(spin);
    var dt = lastT ? Math.min(50, t - lastT) : 16; lastT = t;
    if (held){ speed += (handSpeed - speed)*.5; handSpeed *= .85; } else speed += ((docked ? 1 : 0) - speed)*(docked ? .035 : .06);
    if (!held) angle += speed*(2*Math.PI*rpm/60000)*dt*(RM ? .25 : 1);
    if (page === 'radio') disc.style.transform = 'rotate(' + angle + 'rad)';
    setPitch(speed); }
  requestAnimationFrame(spin);

  var AC = null, master = null, bus = null, timers = [], layer = null;
  function setPitch(s){ if (!AC || !bus) return; var r = Math.abs(s)*(rpm/33.333), c = 1200*Math.log2(Math.max(.06, r));
    bus.offset.setTargetAtTime(Math.max(-4800, Math.min(2400, c)), AC.currentTime, .03);
    if (layer) layer.duck.gain.setTargetAtTime(Math.min(1, Math.abs(s)*1.4), AC.currentTime, .05); }
  function makeCtx(){ var C = window.AudioContext || window.webkitAudioContext; if (!C) return false; AC = new C();
    master = AC.createGain(); master.gain.value = 0; var lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
    var conv = AC.createConvolver(), len = AC.sampleRate*4.5, buf = AC.createBuffer(2, len, AC.sampleRate);
    for (var ch = 0; ch < 2; ch++){ var dd = buf.getChannelData(ch); for (var i = 0; i < len; i++) dd[i] = (Math.random()*2 - 1)*Math.pow(1 - i/len, 2.4); }
    conv.buffer = buf; var wet = AC.createGain(); wet.gain.value = .6; var dry = AC.createGain(); dry.gain.value = .4;
    master.connect(lp); lp.connect(dry); lp.connect(conv); conv.connect(wet); dry.connect(AC.destination); wet.connect(AC.destination);
    bus = AC.createConstantSource(); bus.offset.value = 0; bus.start(); return true; }
  function osc(type, f, t0, t1, out, g){ var o = AC.createOscillator(); o.type = type; o.frequency.value = f; bus.connect(o.detune); var a = AC.createGain(); a.gain.value = g; o.connect(a); a.connect(out); o.start(t0); o.stop(t1); return o; }
  function hz(e, s){ return e.root*Math.pow(2, s/12); }
  function audioStart(){
    try {
      if (!AC && !makeCtx()) return; if (AC.state === 'suspended') AC.resume();
      audioStopNow();
      var e = EDITIONS[ed], t = AC.currentTime, L = layer = {duck:AC.createGain(), nodes:[]}; L.duck.gain.value = 0; L.duck.connect(master);
      master.gain.cancelScheduledValues(t); master.gain.setTargetAtTime(+$('vol').value*.5, t, .8);
      var sub = osc('sine', e.root/2, t, t + 3600, L.duck, .22), lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = .07; lg.gain.value = .08; lfo.connect(lg); lg.connect(sub.detune); lfo.start(); L.nodes.push(sub, lfo);
      if (e.waves > 0){ var nb = AC.createBuffer(1, AC.sampleRate*3, AC.sampleRate), nd = nb.getChannelData(0), lst = 0;
        for (var i = 0; i < nd.length; i++){ lst = (lst + .02*(Math.random()*2 - 1))/1.02; nd[i] = lst*3.5; }
        var ns = AC.createBufferSource(); ns.buffer = nb; ns.loop = true; bus.connect(ns.detune);
        var bp = AC.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 700; var ng = AC.createGain(); ng.gain.value = .12*e.waves;
        var tl = AC.createOscillator(), tg = AC.createGain(); tl.frequency.value = .09; tg.gain.value = .1*e.waves; tl.connect(tg); tg.connect(ng.gain); tl.start();
        ns.connect(bp); bp.connect(ng); ng.connect(L.duck); ns.start(); L.nodes.push(ns, tl); }
      function pad(){ var t0 = AC.currentTime, g = AC.createGain(); g.gain.value = 0; g.connect(L.duck);
        var a = e.scale[(Math.random()*4)|0], ch = [a, a + 7, a + 12 + (Math.random() < .5 ? 4 : 3)];
        ch.forEach(function(s, k){ osc(e.pad, hz(e, s), t0, t0 + 10, g, k ? .08 : .16); osc('sine', hz(e, s)*1.003, t0, t0 + 10, g, .06); });
        g.gain.linearRampToValueAtTime(.5, t0 + 3); g.gain.setTargetAtTime(0, t0 + 5.5, 1.5); }
      function bell(){ if (Math.random() > e.bells) return; var t0 = AC.currentTime, s = e.scale[(Math.random()*e.scale.length)|0] + 12, f = hz(e, s), g = AC.createGain(); g.gain.value = 0; g.connect(L.duck);
        var car = osc(e.pad === 'triangle' ? 'triangle' : 'sine', f, t0, t0 + 4, g, .9);
        var mod = AC.createOscillator(), mg = AC.createGain(); mod.frequency.value = f*(e.pad === 'triangle' ? 4 : 3.5); mg.gain.value = f*.9; mod.connect(mg); mg.connect(car.frequency); bus.connect(mod.detune); mod.start(t0); mod.stop(t0 + 4);
        mg.gain.setTargetAtTime(0, t0, .25); g.gain.linearRampToValueAtTime(.09, t0 + .01); g.gain.setTargetAtTime(0, t0 + .02, e.pad === 'triangle' ? .35 : .9); }
      pad(); timers.push(setInterval(pad, 5200)); timers.push(setInterval(bell, e.rate/2));
    } catch (err) { $('rstatus').textContent = 'Playing · sound unavailable in this browser'; }
  }
  function audioStopNow(){ timers.forEach(clearInterval); timers = []; if (layer){ var L = layer; layer = null; try { L.duck.gain.setTargetAtTime(0, AC.currentTime, .3); setTimeout(function(){ L.nodes.forEach(function(n){ try { n.stop(); } catch (_) {} }); L.duck.disconnect(); }, 1500); } catch (_) {} } }
  function audioStop(){ if (!AC) return; timers.forEach(clearInterval); timers = []; var L = layer; setTimeout(function(){ if (!docked && layer === L && L){ L.nodes.forEach(function(n){ try { n.stop(); } catch (_) {} }); try { L.duck.disconnect(); } catch (_) {} layer = null; } }, 2600); }
  $('vol').addEventListener('input', function(){ if (AC && master && docked) master.gain.setTargetAtTime(+$('vol').value*.5, AC.currentTime, .1); });
  function enterRadio(){ $('crate').querySelectorAll('.sl').forEach(function(b, i){ paint(b.querySelector('canvas'), edArt(EDITIONS[i])); }); drawRadioArt(); placeRecord(false); setEdition(ed); }
  setEdition(0);

  /* ---------- journal ---------- */
  var topic = 'All';
  var TOPICS = ['All'].concat(POSTS.map(function(p){ return p.tag; }).filter(function(t, i, a){ return a.indexOf(t) === i; }));
  TOPICS.forEach(function(t){ var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = t; b.onclick = function(){ topic = t; renderJournal(); }; $('jChips').appendChild(b); });
  $('jShuffle').onclick = function(){ coverSalt = (Math.random()*1e6)|0; renderJournal(); };
  function renderJournal(){
    var L = POSTS.filter(function(p){ return topic === 'All' || p.tag === topic; });
    $('jChips').querySelectorAll('.chip').forEach(function(b){ b.setAttribute('aria-pressed', b.textContent === topic); });
    $('jCount').textContent = L.length + (L.length === 1 ? ' post' : ' posts');
    $('posts').innerHTML = L.map(postCard).join(''); after(function(){ paintPosts($('posts'), L); });
  }
  $('nlForm').addEventListener('submit', function(e){ e.preventDefault(); var v = $('nlEmail').value.trim();
    $('nlNote').textContent = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? 'Thanks. Sign-up isn\'t connected yet, so nothing was sent or saved.' : 'Enter an email address like name@example.com.'; });
  function enterPost(id){
    var p = post(id); if (!p){ location.hash = 'journal'; return; }
    $('postTag').textContent = p.tag;
    var h = '<span class="mono">' + esc(p.tag) + ' · ' + esc(p.date) + ' · <span style="color:var(--accent)">Draft</span></span><h1 style="margin-top:12px">' + esc(p.title) + '</h1><p class="dek">' + esc(p.dek) + '</p><div class="plate hero-art" data-art="-1">' + plateHTML() + '</div><div class="body">';
    p.body.forEach(function(b, i){
      if (b.p) h += '<p>' + esc(b.p) + '</p>';
      else if (b.h) h += '<h3>' + esc(b.h) + '</h3>';
      else if (b.quote) h += '<blockquote>' + esc(b.quote) + '</blockquote>';
      else { var paper = !!b.wire; h += '<figure class="' + (paper ? 'paper' : '') + '"><div class="plate" data-art="' + i + '">' + (paper ? '' : plateHTML()) + (b.art ? '' : '<img class="snap" alt="" hidden>') + '</div><figcaption class="small">' + esc(b.cap) + '</figcaption></figure>'; }
    });
    if (p.product){ var pr = product(p.product); h += '<div class="buy" style="margin-top:8px"><span class="lab">In the shop</span><div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap"><b style="font:700 22px/1.1 var(--f-display)">' + esc(pr.name) + ' · ' + money(pr.price) + '</b><a class="btn" href="#product-' + pr.id + '">View object</a></div></div>'; }
    h += '</div>'; $('article').innerHTML = h;
    after(function(){
      $('article').querySelectorAll('[data-art]').forEach(function(el){
        var i = +el.dataset.art, b = i < 0 ? {art:p.art} : p.body[i], cv = el.querySelector('canvas'), img = el.querySelector('img');
        if (cv && i < 0) cover(cv, p); else if (cv) paint(cv, b.art || Object.assign({}, product(b.render || b.detail).art, {veil:.2}));
        if (img){ var id = b.wire || b.render || b.detail; img.alt = b.cap; fillImg(img, id, {w:1100, h:700, wire:!!b.wire, detail:!!b.detail, ax:b.wire ? -.2 : 0, ay:b.wire ? .3 : 0}); }
      });
    });
    var more = POSTS.filter(function(x){ return x.id !== id; }).slice(0, 3); $('postMore').innerHTML = more.map(postCard).join(''); after(function(){ paintPosts($('postMore'), more); });
  }

  /* ---------- suggest: sketch pad, uploads, submissions, studio inbox ---------- */
  var SG = {db:null, assets:null, user:null, uid:null, canWrite:null, owner:false, ready:false, reviews:{}, mine:[], all:[], filter:'All', started:false, files:[], tab:'sketch'};
  var STATUSES = ['New', 'Shortlisted', 'In talks', 'Declined'];
  var PAPER = '#f6f5f9', INK = '#221b29', RED = '#e9553a';
  var sk = {cv:$('skCv'), strokes:[], cur:null, tool:'ink', size:4, trace:null};
  sk.ctx = sk.cv.getContext('2d');
  function skDraw(){
    var x = sk.ctx, W = sk.cv.width, H = sk.cv.height;
    x.globalAlpha = 1; x.fillStyle = PAPER; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(34,27,41,.12)'; for (var gx = 30; gx < W; gx += 30) for (var gy = 30; gy < H; gy += 30) x.fillRect(gx, gy, 2, 2);
    if (sk.trace){ var s = Math.min(W, H)*.9; x.globalAlpha = .22; x.drawImage(sk.trace, (W - s)/2, (H - s)/2, s, s); x.globalAlpha = 1; }
    sk.strokes.forEach(stroke);
    if (sk.cur) stroke(sk.cur);
  }
  function stroke(s){ var x = sk.ctx, p = s.pts; if (!p.length) return;
    x.strokeStyle = s.tool === 'red' ? RED : s.tool === 'erase' ? PAPER : INK; x.lineWidth = s.tool === 'erase' ? s.size*4 : s.size; x.lineCap = x.lineJoin = 'round';
    x.beginPath(); x.moveTo(p[0][0], p[0][1]); for (var i = 1; i < p.length; i++) x.lineTo(p[i][0], p[i][1]); if (p.length === 1) x.lineTo(p[0][0] + .1, p[0][1]); x.stroke(); }
  function skPt(e){ var r = sk.cv.getBoundingClientRect(); return [(e.clientX - r.left)/r.width*sk.cv.width, (e.clientY - r.top)/r.height*sk.cv.height]; }
  sk.cv.addEventListener('pointerdown', function(e){ e.preventDefault(); sk.cur = {tool:sk.tool, size:sk.size, pts:[skPt(e)]}; try { sk.cv.setPointerCapture(e.pointerId); } catch (_) {} skDraw(); });
  sk.cv.addEventListener('pointermove', function(e){ if (!sk.cur) return; sk.cur.pts.push(skPt(e)); skDraw(); });
  function skUp(){ if (!sk.cur) return; sk.strokes.push(sk.cur); sk.cur = null; skDraw(); }
  sk.cv.addEventListener('pointerup', skUp); sk.cv.addEventListener('pointercancel', skUp);
  document.querySelectorAll('[data-tool]').forEach(function(b){ b.onclick = function(){ sk.tool = b.dataset.tool; document.querySelectorAll('[data-tool]').forEach(function(x){ x.setAttribute('aria-pressed', x === b); }); }; });
  $('skSize').addEventListener('input', function(){ sk.size = +$('skSize').value; });
  $('skUndo').onclick = function(){ sk.strokes.pop(); skDraw(); };
  $('skClear').onclick = function(){ sk.strokes = []; skDraw(); };
  if (GL) PRODUCTS.forEach(function(p){ var o = document.createElement('option'); o.value = p.id; o.textContent = 'Over the ' + p.name; $('skTrace').appendChild(o); });
  else { $('skTrace').hidden = true; document.querySelector('label[for=skTrace]').hidden = true; }
  $('skTrace').addEventListener('change', function(){
    var id = $('skTrace').value; if (!id){ sk.trace = null; skDraw(); return; }
    snapLater(id, {w:900, h:900, wire:true}, function(u){ if (!u) return; var im = new Image(); im.onload = function(){ sk.trace = im; skDraw(); }; im.src = u; });
  });
  skDraw();

  function sgTab(t){ SG.tab = t; $('sgSketchTab').setAttribute('aria-pressed', t === 'sketch'); $('sgUploadTab').setAttribute('aria-pressed', t === 'upload'); $('sgSketch').hidden = t !== 'sketch'; $('sgUpload').hidden = t !== 'upload';
    $('sgHint').textContent = t === 'sketch' ? 'Draw with a mouse, pen or finger' : (SG.assets ? 'Up to 5 files' : 'Uploads need studio access on this link'); }
  $('sgSketchTab').onclick = function(){ sgTab('sketch'); }; $('sgUploadTab').onclick = function(){ sgTab('upload'); };
  var OK_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'];
  function addFiles(list){
    var msg = '';
    Array.prototype.forEach.call(list, function(f){
      if (SG.files.length >= 5){ msg = 'You can send up to 5 files.'; return; }
      if (OK_TYPES.indexOf(f.type) < 0){ msg = f.name + ' isn\'t a supported type. Use PNG, JPG, WebP, GIF or PDF.'; return; }
      if (f.size > 20*1024*1024){ msg = f.name + ' is over 20 MB.'; return; }
      SG.files.push(f);
    });
    renderFiles(); if (msg) $('sgNote').textContent = msg;
  }
  function renderFiles(){ $('fileList').innerHTML = SG.files.map(function(f, i){ return '<li><span>' + esc(f.name) + ' <span class="small">· ' + (f.size/1048576).toFixed(1) + ' MB</span></span><button class="link" type="button" data-rmf="' + i + '">Remove</button></li>'; }).join(''); }
  $('fileList').addEventListener('click', function(e){ var b = e.target.closest('[data-rmf]'); if (b){ SG.files.splice(+b.dataset.rmf, 1); renderFiles(); } });
  $('sgFiles').addEventListener('change', function(){ addFiles($('sgFiles').files); $('sgFiles').value = ''; });
  var drop = $('drop');
  ['dragenter', 'dragover'].forEach(function(ev){ drop.addEventListener(ev, function(e){ e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function(ev){ drop.addEventListener(ev, function(e){ e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function(e){ if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files); });

  // connect to the page's store; everything above works without it
  function connect(){
    if (SG.started) return; SG.started = true;
    var c = window.claude; if (!c || !c.use){ sgState(); return; }
    Promise.all([c.use('db'), c.use('assets'), c.use('user')]).then(function(r){
      SG.db = r[0]; SG.assets = r[1]; SG.user = r[2];
      if (!SG.db || !SG.user){ sgState(); return; }
      return Promise.all([SG.user.id(), SG.user.can('data.write'), SG.user.isOwner(), SG.user.canEdit()]).then(function(v){
        SG.uid = v[0]; SG.canWrite = v[1]; SG.owner = !!(v[2] || v[3]); SG.ready = true; sgState(); listen();
      });
    }).catch(function(){ sgState(); });
  }
  function sgState(){
    var b = $('sgSend');
    if (!SG.ready || !SG.uid || SG.canWrite === false){ b.textContent = 'Send to the studio'; }
    if (SG.tab === 'upload') sgTab('upload');
  }
  function listen(){
    var loadT = setTimeout(function(){ if (!SG.mine.length) $('sgNote').textContent = $('sgNote').textContent || ''; }, 10000);
    SG.db.collection('reviews').onSnapshot(function(s){ SG.reviews = {}; s.docs.forEach(function(d){ SG.reviews[d.id] = d.data().status; }); renderMine(); renderInbox(); }, function(){});
    if (SG.uid) SG.db.doc('suggestions/' + SG.uid).onSnapshot(function(d){ clearTimeout(loadT); SG.mine = d.exists ? (d.data().items || []) : []; renderMine(); }, function(){});
    if (SG.owner) SG.db.collection('suggestions').onSnapshot(function(s){
      var all = []; s.docs.forEach(function(d){ (d.data().items || []).forEach(function(it){ all.push(it); }); });
      all.sort(function(a, b){ return a.createdAt < b.createdAt ? 1 : -1; }); SG.all = all; renderInbox();
    }, function(){});
  }
  function thumbSrc(sketch){ if (!sketch) return null; return sketch.asset ? '/_blob/' + sketch.asset : sketch.data || null; }
  function subCard(it, inbox){
    var st = SG.reviews[it.id] || 'New', src = thumbSrc(it.sketch);
    var files = (it.files || []).map(function(f){ return '<a class="link" href="/_blob/' + esc(f.asset) + '" target="_blank" rel="noopener">' + esc(f.name) + '</a>'; }).join(' · ');
    return '<article class="sub"><div class="plate clean sthumb">' + (src ? '<img alt="Sketch for ' + esc(it.title) + '" src="' + esc(src) + '">' : '<span class="small">No sketch</span>') + '</div>'
      + '<div class="sbody"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><span class="mono">' + esc(it.cat) + ' · ' + new Date(it.createdAt).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}) + '</span><span class="st ' + (st === 'Shortlisted' || st === 'In talks' ? 'live' : '') + '">' + esc(st) + '</span></div>'
      + '<b>' + esc(it.title) + '</b><p class="small" style="font-size:14px">' + esc(it.desc) + '</p>'
      + (it.materials ? '<span class="small">Materials: ' + esc(it.materials) + '</span>' : '')
      + (files ? '<span class="small">Files: ' + files + '</span>' : '')
      + (inbox ? '<span class="small">From ' + esc(it.name) + ' · <span style="user-select:all">' + esc(it.contact) + '</span></span><label class="lab" for="st-' + esc(it.id) + '">Status</label><select id="st-' + esc(it.id) + '" data-review="' + esc(it.id) + '">' + STATUSES.map(function(s){ return '<option' + (s === st ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>' : '')
      + '</div></article>';
  }
  function renderMine(){ $('mineSec').hidden = !SG.mine.length; $('mine').innerHTML = SG.mine.map(function(it){ return subCard(it, false); }).join(''); }
  function renderInbox(){
    if (!SG.owner){ $('inboxSec').hidden = true; return; }
    $('inboxSec').hidden = false;
    var counts = {All:SG.all.length}; STATUSES.forEach(function(s){ counts[s] = 0; }); SG.all.forEach(function(it){ counts[SG.reviews[it.id] || 'New']++; });
    $('inboxFilter').innerHTML = ['All'].concat(STATUSES).map(function(s){ return '<button class="chip" type="button" data-sf="' + s + '" aria-pressed="' + (s === SG.filter) + '">' + s + ' · ' + counts[s] + '</button>'; }).join('');
    var L = SG.all.filter(function(it){ return SG.filter === 'All' || (SG.reviews[it.id] || 'New') === SG.filter; });
    $('inboxCount').textContent = SG.all.length ? SG.all.length + (SG.all.length === 1 ? ' submission so far.' : ' submissions so far.') : 'Nothing yet. New submissions appear here as they arrive.';
    $('inbox').innerHTML = L.map(function(it){ return subCard(it, true); }).join('');
  }
  $('inboxFilter').addEventListener('click', function(e){ var b = e.target.closest('[data-sf]'); if (b){ SG.filter = b.dataset.sf; renderInbox(); } });
  $('inbox').addEventListener('change', function(e){ var s = e.target.closest('[data-review]'); if (!s || !SG.db) return;
    SG.db.doc('reviews/' + s.dataset.review).set({status:s.value, at:new Date().toISOString()}).then(function(){ toast('Marked ' + s.value); }, function(){ toast('Couldn\'t save that status'); }); });

  function blobOf(cv, type, q){ return new Promise(function(res){ cv.toBlob(res, type, q); }); }
  $('sgForm').addEventListener('submit', function(e){
    e.preventDefault();
    var f = {title:$('sgTitle').value.trim(), cat:$('sgCat').value, materials:$('sgMat').value.trim(), desc:$('sgDesc').value.trim(), name:$('sgName').value.trim(), contact:$('sgContact').value.trim()};
    var miss = [];
    if (!f.title) miss.push('a design name'); if (!f.desc) miss.push('a description'); if (!f.name) miss.push('your name'); if (!f.contact) miss.push('an email or Instagram');
    if (!sk.strokes.length && !SG.files.length) miss.push('a sketch or a file');
    if (!$('sgOwn').checked || !$('sgTerms').checked) miss.push('both checkboxes');
    if (miss.length){ $('sgNote').textContent = 'Add ' + miss.join(', ') + ' before sending.'; return; }
    if (!SG.ready || !SG.uid || SG.canWrite === false){ $('sgNote').textContent = 'Submissions aren\'t open yet, so nothing was sent. The open call starts with Collection 001.'; return; }
    if (SG.files.length && !SG.assets){ $('sgNote').textContent = 'File uploads need studio access on this link. Remove the files and send the sketch, or try again later.'; return; }
    var btn = $('sgSend'); btn.disabled = true; btn.textContent = 'Sending…'; $('sgNote').textContent = '';
    var id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8), item = Object.assign({id:id, createdAt:new Date().toISOString(), sketch:null, files:[]}, f);
    var chain = Promise.resolve();
    if (sk.strokes.length){
      chain = chain.then(function(){
        if (SG.assets) return blobOf(sk.cv, 'image/png').then(function(b){ return SG.assets.upload(b, {type:'image/png'}); }).then(function(r){ item.sketch = {asset:r.id}; });
        var small = document.createElement('canvas'); small.width = 800; small.height = 600; small.getContext('2d').drawImage(sk.cv, 0, 0, 800, 600);
        var d = small.toDataURL('image/jpeg', .72); if (d.length < 200000) item.sketch = {data:d};
      });
    }
    SG.files.forEach(function(file){ chain = chain.then(function(){ return SG.assets.upload(file, {type:file.type}).then(function(r){ item.files.push({asset:r.id, name:file.name, type:r.contentType, size:r.sizeBytes}); }); }); });
    chain.then(function(){
      var ref = SG.db.doc('suggestions/' + SG.uid);
      return ref.get().then(function(d){ var items = d.exists ? (d.data().items || []).slice() : []; items.unshift(item); return ref.set({items:items, updatedAt:item.createdAt}); });
    }).then(function(){
      $('sgForm').reset(); sk.strokes = []; skDraw(); SG.files = []; renderFiles();
      $('sgNote').textContent = 'Sent. We review submissions once a month and reply within 30 days if we\'d like to develop yours.';
      toast('Sent to the studio');
    }).catch(function(err){
      var c = err && err.code;
      $('sgNote').textContent = c === 'too_large' ? 'One of the files is too large. Keep each under 20 MB.' : c === 'unsupported_type' ? 'One of the files isn\'t a supported type.' : c === 'quota_exceeded' || c === 'quota_or_state' ? 'The studio inbox is full right now. Try again later.' : c === 'invalid_argument' ? 'Submissions aren\'t open yet, so nothing was sent.' : 'Something went wrong while sending. Your sketch and details are still here, so try again.';
    }).then(function(){ btn.disabled = false; btn.textContent = 'Send to the studio'; });
  });
  function enterSuggest(){ connect(); skDraw(); }
  connect();

  /* ---------- spinning chrome petal mark (footer) ---------- */
  (function(){
    var el = $('spinLogo'), T = THREE; if (!el) return;
    var fallback = '<svg class="kmk" aria-hidden="true" style="width:100%;height:100%"><use href="#kmark"/></svg>';
    if (!T){ el.innerHTML = fallback; return; }
    var rd; try { rd = new T.WebGLRenderer({antialias:true, alpha:true}); } catch (e) { el.innerHTML = fallback; return; }
    rd.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); rd.outputEncoding = T.sRGBEncoding; rd.toneMapping = T.ACESFilmicToneMapping; rd.toneMappingExposure = 1.1;
    el.appendChild(rd.domElement); rd.domElement.style.width = '100%'; rd.domElement.style.height = '100%';
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(28, 1, .1, 50); cam.position.set(0, 0, 5.6);
    // chrome needs a contrasty studio: hard white softboxes and dark bands
    var ec = document.createElement('canvas'); ec.width = 1024; ec.height = 512; var x = ec.getContext('2d');
    var gr = x.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.35, '#c9c9cf'); gr.addColorStop(.5, '#6c6c74'); gr.addColorStop(.62, '#2a2a30'); gr.addColorStop(1, '#8d8d95'); x.fillStyle = gr; x.fillRect(0, 0, 1024, 512);
    x.fillStyle = '#ffffff'; [[60, 70, 180, 60], [420, 40, 90, 150], [700, 90, 230, 50], [880, 300, 60, 120]].forEach(function(b){ x.fillRect(b[0], b[1], b[2], b[3]); });
    x.fillStyle = '#0b0b0e'; x.fillRect(300, 120, 40, 330); x.fillRect(760, 200, 30, 260); x.fillStyle = '#ffffff'; x.fillRect(0, 230, 1024, 14);
    var et = new T.CanvasTexture(ec); et.mapping = T.EquirectangularReflectionMapping; et.encoding = T.sRGBEncoding;
    scene.environment = new T.PMREMGenerator(rd).fromEquirectangular(et).texture;
    // the petal outline: union of eight circles around a centre, like the flat mark
    var N = 8, d = .66, a = .34, pts = [];
    for (var k = 0; k < 360; k++){ var th = Math.PI*2*k/360, r = 0;
      for (var i = 0; i < N; i++){ var D = th - Math.PI*2*i/N, disc = a*a - Math.pow(d*Math.sin(D), 2); if (disc >= 0) r = Math.max(r, d*Math.cos(D) + Math.sqrt(disc)); }
      r /= (d + a); pts.push(new T.Vector2(r*Math.cos(th - Math.PI/2), r*Math.sin(th - Math.PI/2))); }
    var chrome = new T.MeshStandardMaterial({color:0xf2f2f4, metalness:1, roughness:.16, envMapIntensity:1.6});
    var g = new T.Group(), layers = [1, .8, .6, .4], depth = .12;
    layers.forEach(function(s, i){
      var sh = new T.Shape(pts.map(function(p){ return p.clone().multiplyScalar(s*1.15); }));
      var geo = new T.ExtrudeGeometry(sh, {depth:depth, bevelEnabled:true, bevelThickness:.035, bevelSize:.035, bevelSegments:3, curveSegments:12});
      var m = new T.Mesh(geo, chrome); m.position.z = i*depth; g.add(m);           // steps up toward the front
      var back = m.clone(); back.rotation.y = Math.PI; back.position.z = -i*depth; g.add(back); // and mirrored on the back
    });
    scene.add(g);
    function size(){ var w = el.clientWidth, h = el.clientHeight; if (!w) return; rd.setSize(w, h, false); cam.aspect = w/h; cam.updateProjectionMatrix(); }
    size(); window.addEventListener('resize', size);
    var on = true; if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ on = es[0].isIntersecting; }).observe(el);
    function frame(t){ requestAnimationFrame(frame); if (!on || document.hidden) return;
      g.rotation.y = RM ? .6 : t*.00045; g.rotation.x = Math.sin(t*.00025)*.16; rd.render(scene, cam); }
    requestAnimationFrame(frame);
  })();

  /* ---------- router ---------- */
  var page = null, prevPage = null;
  function route(){
    var h = (location.hash || '').slice(1), next = 'home', arg = null, toShop = h === 'shop';
    if (h.indexOf('product-') === 0){ next = 'product'; arg = h.slice(8); }
    else if (h.indexOf('post-') === 0){ next = 'post'; arg = h.slice(5); }
    else if (h === 'radio' || h === 'journal' || h === 'about' || h === 'suggest' || h === 'cart') next = h;
    if (page === 'radio' && next !== 'radio' && docked) setDocked(false);
    Viewer.unmount();
    document.querySelectorAll('[data-page]').forEach(function(el){ el.hidden = el.dataset.page !== next; });
    document.querySelectorAll('[data-nav]').forEach(function(a){ var on = a.dataset.nav === next || (next === 'product' && a.dataset.nav === 'home') || (next === 'post' && a.dataset.nav === 'journal'); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    var prev = page; prevPage = prev; page = next; closeMini();
    if (next === 'home') enterHome(); else if (next === 'product') enterProduct(arg); else if (next === 'radio') enterRadio(); else if (next === 'journal') renderJournal(); else if (next === 'post') enterPost(arg); else if (next === 'suggest') enterSuggest(); else if (next === 'cart') renderCartPage();
    paint($('footCv'), {layout:'scatter', count:9, seed:90, size:1.1});
    // a fresh load or refresh always opens at the top; only a click on Shop scrolls down to the grid
    // Shop and the logo always land at the top of the shop page
    if (toShop && prev === 'home') toTop();
    else window.scrollTo(0, 0);
  }
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  window.addEventListener('hashchange', route);
  // clicking Shop or the logo while already on #shop changes no hash, so scroll up here
  document.addEventListener('click', function(e){ var l = e.target.closest('a[href="#shop"]'); if (l && location.hash === '#shop'){ e.preventDefault(); toTop(); } });
  // smooth where it can animate; instant with reduced motion or in a background tab
  function toTop(){ window.scrollTo({top:0, behavior: RM || document.visibilityState !== 'visible' ? 'auto' : 'smooth'}); }
  var rt; window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(function(){
    if (page === 'home'){ KS.fit(hc, 1.25); if (view === 'grid') paintCards($('grid')); }
    if (page === 'radio'){ enterRadio(); }
    paint($('footCv'), {layout:'scatter', count:9, seed:90, size:1.1});
  }, 180); });
  renderCart(); route();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if (page === 'home') KS.fit(hc, 1.25); });
})();
