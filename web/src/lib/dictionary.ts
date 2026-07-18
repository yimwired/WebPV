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
  aurum: {
    back: "Back to home",
    label: "Case study",
    title: "AURUM",
    subtitle: "Automated XAU/USD trading terminal",
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
    ctaTitle: "Want a system built like this?",
    ctaSub: "I design and build automation end to end — trading, AI, dashboards, content.",
    ctaButton: "Get in touch",
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
  aurum: {
    back: "กลับหน้าแรก",
    label: "เจาะลึกผลงาน",
    title: "AURUM",
    subtitle: "เทอร์มินัลเทรดทองอัตโนมัติ XAU/USD",
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
    ctaTitle: "อยากมีระบบแบบนี้เป็นของตัวเอง?",
    ctaSub: "รับออกแบบและสร้างระบบ automation ครบวงจร ตั้งแต่เทรด AI dashboard ไปจนถึงคอนเทนต์",
    ctaButton: "ทักมาคุยกัน",
  },
};

export const dictionary: Record<Locale, typeof en> = { en, th };
