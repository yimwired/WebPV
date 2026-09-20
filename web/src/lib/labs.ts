// ─────────────────────────────────────────────────────────────
//  Lab data. Design experiments shown under /labs.
//  Each entry is a full standalone landing page in its own style.
//  แก้ไฟล์นี้เพื่อเพิ่ม/แก้ style demo (ชื่อ, คำอธิบาย, สี card)
// ─────────────────────────────────────────────────────────────

export interface Lab {
  slug: string;
  name: string;
  /** short vibe label shown on the card + switcher */
  vibe: string;
  /** 1-2 sentences for the gallery card */
  description: string;
  /** accent used inside the demo itself */
  accent: string;
  /** gradient for the gallery preview thumbnail */
  preview: { from: string; to: string };
  /** who this direction suits, shown on the gallery card */
  bestFor: string;
  /** honest build estimate for a site in this direction */
  buildTime: string;
}

export const labs: Lab[] = [
  {
    slug: "clash",
    name: "Clash",
    vibe: "Maximalism, festival poster",
    description:
      "A two day festival across three stages, and a lineup that answers the question a poster never does: which of the sets you want are on at the same time. Pick them and the running order names every collision, says it costs the overlap plus the walk whichever way you take it, and flags the transfers that look fine on paper and are nine minutes on foot. Loud type, hard borders, and black ink on every bright fill, because off-white on this palette measures 1.3:1.",
    accent: "#f5e04b",
    preview: { from: "#25d07a", to: "#0d0b0a" },
    bestFor: "Festivals, temple fairs, club nights, anything with stages and a clock",
    buildTime: "About a week, and the running order is most of it",
  },
  {
    slug: "gaze",
    name: "Gaze",
    vibe: "Interactive, cursor-driven",
    description:
      "A studio page whose subject turns to follow the pointer. The head is real geometry rather than a skewed drawing, so the meridians bunch towards the limb and the far eye narrows on its own, and the frame index printed under it is the one a video would have seeked to. Nothing in the loop goes through React: a full sweep of the viewport re-renders no components at all.",
    accent: "#c6f24e",
    preview: { from: "#0c1110", to: "#c6f24e" },
    bestFor:
      "Creative developers, motion studios, anyone selling the interaction itself",
    buildTime: "Three days as vectors, a week once there is footage to cut",
  },
  {
    slug: "meeple",
    name: "Meeple",
    vibe: "Pixel art, drawn by hand",
    description:
      "A board game cafe where the shelf answers the question the staff answer forty times a shift: how many of you, how long have you got, and have you played before. Every box that does not fit stays on the shelf and says which of the three it failed, and when nothing fits the page names the one that came closest. No icon set and no photography: every picture on it is sixteen pixels square, and the only easing curve in the code is steps.",
    accent: "#e8705a",
    preview: { from: "#f2e9d8", to: "#eaa93c" },
    bestFor: "Cafes, clubs, game shops, anywhere the choice is the hard part",
    buildTime: "About a week, and the sprites are most of it",
  },
  {
    slug: "slab",
    name: "Slab",
    vibe: "Neo-brutalism, loud and flat",
    description:
      "Hard borders, flat offset shadows with no blur in them anywhere, and controls that travel onto their own shadow when you press them. The palette belongs to the product rather than the page: pick a different course from the top bar and the whole site repaints, which is the part a client actually wants to see before committing to a colour this loud.",
    accent: "#ffe14d",
    preview: { from: "#fffdf5", to: "#ffe14d" },
    bestFor:
      "Courses, startups, agencies, anything that would rather be seen than trusted quietly",
    buildTime: "Three to four days, and no photography at all",
  },
  {
    slug: "ember",
    name: "Ember",
    vibe: "Food chain, full volume",
    description:
      "A charcoal grill buffet sold the way Thai food brands actually sell: cream and one chilli red, type at full volume, stickers, and product cards that lift off the page. Press a set or a branch and the panel grows out of the card you pressed, with the page behind it frozen until it closes.",
    accent: "#d81f14",
    preview: { from: "#fbf1de", to: "#a8140c" },
    bestFor:
      "Restaurant chains, street food brands, anywhere with branches and a menu",
    buildTime: "About a week once the food is photographed",
  },
  {
    slug: "unfold",
    name: "Unfold",
    vibe: "Hardware launch, scroll-driven",
    description:
      "One folding desk light, sold the way a hardware launch page sells one: each section states a single thing and the media that proves it sits in a frame of its own. The clip of the lamp opening starts when you reach it and stops when it is done, and the colour-temperature slider relights the photograph rather than swapping to a second one.",
    accent: "#ffc489",
    preview: { from: "#191512", to: "#4a3524" },
    bestFor:
      "Launching one product: gadgets, appliances, anything with a spec sheet",
    buildTime: "About ten days, plus the product shots",
  },
  {
    slug: "trine",
    name: "Trine",
    vibe: "Jewellery, still life",
    description:
      "A photographed hand with the ring removed and rebuilt in WebGL, sitting exactly where the real one was. Drag to turn it, and the metal picker recolours all three bands live.",
    accent: "#b08d57",
    preview: { from: "#f4f2ef", to: "#dcd8d2" },
    bestFor: "Jewellery, watches, anything sold on one hero object",
    buildTime: "Two weeks, the 3D object is the work",
  },
  {
    slug: "cart",
    name: "Cart",
    vibe: "One product, one page",
    description:
      "The single product page, in the register the genre actually works in. Off-black with one acid accent that only ever means buy, bundle tiles that price themselves, and a noise control that demonstrates the feature instead of claiming it. The scarcity theatre is left out on purpose.",
    accent: "#c8f04a",
    preview: { from: "#141416", to: "#0b0b0c" },
    bestFor: "One hero product, dropshipping, a launch, a pre-order",
    buildTime: "Four days once the product photos exist",
  },
  {
    slug: "counter",
    name: "Counter",
    vibe: "Restaurant menu, one link",
    description:
      "The page a shop actually needs. Today's menu with prices, an open-or-closed badge that reads the visitor's own clock, and a phone number that never scrolls away. Warm paper, one hot accent, no hero video.",
    accent: "#c1440e",
    preview: { from: "#fbf7f0", to: "#e8ddc9" },
    bestFor: "Restaurants, cafes, bakeries, anywhere with a menu and a phone",
    buildTime: "Three days once the menu exists",
  },
  {
    slug: "longtail",
    name: "Longtail",
    vibe: "Day tours, live booking",
    description:
      "A tour operator that takes bookings. Pick a trip, set how many adults and children are coming, add hotel pickup, and the panel quotes the total and the 30% deposit as you go. Deep water, sand and one coral accent.",
    accent: "#ff7a59",
    preview: { from: "#0e262a", to: "#07191c" },
    bestFor: "Tours, boat charters, dive shops, anything sold by the seat",
    buildTime: "Three to five weeks with a booking back end",
  },
  {
    slug: "stall",
    name: "Stall",
    vibe: "Marketplace, sign in and list",
    description:
      "Accounts, listings, search and filters: the plain marketplace people keep asking for. Buyers message the seller directly and the site never holds the money, which is the version worth building.",
    accent: "#facc15",
    preview: { from: "#171a20", to: "#0e1013" },
    bestFor: "Classifieds, second-hand goods, in-game accounts and items",
    buildTime: "Two to three weeks, the accounts are the work",
  },
  {
    slug: "minimal",
    name: "Grid",
    vibe: "Swiss minimal",
    description:
      "White space, a strict grid, one red accent. International-typographic-style discipline applied to a personal index page.",
    accent: "#e11d48",
    preview: { from: "#fafafa", to: "#e5e5e5" },
    bestFor: "Consultants, writers and studios selling clarity",
    buildTime: "Under a week",
  },
];

// ─────────────────────────────────────────────────────────────
//  One route is in neither list on purpose: `/labs/hinge`, a mockup studio
//  that puts a design on a folding phone. It is a tool rather than a style
//  to buy, so it has no vibe, no bestFor and no build estimate to give, and
//  Film's call was that clients do not see it. It builds and answers on a
//  direct URL exactly like the archived entries below.
//  Source: components/labs/hinge-demo.tsx · verified by scripts/shoot-hinge.mjs
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
//  Retired from the gallery on 2026-09-16, kept for reference.
//  Nothing imports this: these demos are off the gallery, the home
//  strip, the switcher, the sitemap and llms.txt. Their routes still
//  build and still answer on a direct URL, so a link can be handed out
//  one at a time. Move an entry back into `labs` above to relist it.
//  เก็บไว้ดูเอง ลูกค้าหาไม่เจอแต่เปิดตรงได้
// ─────────────────────────────────────────────────────────────
export const archivedLabs: Lab[] = [
  {
    slug: "deed",
    name: "Deed",
    vibe: "Property, priced honestly",
    description:
      "A condominium project that answers the two questions a listing never does: whether a bank will lend, and what has to be in the account on transfer day. Give it your income and your deposit and it works the instalment at the floating rate rather than the three year teaser, because that is what the bank sizes the loan against. If the forty percent rule turns it down it says by how much and what would fix it, in baht. Thirty years of instalments are charted where they actually go, and the transfer day costs are itemised down to the meters.",
    accent: "#1b5e9c",
    preview: { from: "#f6f4f0", to: "#c9c2b6" },
    bestFor: "Developers, agents, anything sold on a mortgage",
    buildTime: "A week and a half, and the loan maths is most of it",
  },
  {
    slug: "steep",
    name: "Steep",
    vibe: "Victorian apothecary, blended to order",
    description:
      "A tea room that blends to order, and prints the working label rather than a menu. Pick a leaf and what goes in with it, and the label sets the grams into a 500 ml pot, the water, the minutes and the caffeine per cup. Then it answers the thing a blend never admits: root and bark want boiling water for ten minutes, the leaf in the same pot is bitter long before that, so every material the pot is wrong for is named, by how many degrees or minutes, and told which second pot it belongs in.",
    accent: "#6d1f2a",
    preview: { from: "#f2ece0", to: "#c9b89a" },
    bestFor: "Tea rooms, herbalists, coffee roasters, anything sold by the gram",
    buildTime: "About a week, and the brewing table is the work",
  },
  {
    slug: "draft",
    name: "Draft",
    vibe: "Conceptual sketch, working drawing",
    description:
      "An interior studio that shows the working drawing rather than the render, because a render says how the room will look and a drawing says whether the furniture fits. Give it your room's real dimensions and the plan redraws to scale on ruled paper, dimensions itself, and writes in the margin how much walkway is left, which piece is wider than the wall, and by how many centimetres. Every rectangle on the sheet is measured in the same centimetres the notes are.",
    accent: "#2f5fa8",
    preview: { from: "#f3f1e9", to: "#cfc9b8" },
    bestFor: "Interior designers, architects, fit-out and built-in furniture",
    buildTime: "About a week, and the clearances are the work",
  },
  {
    slug: "paste",
    name: "Paste",
    vibe: "Scrapbook, taped down",
    description:
      "A wedding invitation built out of instant photos taped to ruled paper, overlapping the way a real page does rather than sitting in a grid. It also does the job the printed card cannot: type your name and it gives you your table, your side and the line the couple wrote for you. The Lab sells weddings twice on purpose, and this is the opposite register to Maison.",
    accent: "#b23a26",
    preview: { from: "#f7f2e8", to: "#e3d2b6" },
    bestFor: "Weddings, parties, reunions, anything with a guest list",
    buildTime: "Three days, and the guest list is the only real work",
  },
  {
    slug: "loom",
    name: "Loom",
    vibe: "Bohemian, warm and woven",
    description:
      "A three-room guesthouse that prices the same nights two ways. Pick your dates and the panel quotes the direct rate beside what an agent would list it at, because the 15 to 18 percent they take is the one number a listing can never show you and the owner's own site always can. The calendar says how many rooms are left on every night rather than only whether the house is full.",
    accent: "#a8492a",
    preview: { from: "#f4ece0", to: "#c99a6a" },
    bestFor:
      "Guesthouses, homestays, small resorts, anywhere fighting a booking site",
    buildTime: "A week and a half once the rooms are photographed",
  },
  {
    slug: "rack",
    name: "Rack",
    vibe: "Y2K, chrome and windows",
    description:
      "A second-hand clothing shop, where every piece is the only one of itself and the size on its label was printed in another country twenty years ago. So the rail asks for your own chest measurement instead, and answers with what fits, what does not, and by how many inches in which direction. Nothing on it is photographed: each garment is drawn from the numbers the shop measured, so the 26 inch piece really is wider on screen than the 17 inch one.",
    accent: "#ff2d94",
    preview: { from: "#99a6cf", to: "#4a5480" },
    bestFor: "Vintage and second-hand, anywhere every item is one of one",
    buildTime: "About a week, and the measurements are most of it",
  },
  {
    slug: "kiln",
    name: "Kiln",
    vibe: "Wabi-sabi, one-off goods",
    description:
      "A studio that sells ceramics no two of which are alike, so the page points at what is wrong with each piece instead of finding a flattering angle. The marks are plotted on the photograph itself and each one says what caused it. The quietest page here: no shadows, no borders past a hairline, and hierarchy carried by space rather than weight.",
    accent: "#7a4c30",
    preview: { from: "#f4efe5", to: "#d9cdb8" },
    bestFor: "Makers, ceramics, coffee, anything sold one piece at a time",
    buildTime: "Four days once the pieces are photographed",
  },
  {
    slug: "prism",
    name: "Prism",
    vibe: "OS surface, real glass",
    description:
      "Glass built the way a lens behaves rather than the way a blur filter does: the backdrop bends hardest at the rim, each colour channel bends by a different amount so the edge carries a fringe, and the sheet flips dark or light on its own to keep its text readable over whatever photograph is behind it. Every layer has a switch, so the claim is something you check rather than something the page says.",
    accent: "#7fd4ff",
    preview: { from: "#0b1620", to: "#08090c" },
    bestFor:
      "Apps, dashboards, anything with a lot of controls on screen at once",
    buildTime: "About a week, the readable-over-anything part is the work",
  },
  {
    slug: "contour",
    name: "Contour",
    vibe: "Packaging, real-time 3D",
    description:
      "One drink in three pack sizes, lathed in WebGL from published dimensions and wearing labels painted in the browser. Scroll and it plays out in four acts: the family, one pack filling the frame, the turn to the back panel, then the range to scale. An unofficial brand study.",
    accent: "#f40009",
    preview: { from: "#c11119", to: "#2c0104" },
    bestFor: "Drinks, cosmetics, anything sold as a range of sizes",
    buildTime: "Two weeks, the packaging models are the work",
  },
  {
    slug: "sable",
    name: "Sable",
    vibe: "Product, ink on paper",
    description:
      "A fictional e-ink writing slate, drawn entirely in CSS with one light source. The text field on the page drives the panel at the hardware's real 41 ms latency, full-refresh flicker included.",
    accent: "#a8432b",
    preview: { from: "#f6f5f2", to: "#e4e1da" },
    bestFor: "Physical products, tools, anything you want to feel touchable",
    buildTime: "About a week",
  },
  {
    slug: "meridian",
    name: "Meridian",
    vibe: "Machined hardware",
    description:
      "A milled aluminium control deck: keycaps on translateZ, a knurled encoder, a scroll-pinned walkthrough and a configurator that recolours every deck on the page at once.",
    accent: "#f7a445",
    preview: { from: "#101012", to: "#2a2723" },
    bestFor: "Hardware, devices, engineering-led products",
    buildTime: "About a week",
  },
  {
    slug: "playroom",
    name: "Playroom",
    vibe: "Pick and mix, physics",
    description:
      "A sweet shop where the jar is the cart. Every piece you add is dropped in as a real body in a solver written for this page, so the pile stacks, rolls and can be thrown - and the plus and minus buttons still run the whole shop without it.",
    accent: "#ff85a8",
    preview: { from: "#fff6ec", to: "#ffd9c7" },
    bestFor: "Sweet shops, merch, anything sold by the piece or the bag",
    buildTime: "About a week",
  },
  {
    slug: "signal",
    name: "Signal",
    vibe: "Instrumentation, measured",
    description:
      "A working oscilloscope for a company that sells sensors. Pick a channel and a sweep rate and the trace answers; peak to peak, RMS and frequency are computed from the same samples it draws, so the readout cannot disagree with the picture.",
    accent: "#5cf08a",
    preview: { from: "#0b100e", to: "#04160d" },
    bestFor: "Sensors, lab instruments, IoT, anything sold on a spec sheet",
    buildTime: "About a week",
  },
  {
    slug: "terminal",
    name: "Terminal",
    vibe: "Developer tool, amber CRT",
    description:
      "A command line that answers. Type deploy and it prints its steps at the pace the real thing would; history walks with the arrow keys, tab completes, and a wrong command gets a real error. The page a CLI needs, for the audience that types before it reads.",
    accent: "#ffb000",
    preview: { from: "#120d08", to: "#2a1c08" },
    bestFor: "CLIs, infrastructure, APIs, anything sold to developers",
    buildTime: "About a week",
  },
  {
    slug: "dimension",
    name: "Dimension",
    vibe: "Real-time 3D",
    description:
      "An actual WebGL scene as the hero, with a chrome torus knot, iridescent lighting and drag to orbit. Not a video, not a render: live in your browser.",
    accent: "#f0abfc",
    preview: { from: "#0f172a", to: "#312e81" },
    bestFor: "Studios and agencies that need one striking hero",
    buildTime: "Two weeks, the 3D scene is the work",
  },
  {
    slug: "vision",
    name: "Vision",
    vibe: "Spatial cinematic",
    description:
      "Pure black, a glowing visor, statements that fade in as you scroll and apps floating as glass windows in space. The Apple keynote treatment.",
    accent: "#2997ff",
    preview: { from: "#000000", to: "#101828" },
    bestFor: "Launches and single-product storytelling",
    buildTime: "Around ten days",
  },
  {
    slug: "space",
    name: "Deep Space",
    vibe: "Sci-fi HUD",
    description:
      "A live starfield on canvas, a glowing planet and mission-log typography. The portfolio as a spacecraft dashboard.",
    accent: "#22d3ee",
    preview: { from: "#020617", to: "#0e7490" },
    bestFor: "Games, communities and anything sci-fi adjacent",
    buildTime: "About a week",
  },
  {
    slug: "luxe",
    name: "Maison",
    vibe: "Luxury editorial",
    description:
      "Ivory paper, serif headlines and hairline gold rules. Quiet, printed-matter luxury. The opposite of a tech landing page.",
    accent: "#c8a24a",
    preview: { from: "#f5efe4", to: "#d9c8a3" },
    bestFor: "Restaurants, ateliers, weddings, quiet luxury",
    buildTime: "About a week",
  },
];
