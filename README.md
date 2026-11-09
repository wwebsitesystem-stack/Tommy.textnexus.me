# Tommy.textnexus.me

A lightweight, static Geometry Dash version archive at **[tommy.textnexus.me](https://tommy.textnexus.me)**.

## Pages

- `index.html` — homepage with the full version archive: 13 main Geometry Dash versions (1.0 → 2.2), release dates, levels and headline features, plus the spin-off editions (Lite, Meltdown, World, SubZero).
- `updates.html` — site release notes, including the launch entry and the reserved ad space.
- `assets/styles.css` / `assets/site.js` — shared styles and the mobile navigation script.

There is also a reserved **ad space** block on each page ("Ad space coming soon") and a
**Website made by Nexus · Textnexus.me** credit in the footer.

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

## Notes

Fan-made release history. Geometry Dash and its content belong to RobTop Games; no game files are hosted here.
