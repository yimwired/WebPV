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
    sub: "ตั้งแต่ระบบเทรด AI assistant และ dashboard ไปจนถึงงานคอนเทนต์ — ผมออกแบบและลงมือสร้างเองทุกขั้นตอน จนถึงวันที่มันได้ทำงานจริง ทุกชิ้นรวมอยู่ที่นี่แล้ว",
    viewWork: "ดูผลงาน",
    contact: "ทักมาคุยกัน",
  },
  work: {
    label: "ผลงานเด่น",
    title: "งานที่สร้างเสร็จ และออกไปทำงานจริงแล้ว",
    caseStudy: "เจาะลึกผลงาน",
  },
  about: {
    label: "รู้จักผม",
    title: "เปลี่ยนไอเดียให้เป็นระบบที่ทำงานได้จริง",
    p1: "ผมชื่อฟิล์ม — สร้างบอทเทรด, AI assistant, dashboard และระบบผลิตคอนเทนต์ ผมชอบทำโปรเจกต์แบบจับเองตั้งแต่สเก็ตช์แรก ไปจนถึงวันที่มันรันอยู่บน production จริงๆ",
    p2: "หลักการทำงานของผมเรียบง่าย: ส่งมอบให้ได้ก่อน — เริ่มจากเล็ก ใช้งานได้จริง แล้วค่อยๆ ขัดให้ดีขึ้น ไม่ว่าจะเป็นระบบเทรดอัตโนมัติหรือระบบผลิตวิดีโอสั้น เป้าหมายเหมือนกันเสมอ ทำให้มันเวิร์กก่อน แล้วค่อยทำให้มันเยี่ยม",
    stats: [
      { value: "4+", label: "โปรเจกต์ที่รันอยู่จริง" },
      { value: "ครบวงจร", label: "ออกแบบ → สร้าง → ส่งมอบ" },
      { value: "AI-first", label: "คิดเป็น automation ตั้งแต่ต้น" },
    ],
  },
  footer: {
    label: "ติดต่อ",
    title: "มาสร้างอะไรสักอย่างด้วยกัน",
    sub: "มีโปรเจกต์ในใจ อยากชวนทำงาน หรือแค่แวะมาทักทาย — ส่งข้อความมาได้เลย ผมอ่านเองทุกฉบับ",
    rights: "สงวนลิขสิทธิ์",
    builtWith: "สร้างด้วย Next.js · Tailwind · Framer Motion",
  },
  notFound: {
    title: "หน้านี้ยังไม่มีอยู่จริง — อย่างน้อยก็ตอนนี้",
    sub: "ก็เหมือนไอเดียอีกครึ่งหนึ่งใน backlog ของผม สักวันอาจได้เกิด แต่ระหว่างนี้ งานทั้งหมดที่มีอยู่จริงรอคุณอยู่ที่หน้าแรก",
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
      { k: "สถานะ", v: "กำลังรันจริง" },
    ],
    sections: [
      {
        h: "ปัญหา",
        p: "การเทรดทองด้วยมือหมายถึงการพลาด setup ดีๆ ตอนที่คุณหลับ การปิดออเดอร์ด้วยอารมณ์ และวินัยความเสี่ยงที่ไม่เคยคงเส้นคงวา ทองวิ่งต่อเนื่องข้ามทั้ง session เอเชีย ลอนดอน และนิวยอร์ก — ไม่มีใครเฝ้าจอได้ตลอด และก็ไม่ควรมีใครต้องทำแบบนั้น",
      },
      {
        h: "แนวทาง",
        p: "แทนที่จะให้กลยุทธ์เดียวทำทุกอย่าง AURUM แบ่งงานให้ 12 engines — แต่ละตัวเชี่ยวชาญ setup เฉพาะทางของตัวเอง ระบบสแกนแบบเข้าใจ session เพราะพฤติกรรมทองช่วงเอเชียต่างจากตอนลอนดอนหรือนิวยอร์กเปิดตลาดอย่างสิ้นเชิง และทุกสัญญาณต้องผ่านด่านตรวจความเสี่ยงแบบ real-time ก่อนจะส่งออเดอร์แม้แต่ไม้เดียว",
      },
      {
        h: "รายละเอียดที่สำคัญจริง",
        p: "ทุกการตัดสินใจของบอทถูกบันทึกลง trade tape — จะไม่มีวันเจอออเดอร์ปริศนาที่ตอบไม่ได้ว่ามาจากไหน มี kill switch ที่ปิดทุกสถานะและหยุดเทรดได้ในคลิกเดียว ส่วน daily loss limit ก็เป็นระบบที่บังคับเอง ไม่ได้พึ่งวินัยของคน ชิ้นส่วนเรียบๆ พวกนี้ใช้เวลาสร้างนานกว่าตัวกลยุทธ์เสียอีก — แต่มันคือสิ่งที่ทำให้ระบบน่าเชื่อถือพอจะปล่อยให้รันจริง",
      },
      {
        h: "สถานะตอนนี้",
        p: "วันนี้ AURUM รันครบวงจรบน MetaTrader 5 พร้อม dashboard สำหรับมอนิเตอร์แบบสด บทเรียนที่ใหญ่ที่สุดจากโปรเจกต์นี้: ส่วนที่ยากของบอทเทรดไม่ใช่ logic จุดเข้า แต่เป็นระบบจัดการความเสี่ยง การรับมือ failure states และการรู้ให้ชัดว่าระบบทำอะไรลงไป เพราะอะไร",
      },
    ],
    ctaTitle: "อยากมีระบบแบบนี้เป็นของตัวเอง?",
    ctaSub: "ผมรับออกแบบและสร้างระบบ automation ครบวงจร — เทรด, AI, dashboard ไปจนถึงคอนเทนต์",
    ctaButton: "ทักมาคุยกัน",
  },
};

export const dictionary: Record<Locale, typeof en> = { en, th };
