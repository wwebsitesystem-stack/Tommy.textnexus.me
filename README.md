# Tommy.textnexus.me

A lightweight, static Geometry Dash version archive at **[tommy.textnexus.me](https://tommy.textnexus.me)**.

## Pages

- `index.html` — the full version archive: 13 main Geometry Dash versions (1.0 → 2.2), release dates, levels and headline features, plus the spin-off editions (Lite, Meltdown, World, SubZero). Every card opens its release page.
- `versions/*.html` — one page per release, generated from `data/versions.json`. Each has a release sheet, notes, previous/next navigation, the reserved ad slot and a playable browser course.
- `updates.html` — site release notes, including the launch, the version pages and the reserved ad space.
- `assets/styles.css` / `assets/version.css` — the shared TextNexus house style and the version/arcade styles.
- `assets/site.js` — mobile navigation and footer year.
- `assets/arcade.js` — the original canvas one-button course used on each version page.

There is also a reserved **ad space** block on every page ("Ad space coming soon") and a
**Website made by Nexus · Textnexus.me** credit in the footer.

## The playable course

The courses are original browser tributes written for this site. They use no Geometry Dash
binaries, artwork or music, and nothing is downloaded. Each release gets its own speed, course
length and palette; best times are stored locally in the browser.

**No Geometry Dash game files are hosted here.** Geometry Dash and its content belong to RobTop
Games. Each version page links to the official release.

## Version data & rebuild

Release metadata lives in `data/versions.json`. To regenerate all 17 pages after editing it:

```bash
python3 scripts/build_versions.py
```

## Local preview

```bash
python3 -m http.server 3000 --bind 0.0.0.0
```

Then open <http://localhost:3000>.

## GitHub Pages

This repository is served with GitHub Pages from the `main` branch, root folder.

- The `CNAME` file points Pages at `tommy.textnexus.me`.
- DNS for `tommy.textnexus.me` should be a `CNAME` record to `wwebsitesystem-stack.github.io`.
- In the repository settings, under **Pages**, the source must be **Deploy from a branch → main → / (root)**.
- Enable **Enforce HTTPS** once the certificate is issued.

`.nojekyll` is present so the site is served exactly as committed.
