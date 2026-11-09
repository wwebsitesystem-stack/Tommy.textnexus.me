#!/usr/bin/env python3
"""Build the individual version pages from data/versions.json."""

from __future__ import annotations

import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "versions.json"
OUT = ROOT / "versions"
ASSET_VERSION = "2026-11-09c"


def esc(value: object) -> str:
    return html.escape(str(value), quote=True)


def fact_rows(facts: list[list[str]]) -> str:
    return "\n".join(
        f'              <li><span>{esc(label)}</span><strong>{esc(value)}</strong></li>'
        for label, value in facts
    )


def note_rows(notes: list[str]) -> str:
    return "\n".join(f'            <li>{esc(note)}</li>' for note in notes)


def pager_cards(index: int, versions: list[dict]) -> str:
    previous = versions[index - 1] if index > 0 else None
    following = versions[index + 1] if index < len(versions) - 1 else None
    prev_html = (
        f'''        <a class="pager-card" href="{esc(previous["slug"])}.html">
          <span>Previous</span>
          <strong>{esc(previous["label"])} // {esc(previous["name"])}</strong>
          <em aria-hidden="true">←</em>
        </a>'''
        if previous
        else '''        <a class="pager-card" href="../index.html#versions">
          <span>Previous</span>
          <strong>Back to the full archive</strong>
          <em aria-hidden="true">←</em>
        </a>'''
    )
    next_html = (
        f'''        <a class="pager-card" href="{esc(following["slug"])}.html">
          <span>Next</span>
          <strong>{esc(following["label"])} // {esc(following["name"])}</strong>
          <em aria-hidden="true">→</em>
        </a>'''
        if following
        else '''        <a class="pager-card" href="../index.html#versions">
          <span>Next</span>
          <strong>Back to the full archive</strong>
          <em aria-hidden="true">→</em>
        </a>'''
    )
    return f'''      <div class="pager-bottom">
{prev_html}
{next_html}
      </div>'''


def page(version: dict, index: int, versions: list[dict], official: str) -> str:
    slug = esc(version["slug"])
    label = esc(version["label"])
    name = esc(version["name"])
    kind = esc(version["kind"])
    date = esc(version["date"])
    iso = esc(version.get("iso", ""))
    year = esc(version["year"])
    era = esc(version["era"])
    summary = esc(version["summary"])
    context = esc(version["context"])
    platform = esc(version["platform"])
    levels = esc(version["levels"])
    forms = esc(version["forms"])
    tags = "".join(f"<span>{esc(tag)}</span>" for tag in version["tags"])
    facts = fact_rows(version["facts"])
    notes = note_rows(version["notes"])
    arcade = version["arcade"]
    arcade_name = esc(arcade["name"])
    tagline = esc(arcade["tagline"])
    difficulty = esc(arcade["difficulty"])
    accent = esc(arcade["accent"])
    game_official = esc(version.get("official", official))
    page_url = f"https://tommy.textnexus.me/versions/{slug}.html"
    seconds = round(arcade["length"] / arcade["speed"])

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Geometry Dash {label} — {name} | Tommy.textnexus.me</title>
  <meta name="description" content="Geometry Dash {label} ({date}): {summary}">
  <meta name="theme-color" content="#080604">
  <meta property="og:type" content="article">
  <meta property="og:title" content="Geometry Dash {label} — {name}">
  <meta property="og:description" content="{summary}">
  <meta property="og:url" content="{page_url}">
  <link rel="canonical" href="{page_url}">
  <link rel="icon" href="data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2064%2064'%3E%3Crect%20width='64'%20height='64'%20rx='12'%20fill='%23ffd76a'/%3E%3Ctext%20x='32'%20y='45'%20font-family='monospace'%20font-size='38'%20font-weight='700'%20text-anchor='middle'%20fill='%23080604'%3ET%3C/text%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../assets/styles.css?v={ASSET_VERSION}">
  <link rel="stylesheet" href="../assets/version.css?v={ASSET_VERSION}">
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>

  <header class="site-header">
    <div class="release-bar">
      <div class="container release-inner">
        <span class="release-status"><span class="dot" aria-hidden="true"></span> Archive online</span>
        <span class="release-sep" aria-hidden="true">//</span>
        <span class="release-meta">Version {label}</span>
        <span class="release-meta">{year}</span>
        <span class="release-build">Build 2026.11.09</span>
      </div>
    </div>

    <div class="container header-inner">
      <a class="brand" href="../index.html" aria-label="Tommy.textnexus.me home">
        <span class="brand-mark" aria-hidden="true">T</span>
        <span class="brand-text">
          <strong>TOMMY.TEXTNEXUS.ME</strong>
          <span>Geometry Dash // Version archive</span>
        </span>
      </a>

      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
        <span class="nav-toggle-bars" aria-hidden="true"><span></span><span></span><span></span></span>
        <span>Menu</span>
      </button>

      <nav class="site-nav" id="site-nav" aria-label="Main">
        <a href="../index.html">Home</a>
        <a href="../index.html#versions">Versions</a>
        <a href="../updates.html">Updates</a>
        <a class="nav-cta" href="#play">Play this era</a>
      </nav>
    </div>
  </header>

  <main id="main">
    <section class="version-hero container">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="../index.html">Archive</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{label}</span>
      </nav>

      <div class="version-hero-grid">
        <div class="version-intro">
          <p class="eyebrow"><span class="dot" aria-hidden="true"></span> {kind} // {date}</p>
          <h1>
            <span class="version-display">{label}</span>
            <span class="version-title">{name}</span>
          </h1>
          <p class="lede">{summary}</p>
          <div class="tags">{tags}</div>
          <div class="hero-actions">
            <a class="btn btn-primary" href="#play">Play this era <span aria-hidden="true">↓</span></a>
            <a class="btn btn-ghost" href="{game_official}" target="_blank" rel="noopener">Get the real game <span aria-hidden="true">↗</span></a>
          </div>
          <p class="meta-line">
            <span>{year}</span> <span aria-hidden="true">//</span> {era}
            <span aria-hidden="true">//</span> Browser course {difficulty.lower()}
            <span aria-hidden="true">//</span> No game files
          </p>
        </div>

        <aside class="release-sheet" aria-label="Release sheet for version {label}">
          <div class="sheet-head">
            <span>Release sheet</span>
            <span>GD-{label}</span>
          </div>
          <dl class="sheet-list">
            <div><dt>Released</dt><dd>{date}</dd></div>
            <div><dt>Era</dt><dd>{era}</dd></div>
            <div><dt>Levels</dt><dd>{levels}</dd></div>
            <div><dt>Forms</dt><dd>{forms}</dd></div>
            <div><dt>Platform</dt><dd>{platform}</dd></div>
            <div><dt>Status</dt><dd><span class="status-pill">Released</span></dd></div>
          </dl>
          <div class="sheet-foot">
            <span>Course</span>
            <span>{difficulty} // ~{seconds}s</span>
          </div>
        </aside>
      </div>
    </section>

    <section class="container version-layout">
      <div class="version-main">
        <div class="section-bar">
          <span>01 / Release notes</span>
          <span>{label} // {year}</span>
        </div>
        <div class="release-copy">
          <h2>What {label} changed.</h2>
          <p>{context}</p>
          <ul class="release-list">
{notes}
          </ul>
          <div class="note-panel">
            <span class="note-mark" aria-hidden="true">i</span>
            <div>
              <h3>Files, credits and the original game</h3>
              <p>
                The original Geometry Dash builds are not distributed here. The course below is an
                original browser tribute written for this archive; it uses no game files, artwork or
                music. For the real thing, use the
                <a href="{game_official}" target="_blank" rel="noopener">official RobTop release</a>.
                Geometry Dash belongs to RobTop Games.
              </p>
            </div>
          </div>
        </div>

        <section class="play-section" id="play" aria-label="Playable {label} tribute course">
          <div class="section-bar">
            <span>02 / Playable era</span>
            <span>{difficulty} // one-button course</span>
          </div>
          <div class="section-head">
            <h2>Run the {label} course. <em>Right here.</em></h2>
            <p>
              An original one-button course tuned to the feel of {label}. Tap, click or press Space
              to jump; clear the line to log a time. It is a tribute, not a reupload.
            </p>
          </div>

          <div class="arcade"
               data-arcade
               data-version="{label}"
               data-speed="{arcade["speed"]}"
               data-gap-min="{arcade["gapMin"]}"
               data-gap-max="{arcade["gapMax"]}"
               data-length="{arcade["length"]}"
               data-seed="{arcade["seed"]}"
               data-accent="{accent}"
               data-difficulty="{difficulty}">
            <div class="arcade-head">
              <div class="arcade-id">
                <span class="arcade-kicker">Era course</span>
                <strong>{label} // {arcade_name}</strong>
              </div>
              <div class="arcade-stats">
                <span>Best <b data-best>—</b></span>
                <span>Attempts <b data-attempts>0</b></span>
                <button class="arcade-reset" type="button" data-reset>Restart</button>
              </div>
            </div>

            <div class="arcade-stage">
              <canvas class="arcade-canvas" width="960" height="320"
                      aria-label="Playable {label} tribute course. Press Space, Up or click to jump."></canvas>
              <div class="arcade-overlay" data-overlay>
                <div class="arcade-overlay-inner">
                  <span class="arcade-kicker">Browser tribute</span>
                  <h3 data-overlay-title>Run the {label} course</h3>
                  <p data-overlay-message>{tagline}</p>
                  <button class="btn btn-primary" type="button" data-start>Start run</button>
                  <p class="arcade-hint">Space / ↑ / click to jump</p>
                </div>
              </div>
            </div>

            <div class="arcade-progress" role="progressbar" aria-label="Course progress"
                 aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
              <span data-progress aria-hidden="true"></span>
            </div>

            <div class="arcade-foot">
              <p class="arcade-note">Original tribute built for this archive — not the original game. No GD files are hosted.</p>
              <a href="{game_official}" target="_blank" rel="noopener">Get Geometry Dash <span aria-hidden="true">↗</span></a>
            </div>
            <p class="visually-hidden">
              This is an original browser game. Use the Start run button, then press Space, the up
              arrow, or tap the course to jump. Clear the finish line to record a time.
            </p>
          </div>
        </section>
      </div>

      <aside class="version-side">
        <div class="side-panel">
          <div class="side-head">
            <span>At a glance</span>
            <span>{label}</span>
          </div>
          <ul class="side-facts">
{facts}
          </ul>
        </div>

        <div class="side-panel">
          <div class="side-head">
            <span>Archive</span>
            <span>Index</span>
          </div>
          <ul class="side-links">
            <li><a href="../index.html#versions">All 13 versions <span aria-hidden="true">↗</span></a></li>
            <li><a href="../index.html#spin-offs">Spin-off editions <span aria-hidden="true">↗</span></a></li>
            <li><a href="../updates.html">Site updates <span aria-hidden="true">↗</span></a></li>
            <li><a href="../index.html#ads">Ad space <span aria-hidden="true">↗</span></a></li>
          </ul>
        </div>

        <aside class="ad-slot side-ad" aria-label="Reserved advertisement space, coming soon">
          <span class="ad-tag">Advertisement</span>
          <div class="ad-copy">
            <p class="ad-title">Ad space coming soon</p>
            <p class="ad-note">Reserved for a future placement. Nothing is served here yet.</p>
          </div>
          <span class="ad-size" aria-hidden="true">300 × 250</span>
        </aside>
      </aside>
    </section>

    <section class="container pager-wrap" aria-label="More versions">
      <div class="section-bar">
        <span>03 / Keep browsing</span>
        <span>Archive order</span>
      </div>
{pager_cards(index, versions)}
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-grid">
      <div class="footer-about">
        <a class="brand" href="../index.html" aria-label="Tommy.textnexus.me home">
          <span class="brand-mark" aria-hidden="true">T</span>
          <span class="brand-text">
            <strong>TOMMY.TEXTNEXUS.ME</strong>
            <span>Geometry Dash // Version archive</span>
          </span>
        </a>
        <p>
          A fan-made index of Geometry Dash releases, from the seven-level launch build to Editor
          2.0. Not affiliated with RobTop Games.
        </p>
      </div>

      <div class="footer-col">
        <h3>Explore</h3>
        <ul>
          <li><a href="../index.html">Home</a></li>
          <li><a href="../index.html#versions">All versions</a></li>
          <li><a href="../index.html#spin-offs">Spin-offs</a></li>
          <li><a href="../updates.html">Site updates</a></li>
          <li><a href="../index.html#ads">Ad space</a></li>
        </ul>
      </div>

      <div class="credit">
        <p class="credit-kicker">Website made by</p>
        <p class="credit-name">Nexus</p>
        <a class="credit-link" href="https://textnexus.me" target="_blank" rel="noopener">
          Textnexus.me <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>

    <div class="container footer-bottom">
      <p>© <span id="year">2026</span> Tommy.textnexus.me</p>
      <p>Website made by Nexus · <a href="https://textnexus.me" target="_blank" rel="noopener">Textnexus.me</a></p>
    </div>
  </footer>

  <script src="../assets/site.js?v={ASSET_VERSION}" defer></script>
  <script src="../assets/arcade.js?v={ASSET_VERSION}" defer></script>
</body>
</html>
'''


def main() -> None:
    data = json.loads(DATA.read_text(encoding="utf-8"))
    versions = data["versions"]
    official = data["official"]
    OUT.mkdir(exist_ok=True)
    for index, version in enumerate(versions):
        target = OUT / f'{version["slug"]}.html'
        target.write_text(page(version, index, versions, official), encoding="utf-8")
    print(f"Built {len(versions)} version pages in {OUT}")


if __name__ == "__main__":
    main()
