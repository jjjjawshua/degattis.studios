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
  function kmark(kind){ var word = '<span class="wm">degattis studios</span>'; return '<span class="lock" role="img" aria-label="degattis studios"><svg class="kmk" aria-hidden="true"><use href="#kmark"/></svg>' + word + '</span>'; }
  document.querySelectorAll('[data-kmark]').forEach(function(el){ el.innerHTML = kmark(el.dataset.kmark); });
  // hero fills the screen below the header, so the shop starts just out of frame
  /* ---------- side column: on phones it folds away behind Menu ---------- */
  function setMenu(open){ $('side').classList.toggle('open', open); $('menuBtn').setAttribute('aria-expanded', open); $('menuBtn').textContent = open ? 'Close' : 'Menu'; document.documentElement.style.overflow = open ? 'hidden' : ''; if (open) window.dispatchEvent(new Event('resize')); }
  $('menuBtn').onclick = function(){ setMenu(!$('side').classList.contains('open')); };
  $('sideBody').addEventListener('click', function(e){ if (e.target.closest('a[href^="#"]')) setMenu(false); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && $('side').classList.contains('open')){ setMenu(false); $('menuBtn').focus(); } });

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
    var d = document.createElement('div'); d.className = 'gcard'; d.dataset.id = p.id;
    d.innerHTML = '<a class="gimg" href="#product-' + p.id + '" aria-label="' + esc(p.name + ', ' + money(p.price)) + '"><img class="snap a" alt="" hidden><img class="snap b" alt="" hidden></a>'
      + '<div class="ginfo"><a class="gname" href="#product-' + p.id + '" tabindex="-1">' + esc(p.name) + '</a><button class="gadd" type="button" data-add="' + p.id + '" aria-label="Add ' + esc(p.name) + ' to cart">+</button><span class="gprice">' + money(p.price) + '</span></div>';
    return d;
  }
  // first a straight-on render, then a closer second angle that shows on hover
  function paintCards(root){
    var cs = root.querySelectorAll('.gcard');
    cs.forEach(function(c){ fillImg(c.querySelector('.a'), c.dataset.id, {w:640, h:800, dist:16.5}); });
    cs.forEach(function(c){ fillImg(c.querySelector('.b'), c.dataset.id, {w:640, h:800, ay:1.3, ax:-.4, dist:16.5}); });
  }

  document.addEventListener('click', function(e){
    var b = e.target.closest('[data-add]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    var p = product(b.dataset.add); addToCart(p.id, p.finishes ? 'polished' : null, p.sizes ? 'US 9' : null);
  });

  /* ---------- home / shop ---------- */
  var cat = 'all';
  CATS.forEach(function(c){ var b = document.createElement('button'); b.type = 'button'; b.textContent = c[1]; b.dataset.c = c[0]; b.onclick = function(){ location.hash = c[0] === 'all' ? 'shop' : 'shop-' + c[0]; }; $('catChips').appendChild(b); });
  function list(){ return PRODUCTS.filter(function(p){ return cat === 'all' || p.cat === cat; }); }
  function renderShop(){
    var L = list();
    document.querySelectorAll('.snav [data-cat]').forEach(function(l){ if (l.dataset.cat === cat) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current'); });
    $('catChips').querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.c === cat); });
    Viewer.unmount(); $('grid').innerHTML = ''; L.forEach(function(p){ $('grid').appendChild(card(p)); }); after(function(){ paintCards($('grid')); });
  }

  function postCard(p){ return '<a class="pcard" href="#post-' + p.id + '"><div class="plate">' + plateHTML() + '</div><div style="display:flex;justify-content:space-between;gap:8px"><span class="mono">' + esc(p.tag) + ' · ' + esc(p.date) + '</span><span class="mono" style="color:var(--accent)">Draft</span></div><b>' + esc(p.title) + '</b><span class="small">' + esc(p.dek) + '</span></a>'; }
  var coverSalt = (Math.random()*1e6)|0;
  function cover(cv, p){ if (cv.offsetParent === null) return; KS.fit(cv, 1.5); Covers.draw(cv, p, coverSalt); }
  function paintPosts(root, L){ root.querySelectorAll('.pcard').forEach(function(c, i){ cover(c.querySelector('canvas'), L[i]); }); }

  // hero
  // the logo is painted into the colour field, so it blurs and smears exactly like the shapes around it
  var heroLogo = new Image(), logoAt = {img:heroLogo, cx:.5, cy:.44, w:.86, h:.56, parts:[{y0:0, y1:.7, soft:.3}, {y0:.7, y1:1, soft:.14}]};
  var hc = $('heroCv'), hero = KS.create(hc, {layout:'ring', count:9, seed:4, size:1.2, spread:1.1, cx:.5, cy:.46, spin:.00005});
  function placeLogo(){ var wide = hc.clientWidth > hc.clientHeight; logoAt.w = wide ? .86 : .94; logoAt.cy = wide ? .44 : .42; hero.set({under: Object.assign({}, logoAt)}); }
  heroLogo.onload = function(){ placeLogo(); if (page === 'home') hero.render(0); };
  heroLogo.src = './brand/degattis-logo.webp';
  var ptr = {x:.5, y:.46, s:0}, tgt = {x:.5, y:.46, s:0}, heroOn = true, last = 0;
  hc.addEventListener('pointermove', function(e){ var r = hc.getBoundingClientRect(); tgt.x = (e.clientX - r.left) / r.width; tgt.y = (e.clientY - r.top) / r.height; tgt.s = 1; });
  hc.addEventListener('pointerleave', function(){ tgt.s = 0; });
  if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ heroOn = es[0].isIntersecting; }).observe(hc);
  function heroFrame(t){
    requestAnimationFrame(heroFrame);
    if (!heroOn || page !== 'home' || t - last < 33) return; last = t;
    ptr.x += (tgt.x - ptr.x)*.08; ptr.y += (tgt.y - ptr.y)*.08; ptr.s += (tgt.s - ptr.s)*.05;
    var sp = Math.max(0, Math.min(1, (window.scrollY || 0) / (hc.clientHeight || 1)));
    hero.set({pointer: ptr.s > .01 ? {x:ptr.x, y:ptr.y, s:ptr.s} : null, veil:.1 + sp*.45, spread:1.1 + sp*.25}); hero.render(RM ? 0 : t);
  }
  requestAnimationFrame(heroFrame);

  // the footer mark lines up under "Shop the collection": its column takes the button's width (and, on phones, its left edge)
  function enterHome(){ after(function(){ KS.fit(hc, 1.25); placeLogo(); hero.render(0); }); }

  /* ---------- product page: big still or live 3D on the left, details on the right, more views on scroll ---------- */
  var cur = null, curFinish = 'polished', curSize = null, mediaMode = 'images';
  var RING_MM = {'US 5':'15.7', 'US 6':'16.5', 'US 7':'17.3', 'US 8':'18.1', 'US 9':'19.0', 'US 10':'19.8', 'US 11':'20.6', 'US 12':'21.4'};
  function renderMedia(){
    var p = cur;
    $('mImages').setAttribute('aria-pressed', mediaMode === 'images'); $('m3d').setAttribute('aria-pressed', mediaMode === '3d');
    $('mImagesView').hidden = mediaMode !== 'images'; $('m3dView').hidden = mediaMode !== '3d';
    if (mediaMode === 'images'){
      Viewer.unmount();
      var img = $('pMainImg'); img.alt = p.name + ' in ' + finishName(curFinish).toLowerCase(); fillImg(img, p.id, {w:1000, h:1020, finish:curFinish});
    } else {
      $('noGL').hidden = GL;
      after(function(){ if (GL){ Viewer.mount($('p3dHost')); Viewer.finish(curFinish); if (Viewer.current() !== p.id) Viewer.show(p.id); Viewer.inspect(false); } });
    }
  }
  // scrolling down shows the object large and close up, one angle after another
  function renderDetails(){
    var p = cur, D = [{ay:.85, ax:-.3, dist:10.5, cap:'Three-quarter'}, {ay:1.5, ax:-.05, dist:8, cap:'Profile'}, {detail:true, cap:'The vermilion part'}, {ax:-1.15, ay:.3, dist:9, cap:'From above'}, {ay:-.6, ax:.35, dist:7, cap:'Edge and finish'}];
    $('pDetails').innerHTML = D.map(function(d, i){ return '<figure class="dfig"><div class="plate clean"><img class="snap" alt="' + esc(p.name + ', ' + d.cap.toLowerCase()) + '" hidden></div></figure>'; }).join('');
    after(function(){ $('pDetails').querySelectorAll('.dfig').forEach(function(f, i){ var o = Object.assign({w:1300, h:1330, finish:curFinish}, D[i]); delete o.cap; if (window.innerWidth < 600){ o.w = 800; o.h = 820; } fillImg(f.querySelector('img'), p.id, o); }); });
  }
  function renderSide(){
    var p = cur;
    $('pSizeWrap').innerHTML = p.sizes ? p.sizes.map(function(s){ return '<button type="button" data-s="' + esc(s) + '" aria-pressed="' + (s === curSize) + '">' + esc(s) + '</button>'; }).join('') : '';
    $('pFinishes').innerHTML = p.finishes.map(function(fid){ return '<button type="button" data-f="' + fid + '" aria-pressed="' + (fid === curFinish) + '" aria-label="' + finishName(fid) + '" title="' + finishName(fid) + '"><img alt="" hidden></button>'; }).join('');
    after(function(){ $('pFinishes').querySelectorAll('[data-f]').forEach(function(b){ fillImg(b.querySelector('img'), p.id, {w:220, h:220, finish:b.dataset.f, dist:16}); }); });
    $('pMeta').textContent = finishName(curFinish);
  }
  $('pSizeWrap').addEventListener('click', function(e){ var b = e.target.closest('[data-s]'); if (!b) return; curSize = b.dataset.s; $('pSizeWrap').querySelectorAll('[data-s]').forEach(function(x){ x.setAttribute('aria-pressed', x === b); }); });
  $('pFinishes').addEventListener('click', function(e){ var b = e.target.closest('[data-f]'); if (!b) return; curFinish = b.dataset.f;
    $('pFinishes').querySelectorAll('[data-f]').forEach(function(x){ x.setAttribute('aria-pressed', x === b); });
    $('pMeta').textContent = finishName(curFinish);
    Viewer.finish(curFinish); if (mediaMode === 'images') renderMedia(); renderDetails(); });
  $('mImages').onclick = function(){ mediaMode = 'images'; renderMedia(); };
  $('m3d').onclick = function(){ mediaMode = '3d'; renderMedia(); };
  $('zIn').onclick = function(){ Viewer.zoomBy(.85); }; $('zOut').onclick = function(){ Viewer.zoomBy(1.18); };
;
  $('pAdd').onclick = function(e){ e.stopPropagation(); if (cur.sizes && !curSize){ toast('Choose a size first'); $('pSizeWrap').querySelector('button').focus(); return; } addToCart(cur.id, curFinish, cur.sizes ? curSize : null); };
  function enterProduct(id){
    var p = product(id); if (!p){ location.hash = 'shop'; return; }
    cur = p; curFinish = 'polished'; curSize = null; mediaMode = 'images';
    $('pName').textContent = p.name; $('pPrice').textContent = money(p.price);
    $('pCopy').textContent = p.copy;
    $('pSpec').innerHTML = [['Part', p.code]].concat(p.spec).map(function(r){ return '<li>' + esc(r[0]) + ': ' + esc(r[1]) + '</li>'; }).join('');
    $('pSizeChartWrap').hidden = !p.sizes;
    $('pSizeChart').innerHTML = p.sizes ? '<thead><tr><th>Size</th><th>Inside diameter</th></tr></thead><tbody>' + p.sizes.map(function(s){ return '<tr><td>' + esc(s) + '</td><td>' + (RING_MM[s] || '—') + ' mm</td></tr>'; }).join('') + '</tbody>' : '';
    renderSide(); renderMedia(); renderDetails();
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
  /* ---------- contact ---------- */
  $('cForm').addEventListener('submit', function(e){
    e.preventDefault();
    var miss = ['cTopic', 'cName', 'cEmail', 'cMsg'].filter(function(id){ return !$(id).value.trim(); });
    var badMail = $('cEmail').value.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test($('cEmail').value.trim());
    ['cTopic', 'cName', 'cEmail', 'cMsg'].forEach(function(id){ $(id).setAttribute('aria-invalid', miss.indexOf(id) > -1 || (id === 'cEmail' && badMail)); });
    if (miss.length){ $('cNote').textContent = 'Fill in the topic, your name, email and a message.'; $(miss[0]).focus(); return; }
    if (badMail){ $('cNote').textContent = 'Enter an email address like name@example.com.'; $('cEmail').focus(); return; }
    $('cNote').textContent = 'Thanks. The form isn\'t connected yet, so nothing was sent. Email us directly for now.';
  });
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

  /* ---------- outside links: degattis radio lives on Spotify ---------- */
  document.querySelectorAll('[data-link]').forEach(function(el){
    var url = LINKS[el.dataset.link];
    if (url){ el.href = url; return; }
    el.removeAttribute('href'); el.removeAttribute('target'); el.setAttribute('aria-disabled', 'true');
    el.classList.add('soon'); if (el.classList.contains('flink')){ el.title = 'Coming soon'; return; }
    if (el.classList.contains('spotify')) el.textContent = 'degattis radio on Spotify · coming soon';
    else { var s = el.querySelector('.small'); if (s) s.textContent = 'A new playlist every two weeks · coming soon'; }
  });

  /* ---------- footer: date and live New York time, newsletter ---------- */
  var fmtDate = new Intl.DateTimeFormat('en-GB', {timeZone:'America/New_York', day:'2-digit', month:'short', year:'numeric'});
  var fmtTime = new Intl.DateTimeFormat('en-GB', {timeZone:'America/New_York', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false});
  function tick(){ var n = new Date(); $('fDate').textContent = fmtDate.format(n).toUpperCase(); $('fDate').setAttribute('datetime', n.toISOString()); $('fTime').textContent = fmtTime.format(n) + ' ET'; }
  tick(); setInterval(tick, 1000);
  // mailing list: the button wakes up once the terms box is ticked
  $('fnlAgree').addEventListener('change', function(){ $('fnlGo').disabled = !this.checked; });
  $('fnl').addEventListener('submit', function(e){ e.preventDefault(); var v = $('fnlEmail').value.trim();
    if (!$('fnlAgree').checked) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)){ toast('Enter an email like name@example.com'); $('fnlEmail').focus(); return; }
    $('fnlEmail').value = ''; toast('Thanks. Sign-up isn\'t connected yet, so nothing was saved.'); });

  /* ---------- router ---------- */
  var page = null, prevPage = null;
  function route(){
    var h = (location.hash || '').slice(1), next = 'home', arg = null;
    if (h.indexOf('product-') === 0){ next = 'product'; arg = h.slice(8); }
    else if (h.indexOf('post-') === 0){ next = 'post'; arg = h.slice(5); }
    else if (h.indexOf('shop-') === 0){ next = 'shop'; var c0 = h.slice(5); if (CATS.some(function(c){ return c[0] === c0; })) cat = c0; }
    else if (h === 'shop'){ next = 'shop'; cat = 'all'; }
    else if (h === 'journal' || h === 'about' || h === 'contact' || h === 'cart' || h === 'terms' || h === 'account') next = h;
    Viewer.unmount();
    document.querySelectorAll('[data-page]').forEach(function(el){ el.hidden = el.dataset.page !== next; });
    document.querySelectorAll('[data-nav]').forEach(function(a){ var on = a.dataset.nav === next || ((next === 'product' || next === 'shop') && a.dataset.nav === 'shop') || (next === 'post' && a.dataset.nav === 'journal'); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    if (next !== 'shop') document.querySelectorAll('.snav [data-cat]').forEach(function(l){ l.removeAttribute('aria-current'); });
    var prev = page; prevPage = prev; page = next; closeMini();
    if (next === 'home') enterHome(); else if (next === 'shop') renderShop(); else if (next === 'product') enterProduct(arg); else if (next === 'journal') renderJournal(); else if (next === 'post') enterPost(arg); else if (next === 'cart') renderCartPage();
    window.scrollTo(0, 0);
  }
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  window.addEventListener('hashchange', route);
  // clicking Shop or the logo while already on #shop changes no hash, so scroll up here
  document.addEventListener('click', function(e){ var l = e.target.closest('a[href="#shop"]'); if (l && location.hash === '#shop'){ e.preventDefault(); toTop(); } });
  // smooth where it can animate; instant with reduced motion or in a background tab
  function toTop(){ window.scrollTo({top:0, behavior: RM || document.visibilityState !== 'visible' ? 'auto' : 'smooth'}); }
  var rt; window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(function(){
    if (page === 'home'){ KS.fit(hc, 1.25); placeLogo(); }
    if (page === 'shop') paintCards($('grid'));
  }, 180); });
  renderCart(); route();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if (page === 'home') KS.fit(hc, 1.25); });
})();
