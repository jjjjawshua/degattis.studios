# kram.

Site for **kram.**, a studio making metal objects with one vermilion part, plus KRAM Radio, a journal and an open call for designs.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # static site in dist/
npm run preview   # serve the built site
```

The build is a plain static site (`base: './'`), so `dist/` can go on any static host: Vercel, Netlify, Cloudflare Pages or GitHub Pages.

## What's here

| Page | Hash | What it does |
| --- | --- | --- |
| Shop | `#shop` | Hero, then 30 objects in a grid (hover for details) or one by one in live 3D |
| Product | `#product-<id>` | Renders, live 3D with finishes, specs, add to cart, close-ups on scroll |
| Radio | `#radio` | The crate of editions, a deck with generated sound and scratching |
| Journal | `#journal`, `#post-<id>` | Posts with generative covers, newsletter sign-up |
| Suggest | `#suggest` | Sketch pad, file uploads, submission form, draft 50/50 terms |
| About | `#about` | Studio, process, socials |

Two studio tools ship as standalone pages in `public/tools/`: the visual direction board and the Radio cover generator.

## Code

```
index.html          markup for every page (hash-routed)
src/main.js         entry: styles + app
src/styles.css      all styles; tokens at the top (Halo paper, plum ink, vermilion)
src/app.js          router, shop views, product page, cart, Radio deck, journal, Suggest, footer mark
src/data.js         catalogue (PRODUCTS), Radio EDITIONS, journal POSTS
src/viewer.js       one shared three.js renderer: product models, finishes, snapshots
src/covers.js       generative journal covers
src/spectral.js     the frosted reeded-glass artwork renderer
```

**Add a product:** add an entry to `PRODUCTS` in `src/data.js`. Give it a `build` (`plate`, `band`, `tray`, `dish` or `rod` with sizes) to get a 3D model without writing geometry, or add a bespoke builder to `B` in `src/viewer.js`.

three.js is pinned to `0.128.0`, the version the models and materials were tuned on.

## Not connected yet

- **Checkout.** The cart works and is saved in the browser; checkout shows a message. Next step: Shopify Storefront API or Stripe Checkout.
- **Spotify.** Each Radio edition has an "Open in Spotify" button waiting for a playlist URL in `EDITIONS`.
- **Suggest submissions.** The prototype saved these to its artifact database; on this site the form validates and then says submissions aren't open. Next step: a small backend (for example Supabase or a form service) for the form, sketches and uploads.
- **Newsletter.** The form validates but sends nothing.
- **Socials.** Handles on the About page are placeholders.
- **Product photos and specs.** Images are 3D renders; names, prices and specs are concepts.
