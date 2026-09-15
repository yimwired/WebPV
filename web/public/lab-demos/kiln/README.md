# Kiln demo photography

Stock photographs standing in for a ceramics studio's own, used by `/labs/kiln`.

Source: Unsplash, fetched 2026-09-15. The Unsplash License allows commercial and
non-commercial use with no permission and no attribution required, so these are
safe on a portfolio. They are stand-ins: a real studio's site ships with the
studio's own photographs, and these get deleted the moment that happens.

| file | Unsplash photo id | used by |
| --- | --- | --- |
| piece-bowl.webp | 1778925971875-e36bcf9221c2 | piece 24-118, two flaw markers |
| piece-cup.webp | 1541689588306-8847082e1c1c | piece 24-076, two flaw markers |
| piece-jar.webp | 1755401324208-7ead4696b351 | piece 24-203, two flaw markers |
| piece-plate.webp | 1762541088571-34a2949af8a0 | piece 24-044, two flaw markers |
| studio.webp | 1590605103416-230704277b05 | the hero |
| shelf.webp | 1731162694065-b4e5f6a667e6 | the process section |

**The flaw markers are tied to these exact crops.** Each piece in
`components/labs/kiln/data.ts` carries percentage coordinates that were checked
against the rendered photograph, and `web/scripts/shoot-kiln.mjs` fails if any
marker drifts within 6% of an edge. Swapping a photograph without re-checking
its coordinates leaves markers pointing at empty background, which is worse than
having none.

Two notes on the files themselves:

- `piece-cup.webp` is cropped, not the raw fetch. The original frames the cup on
  a copy of a book called *Wabi Sabi*, spine out and legible, which reads as a
  prop on a page for a brand that is not that book. Cropped to
  `560:560:300:130` of the 900px fetch and scaled back up.
- `studio.webp` is the second choice. The first, `1609881583302-61548332039c`,
  cropped to the potter's knee at this aspect ratio and showed no hands and no
  wheel, which made the alt text a description of a different picture.

Whole folder is about 340 KB and none of it reaches the gallery card, the home
page, or any other route.
