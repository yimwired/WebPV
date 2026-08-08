// ─────────────────────────────────────────────────────────────
//  UI copy in both languages — EDIT THIS to change site text.
//  แก้ข้อความบนเว็บ (ทั้ง EN และไทย) ที่ไฟล์นี้ไฟล์เดียว
//  Project names/descriptions live in `projects.ts`.
// ─────────────────────────────────────────────────────────────

export type Locale = "en" | "th";

const en = {
  nav: {
    work: "Work",
    about: "About",
    labs: "Labs",
    contact: "Contact",
    cta: "Get in touch",
  },
  hero: {
    badge: "Builder of bots, tools & content",
    greeting: "Hi, I'm",
    headline: "I build things that ship.",
    sub: "Trading systems, AI assistants, dashboards, and content — designed, built and shipped end to end. This is where it all lives.",
    viewWork: "View my work",
    contact: "Get in touch",
  },
  work: {
    label: "Selected work",
    title: "Things I've built & shipped",
    caseStudy: "Case study",
  },
  about: {
    label: "About",
    title: "I turn ideas into working systems.",
    p1: "I'm Film — I build trading bots, AI assistants, dashboards and content pipelines. I like owning a project from the first sketch to the thing running in production.",
    p2: "My default is to ship: small, real, and improving over time. Whether it's an automated strategy or a short-form video system, the goal is the same — make it work, then make it better.",
    stats: [
      { value: "4+", label: "Active projects" },
      { value: "End-to-end", label: "Design → build → ship" },
      { value: "AI-first", label: "Automation mindset" },
    ],
  },
  footer: {
    label: "Contact",
    title: "Let's build something.",
    sub: "Got a project, a collaboration, or just want to say hi? My inbox is open.",
    rights: "All rights reserved.",
    builtWith: "Built with Next.js · Tailwind · Framer Motion",
  },
  notFound: {
    title: "This page doesn't exist. Yet.",
    sub: "Like half the ideas in my backlog — it might get built someday. Meanwhile, everything that does exist lives on the home page.",
    home: "Back to home",
    labs: "Visit The Lab",
  },
  // Chrome shared by every case-study page.
  caseStudy: {
    back: "Back to home",
    label: "Case study",
    ctaTitle: "Want a system built like this?",
    ctaSub: "I design and build automation end to end — trading, AI, dashboards, content.",
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
          p: "Trading gold manually means missing setups while you sleep, exiting on emotion, and applying risk rules inconsistently. Gold moves around the clock across Asia, London and New York sessions — a human can't watch all of them, and shouldn't have to.",
        },
        {
          h: "The approach",
          p: "Instead of one strategy trying to do everything, AURUM runs 12 focused engines — each one scans for a single setup type it's good at. Scanning is session-aware, because gold behaves differently in Asia than it does when London or New York opens. Every signal must pass real-time risk checks before a single order is placed.",
        },
        {
          h: "The details that matter",
          p: "Every decision the bot makes is logged to a trade tape, so there's never a mystery position. A kill switch flattens everything and halts trading with one action. Daily loss limits are enforced by the system, not by discipline. These unglamorous pieces took longer than the strategies — and they're what makes it trustworthy enough to run live.",
        },
        {
          h: "Where it is now",
          p: "AURUM runs end to end on MetaTrader 5 with a live terminal dashboard for monitoring. The biggest lesson: the hard part of a trading bot isn't the entry logic — it's risk plumbing, failure states, and knowing exactly what the system did and why.",
        },
      ],
    },
    "you-are-the-virus": {
      title: "You Are the Virus",
      subtitle: "A game where the villain is you",
      imageAlt: "You Are the Virus — gameplay",
      meta: [
        { k: "Role", v: "Design + build, solo" },
        { k: "Engine", v: "Godot 4 · GDScript" },
        { k: "Genre", v: "Side-scroll survival" },
        { k: "Status", v: "In playtest" },
      ],
      sections: [
        {
          h: "The idea",
          p: "Most virus games hand you the cure. This one hands you the virus. You drift through a host's bloodstream, infect cells for DNA, dodge the immune system and evolve — and somewhere along the way you learn the host is a child. Every run ends on the same choice: mutate and win, or self-destruct so the kid lives.",
        },
        {
          h: "The approach",
          p: "The vessel scrolls past on its own, so the pressure never lets up. Three verbs carry the whole game: infect, evade, evolve. A run starts at a random peripheral entry — hand, foot, nose or mouth — then climbs five tiers of the body toward the brain, and every body part brings its own hazard: mucus that makes you slide, saliva enzymes that chip away at you, capillaries too narrow to hide in.",
        },
        {
          h: "The details that matter",
          p: "The abilities come from real virology — glycoprotein shift, lytic burst, endocytosis hiding — and each one costs DNA and carries a trade-off, so no build cheeses the game. The HUD is an ECG that reacts to the host's vitals, the audio (12 SFX, 6 tracks) is generated procedurally, and memory fragments drop between levels to reveal exactly who you're killing.",
        },
        {
          h: "Where it is now",
          p: "The full loop plays end to end — intro, levels, fragments, both endings. The side-scroll rework is going in system by system, and each piece heads straight into playtest. The target is a 10–15 minute run worth replaying for the other ending.",
        },
      ],
    },
    "product-dashboard": {
      title: "Product Dashboard",
      subtitle: "Product & content ops for a Shopee store",
      imageAlt: "Product Dashboard — Giffarine catalog with AI content tools",
      meta: [
        { k: "Role", v: "Design + build, solo" },
        { k: "Catalog", v: "900+ items" },
        { k: "Store", v: "Shopee (Giffarine)" },
        { k: "Status", v: "In daily use" },
      ],
      sections: [
        {
          h: "The problem",
          p: "Running a Giffarine store on Shopee means the same loop for every product: write the description, find an image, cut the background out, script a short video, list it, repeat. With hundreds of items in the catalog and only a fraction of them listed, the bottleneck was never selling — it was producing content fast enough to list anything at all.",
        },
        {
          h: "The approach",
          p: "One dashboard holds the whole catalog and knows where every product stands: listed on Shopee, not listed yet, or newly added from the Giffarine range. From any row, one click generates whatever that product is missing — a description, an image prompt, a background-removed cut-out, a video prompt, or a partner product to bundle it with.",
        },
        {
          h: "The details that matter",
          p: "Filter by category, search by name or SKU, and switch between three views — table, cards, split — depending on the job. Every row carries status ticks, so what's done and what's missing reads at a glance. Finished content exports as a CSV in the shape the marketplace expects.",
        },
        {
          h: "Where it is now",
          p: "It's the daily driver for the store: 50 products live on Shopee, a queue waiting behind them, hundreds more in the catalog ready to go. The lesson was that a catalog tool lives or dies on tracking state — knowing what's done — far more than on how good the AI copy is.",
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
          p: "Before writing a line of code I checked what each platform actually allows: YouTube has a real upload API, TikTok's needs app approval and quota, Shopee Shorts and Lemon8 can't be posted to from a desktop at all. So the system is honest semi-automation — API where one exists, browser automation where it doesn't, assist-manual where the platform forces you into its app. One publisher adapter per platform keeps those differences in a single place.",
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
      imageAlt: "MOON FLEET — multi-agent orchestrator",
      meta: [
        { k: "Role", v: "Design + build, solo" },
        { k: "Fleet", v: "11 specialist agents" },
        { k: "Interfaces", v: "Voice · Telegram · Web" },
        { k: "Status", v: "Running at login" },
      ],
      sections: [
        {
          h: "The idea",
          p: "An assistant that answers one question at a time throws away the best thing about agents: several of them can work at once. Moon is a commander that holds the goal and hands the work out to a fleet — a scout to find things, a researcher to read them, a builder to make something, a critic to tear it apart, a scheduler to keep it all running.",
        },
        {
          h: "The approach",
          p: "11 specialized Claude agents sit behind four pipelines — research, build, intake, and an auto mode that picks its own work. Every job lands on a live mission queue, so the fleet can be watched and corrected mid-flight instead of trusted blindly. Each agent gets one job and a narrow prompt; the commander is the only piece holding the full context.",
        },
        {
          h: "The details that matter",
          p: "Voice is the front door. Say “Hey Moon” and a small orb appears at the top of the screen, Siri-style — it listens, answers, and keeps the conversation open until you say you're done. Wake-word detection runs offline, speech-to-text handles Thai, and voice, Telegram and the web all talk to the same brain. One system, three doors, no duplicated logic.",
        },
        {
          h: "Where it is now",
          p: "It starts with the machine at login: the fleet, the voice server, the Telegram bot and scheduled jobs like a morning brief. It's the tool I use to run everything else — including this site.",
        },
      ],
    },
  },
};

const th: typeof en = {
  nav: {
    work: "ผลงาน",
    about: "รู้จักผม",
    labs: "Labs",
    contact: "ติดต่อ",
    cta: "ทักมาคุยกัน",
  },
  hero: {
    badge: "สร้างบอท · เครื่องมือ · คอนเทนต์",
    greeting: "สวัสดี ผม",
    headline: "สร้างจริง ใช้งานได้จริง",
    sub: "ตั้งแต่บอทเทรด AI assistant และ dashboard ไปจนถึงงานคอนเทนต์ ทุกชิ้นลงมือทำเองตั้งแต่สเก็ตช์แรกจนได้ใช้จริง และรวมไว้ที่นี่ให้ดูครบ",
    viewWork: "ดูผลงาน",
    contact: "ทักมาคุยกัน",
  },
  work: {
    label: "ผลงานเด่น",
    title: "งานที่เสร็จแล้ว และรันอยู่จริงทุกชิ้น",
    caseStudy: "เบื้องหลังงานนี้",
  },
  about: {
    label: "รู้จักผม",
    title: "เปลี่ยนไอเดียให้เป็นระบบที่ทำงานจริง",
    p1: "ผมชื่อฟิล์ม สร้างบอทเทรด AI assistant dashboard และระบบผลิตคอนเทนต์ ถนัดทำโปรเจกต์แบบจับเองทุกขั้น ตั้งแต่สเก็ตช์แรกยันวันที่ระบบรันอยู่บน production",
    p2: "หลักทำงานเรียบง่าย คือส่งของให้ได้ก่อน เริ่มจากเล็ก ใช้ได้จริง แล้วค่อยขัดให้ดีขึ้นเรื่อยๆ จะเป็นบอทเทรดหรือระบบทำวิดีโอสั้นก็เป้าเดียวกัน ทำให้เวิร์กก่อน แล้วค่อยทำให้เนี้ยบ",
    stats: [
      { value: "4+", label: "โปรเจกต์ที่รันอยู่จริง" },
      { value: "ครบวงจร", label: "ออกแบบ → สร้าง → ส่งมอบ" },
      { value: "AI-first", label: "คิดเป็น automation ตั้งแต่ต้น" },
    ],
  },
  footer: {
    label: "ติดต่อ",
    title: "มาสร้างอะไรสักอย่างด้วยกัน",
    sub: "มีโปรเจกต์ในใจ อยากชวนทำงาน หรือแค่แวะมาทัก ส่งเมลมาได้เลย อ่านเองทุกฉบับ",
    rights: "สงวนลิขสิทธิ์",
    builtWith: "สร้างด้วย Next.js · Tailwind · Framer Motion",
  },
  notFound: {
    title: "หน้านี้ยังไม่มีอยู่จริง อย่างน้อยก็ตอนนี้",
    sub: "เหมือนไอเดียอีกครึ่งใน backlog แหละ สักวันอาจได้เกิด แต่ตอนนี้ของจริงทั้งหมดรออยู่ที่หน้าแรก",
    home: "กลับหน้าแรก",
    labs: "แวะดู The Lab",
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
