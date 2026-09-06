# Architecture reference — modules

Reference material extracted verbatim from code comments under Rule 4 of the
comment-pruning pass. Each section is pointed at from a single-line
`Reference spec:` comment at the corresponding place in the source file.

## content-index
src/content/index.ts

/* ============================================================================
   CONTENT — markdown files and UI strings, with English fallback.

   content/
     en/
       ui.json                     every short UI string (nav, chips, labels)
       faq.json                    a collection: records with a prose field
       home/hero.md                long-form prose, front matter + body
       universe/factions/<id>.md   entity copy: name, tagline, story
   Adding a language = copying the folder and translating it. There is no
   i18n dependency: a missing key or file falls back to English, per item.

   Markdown or JSON? Markdown when the prose is the point and the metadata is
   a header on it. JSON when it is the other way round — a list of records that
   happen to contain a sentence, where reading the whole set at once is how it
   gets edited. A record that outgrows its sentence names a markdown file
   instead of carrying one; see `faq.json`'s `body`.
   ========================================================================== */

## programs
src/data/programs.ts

/* ============================================================================
   PROGRAM CARD TEXT — the printed cards, as data.

   Four rules, in the order they are easy to break:

     1. TRANSCRIBE, DO NOT EDIT. These strings are the printed wording, typos
        and all ("a total cost 4 of or less" on Decode; "progams" on Holo
        Kingdom; "concience" on Oni Shift; "heal itself 1 by [H]" on Crackling
        Stroke). A string that reads differently from the box makes this file a
        second, wrong rulebook. Fix the print run first.
     2. `rules` is one entry per printed line. Joining them invents punctuation
        the card does not have.
     3. Nothing internal goes in this file. It ships in the JS bundle and is
        readable in devtools, so "in this file" means published — which is also
        why an unannounced card is simply absent rather than `revealed: false`.
        An absent card leaves no slot behind: card counts are derived from this
        file, and `Brand.announcedCount` only states the gap in words.
     4. TWO IDENTITIES, AND THEY ARE NOT INTERCHANGEABLE. `cardId` is printed
        on the card and carries the locale (`-EN`), so errata cite it in
        `affectedProgramIds` (content/en/news/) — an errata applies to a
        printed card, and the same card in another language is a different
        printing. `id` is the public URL identity, the name made safe, which
        is why it is derived from the English name and never from a
        translation: `?card=` and `?stack=` must name the same cards in every
        locale. Neither is positional, so inserting a card renumbers nothing.
   ========================================================================== */

## types
src/data/types.ts

### Art layers (`art` / `sceneArt` / `cardArt`)

```
/* ---------------------------------------------------------------------------
   ART COMES IN LAYERS, AND THEY ARE NOT INTERCHANGEABLE.

   All three are the same painting at different depths of the printed card:

     · ILLUSTRATION (`art`) — the subject as they appear on the card, with the
       background cut away. Croppable, focal-pointable, safe behind text.
       TODO add in cool parallax with this when we eventually have the art, parked till we get art.
     · SCENE (`sceneArt`) — characters only: subject and background as printed,
       without the rules text.
     · CARD (`cardArt`) — the card as it is in play, rules text and all. Never
       cropped, never a backdrop: a crop removes printed rules.

   Separate fields so a surface cannot reach for the wrong one. A surface
   showing the ILLUSTRATION must not carry the card's wording: art plus text is
   a reconstruction of a card, not a card. Show the card, or show the art.
   -------------------------------------------------------------------------- */
```

### Boxes, products (SKUs) and chapters

```
/* ---------------------------------------------------------------------------
   THREE LEVELS, AND THEY ARE NOT INTERCHANGEABLE.

     · A BOX is a physical thing with components in it, and the unit story
       ships inside.
     · A PRODUCT (SKU) is a way to pay, bundling one or more boxes. A box sold
       on its own later just gains a product containing only it - which is why
       `Box` has no price and no "sold separately" flag.
     · A CHAPTER is story. It rides in boxes, never in SKUs: bundling six boxes
       into an edition creates no chapter, and story also ships with no box.

   The invariants, in order of how easy they are to break:

     1. A box's component list is the STORE's and is not mirrored here.
        `Product.extras` is for things arriving OUTSIDE any box, not a way to
        reintroduce one.
     2. `Chapter.boxIds` points at boxes, never at products.
     3. `Product.boxCount` is the claim, `Product.boxIds` the enumeration, and
        `assertProductShape()` checks they agree. "six boxes" listing five is
        the error nobody notices.
   -------------------------------------------------------------------------- */
```

## faq
src/site/faq.ts

### src/site/faq.ts — module header (lines 1-24)

```
/* ============================================================================
   FAQ — the group taxonomy and the link table.

   Two things live here and nothing else:

   1. GROUPS, in page order. The array's order IS the order of the bands, and
      the ordinals ("01 / 06") are computed from its length. Reordering the
      page is a reordering of this array.
   2. LINK KEYS. A question may carry one link out. Front matter names a key
      from the table below; this file resolves it to a route. Targets are not
      writable from `content/`, so translating a question can never repoint it
      at a page that does not exist.

   The questions themselves are `content/<locale>/faq.json` — one ordered list
   of records, because that is what they are: a sentence with an id, a group,
   some search aliases and at most one link. Array order is page order within a
   group. An `id` is a public URL (`#faq-<id>`) under rule 5; renaming one
   breaks every link anyone has ever pasted.

   An answer that outgrows a sentence names a markdown file instead
   (`"body": "faq/contents"` → `content/<locale>/faq/contents.md`). That is the
   exception, not the direction of travel: forty-two files of six-line front
   matter wrapped around one sentence each is what this replaced.
   ========================================================================== */
```
