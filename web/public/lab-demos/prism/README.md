# Prism demo photography

The four backdrops the glass in `/labs/prism` sits on, standing in for album art.

Source: Unsplash, fetched 2026-09-15. The Unsplash License allows commercial and
non-commercial use with no permission and no attribution required, so these are
safe on a portfolio.

| file | Unsplash photo id | band luma | what it is in the set for |
| --- | --- | --- | --- |
| soi.webp | 1599060052009-24d6d0b0161c | 27 | hard neon edges, the clearest view of the refraction |
| monsoon.webp | 1631322342429-5897e52b0f64 | 19 | tight straight leaf veins, where the chromatic fringe shows |
| dune.webp | 1621795307430-3ff25aa08945 | 64 | soft curves and no hard edges, the control |
| salt.webp | 1509228105826-2d09109f16bc | 174 | brightest, forces the sheet into its dark mode |

**These were not chosen for looks.** `band luma` is the mean luminance, 0 to 255,
of the strip the player panel covers, measured with ffmpeg off each file rather
than guessed:

```
ffmpeg -i soi.webp -vf "crop=iw:ih*0.38:0:ih*0.62,scale=1:1" -f rawvideo -pix_fmt gray - | od -An -tu1
```

The set spans 19 to 174 on purpose. The adaptive layer flips the panel at 118, so
this range makes it flip in both directions while someone is watching, which is
the whole demonstration. The numbers live in `components/labs/prism/data.ts`;
re-measure them if a photograph is ever swapped, or the sheet will pick the wrong
mode and the text will go quiet.

Two of the four also carry hard straight lines, because a displacement map over a
smooth gradient has nothing to bend and the refraction would be invisible.

Fetched at 1100x1100 WebP, quality 54 to 58. The whole folder is about 432 KB and
none of it reaches the gallery card, the home page, or any other route.
