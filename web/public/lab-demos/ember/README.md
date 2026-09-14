# Ember demo photography

Stock photographs standing in for a restaurant chain's own, used by `/labs/ember`.

Source: Unsplash, fetched 2026-09-14. The Unsplash License allows commercial and
non-commercial use with no permission and no attribution required, so these are
safe on a portfolio. They are still stand-ins: a real client's site ships with
the client's own photographs, and these get deleted the moment that happens.

| file | Unsplash photo id | used by |
| --- | --- | --- |
| hero-table.webp | 1708388066828-af75608c3b2f | hero, the floating picture |
| grill-close.webp | 1708388064287-4cb063e84b65 | the charcoal section |
| embers.webp | 1565812557693-208d29398fbb | hero background, behind a mask |
| set-classic.webp | 1752555535777-0aed7bc93f98 | buffet set card and its dialog |
| set-sea.webp | 1681108933468-d6ee56f1f97e | buffet set card and its dialog |
| set-premium.webp | 1768203632885-91485e5f4036 | buffet set card and its dialog |
| shop-night.webp | 1718942900361-d01a1ee8d077 | the branches section |

Fetched as WebP at roughly the width each one renders at, `fit=crop` with
`crop=entropy` where the crop was doing real work. Quality runs 44 to 62,
lowest on the two that sit behind a mask or a scrim and never get looked at
directly. The whole folder is about 810 KB and none of it reaches the gallery
card, the home page, or any other route.

The brand on the page, Taodang, is invented, and so are the branches, the phone
numbers and the prices. The footer says so.
