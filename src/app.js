import * as THREE from 'three';
import { KramSpectral } from './spectral.js';
import { CATS, FINISHES, PRODUCTS, product, POSTS, post, LINKS } from './data.js';
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

  /* ---------- outside links: KRAM Radio lives on Spotify ---------- */
  document.querySelectorAll('[data-link]').forEach(function(el){
    var url = LINKS[el.dataset.link];
    if (url){ el.href = url; return; }
    el.removeAttribute('href'); el.removeAttribute('target'); el.setAttribute('aria-disabled', 'true');
    el.classList.add('soon'); if (el.classList.contains('spotify')) el.textContent = 'KRAM Radio on Spotify · coming soon';
    else { var s = el.querySelector('.small'); if (s) s.textContent = 'A new playlist every two weeks · coming soon'; }
  });

  /* ---------- router ---------- */
  var page = null, prevPage = null;
  function route(){
    var h = (location.hash || '').slice(1), next = 'home', arg = null, toShop = h === 'shop';
    if (h.indexOf('product-') === 0){ next = 'product'; arg = h.slice(8); }
    else if (h.indexOf('post-') === 0){ next = 'post'; arg = h.slice(5); }
    else if (h === 'journal' || h === 'about' || h === 'cart') next = h;
    Viewer.unmount();
    document.querySelectorAll('[data-page]').forEach(function(el){ el.hidden = el.dataset.page !== next; });
    document.querySelectorAll('[data-nav]').forEach(function(a){ var on = a.dataset.nav === next || (next === 'product' && a.dataset.nav === 'home') || (next === 'post' && a.dataset.nav === 'journal'); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    var prev = page; prevPage = prev; page = next; closeMini();
    if (next === 'home') enterHome(); else if (next === 'product') enterProduct(arg); else if (next === 'journal') renderJournal(); else if (next === 'post') enterPost(arg); else if (next === 'cart') renderCartPage();
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
    paint($('footCv'), {layout:'scatter', count:9, seed:90, size:1.1});
  }, 180); });
  renderCart(); route();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if (page === 'home') KS.fit(hc, 1.25); });
})();
