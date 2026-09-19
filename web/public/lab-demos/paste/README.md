# Paste demo photography

Stock photographs standing in for a couple's own, used by `/labs/paste`.

Source: Unsplash, fetched 2026-09-15. The Unsplash License allows commercial and
non-commercial use with no permission and no attribution required, so these are
safe on a portfolio.

| file | Unsplash photo id | caption it carries |
| --- | --- | --- |
| laugh.webp | 1466979939565-131c4b39a51b | วันที่ต้นขอ ฟ้าหัวเราะก่อนตอบ |
| pinky.webp | 1514446750685-c27ac87a4403 | สัญญาว่าจะไม่ทะเลาะกันเรื่องแอร์ |
| hands.webp | 1522973717924-b10fe4e185cc | แหวนคู่ ทำเองที่เวิร์กชอป |
| sofa.webp | 1655759738595-418970010986 | คืนก่อนวันงาน ยังเถียงกันเรื่องเพลง |

**These are photographs of real people who have nothing to do with this
invented wedding,** which the page's footer says in plain Thai. That matters
more here than on the other labs: a wedding page implies the people in the
pictures are the couple, and on a public portfolio that implication should not
be left to the visitor to work out.

Fetched square at 640px, WebP, quality 56 to 58. The whole folder is about
230 KB.

Two notes for anyone swapping a photo:

- **Captions must fit one line.** The polaroid frame reserves a fixed chin, and
  a caption that wraps to two spills over the photograph. The longest of these
  was cut back for exactly that reason.
- **The tilts live in `data.ts`, not in a random call.** A layout that
  reshuffles on every render cannot be screenshotted, reviewed, or regression
  tested, and `web/scripts/shoot-paste.mjs` asserts that no photo is straight
  and that they do not all lean the same way.
