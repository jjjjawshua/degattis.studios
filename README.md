# degattis studios

Site for **degattis studios**, a studio making metal objects with one cobalt part, with a journal and a link to degattis radio on Spotify.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # static site in dist/
npm run preview   # serve the built site
```

The build is a plain static site (`base: './'`). It is live at **https://degattisstudios.com**: every push to `main` runs `.github/workflows/pages.yml`, which builds `dist/` and publishes it to GitHub Pages. `public/CNAME` keeps the custom domain. The previous site is kept on the `legacy-site` branch.

## What's here

| Page | Hash | What it does |
| --- | --- | --- |
| Home | `#` | "degattis studios" in white over the frosted Echo-palette artwork fills the screen |
| Shop | `#shop`, `#shop-<category>` | 30 objects in a gallery by category; hover a tile for a second angle; side links open it filtered |
| Product | `#product-<id>` | Name, price, finish, size, add to cart and details; renders or live 3D, close-ups on scroll |
| Journal | `#journal`, `#post-<id>` | Posts with generative covers |
| About | `#about` | Who the studio is |
| Contact | `#contact` | Email plus a contact form (topic, order number, name, email, message) |
| Cart | `#cart` | Cart page; the header Cart (n) opens a dropdown |
| Terms, Account | `#terms`, `#account` | Draft terms; account placeholder until checkout |

Every page has a side column (Stüssy-style): the logo, shop categories, Journal/About/Contact, Instagram/Spotify/Terms/Account, a mailing-list form, the live New York time (ET) and date, and the turning chrome mark. The cart stays top right. On phones the column folds behind a Menu button. Type is set in Doto, a square-dot font.

Two studio tools ship as standalone pages in `public/tools/`: the visual direction board and the Radio cover generator.

## Code

```
index.html          markup for every page (hash-routed)
src/main.js         entry: styles + app
src/styles.css      all styles; tokens at the top (Echo paper, near-black ink, cobalt)
src/app.js          router, shop views, product page, cart, journal, outside links, side column, chrome mark
src/data.js         catalogue (PRODUCTS), journal POSTS, outside LINKS
src/viewer.js       one shared three.js renderer: product models, finishes, snapshots
src/covers.js       generative journal covers
src/spectral.js     the frosted reeded-glass artwork renderer
```

**Add a product:** add an entry to `PRODUCTS` in `src/data.js`. Give it a `build` (`plate`, `band`, `tray`, `dish` or `rod` with sizes) to get a 3D model without writing geometry, or add a bespoke builder to `B` in `src/viewer.js`.

three.js is pinned to `0.128.0`, the version the models and materials were tuned on.

## Not connected yet

- **Checkout.** The cart works and is saved in the browser; checkout shows a message. Next step: Shopify Storefront API or Stripe Checkout.
- **degattis radio.** Lives on Spotify. Paste the profile or playlist URL into `LINKS.spotify` in `src/data.js` (and the Instagram profile into `LINKS.instagram`); until then those links say "coming soon". Covers can be made with `public/tools/radio-covers.html`.
- **Newsletter and contact form.** Both validate but send nothing; `hello@degattis.studio` is a placeholder address.
- **Product photos and specs.** Images are 3D renders; names, prices and specs are concepts.
