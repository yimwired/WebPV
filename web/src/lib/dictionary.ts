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
    about: "เกี่ยวกับ",
    labs: "Labs",
    contact: "ติดต่อ",
    cta: "ติดต่อผม",
  },
  hero: {
    badge: "สร้างบอท เครื่องมือ และคอนเทนต์",
    greeting: "สวัสดี ผม",
    headline: "ผมสร้างของที่ใช้งานได้จริง",
    sub: "ระบบเทรด, AI assistant, dashboard และคอนเทนต์ — ออกแบบ สร้าง และส่งมอบครบจบตั้งแต่ต้นจนใช้งานจริง ทั้งหมดรวมอยู่ที่นี่",
    viewWork: "ดูผลงาน",
    contact: "ติดต่อผม",
  },
  work: {
    label: "ผลงานที่คัดมา",
    title: "สิ่งที่ผมสร้างและส่งมอบแล้ว",
    caseStudy: "เจาะลึกผลงาน",
  },
  about: {
    label: "เกี่ยวกับผม",
    title: "ผมเปลี่ยนไอเดียให้เป็นระบบที่ทำงานได้จริง",
    p1: "ผมฟิล์ม — สร้างบอทเทรด, AI assistant, dashboard และระบบผลิตคอนเทนต์ ชอบดูแลโปรเจกต์ตั้งแต่สเก็ตช์แรกจนถึงวันที่มันรันอยู่บน production",
    p2: "หลักการทำงานของผมคือส่งมอบให้ได้ก่อน: เริ่มเล็ก ใช้ได้จริง แล้วค่อยพัฒนาต่อเนื่อง ไม่ว่าจะเป็นระบบเทรดอัตโนมัติหรือระบบทำวิดีโอสั้น เป้าหมายเดียวกัน — ทำให้เวิร์กก่อน แล้วทำให้ดีขึ้น",
    stats: [
      { value: "4+", label: "โปรเจกต์ที่รันอยู่" },
      { value: "ครบวงจร", label: "ออกแบบ → สร้าง → ส่งมอบ" },
      { value: "AI-first", label: "คิดแบบ automation" },
    ],
  },
  footer: {
    label: "ติดต่อ",
    title: "มาสร้างอะไรด้วยกัน",
    sub: "มีโปรเจกต์ อยากชวนทำงาน หรือแค่อยากทัก — ส่งมาได้เลย ผมอ่านทุกฉบับ",
    rights: "สงวนลิขสิทธิ์",
    builtWith: "สร้างด้วย Next.js · Tailwind · Framer Motion",
  },
  notFound: {
    title: "หน้านี้ยังไม่มีอยู่จริง (ตอนนี้)",
    sub: "เหมือนไอเดียอีกครึ่งใน backlog ของผม — สักวันอาจได้สร้าง ระหว่างนี้ของที่มีอยู่จริงทั้งหมดรออยู่ที่หน้าแรก",
    home: "กลับหน้าแรก",
    labs: "แวะดู The Lab",
  },
  aurum: {
    back: "กลับหน้าแรก",
    label: "เจาะลึกผลงาน",
    title: "AURUM",
    subtitle: "ระบบเทรดทองอัตโนมัติ XAU/USD",
    meta: [
      { k: "บทบาท", v: "ออกแบบ + สร้างคนเดียว" },
      { k: "Stack", v: "Python · MetaTrader 5" },
      { k: "ตลาด", v: "ทองคำ (XAU/USD)" },
      { k: "สถานะ", v: "รันจริงอยู่ตอนนี้" },
    ],
    sections: [
      {
        h: "ปัญหา",
        p: "เทรดทองด้วยมือแปลว่าพลาด setup ตอนหลับ ปิดออเดอร์ตามอารมณ์ และใช้กฎความเสี่ยงไม่สม่ำเสมอ ทองวิ่งตลอดทั้ง session เอเชีย ลอนดอน นิวยอร์ก — คนเดียวเฝ้าไม่ไหว และไม่ควรต้องเฝ้า",
      },
      {
        h: "แนวทาง",
        p: "แทนที่จะใช้กลยุทธ์เดียวทำทุกอย่าง AURUM รัน 12 engines แยกหน้าที่ — แต่ละตัวสแกนหา setup เฉพาะทางที่มันถนัด การสแกนรู้จัก session เพราะทองในช่วงเอเชียพฤติกรรมต่างจากตอนลอนดอนหรือนิวยอร์กเปิด ทุกสัญญาณต้องผ่านการเช็คความเสี่ยง real-time ก่อนส่งออเดอร์แม้แต่ไม้เดียว",
      },
      {
        h: "รายละเอียดที่สำคัญจริง",
        p: "ทุกการตัดสินใจของบอทถูกบันทึกลง trade tape — ไม่มีทางมีออเดอร์ปริศนา มี kill switch ปิดทุกสถานะและหยุดเทรดได้ในคลิกเดียว daily loss limit ถูกบังคับโดยระบบ ไม่ใช่ด้วยวินัยคน ชิ้นส่วนไม่หวือหวาพวกนี้ใช้เวลานานกว่าตัวกลยุทธ์ — และมันคือเหตุผลที่กล้าปล่อยให้รันจริง",
      },
      {
        h: "สถานะตอนนี้",
        p: "AURUM รันครบวงจรบน MetaTrader 5 พร้อม terminal dashboard สำหรับมอนิเตอร์สด บทเรียนใหญ่สุด: ส่วนที่ยากของบอทเทรดไม่ใช่ logic จุดเข้า — แต่คือระบบจัดการความเสี่ยง, failure states และการรู้แน่ชัดว่าระบบทำอะไรไปเพราะอะไร",
      },
    ],
    ctaTitle: "อยากได้ระบบแบบนี้บ้าง?",
    ctaSub: "ผมออกแบบและสร้าง automation ครบวงจร — เทรด, AI, dashboard, คอนเทนต์",
    ctaButton: "ติดต่อผม",
  },
};

export const dictionary: Record<Locale, typeof en> = { en, th };
