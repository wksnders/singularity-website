# Singularity.exe — website

Vue 3 + Vite + vue-router + TypeScript. Three runtime dependencies (`vue`,
`vue-router`, `markdown-it`), five dev dependencies. No i18n library, no CSS
framework, no component library, no state library.

```
npm install
npm run dev        # http://localhost:5173
npm run build      # vue-tsc --noEmit && vite build  → dist/
```

## Layout

```
content/en/            all user-visible copy
  ui.json              short strings (nav, labels, chips, empty states)
  news/*.md            posts — front matter + body
  story/<set>.md       chapter narrative
  universe/…/<id>.md   faction, brand, character and Incursions prose
src/
  data/universe.ts     ids, relations, faction colours, facts, outbound URLs
  data/types.ts
  content/             markdown + front-matter loader, t(), English fallback
  i18n/locales.ts      the locale list — the only place a language is declared
  site/ia.ts           THE information architecture: one array
  site/links.ts        to() for internal links, outbound() for the 8 real URLs
  site/soon.ts         what /soon says per destination
  router/index.ts      routes, anchors and scroll behaviour
  styles/              tokens · base · layout objects (read index.css first)
  components/atoms|molecules|organisms
  views/               one file per page (14)
```

## The five rules this codebase is built on

1. **Raw values live only in `styles/tokens.css`.** No hex codes, no magic
   numbers anywhere else. Components own their BEM block in their own `.vue`
   file (`c-card`, `c-card__title`, `c-card--featured`), deliberately unscoped —
   BEM already namespaces it.
2. **Faction colour is data, not CSS.** A scoped element sets `--faction` /
   `--faction-text` inline from `factions[]`. The roster is not fixed: a new
   faction needs no CSS, no template and no new component — just an entry in
   the data file. Nothing anywhere hard-codes the faction count.
3. **Every user-visible string is in `content/<locale>/`.** A new language is a
   copy of `content/en/`, translated, plus its code in `src/i18n/locales.ts`.
   Fallback is per string and per file, always to English. Section anchors and
   filter query params are locale-independent: `/story#chapters` and
   `/de/story#chapters` resolve to the same id.
4. **One IA array.** `site/ia.ts` drives the header nav, all four mega panels,
   the mobile sheet and the footer sitemap. Add a page there and in the router;
   nothing else lists site sections. The array is curated: a route existing is
   not a reason to list it. Adding an entry is an editorial decision, not a
   mechanical one — ask first.
5. **Public URLs are contracts.** Every anchor (`#chapters`, `#ch-01`,
   `#discord`, `#support`, …) and every filter param (`?faction=`, `?category=`,
   `?kind=`) is carried over from the mock and must survive refactors. Anchor
   targets take `tabindex="-1"` and clear the nav via `--scroll-offset`.

Two more worth knowing: card wording is **data, not pixels** (the printed card is
an image, its name/cost/type/rules/flavour are text so the gallery is
searchable, screen-readable, errata-linkable and translatable); and every image
goes through `ArtFrame`, which reserves its aspect ratio and falls back to a
striped placeholder naming the art that belongs there.

## Conventions for placeholders

- `[PLACEHOLDER …]` — invented copy awaiting the real thing. Never ship it.
- `[ TBD ]` — a real fact we have not been given (price, release date, rating
  marks). Rendered as a visible dashed slot on purpose: an empty layout hides
  the gap, a `[ TBD ]` admits it.

## Not built yet

Rules reference · errata log · competition rules · FAQ. Every link to them
resolves to `/soon`, which distinguishes "being written" from "not live yet"
and always offers what *is* open on the same subject.

## What must never be committed

**This repository is public.** Everything in `src/` and `content/` is compiled
into `dist/` and shipped to every visitor, so "in the repo" and "published"
are the same thing — a private branch or an unrendered string protects nothing.

Unreleased product material — unannounced content, roadmap, anything embargoed
— lives in a separate private repo, not here. That includes AI/agent working
files (handoff notes, prompts, planning docs), which is why they are
`.gitignore`d rather than merely uncommitted.

If you need that context to do a task, ask Wyatt for access. Do not paste it
into a comment, a data file, a commit message or a branch name.

**There is no staging area in this repo.** Two traps follow from that, and both
look safe:

- `revealed: false` on a program hides the card in the gallery. It does **not**
  hide the text: the whole data file is in the JS bundle, readable in devtools
  in about four clicks. Unreleased card wording must not be in `universe.ts` at
  all until it is public. Same for character names, set names and dates.
- Every file under `content/` is bundled by `import.meta.glob` whether or not a
  view renders it. A draft post is published the moment it is committed, even
  with a future date and even if nothing links to it. `NewsView` hides
  future-dated posts, but that is *scheduling*, not secrecy.

The test is not "does it render?" — it is **"is it in the repo?"** If it is,
treat it as published.
