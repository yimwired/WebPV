// ─────────────────────────────────────────────────────────────
//  UI copy in both languages. EDIT THIS to change site text.
//  แก้ข้อความบนเว็บ (ทั้ง EN และไทย) ที่ไฟล์นี้ไฟล์เดียว
//  Project names/descriptions live in `projects.ts`.
// ─────────────────────────────────────────────────────────────

export type Locale = "en" | "th";

const en = {
  nav: {
    work: "Work",
    services: "Services",
    pricing: "Pricing",
    about: "About",
    labs: "Labs",
    contact: "Contact",
    cta: "Get in touch",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  hero: {
    name: "Nuttapon Yimnoi (Film)",
    location: "Bangkok",
    headline: "I build trading systems, AI agents and the tools around them.",
    sub: "Five systems running in production right now, all designed and built solo, from the first sketch to the thing that runs while I sleep.",
    viewWork: "See the work",
    contact: "Get in touch",
    facts: [
      { value: "{projects}", label: "Systems in production" },
      { value: "12", label: "Strategy engines in AURUM" },
      { value: "11", label: "AI agents in the fleet" },
      { value: "4", label: "Platforms published to" },
    ],
  },
  work: {
    label: "projects",
    title: "Built, shipped, still running",
    sub: "Each one is in daily use, not a demo. Open any of them for how it was built and what it does.",
    caseStudy: "Read the build",
  },
  about: {
    label: "What I work with",
    title: "One person, the whole stack.",
    p1: "I'm Film. I build trading bots, AI assistants, dashboards and content pipelines, and I own each project from the first sketch to the thing running in production.",
    p2: "My default is to ship: small, real, improving over time. Whether it's an automated strategy or a short-form video system, the goal is the same. Make it work, then make it better.",
    stats: [
      { value: "{projects}", label: "Systems in production" },
      { value: "Solo", label: "Design, build and run" },
      { value: "EN · TH", label: "Languages I work in" },
    ],
  },
  footer: {
    title: "Let's build something.",
    sub: "Got a project, a collaboration, or just want to say hi? My inbox is open.",
    rights: "All rights reserved.",
    builtWith: "Built with Next.js · Tailwind · Framer Motion",
  },
  form: {
    name: "Name",
    namePlaceholder: "Your name",
    email: "Email",
    emailPlaceholder: "you@example.com",
    message: "Message",
    messagePlaceholder: "What do you want built? A rough idea is enough.",
    send: "Send message",
    sending: "Sending",
    success: "Got it. I read every message and reply from yimwired@gmail.com.",
    error: "That didn't send. Email me directly and it'll reach me.",
    copyEmail: "Copy email",
    copied: "Copied",
  },
  notFound: {
    title: "This page doesn't exist. Yet.",
    sub: "Like half the ideas in my backlog, it might get built someday. Meanwhile, everything that does exist lives on the home page.",
    home: "Back to home",
    labs: "Visit The Lab",
  },
  services: {
    title: "What I can build for you",
    sub: "Same approach as everything above: designed, built and shipped by one person who has to live with the result.",
    offerings: [
      {
        title: "Websites & landing pages",
        blurb:
          "A fast, responsive site that looks made for you instead of pulled off a template. Pick a direction from The Lab or send a reference you like. It goes live when it's done.",
        points: [
          "Next.js, deployed and running",
          "Phone first, Thai and English",
          "Your repo, your domain",
        ],
        timeline: "Usually about a week",
      },
      {
        title: "Automation & bots",
        blurb:
          "The repetitive half of your week handed to a machine: Telegram bots, scheduled jobs, scraping, publishing to several platforms from one place.",
        points: [
          "Driven from Telegram or a web panel",
          "Runs on a schedule or on demand",
          "Alerts you when something breaks",
        ],
        timeline: "One to two weeks, depending on scope",
      },
      {
        title: "Dashboards & internal tools",
        blurb:
          "One screen that shows the state of the business and lets you act on it: catalogs, orders, content status, exports.",
        points: [
          "Built around how you actually work",
          "Search, filters and CSV export",
          "Room to grow as you do",
        ],
        timeline: "One to three weeks",
      },
      {
        title: "AI where it earns its place",
        blurb:
          "Claude or Gemini wired into a real workflow: product copy, summaries, image prompts, classification. Used where it saves hours, not sprinkled on for show.",
        points: [
          "Runs inside the tools you already use",
          "Your data stays yours",
          "Running costs explained up front",
        ],
        timeline: "Usually added onto one of the above",
      },
    ],
    processTitle: "How it works",
    process: [
      {
        h: "Tell me what you need",
        p: "A message with the rough idea is enough. No brief, no forms to fill in.",
      },
      {
        h: "Scope and quote",
        p: "I come back with what I would build, how long it takes and a fixed price. That part costs nothing.",
      },
      {
        h: "Build in the open",
        p: "You see working versions as they land instead of waiting for one big reveal at the end.",
      },
      {
        h: "Ship and hand over",
        p: "It goes live, the code is yours, and revisions are included as agreed.",
      },
    ],
    ctaTitle: "Have something in mind?",
    ctaSub: "Tell me roughly what you need and I'll send back scope, timeline and a price.",
    ctaButton: "Ask for a quote",
  },
  // Numbers live in `pricing.ts`; only the wording is here, keyed by tier id.
  pricing: {
    title: "Prices agreed before anything starts",
    sub: "Three packages cover most of what people ask me for. Anything larger is quoted per project. Whatever number you agree to is the number on the invoice.",
    recommended: "Recommended",
    perProject: "Per project",
    seeDemo: "See it live",
    tiers: {
      starter: {
        name: "Starter",
        forWho: "One page, one message",
        blurb:
          "A single scrolling page for a product, an event or an introduction. Everything a first visitor needs, without making them click anywhere else.",
        points: [
          "One page, up to five sections",
          "Thai and English copy",
          "Contact form straight to your inbox",
          "Live on your own domain",
        ],
        timeline: "About 5 days",
      },
      standard: {
        name: "Standard",
        forWho: "A small site that has to sell",
        blurb:
          "Several pages built on a direction you pick from The Lab, written so Google can find it and light enough to open on a phone with no wifi.",
        points: [
          "Up to five pages",
          "A Lab style adapted to your brand",
          "SEO, share previews and sitemap",
          "Edit your own text without me",
          "Two rounds of revisions",
        ],
        timeline: "About 2 weeks",
      },
      signature: {
        name: "Signature",
        forWho: "The site is the product",
        blurb:
          "Motion, 3D or an interactive piece written from scratch for you, at the level of the Trine and Sable studies in The Lab.",
        points: [
          "Everything in Standard",
          "Custom motion, WebGL or a configurator",
          "A design system you can extend later",
          "Speed and accessibility measured, not assumed",
          "Three rounds of revisions",
        ],
        timeline: "3 to 5 weeks",
      },
      custom: {
        name: "Automation, dashboards, AI",
        forWho: "Not a website",
        blurb:
          "Trading systems, Telegram bots, internal dashboards, content pipelines. Scope decides the price here, so it gets quoted properly instead of guessed.",
        points: [
          "Free scoping call, then a fixed price",
          "Built in stages you can stop between",
          "Handed over with the code and how to run it",
        ],
        timeline: "Quoted with the scope",
      },
    },
    includedTitle: "In every package",
    included: [
      "Built by me end to end, no agency layer",
      "Designed for a phone first",
      "The repository is yours at handover",
      "Deployment set up and running",
      "Two weeks of free fixes after launch",
    ],
    faqTitle: "Before you ask",
    faq: [
      {
        q: "What is not included?",
        a: "Domain and hosting stay in your name: a domain runs about 500 baht a year, and a site this size hosts free on Vercel. Photography, licensed fonts and long-form copywriting are quoted separately if you want them.",
      },
      {
        q: "How does payment work?",
        a: "Half to start, half on the day it goes live. Bank transfer or PromptPay.",
      },
      {
        q: "What if I need changes later?",
        a: "Fixes to what we agreed are free for two weeks after launch. After that, small edits are hourly and anything new gets quoted first.",
      },
      {
        q: "Can you start from a design I already have?",
        a: "Yes. A Figma file, or even screenshots of a site you like, is enough. It usually makes the build faster.",
      },
    ],
    ctaTitle: "Not sure which one fits?",
    ctaSub: "Send the rough idea. I'll tell you which package it lands in, or that it doesn't need one.",
    ctaButton: "Ask for a quote",
    ctaSecondary: "See the styles",
  },
  // Chrome shared by every case-study page.
  caseStudy: {
    back: "Back to home",
    label: "Case study",
    ctaTitle: "Want a system built like this?",
    ctaSub: "I design and build automation end to end: trading, AI, dashboards, content.",
    ctaButton: "Get in touch",
  },
  // Per-project copy, keyed by the project id in `projects.ts`.
  caseStudies: {
    aurum: {
      title: "AURUM",
      subtitle: "Automated XAU/USD trading terminal",
      imageAlt: "AURUM trading terminal dashboard",
      meta: [
        { k: "Role", v: "Design + build, solo" },
        { k: "Stack", v: "Python · MetaTrader 5" },
        { k: "Market", v: "Gold (XAU/USD)" },
        { k: "Status", v: "Running live" },
      ],
      sections: [
        {
          h: "The problem",
          p: "Trading gold manually means missing setups while you sleep, exiting on emotion, and applying risk rules inconsistently. Gold moves around the clock across Asia, London and New York sessions. No one can watch all of them, and no one should have to.",
        },
        {
          h: "The approach",
          p: "Instead of one strategy trying to do everything, AURUM runs 12 focused engines. Each one scans for a single setup type it's good at. Scanning is session-aware, because gold behaves differently in Asia than it does when London or New York opens. Every signal must pass real-time risk checks before a single order is placed.",
        },
        {
          h: "The details that matter",
          p: "Every decision the bot makes is logged to a trade tape, so there's never a mystery position. A kill switch flattens everything and halts trading with one action. Daily loss limits are enforced by the system, not by discipline. These unglamorous pieces took longer than the strategies, and they're what makes it trustworthy enough to run live.",
        },
        {
          h: "Where it is now",
          p: "AURUM runs end to end on MetaTrader 5 with a live terminal dashboard for monitoring. The biggest lesson: the hard part of a trading bot isn't the entry logic. It's risk plumbing, failure states, and knowing exactly what the system did and why.",
        },
      ],
    },
    "you-are-the-virus": {
      title: "You Are the Virus",
      subtitle: "A game where the villain is you",
      imageAlt: "You Are the Virus gameplay",
      meta: [
        { k: "Role", v: "Design + build, solo" },
        { k: "Engine", v: "Godot 4 · GDScript" },
        { k: "Genre", v: "Side-scroll survival" },
        { k: "Status", v: "In playtest" },
      ],
      sections: [
        {
          h: "The idea",
          p: "Most virus games hand you the cure. This one hands you the virus. You drift through a host's bloodstream, infect cells for DNA, dodge the immune system and evolve. Somewhere along the way you learn the host is a child. Every run ends on the same choice: mutate and win, or self-destruct so the kid lives.",
        },
        {
          h: "The approach",
          p: "The vessel scrolls past on its own, so the pressure never lets up. Three verbs carry the whole game: infect, evade, evolve. A run starts at a random peripheral entry (hand, foot, nose or mouth), then climbs five tiers of the body toward the brain, and every body part brings its own hazard: mucus that makes you slide, saliva enzymes that chip away at you, capillaries too narrow to hide in.",
        },
        {
          h: "The details that matter",
          p: "The abilities come from real virology: glycoprotein shift, lytic burst, endocytosis hiding. Each one costs DNA and carries a trade-off, so no build cheeses the game. The HUD is an ECG that reacts to the host's vitals, the audio (12 SFX, 6 tracks) is generated procedurally, and memory fragments drop between levels to reveal exactly who you're killing.",
        },
        {
          h: "Where it is now",
          p: "The full loop plays end to end: intro, levels, fragments, both endings. The side-scroll rework is going in system by system, and each piece heads straight into playtest. The target is a 10-15 minute run worth replaying for the other ending.",
        },
      ],
    },
    "product-dashboard": {
      title: "Product Dashboard",
      subtitle: "Product & content ops for a Shopee store",
      imageAlt: "Product Dashboard showing the Giffarine catalog and its AI content tools",
      meta: [
        { k: "Role", v: "Design + build, solo" },
        { k: "Catalog", v: "900+ items" },
        { k: "Store", v: "Shopee (Giffarine)" },
        { k: "Status", v: "In daily use" },
      ],
      sections: [
        {
          h: "The problem",
          p: "Running a Giffarine store on Shopee means the same loop for every product: write the description, find an image, cut the background out, script a short video, list it, repeat. With hundreds of items in the catalog and only a fraction of them listed, the bottleneck was never selling. It was producing content fast enough to list anything at all.",
        },
        {
          h: "The approach",
          p: "One dashboard holds the whole catalog and knows where every product stands: listed on Shopee, not listed yet, or newly added from the Giffarine range. From any row, one click generates whatever that product is missing: a description, an image prompt, a background-removed cut-out, a video prompt, or a partner product to bundle it with.",
        },
        {
          h: "The details that matter",
          p: "Filter by category, search by name or SKU, and switch between three views (table, cards, split) depending on the job. Every row carries status ticks, so what's done and what's missing reads at a glance. Finished content exports as a CSV in the shape the marketplace expects.",
        },
        {
          h: "Where it is now",
          p: "It's the daily driver for the store: 50 products live on Shopee, a queue waiting behind them, hundreds more in the catalog ready to go. The lesson was that a catalog tool lives or dies on tracking state, on knowing what's done, far more than on how good the AI copy is.",
        },
      ],
    },
    affiliate: {
      title: "Affiliate",
      subtitle: "One product, published everywhere",
      imageAlt: "Affiliate Publisher dashboard",
      meta: [
        { k: "Role", v: "Design + build, solo" },
        { k: "Stack", v: "FastAPI · React · Playwright" },
        { k: "Platforms", v: "YouTube · TikTok · Shopee · Lemon8" },
        { k: "Status", v: "Running daily" },
      ],
      sections: [
        {
          h: "The problem",
          p: "Affiliate content only pays if it's everywhere. Posting the same clip to YouTube, TikTok, Shopee Shorts and Lemon8 by hand means writing captions four times, uploading the same video four times, and losing track of what actually went out.",
        },
        {
          h: "The approach",
          p: "Before writing a line of code I checked what each platform actually allows: YouTube has a real upload API, TikTok's needs app approval and quota, Shopee Shorts and Lemon8 can't be posted to from a desktop at all. So the system is honest semi-automation: API where one exists, browser automation where it doesn't, assist-manual where the platform forces you into its app. One publisher adapter per platform keeps those differences in a single place.",
        },
        {
          h: "The details that matter",
          p: "The interface people actually use is a Telegram bot, because products get found on a phone. Paste a Shopee link, send the photos, and the bot comes back with captions per platform, a video prompt, and even the right size read off the product's size chart. The desktop dashboard is the overview; the queue walks every post through waiting for assets → waiting for video → ready → posted.",
        },
        {
          h: "Where it is now",
          p: "FastAPI backend with a SQLite job queue, a React dashboard, Gemini for copy and images. It runs every day. The interesting constraint was accepting that 'one button, fully automatic' isn't possible on these platforms, then designing something that still saves the whole afternoon.",
        },
      ],
    },
    "jarvis-moon": {
      title: "Moon",
      subtitle: "A multi-agent fleet, and a voice to command it",
      imageAlt: "MOON FLEET, the multi-agent orchestrator",
      meta: [
        { k: "Role", v: "Design + build, solo" },
        { k: "Fleet", v: "11 specialist agents" },
        { k: "Interfaces", v: "Voice · Telegram · Web" },
        { k: "Status", v: "Running at login" },
      ],
      sections: [
        {
          h: "The idea",
          p: "An assistant that answers one question at a time throws away the best thing about agents: several of them can work at once. Moon is a commander that holds the goal and hands the work out to a fleet: a scout to find things, a researcher to read them, a builder to make something, a critic to tear it apart, a scheduler to keep it all running.",
        },
        {
          h: "The approach",
          p: "11 specialized Claude agents sit behind four pipelines: research, build, intake, and an auto mode that picks its own work. Every job lands on a live mission queue, so the fleet can be watched and corrected mid-flight instead of trusted blindly. Each agent gets one job and a narrow prompt; the commander is the only piece holding the full context.",
        },
        {
          h: "The details that matter",
          p: "Voice is the front door. Say \"Hey Moon\" and a small orb appears at the top of the screen, Siri-style. It listens, answers, and keeps the conversation open until you say you're done. Wake-word detection runs offline, speech-to-text handles Thai, and voice, Telegram and the web all talk to the same brain. One system, three doors, no duplicated logic.",
        },
        {
          h: "Where it is now",
          p: "It starts with the machine at login: the fleet, the voice server, the Telegram bot and scheduled jobs like a morning brief. It's the tool I use to run everything else, including this site.",
        },
      ],
    },
  },
};

const th: typeof en = {
  nav: {
    work: "ผลงาน",
    services: "รับงาน",
    pricing: "ราคา",
    about: "รู้จักผม",
    labs: "Labs",
    contact: "ติดต่อ",
    cta: "ทักมาคุยกัน",
    openMenu: "เปิดเมนู",
    closeMenu: "ปิดเมนู",
  },
  hero: {
    // Roman spelling on both sides: it is how the name appears on GitHub and
    // in email, and a guessed Thai spelling of it would be worse than none.
    name: "Nuttapon Yimnoi (ฟิล์ม)",
    location: "กรุงเทพฯ",
    // The zero-width spaces are deliberate: they mark where a line may break
    // inside a Thai run, for engines with no Thai dictionary loaded.
    headline: "ผมสร้าง​ระบบเทรด เอเจนต์ AI และ​เครื่องมือ​รอบๆ มัน",
    sub: "ตอนนี้มีห้าระบบรันอยู่จริง ทำเองคนเดียวทุกตัว ตั้งแต่สเก็ตช์แรกจนถึงวันที่มันทำงานเองตอนผมหลับ",
    viewWork: "ดูผลงาน",
    contact: "ทักมาคุยกัน",
    facts: [
      { value: "{projects}", label: "ระบบที่รันอยู่จริง" },
      { value: "12", label: "strategy engine ใน AURUM" },
      { value: "11", label: "AI agent ในกองยาน" },
      { value: "4", label: "แพลตฟอร์มที่โพสต์ขึ้น" },
    ],
  },
  work: {
    label: "โปรเจกต์",
    title: "สร้างเสร็จ ส่งขึ้นใช้ และยังรันอยู่",
    sub: "ทุกตัวใช้งานจริงทุกวัน ไม่ใช่ตัวอย่างโชว์ กดเข้าไปดูได้ว่าสร้างยังไงและทำอะไรได้บ้าง",
    caseStudy: "ดูเบื้องหลัง",
  },
  about: {
    label: "เครื่องมือที่ใช้",
    title: "คนเดียว ครบทั้งกอง",
    p1: "ผมชื่อฟิล์ม สร้างบอทเทรด AI assistant dashboard และระบบผลิตคอนเทนต์ ถนัดทำโปรเจกต์แบบจับเองทุกขั้น ตั้งแต่สเก็ตช์แรกยันวันที่ระบบรันอยู่บน production",
    p2: "หลักทำงานเรียบง่าย คือส่งของให้ได้ก่อน เริ่มจากเล็ก ใช้ได้จริง แล้วค่อยขัดให้ดีขึ้นเรื่อยๆ จะเป็นบอทเทรดหรือระบบทำวิดีโอสั้นก็เป้าเดียวกัน ทำให้เวิร์กก่อน แล้วค่อยทำให้เนี้ยบ",
    stats: [
      { value: "{projects}", label: "ระบบที่รันอยู่จริง" },
      { value: "ทำเอง", label: "ออกแบบ สร้าง และดูแลต่อ" },
      { value: "ไทย · อังกฤษ", label: "ภาษาที่ทำงานได้" },
    ],
  },
  footer: {
    title: "มาสร้างอะไรสักอย่างด้วยกัน",
    sub: "มีโปรเจกต์ในใจ อยากชวนทำงาน หรือแค่แวะมาทัก ส่งเมลมาได้เลย อ่านเองทุกฉบับ",
    rights: "สงวนลิขสิทธิ์",
    builtWith: "สร้างด้วย Next.js · Tailwind · Framer Motion",
  },
  form: {
    name: "ชื่อ",
    namePlaceholder: "เรียกว่าอะไรดี",
    email: "อีเมล",
    emailPlaceholder: "you@example.com",
    message: "ข้อความ",
    messagePlaceholder: "อยากได้อะไร เล่าคร่าวๆ มาก่อนก็ได้",
    send: "ส่งข้อความ",
    sending: "กำลังส่ง",
    success: "ได้รับแล้ว อ่านเองทุกฉบับ เดี๋ยวตอบกลับจาก yimwired@gmail.com",
    error: "ส่งไม่ผ่าน ส่งเมลมาตรงๆ ได้เลย ถึงมือแน่นอน",
    copyEmail: "คัดลอกอีเมล",
    copied: "คัดลอกแล้ว",
  },
  notFound: {
    title: "หน้านี้ยังไม่มีอยู่จริง อย่างน้อยก็ตอนนี้",
    sub: "เหมือนไอเดียอีกครึ่งใน backlog แหละ สักวันอาจได้เกิด แต่ตอนนี้ของจริงทั้งหมดรออยู่ที่หน้าแรก",
    home: "กลับหน้าแรก",
    labs: "แวะดู The Lab",
  },
  services: {
    title: "รับทำอะไรบ้าง",
    sub: "วิธีทำงานเหมือนงานทุกชิ้นข้างบน ออกแบบเอง สร้างเอง ส่งจนขึ้นใช้จริง โดยคนที่ต้องอยู่กับผลงานนั้นเอง",
    offerings: [
      {
        title: "เว็บไซต์และแลนดิ้งเพจ",
        blurb:
          "เว็บที่โหลดไว ใช้ได้ทุกจอ หน้าตาเหมือนทำมาเพื่อคุณ ไม่ใช่เทมเพลตสำเร็จรูป เลือกสไตล์จาก The Lab หรือส่งตัวอย่างที่ชอบมาก็ได้ ทำเสร็จแล้วขึ้นออนไลน์ให้เลย",
        points: [
          "Next.js ขึ้นเซิร์ฟเวอร์พร้อมใช้",
          "ออกแบบจากมือถือก่อน รองรับทั้งไทยและอังกฤษ",
          "โค้ดกับโดเมนเป็นของคุณ",
        ],
        timeline: "ปกติราวหนึ่งสัปดาห์",
      },
      {
        title: "ระบบอัตโนมัติและบอท",
        blurb:
          "ยกงานซ้ำๆ ที่ต้องทำทุกวันไปให้เครื่องทำแทน ทั้งบอท Telegram งานตั้งเวลา ดึงข้อมูล ไปจนถึงกระจายโพสต์หลายแพลตฟอร์มจากที่เดียว",
        points: [
          "สั่งงานผ่าน Telegram หรือหน้าเว็บ",
          "รันตามเวลาหรือกดเองเมื่อไหร่ก็ได้",
          "แจ้งเตือนทันทีเมื่อระบบสะดุด",
        ],
        timeline: "ราวหนึ่งถึงสองสัปดาห์ ขึ้นกับขอบเขตงาน",
      },
      {
        title: "Dashboard และเครื่องมือใช้ในทีม",
        blurb:
          "หน้าจอเดียวที่เห็นสถานะทั้งร้าน แล้วกดจัดการต่อได้เลย ทั้งแคตตาล็อกสินค้า ออเดอร์ สถานะคอนเทนต์ และการ export",
        points: [
          "ออกแบบตามวิธีทำงานจริงของคุณ",
          "ค้นหา กรอง export เป็น CSV",
          "ต่อเติมได้เรื่อยๆ เมื่อธุรกิจโตขึ้น",
        ],
        timeline: "ราวหนึ่งถึงสามสัปดาห์",
      },
      {
        title: "AI เฉพาะจุดที่คุ้มจริง",
        blurb:
          "ต่อ Claude หรือ Gemini เข้ากับงานจริง เขียนคำโฆษณา สรุปข้อมูล สร้าง prompt รูป จัดหมวดหมู่ ใส่เฉพาะจุดที่ประหยัดเวลาได้จริง ไม่ได้ใส่ไว้ให้ดูเท่",
        points: [
          "ทำงานอยู่ในเครื่องมือที่คุณใช้อยู่แล้ว",
          "ข้อมูลยังเป็นของคุณ",
          "บอกค่าใช้จ่ายรายเดือนให้ชัดตั้งแต่แรก",
        ],
        timeline: "ส่วนใหญ่เสริมเข้าไปในงานข้างบน",
      },
    ],
    processTitle: "ทำงานกันยังไง",
    process: [
      {
        h: "เล่าให้ฟังก่อน",
        p: "ส่งไอเดียคร่าวๆ มาก็พอ ไม่ต้องมีเอกสารหรือแบบฟอร์มอะไร",
      },
      {
        h: "สรุปงานและเสนอราคา",
        p: "ผมตอบกลับว่าจะทำอะไรให้บ้าง ใช้เวลาเท่าไหร่ ราคาเท่าไหร่ ขั้นนี้ไม่มีค่าใช้จ่าย",
      },
      {
        h: "ทำให้เห็นระหว่างทาง",
        p: "ได้เห็นของที่ใช้ได้จริงเป็นระยะ ไม่ต้องรอลุ้นทีเดียวตอนจบ",
      },
      {
        h: "ส่งมอบและขึ้นจริง",
        p: "ขึ้นออนไลน์ให้เรียบร้อย โค้ดเป็นของคุณ แล้วแก้ให้ตามรอบที่ตกลงกันไว้",
      },
    ],
    ctaTitle: "มีงานในใจแล้วใช่ไหม",
    ctaSub: "เล่าคร่าวๆ มาได้เลย เดี๋ยวสรุปขอบเขตงาน เวลา และราคากลับไปให้",
    ctaButton: "ขอใบเสนอราคา",
  },
  pricing: {
    title: "ราคาคุยกันจบ​ตั้งแต่​ก่อนเริ่มงาน",
    sub: "สามแพ็กเกจนี้ครอบคลุมงานที่มีคนถามหาบ่อยที่สุด ถ้าใหญ่กว่านั้นคิดตามงานจริง ตกลงราคาไหนไว้ ก็จ่ายเท่านั้น ไม่มีบวกเพิ่มทีหลัง",
    recommended: "แนะนำ",
    perProject: "คิดตามงาน",
    seeDemo: "ดูของจริง",
    tiers: {
      starter: {
        name: "Starter",
        forWho: "หน้าเดียว จบในหน้าเดียว",
        blurb:
          "หน้าเว็บเลื่อนยาวหน้าเดียว สำหรับสินค้าตัวเดียว งานอีเวนต์ หรือแนะนำตัว มีครบทุกอย่างที่คนเข้ามาครั้งแรกอยากรู้ โดยไม่ต้องกดไปหน้าอื่น",
        points: [
          "หน้าเดียว ไม่เกินห้าส่วน",
          "ข้อความทั้งไทยและอังกฤษ",
          "ฟอร์มติดต่อส่งเข้าอีเมลคุณตรงๆ",
          "ขึ้นออนไลน์บนโดเมนของคุณเอง",
        ],
        timeline: "ราว 5 วัน",
      },
      standard: {
        name: "Standard",
        forWho: "เว็บเล็กที่ต้องขายของได้",
        blurb:
          "หลายหน้า เลือกสไตล์จาก The Lab มาปรับให้เป็นของคุณ เขียนให้ Google หาเจอ และเบาพอจะเปิดติดบนมือถือที่ไม่ได้ต่อไวไฟ",
        points: [
          "ไม่เกินห้าหน้า",
          "สไตล์จาก The Lab ปรับให้เข้ากับแบรนด์",
          "SEO รูปตอนแชร์ และ sitemap",
          "แก้ข้อความเองได้ ไม่ต้องเรียกผม",
          "แก้งานได้สองรอบ",
        ],
        timeline: "ราว 2 สัปดาห์",
      },
      signature: {
        name: "Signature",
        forWho: "ตัวเว็บคือตัวสินค้า",
        blurb:
          "งาน motion, 3D หรือของเล่นในหน้าเว็บที่เขียนขึ้นใหม่ให้เฉพาะคุณ ระดับเดียวกับ Trine และ Sable ที่อยู่ใน The Lab",
        points: [
          "ได้ทุกอย่างใน Standard",
          "Motion, WebGL หรือ configurator ที่เขียนขึ้นใหม่",
          "ระบบดีไซน์ที่ต่อยอดเองได้ทีหลัง",
          "วัดความเร็วและการเข้าถึงด้วยเครื่องมือจริง ไม่ใช่เดา",
          "แก้งานได้สามรอบ",
        ],
        timeline: "3 ถึง 5 สัปดาห์",
      },
      custom: {
        name: "งานอัตโนมัติ Dashboard และ AI",
        forWho: "ไม่ใช่เว็บไซต์",
        blurb:
          "ระบบเทรด บอท Telegram dashboard ในทีม สายพานคอนเทนต์ งานกลุ่มนี้ขอบเขตเป็นตัวกำหนดราคา เลยต้องคุยก่อนแล้วเสนอจริง ไม่ใช่ทายเอา",
        points: [
          "คุยขอบเขตงานฟรี แล้วเสนอราคาคงที่",
          "แบ่งทำเป็นช่วง หยุดระหว่างช่วงได้",
          "ส่งมอบพร้อมโค้ดและวิธีรัน",
        ],
        timeline: "เสนอราคาพร้อมขอบเขตงาน",
      },
    },
    includedTitle: "ได้เหมือนกันทุกแพ็กเกจ",
    included: [
      "ผมทำเองตั้งแต่ต้นจนจบ ไม่มีชั้นเอเจนซีคั่น",
      "ออกแบบจากจอมือถือก่อน",
      "โค้ดทั้งหมดส่งมอบเป็นของคุณ",
      "ติดตั้งขึ้นเซิร์ฟเวอร์ให้พร้อมใช้",
      "แก้บั๊กฟรีสองสัปดาห์หลังขึ้นจริง",
    ],
    faqTitle: "คำถามที่มักถามก่อน",
    faq: [
      {
        q: "อะไรที่ไม่รวมในราคา",
        a: "โดเมนกับโฮสต์อยู่ในชื่อคุณ โดเมนราวปีละ 500 บาท เว็บขนาดนี้โฮสต์บน Vercel ได้ฟรี ส่วนภาพถ่าย ฟอนต์ที่มีลิขสิทธิ์ และงานเขียนยาวๆ คิดแยกถ้าอยากได้",
      },
      {
        q: "จ่ายเงินยังไง",
        a: "ครึ่งแรกตอนเริ่มงาน ครึ่งหลังวันที่เว็บขึ้นจริง โอนธนาคารหรือพร้อมเพย์",
      },
      {
        q: "ส่งงานแล้วอยากแก้เพิ่มทีหลัง",
        a: "แก้ในสิ่งที่ตกลงกันไว้ ฟรีสองสัปดาห์หลังขึ้นจริง หลังจากนั้นงานเล็กคิดรายชั่วโมง ของที่เพิ่มใหม่เสนอราคาให้ดูก่อนทุกครั้ง",
      },
      {
        q: "มีแบบอยู่แล้ว เริ่มจากตรงนั้นได้ไหม",
        a: "ได้ ไฟล์ Figma หรือแค่รูปหน้าเว็บที่ชอบก็พอ ส่วนใหญ่ช่วยให้งานเร็วขึ้นด้วยซ้ำ",
      },
    ],
    ctaTitle: "ไม่แน่ใจว่าอันไหนใช่",
    ctaSub: "เล่าไอเดียคร่าวๆ มา เดี๋ยวบอกให้ว่าเข้าแพ็กเกจไหน หรือจริงๆ แล้วไม่ต้องใช้แพ็กเกจเลย",
    ctaButton: "ขอใบเสนอราคา",
    ctaSecondary: "ดูสไตล์ทั้งหมด",
  },
  caseStudy: {
    back: "กลับหน้าแรก",
    label: "เจาะลึกผลงาน",
    ctaTitle: "อยากมีระบบแบบนี้เป็นของตัวเอง?",
    ctaSub: "รับออกแบบและสร้างระบบ automation ครบวงจร ตั้งแต่เทรด AI dashboard ไปจนถึงคอนเทนต์",
    ctaButton: "ทักมาคุยกัน",
  },
  caseStudies: {
    aurum: {
      title: "AURUM",
      subtitle: "เทอร์มินัลเทรดทองอัตโนมัติ XAU/USD",
      imageAlt: "หน้าจอเทอร์มินัลเทรดของ AURUM",
      meta: [
        { k: "บทบาท", v: "ออกแบบและสร้างเองทั้งหมด" },
        { k: "Stack", v: "Python · MetaTrader 5" },
        { k: "ตลาด", v: "ทองคำ (XAU/USD)" },
        { k: "สถานะ", v: "รันอยู่จริงตอนนี้" },
      ],
      sections: [
        {
          h: "ปัญหา",
          p: "เทรดทองด้วยมือ ยังไงก็พลาด setup ตอนหลับ เผลอปิดออเดอร์ตามอารมณ์ แล้ววินัยเรื่องความเสี่ยงก็หย่อนเอาง่ายๆ ทองวิ่งข้าม session เอเชีย ลอนดอน นิวยอร์กตลอดทั้งวัน เฝ้าจอคนเดียวยังไงก็ไม่ไหว และก็ไม่ควรต้องมานั่งเฝ้าด้วย",
        },
        {
          h: "แนวทาง",
          p: "AURUM ไม่ได้ใช้กลยุทธ์เดียวทำทุกอย่าง แต่แบ่งงานให้ engines ทั้ง 12 ตัว แต่ละตัวเชี่ยวชาญ setup เฉพาะทางของตัวเอง ระบบสแกนตามจังหวะของแต่ละ session เพราะทองช่วงเอเชียนิสัยไม่เหมือนช่วงลอนดอนหรือนิวยอร์กเปิดตลาด และก่อนส่งออเดอร์ทุกไม้ สัญญาณต้องผ่านด่านเช็คความเสี่ยงแบบ real-time เสมอ",
        },
        {
          h: "รายละเอียดที่สำคัญจริง",
          p: "บอทตัดสินใจอะไร ระบบจดลง trade tape ไว้หมด เลยไม่มีทางเจอออเดอร์ปริศนาที่ตอบไม่ได้ว่ามาจากไหน มี kill switch กดปุ่มเดียวปิดทุกสถานะแล้วหยุดเทรดทันที ส่วน daily loss limit ระบบคุมเอง ไม่ต้องพึ่งวินัยคน ของเรียบๆ พวกนี้ใช้เวลาสร้างนานกว่าตัวกลยุทธ์อีก แต่ก็เป็นเหตุผลที่กล้าปล่อยให้รันจริง",
        },
        {
          h: "สถานะตอนนี้",
          p: "ตอนนี้ AURUM รันครบวงจรบน MetaTrader 5 มี dashboard ไว้มอนิเตอร์สดๆ บทเรียนใหญ่สุดจากโปรเจกต์นี้คือ ส่วนที่ยากของบอทเทรดไม่ใช่ logic จุดเข้า แต่เป็นระบบคุมความเสี่ยง การรับมือตอนระบบสะดุด และการตอบให้ได้ทุกครั้งว่าบอททำอะไรลงไป เพราะอะไร",
        },
      ],
    },
    "you-are-the-virus": {
      title: "You Are the Virus",
      subtitle: "เกมที่ให้เล่นเป็นฝ่ายผู้ร้าย",
      imageAlt: "ภาพในเกม You Are the Virus",
      meta: [
        { k: "บทบาท", v: "ออกแบบและสร้างเองทั้งหมด" },
        { k: "Engine", v: "Godot 4 · GDScript" },
        { k: "แนวเกม", v: "Side-scroll เอาตัวรอด" },
        { k: "สถานะ", v: "อยู่ช่วง playtest" },
      ],
      sections: [
        {
          h: "ไอเดีย",
          p: "เกมไวรัสส่วนใหญ่ให้เราถือวัคซีนไล่ล่า เกมนี้สลับข้าง ยื่นไวรัสให้เล่นเอง ล่องไปตามกระแสเลือดของโฮสต์ บุกเซลล์เก็บ DNA หลบเม็ดเลือดขาว แล้วกลายพันธุ์ให้แกร่งขึ้นเรื่อยๆ จนรู้ระหว่างทางว่าโฮสต์ที่บุกอยู่คือเด็กคนหนึ่ง ทุกรอบจบลงที่ทางเลือกเดิม กลายพันธุ์แล้วชนะ หรือสลายตัวเองเพื่อให้เด็กรอด",
        },
        {
          h: "แนวทาง",
          p: "หลอดเลือดเลื่อนผ่านจอไปเองตลอด แรงกดดันเลยไม่มีจังหวะให้พัก ทั้งเกมขับด้วยสามคำสั่ง บุก หลบ วิวัฒนาการ แต่ละรอบสุ่มจุดเริ่มจากปลายร่างกาย มือ เท้า จมูก หรือปาก แล้วไต่ขึ้นห้าชั้นไปหาสมอง อวัยวะแต่ละจุดมีกับดักของตัวเอง เมือกที่ทำให้ลื่นจนคุมตัวไม่อยู่ เอนไซม์ในน้ำลายที่กัดเลือดทีละนิด เส้นเลือดฝอยที่แคบจนไม่มีที่หลบ",
        },
        {
          h: "รายละเอียดที่สำคัญจริง",
          p: "ความสามารถทุกอย่างหยิบมาจากไวรัสวิทยาจริง ทั้ง glycoprotein shift, lytic burst และการซ่อนตัวแบบ endocytosis แต่ละอันมีราคาที่ต้องจ่ายกับข้อเสียของมันเอง จะได้ไม่มีสายไหนโกงเกมได้ HUD เป็นกราฟ ECG ที่เต้นตามสัญญาณชีพของโฮสต์ เสียงทั้งหมด 12 SFX กับเพลง 6 แทร็ก สร้างเองด้วย ffmpeg ส่วนเศษความทรงจำที่โผล่คั่นระหว่างด่าน ค่อยๆ เฉลยว่ากำลังฆ่าใครอยู่",
        },
        {
          h: "สถานะตอนนี้",
          p: "ตอนนี้เล่นได้ครบลูปแล้ว ตั้งแต่ฉากเปิด ผ่านด่าน เก็บเศษความทรงจำ ไปจนถึงตอนจบทั้งสองแบบ ที่เหลือคือรื้อระบบ side-scroll ทีละส่วน เสร็จส่วนไหนก็โยนเข้า playtest ทันที เป้าคือหนึ่งรอบจบใน 10-15 นาที และคุ้มพอให้กลับมาเล่นซ้ำเพื่อดูตอนจบอีกแบบ",
        },
      ],
    },
    "product-dashboard": {
      title: "Product Dashboard",
      subtitle: "ระบบหลังบ้านสินค้าและคอนเทนต์ของร้านบน Shopee",
      imageAlt: "Product Dashboard หน้าจอแคตตาล็อกกิฟฟารีนพร้อมเครื่องมือ AI",
      meta: [
        { k: "บทบาท", v: "ออกแบบและสร้างเองทั้งหมด" },
        { k: "แคตตาล็อก", v: "900+ รายการ" },
        { k: "ร้าน", v: "Shopee (กิฟฟารีน)" },
        { k: "สถานะ", v: "ใช้งานอยู่ทุกวัน" },
      ],
      sections: [
        {
          h: "ปัญหา",
          p: "ขายกิฟฟารีนบน Shopee ต้องวนลูปเดิมกับสินค้าทุกตัว เขียนคำอธิบาย หารูป ไดคัทพื้นหลัง คิดสคริปต์วิดีโอสั้น แล้วค่อยลงขาย สินค้าในแคตตาล็อกมีเป็นร้อย แต่ลงขายจริงได้แค่หยิบมือ คอขวดไม่ใช่เรื่องขายไม่ออก แต่ติดตรงผลิตคอนเทนต์ไม่ทัน จนของกองรออยู่เฉยๆ",
        },
        {
          h: "แนวทาง",
          p: "รวมแคตตาล็อกทั้งร้านไว้ที่เดียว แล้วให้ระบบรู้สถานะสินค้าทุกตัว ว่าลง Shopee แล้ว ยังไม่ได้ลง หรือเพิ่งเข้ามาใหม่จากกิฟฟารีน อยู่แถวไหนก็กดปุ่มเดียวให้ AI เติมของที่ยังขาด คำอธิบายสินค้า prompt รูป รูปไดคัทพื้นหลัง prompt วิดีโอ หรือหาสินค้าคู่ไว้ขายพ่วงกัน",
        },
        {
          h: "รายละเอียดที่สำคัญจริง",
          p: "กรองตามหมวดหมู่ ค้นด้วยชื่อหรือรหัส SKU สลับดูได้สามมุมมอง ทั้งตาราง การ์ด และแบบแยกด้าน ให้เหมาะกับงานคนละแบบ ทุกแถวมีเครื่องหมายบอกสถานะ เลยกวาดตาทีเดียวรู้เลยว่าตัวไหนครบ ตัวไหนยังขาด พอทำเสร็จก็ export เป็น CSV ในรูปแบบที่ marketplace ต้องการได้เลย",
        },
        {
          h: "สถานะตอนนี้",
          p: "ตอนนี้เป็นเครื่องมือหลักที่เปิดใช้ทุกวัน ลง Shopee ไปแล้ว 50 รายการ มีคิวรออยู่อีกชุด และเหลือในแคตตาล็อกอีกหลายร้อยรอลง บทเรียนจากงานนี้คือเครื่องมือจัดการแคตตาล็อกอยู่หรือตายที่การเก็บสถานะ ว่าอะไรทำแล้วอะไรยังค้าง มากกว่าความเก่งของ AI ที่เขียนคำโฆษณาให้",
        },
      ],
    },
    affiliate: {
      title: "Affiliate",
      subtitle: "สินค้าตัวเดียว กระจายครบทุกแพลตฟอร์ม",
      imageAlt: "หน้าจอ dashboard ของ Affiliate Publisher",
      meta: [
        { k: "บทบาท", v: "ออกแบบและสร้างเองทั้งหมด" },
        { k: "Stack", v: "FastAPI · React · Playwright" },
        { k: "แพลตฟอร์ม", v: "YouTube · TikTok · Shopee · Lemon8" },
        { k: "สถานะ", v: "ใช้งานอยู่ทุกวัน" },
      ],
      sections: [
        {
          h: "ปัญหา",
          p: "คอนเทนต์ affiliate จะได้เงินก็ต่อเมื่อไปโผล่ครบทุกที่ แต่ลงคลิปเดียวกันเองทั้ง YouTube TikTok Shopee Shorts และ Lemon8 แปลว่าต้องเขียน caption ใหม่สี่รอบ อัปวิดีโอซ้ำสี่รอบ แล้วสุดท้ายก็จำไม่ได้ว่าตัวไหนลงไปแล้วบ้าง",
        },
        {
          h: "แนวทาง",
          p: "ก่อนเขียนโค้ดบรรทัดแรก ไปไล่ดูก่อนว่าแต่ละแพลตฟอร์มยอมให้ทำอะไรได้จริง YouTube มี API อัปโหลดตรงๆ ส่วน TikTok ต้องขออนุมัติแอปกับโควตา ขณะที่ Shopee Shorts กับ Lemon8 โพสต์จากคอมไม่ได้เลย ระบบเลยวางเป็น semi-automation แบบตรงไปตรงมา ตรงไหนมี API ก็ใช้ API ตรงไหนไม่มีก็ใช้ browser automation ส่วนตรงที่บังคับให้โพสต์ในแอป ระบบเตรียมของให้พร้อมแล้วค่อยกดโพสต์เองบนมือถือ ความต่างพวกนี้เก็บไว้ใน adapter ของแต่ละแพลตฟอร์ม ไม่ปนกับส่วนอื่น",
        },
        {
          h: "รายละเอียดที่สำคัญจริง",
          p: "หน้าจอที่ใช้จริงคือบอท Telegram เพราะเจอสินค้าตอนไถมือถือ วางลิงก์ Shopee ส่งรูปตามเข้าไป แล้วบอทตอบกลับมาให้ครบ ทั้ง caption แยกตามแพลตฟอร์ม prompt วิดีโอ ไปจนถึงไซส์ที่ควรใส่ ที่อ่านมาจากตารางไซส์ของสินค้าเอง ส่วน dashboard บนคอมไว้ดูภาพรวม มีคิวไล่สถานะให้ทีละขั้น รอ asset รอวิดีโอ พร้อมโพสต์ โพสต์แล้ว",
        },
        {
          h: "สถานะตอนนี้",
          p: "หลังบ้านเป็น FastAPI ต่อคิวงานไว้ใน SQLite หน้าเว็บเป็น React ใช้ Gemini เขียนคำโฆษณากับสร้างรูป รันใช้งานอยู่ทุกวัน ข้อจำกัดที่น่าสนใจของงานนี้คือต้องยอมรับให้ได้ก่อนว่าปุ่มเดียวจบครบทุกแพลตฟอร์มเป็นไปไม่ได้ แล้วออกแบบของที่ยังประหยัดเวลาไปได้ทั้งบ่ายแทน",
        },
      ],
    },
    "jarvis-moon": {
      title: "Moon",
      subtitle: "กองยาน AI ที่สั่งงานด้วยเสียง",
      imageAlt: "MOON FLEET ระบบสั่งการ AI หลาย agent",
      meta: [
        { k: "บทบาท", v: "ออกแบบและสร้างเองทั้งหมด" },
        { k: "กองยาน", v: "agent เฉพาะทาง 11 ตัว" },
        { k: "ช่องทาง", v: "เสียง · Telegram · เว็บ" },
        { k: "สถานะ", v: "รันเองตั้งแต่เปิดเครื่อง" },
      ],
      sections: [
        {
          h: "ไอเดีย",
          p: "ผู้ช่วย AI ที่ตอบทีละคำถาม ทิ้งข้อดีใหญ่สุดของ agent ไปเปล่าๆ เพราะหลายตัวแยกกันลุยพร้อมกันได้ Moon เลยวางตัวเป็นผู้บัญชาการ ถือเป้าหมายไว้แล้วกระจายงานให้ลูกทีม scout ออกไปหา researcher อ่านแล้วสรุป builder ลงมือสร้าง critic คอยจับผิด scheduler ดูให้ทุกอย่างเดินต่อไม่สะดุด",
        },
        {
          h: "แนวทาง",
          p: "Claude agents เฉพาะทาง 11 ตัวทำงานอยู่หลัง pipeline สี่สาย research, build, intake และโหมด auto ที่เลือกงานเองได้ ทุกงานที่สั่งไปโผล่บน mission queue แบบสดๆ เลยเฝ้าดูและสั่งแก้กลางทางได้ ไม่ต้องปล่อยแล้วภาวนา agent แต่ละตัวรับงานเดียวและมี prompt แคบๆ ของตัวเอง เหลือแค่ commander ที่ถือ context ทั้งหมดไว้",
        },
        {
          h: "รายละเอียดที่สำคัญจริง",
          p: "ประตูหน้าของระบบคือเสียง พูดว่า เห้ มูน แล้ววงกลมเล็กๆ จะโผล่ขอบบนจอแบบ Siri คอยฟัง ตอบ แล้วเปิดบทสนทนาค้างไว้จนกว่าจะบอกว่าพอ ตัวจับ wake word ทำงานแบบ offline ระบบถอดเสียงรองรับภาษาไทย และไม่ว่าจะเข้าทางเสียง Telegram หรือหน้าเว็บ ก็คุยกับสมองก้อนเดียวกัน ระบบเดียว สามประตู ไม่ต้องเขียน logic ซ้ำ",
        },
        {
          h: "สถานะตอนนี้",
          p: "ตอนนี้ขึ้นเองพร้อมเครื่องตั้งแต่ตอน login ทั้งกองยาน เซิร์ฟเวอร์เสียง บอท Telegram และงานตามเวลาอย่าง morning brief สรุปให้ฟังทุกเช้า เป็นเครื่องมือที่ผมใช้ขับงานอื่นทั้งหมด รวมถึงเว็บนี้ด้วย",
        },
      ],
    },
  },
};

export const dictionary: Record<Locale, typeof en> = { en, th };

/** ids of the projects that have a case-study page (see `projects.ts`) */
export type CaseStudySlug = keyof typeof en.caseStudies;

export const caseStudySlugs = Object.keys(en.caseStudies) as CaseStudySlug[];

export function isCaseStudySlug(value: string): value is CaseStudySlug {
  return value in en.caseStudies;
}
