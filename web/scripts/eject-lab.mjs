// Turn one Lab demo into a standalone client project.
//
//   node scripts/eject-lab.mjs counter ../../clients/somchai-cafe
//
// A client picks a style from The Lab and then it has to become their site, on
// their repo, on their domain. Copying this repo would hand them thirteen demos
// they did not buy plus a portfolio that is not theirs; starting from a blank
// `create-next-app` means rebuilding the config and the tokens by hand on every
// job. This walks the demo's own import graph, takes only the files it actually
// reaches, and writes a project that installs and runs.
//
// What comes out is deliberately plain: no Lab switcher, no gallery, no
// dictionary of two languages unless the demo itself used one. The client's
// site should not carry the machinery of the showroom it came from.
import { mkdir, readFile, writeFile, copyFile, access } from "node:fs/promises";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const WEB = fileURLToPath(new URL("..", import.meta.url));
const SRC = join(WEB, "src");

const [slug, destArg] = process.argv.slice(2);

if (!slug || !destArg) {
  console.error("usage: node scripts/eject-lab.mjs <lab-slug> <destination>");
  console.error("   eg: node scripts/eject-lab.mjs counter ../../clients/somchai-cafe");
  process.exit(1);
}

const DEST = resolve(process.cwd(), destArg);

// ── the import graph ─────────────────────────────────────────────────────

/** Packages that ship with the project shell and are not worth detecting. */
const SHELL_DEPS = new Set(["react", "react-dom", "next"]);

/** Bare imports that are part of a package already listed under another name. */
const DEP_ALIASES = {
  "next/image": null,
  "next/link": null,
  "next/font/google": null,
  "next/dynamic": null,
  "next/navigation": null,
};

const exists = (path) => access(path).then(() => true, () => false);

/**
 * Resolves an import specifier to a file on disk.
 *
 * Only `@/` and relative paths resolve — a bare specifier is a package, and is
 * collected as a dependency instead.
 */
async function resolveImport(spec, fromFile) {
  let base;
  if (spec.startsWith("@/")) base = join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(fromFile), spec);
  else return null;

  for (const candidate of [base, `${base}.tsx`, `${base}.ts`, join(base, "index.tsx"), join(base, "index.ts")]) {
    if (await exists(candidate)) {
      const stat = candidate === base && !/\.[jt]sx?$/.test(candidate);
      if (!stat) return candidate;
    }
  }
  return null;
}

const IMPORT_RE = /(?:^|\n)\s*(?:import|export)\s[^;]*?from\s+["']([^"']+)["']/g;
const DYNAMIC_RE = /import\(\s*["']([^"']+)["']\s*\)/g;

/** Public files a source file points at: "/planet/earth-day.webp" and friends. */
const ASSET_RE = /["'`](\/[A-Za-z0-9_\-./]+\.(?:webp|png|jpe?g|svg|gif|mp4|webm|html|json|woff2?|glb|hdr))["'`]/g;

const files = new Set();
const packages = new Set();
const assets = new Set();

async function walk(file) {
  if (files.has(file)) return;
  files.add(file);

  const source = await readFile(file, "utf8");

  const specs = [
    ...[...source.matchAll(IMPORT_RE)].map((m) => m[1]),
    ...[...source.matchAll(DYNAMIC_RE)].map((m) => m[1]),
  ];

  for (const spec of specs) {
    const resolved = await resolveImport(spec, file);
    if (resolved) {
      await walk(resolved);
      continue;
    }
    if (spec.startsWith("@/") || spec.startsWith(".")) {
      console.warn(`  ! could not resolve ${spec} from ${relative(WEB, file)}`);
      continue;
    }
    if (spec in DEP_ALIASES) continue;
    // "@react-three/drei" keeps both segments; "three/webgpu" keeps only "three"
    const pkg = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
    if (!SHELL_DEPS.has(pkg)) packages.add(pkg);
  }

  for (const [, asset] of source.matchAll(ASSET_RE)) assets.add(asset);
}

const entry = join(SRC, "components", "labs", `${slug}-demo.tsx`);
const standalone = join(WEB, "public", "lab-demos", `${slug}.html`);

// Sable and Meridian are single HTML documents, not React pages, and a client
// who picks one should get exactly that: one file they can open and edit. A
// Next project around it would add an install, a build and a framework to
// maintain for a page that already works on its own.
if (!(await exists(entry)) && (await exists(standalone))) {
  await mkdir(DEST, { recursive: true });
  await copyFile(standalone, join(DEST, "index.html"));

  const labsSource = await readFile(join(SRC, "lib", "labs.ts"), "utf8");
  const name = labsSource.match(new RegExp(`slug: "${slug}",\s*\n\s*name: "([^"]+)"`))?.[1] ?? slug;

  await writeFile(
    join(DEST, "README.md"),
    `# ${name}

สไตล์ที่ลูกค้าเลือกคือ **${name}** ซึ่งเป็นหน้าเว็บไฟล์เดียว ไม่ใช้ framework
ไม่ต้อง build ไม่ต้อง install อะไรเลย

## แก้งาน

เปิด \`index.html\` แก้ข้อความกับสีในไฟล์นั้นได้ตรงๆ แล้วเปิดในเบราว์เซอร์ดูผล

> ต้นฉบับของสไตล์นี้อยู่นอก repo portfolio (ดู memory \`labs-static-demos\`)
> ไฟล์นี้เป็นสำเนาที่แยกออกมาให้ลูกค้าแล้ว แก้ที่นี่ได้เลย ไม่ต้องกังวลว่าจะทับของเดิม

## ขึ้นออนไลน์

ลากทั้งโฟลเดอร์ขึ้นโฮสต์ static ที่ไหนก็ได้ หรือ

\`\`\`powershell
npx wrangler deploy --assets .
\`\`\`

## เช็คก่อนส่งมอบ

- [ ] แก้ \`<title>\` กับ meta description ที่หัวไฟล์
- [ ] แทนข้อความตัวอย่างให้หมด
- [ ] เบอร์โทร ลิงก์ แผนที่ ชี้ไปที่จริง
- [ ] เปิดในมือถือจริงหนึ่งรอบ
`,
    "utf8",
  );

  console.log(`
  ${slug} is a standalone HTML page, so that is what came out: one file.

  written to ${DEST}
`);
  process.exit(0);
}

if (!(await exists(entry))) {
  console.error(`no demo at ${relative(WEB, entry)} - check the slug against src/lib/labs.ts`);
  process.exit(1);
}

console.log(`ejecting ${slug}`);
await walk(entry);

// The static demos load their document from /public/lab-demos; the frame takes
// the filename as a prop, so it never appears as a literal in the frame itself.
const framed = [...files].some((f) => f.endsWith("static-lab-frame.tsx"));
if (framed) assets.add(`/lab-demos/${slug}.html`);

// ── the project shell ────────────────────────────────────────────────────

const labs = await readFile(join(SRC, "lib", "labs.ts"), "utf8");
const nameMatch = labs.match(new RegExp(`slug: "${slug}",\\s*\\n\\s*name: "([^"]+)"`));
const labName = nameMatch?.[1] ?? slug;

const usesLocale = [...files].some((f) => f.endsWith(join("lib", "i18n.tsx")));
const usesThree = [...packages].some((p) => p === "three" || p.startsWith("@react-three"));

// globals.css pulls packages of its own, and they are invisible to a walk over
// the TypeScript imports: `tw-animate-css` and `shadcn/tailwind.css` are both
// `@import` lines in the stylesheet. Miss them and the build dies on the first
// line of CSS, which is exactly what happened the first time this ran.
const globalsCss = await readFile(join(SRC, "app", "globals.css"), "utf8");
for (const [, spec] of globalsCss.matchAll(/@import\s+["']([^"']+)["']/g)) {
  if (spec.startsWith(".") || spec.startsWith("/")) continue;
  const pkg = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
  if (pkg !== "tailwindcss") packages.add(pkg);
}

// Versions come from this repo's package.json rather than being pinned here, so
// an ejected project starts on the same versions the demo was proved against.
const own = JSON.parse(await readFile(join(WEB, "package.json"), "utf8"));
const version = (name) => own.dependencies[name] ?? own.devDependencies[name] ?? "latest";

const dependencies = Object.fromEntries(
  [...SHELL_DEPS, ...packages].sort().map((name) => [name, version(name)]),
);

const pkg = {
  name: DEST.split(/[\\/]/).filter(Boolean).pop(),
  version: "0.1.0",
  private: true,
  scripts: {
    dev: "next dev",
    build: "next build",
    lint: "eslint",
  },
  dependencies,
  devDependencies: {
    "@tailwindcss/postcss": version("@tailwindcss/postcss"),
    "@types/node": version("@types/node"),
    "@types/react": version("@types/react"),
    "@types/react-dom": version("@types/react-dom"),
    ...(usesThree ? { "@types/three": version("@types/three") } : {}),
    eslint: version("eslint"),
    "eslint-config-next": version("eslint-config-next"),
    tailwindcss: version("tailwindcss"),
    typescript: version("typescript"),
  },
};

const NEXT_CONFIG = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },

  // Static export: this site has no route handlers and nothing to render per
  // request, so it ships as plain files. Any static host serves it.
  output: "export",

  // Required by \`output: "export"\` - there is no server to resize on request.
  images: { unoptimized: true },
};

export default nextConfig;
`;

const TSCONFIG = {
  compilerOptions: {
    target: "ES2017",
    lib: ["dom", "dom.iterable", "esnext"],
    allowJs: true,
    skipLibCheck: true,
    strict: true,
    noEmit: true,
    esModuleInterop: true,
    module: "esnext",
    moduleResolution: "bundler",
    resolveJsonModule: true,
    isolatedModules: true,
    jsx: "preserve",
    incremental: true,
    plugins: [{ name: "next" }],
    paths: { "@/*": ["./src/*"] },
  },
  include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  exclude: ["node_modules"],
};

const POSTCSS = `const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;
`;

const GITIGNORE = `node_modules
.next
out
.env*.local
.DS_Store
.wrangler
`;

const demoImport = `@/components/labs/${slug}-demo`;
const demoExport = `${labName.replace(/[^A-Za-z0-9]/g, "")}Demo`;

// The real export name is whatever the demo file declares; read it rather than
// guessing from the lab's display name ("Deep Space" exports SpaceDemo).
const entrySource = await readFile(entry, "utf8");
const exportName = entrySource.match(/export function (\w+)/)?.[1] ?? demoExport;

const LAYOUT = `import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
${usesLocale ? 'import { LocaleProvider } from "@/lib/i18n";\n' : ""}import "./globals.css";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// TODO ก่อนส่งมอบ: ชื่อกับคำอธิบายนี้ขึ้น Google และขึ้นตอนแชร์ลิงก์
export const metadata: Metadata = {
  title: "ชื่อร้าน",
  description: "อธิบายสั้นๆ ว่าร้านทำอะไร ใครควรเข้ามา",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={\`dark \${geistSans.variable} \${geistMono.variable} h-full antialiased\`}>
      <body className="h-full">${usesLocale ? "\n        <LocaleProvider>{children}</LocaleProvider>" : "\n        {children}"}
      </body>
    </html>
  );
}
`;

/**
 * The page comes from the demo's own route, not from a template.
 *
 * Some demos take props that only the route knows how to supply — Contour is
 * handed a font class and family loaded with `next/font` — so a generated
 * `<Demo />` fails to type check. Lifting the route and stripping the parts
 * that belong to the showroom keeps whatever wiring the demo actually needs.
 */
async function buildPage() {
  const routeFile = join(SRC, "app", "labs", slug, "page.tsx");
  if (!(await exists(routeFile))) {
    return `import { ${exportName} } from "${demoImport}";

export default function Home() {
  return <${exportName} />;
}
`;
  }

  let route = await readFile(routeFile, "utf8");

  // the switcher is showroom furniture, and metadata lives in the layout here
  route = route
    .replace(/import \{ LabSwitcher \} from "[^"]+";\n/, "")
    .replace(/\s*<LabSwitcher \/>\n/, "\n")
    .replace(/import type \{ Metadata \} from "next";\n/, "")
    .replace(/export const metadata: Metadata = \{[\s\S]*?\n\};\n\n?/, "");

  return route;
}

const PAGE = await buildPage();

const README = `# ${labName}

เว็บนี้แยกออกมาจาก The Lab ของ Film ด้วย \`scripts/eject-lab.mjs\`
ตัวเลือกที่ลูกค้าเลือกคือสไตล์ **${labName}**

## รันเครื่องตัวเอง

\`\`\`powershell
npm install
npm run dev     # http://localhost:3000
\`\`\`

## ขึ้นออนไลน์

\`\`\`powershell
npm run build   # ได้ไฟล์ static ในโฟลเดอร์ out/
\`\`\`

โฟลเดอร์ \`out/\` เอาไปวางที่ไหนก็ได้ที่รับไฟล์ static (Cloudflare Workers,
Netlify, GitHub Pages) ไม่ต้องมีเซิร์ฟเวอร์ ไม่มีค่ารันรายเดือน

## แก้เนื้อหาตรงไหน

| อยากแก้ | ไฟล์ |
|---|---|
| ข้อความทั้งหมดในหน้า | \`src/components/labs/${slug}-demo.tsx\` |
| ชื่อเว็บ คำอธิบายตอนแชร์ | \`src/app/layout.tsx\` |
| รูป | \`public/\` แล้วอ้างด้วย path ที่ขึ้นต้น \`/\` |
${usesLocale ? "| ข้อความไทย/อังกฤษ | `src/lib/dictionary.ts` |\n" : ""}
## เช็คก่อนส่งมอบ

- [ ] เปลี่ยน \`title\` กับ \`description\` ใน \`src/app/layout.tsx\` (ยังเป็นคำว่า "ชื่อร้าน" อยู่)
- [ ] แทนข้อความตัวอย่างในหน้าให้หมด ค้นคำว่า TODO ในโปรเจกต์
- [ ] เปลี่ยนรูปใน \`public/\` เป็นของลูกค้า
- [ ] เบอร์โทร ลิงก์โซเชียล แผนที่ ชี้ไปที่จริง
- [ ] \`npm run build\` ผ่าน
- [ ] เปิดในมือถือจริงหนึ่งรอบ ไม่ใช่แค่ย่อหน้าต่างเบราว์เซอร์
`;

const WRANGLER = `{
  "name": "${pkg.name}",
  "compatibility_date": "2026-09-08",
  "assets": { "directory": "./out" }
}
`;

// ── write it out ─────────────────────────────────────────────────────────

async function write(rel, contents) {
  const path = join(DEST, rel);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents, "utf8");
}

for (const file of files) {
  const rel = relative(SRC, file);
  const path = join(DEST, "src", rel);
  await mkdir(dirname(path), { recursive: true });
  await copyFile(file, path);
}

for (const asset of assets) {
  const from = join(WEB, "public", asset);
  if (!(await exists(from))) {
    console.warn(`  ! asset not found, skipped: ${asset}`);
    continue;
  }
  const to = join(DEST, "public", asset);
  await mkdir(dirname(to), { recursive: true });
  await copyFile(from, to);
}

await write("src/app/globals.css", globalsCss);
await write("src/app/layout.tsx", LAYOUT);
await write("src/app/page.tsx", PAGE);
await write("package.json", JSON.stringify(pkg, null, 2) + "\n");
await write("next.config.ts", NEXT_CONFIG);
await write("tsconfig.json", JSON.stringify(TSCONFIG, null, 2) + "\n");
await write("postcss.config.mjs", POSTCSS);
await write(".gitignore", GITIGNORE);
await write("wrangler.jsonc", WRANGLER);
await write("README.md", README);

console.log(`
  ${files.size} source files, ${assets.size} assets
  packages: ${[...packages].sort().join(", ") || "none beyond the shell"}
  written to ${DEST}

  next:
    cd ${destArg}
    npm install
    npm run dev
`);
