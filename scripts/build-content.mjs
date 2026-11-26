// Turns the portfolio/ folder into website content.
//
//  - Every folder inside portfolio/ becomes a section (except "cv").
//  - Every image in a folder gets two optimized WebP copies:
//      a thumbnail for the grid and a large version for full-screen view.
//    Your original files are only READ, never changed.
//  - The first PDF found in portfolio/cv/ becomes the "Download CV" button.
//  - An optional _details.txt in a folder sets titles, captions and order.
//
// Output (all generated, safe to delete, rebuilt every time):
//   public/media/      optimized images
//   public/files/      the CV
//   src/generated/     content.json that the page reads

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = path.join(ROOT, 'portfolio');
const CV_DIR = path.join(CONTENT_DIR, 'cv');
const MEDIA_DIR = path.join(ROOT, 'public', 'media');
const FILES_DIR = path.join(ROOT, 'public', 'files');
const GENERATED_DIR = path.join(ROOT, 'src', 'generated');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.avif']);
const SIZES = {
  thumb: { width: 900, quality: 78 },
  full: { width: 2400, quality: 84 },
};
const CONCURRENCY = 4;

sharp.cache(false);

// Images that could not be read (damaged, or not really an image). Reported at the end.
const failures = [];

// ---------- helpers ----------

const slugify = (s) =>
  s
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';

// "loungeChair" -> "Lounge Chair", "tshirt-5-a" -> "Tshirt 5 A"
const titleFromFilename = (name) =>
  name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-~.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const toPosix = (p) => p.split(path.sep).join('/');

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

// _details.txt format, one line per image:
//   filename | Title | Caption (optional)
// Lines starting with # are ignored. Line order = order on the site.
async function readDetails(folder) {
  const file = path.join(folder, '_details.txt');
  if (!existsSync(file)) return new Map();
  const map = new Map();
  const lines = (await fs.readFile(file, 'utf8')).split(/\r?\n/);
  let order = 0;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const [fileName, title, ...rest] = line.split('|').map((s) => s.trim());
    if (!fileName) continue;
    map.set(fileName.toLowerCase(), {
      title: title || '',
      caption: rest.join('|').trim(),
      order: order++,
    });
  }
  return map;
}

async function runPool(items, worker) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await worker(items[i], i);
      }
    }),
  );
  return results;
}

// ---------- images ----------

async function processImage(srcPath, sectionSlug, written) {
  const buf = await fs.readFile(srcPath);
  const hash = createHash('sha1').update(buf).digest('hex').slice(0, 10);
  const base = slugify(path.parse(srcPath).name);
  const outDir = path.join(MEDIA_DIR, sectionSlug);
  await fs.mkdir(outDir, { recursive: true });

  const out = {};
  for (const [key, { width, quality }] of Object.entries(SIZES)) {
    const file = path.join(outDir, `${base}-${hash}-${key}.webp`);
    written.add(file);
    if (!existsSync(file)) {
      await sharp(buf, { limitInputPixels: false })
        .rotate() // respect camera orientation
        .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
        .webp({ quality, effort: 5 })
        .toFile(file);
    }
    out[key] = file;
  }

  const thumb = sharp(out.thumb);
  const [meta, stats] = await Promise.all([thumb.metadata(), thumb.stats()]);
  const { r, g, b } = stats.dominant;
  const [thumbSize, fullSize] = await Promise.all([fs.stat(out.thumb), fs.stat(out.full)]);

  return {
    thumb: toPosix(path.relative(path.join(ROOT, 'public'), out.thumb)),
    full: toPosix(path.relative(path.join(ROOT, 'public'), out.full)),
    width: meta.width,
    height: meta.height,
    color: `rgb(${r}, ${g}, ${b})`,
    bytes: { original: buf.length, web: thumbSize.size + fullSize.size },
  };
}

async function buildSection(folderName, config, written) {
  const folder = path.join(CONTENT_DIR, folderName);
  const details = await readDetails(folder);
  const files = (await fs.readdir(folder, { withFileTypes: true }))
    .filter((d) => d.isFile() && IMAGE_EXTS.has(path.extname(d.name).toLowerCase()))
    .map((d) => d.name);

  files.sort((a, b) => {
    const da = details.get(a.toLowerCase());
    const db = details.get(b.toLowerCase());
    if (da && db) return da.order - db.order;
    if (da) return -1;
    if (db) return 1;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

  const slug = slugify(folderName);
  const results = await runPool(files, async (fileName) => {
    const info = details.get(fileName.toLowerCase());
    try {
      const img = await processImage(path.join(folder, fileName), slug, written);
      return {
        title: info?.title || titleFromFilename(path.parse(fileName).name),
        caption: info?.caption || '',
        ...img,
      };
    } catch (err) {
      failures.push({ file: `${folderName}/${fileName}`, reason: err.message });
      return null;
    }
  });
  const items = results.filter(Boolean);

  return {
    id: slug,
    folder: folderName,
    title: config?.title || folderName,
    description: config?.description || '',
    items,
  };
}

// ---------- CV ----------

async function buildCv(written) {
  if (!existsSync(CV_DIR)) return null;
  const pdfs = (await fs.readdir(CV_DIR))
    .filter((f) => f.toLowerCase().endsWith('.pdf'))
    .sort();
  if (!pdfs.length) return null;
  if (pdfs.length > 1) {
    console.warn(`  ! More than one PDF in portfolio/cv — using "${pdfs[0]}"`);
  }
  await fs.mkdir(FILES_DIR, { recursive: true });
  const dest = path.join(FILES_DIR, pdfs[0]);
  await fs.copyFile(path.join(CV_DIR, pdfs[0]), dest);
  written.add(dest);
  return toPosix(path.relative(path.join(ROOT, 'public'), dest));
}

// ---------- cleanup of files from removed/replaced images ----------

async function removeStale(dir, keep) {
  if (!existsSync(dir)) return 0;
  let removed = 0;
  for (const entry of await fs.readdir(dir, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile()) continue;
    const file = path.join(entry.parentPath ?? entry.path, entry.name);
    if (!keep.has(file)) {
      await fs.rm(file);
      removed++;
    }
  }
  return removed;
}

// ---------- main ----------

async function main() {
  const started = Date.now();
  const site = await readJson(path.join(ROOT, 'site.config.json'));
  const configured = new Map((site.sections || []).map((s) => [s.folder.toLowerCase(), s]));

  const folders = (await fs.readdir(CONTENT_DIR, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && d.name.toLowerCase() !== 'cv' && !/^[._]/.test(d.name))
    .map((d) => d.name);

  // Sections listed in site.config.json come first, in that order; any other folder follows.
  const order = (name) => {
    const i = (site.sections || []).findIndex((s) => s.folder.toLowerCase() === name.toLowerCase());
    return i === -1 ? Infinity : i;
  };
  folders.sort((a, b) => order(a) - order(b) || a.localeCompare(b));

  const written = new Set();
  const sections = [];
  for (const folder of folders) {
    const section = await buildSection(folder, configured.get(folder.toLowerCase()), written);
    if (section.items.length) sections.push(section);
    console.log(`  ${section.title.padEnd(28)} ${section.items.length} images`);
  }
  if (failures.length) {
    console.error('\n  These files could not be read as images (damaged, or not really an image):');
    for (const f of failures) console.error(`    - portfolio/${f.file}`);
    console.error('  Re-export them as JPG or PNG, or remove them, then try again.\n');
    process.exit(1);
  }

  const cv = await buildCv(written);

  const removed =
    (await removeStale(MEDIA_DIR, written)) + (await removeStale(FILES_DIR, written));

  await fs.mkdir(GENERATED_DIR, { recursive: true });
  const { sections: _ignored, ...siteInfo } = site;
  await fs.writeFile(
    path.join(GENERATED_DIR, 'content.json'),
    JSON.stringify({ site: siteInfo, cv, sections }, null, 2),
  );

  const all = sections.flatMap((s) => s.items);
  const orig = all.reduce((n, i) => n + i.bytes.original, 0);
  const web = all.reduce((n, i) => n + i.bytes.web, 0);
  const mb = (n) => (n / 1024 / 1024).toFixed(1) + ' MB';
  console.log(
    `  Originals ${mb(orig)} -> web copies ${mb(web)}` +
      (cv ? `, CV: ${path.basename(cv)}` : ', no CV found') +
      (removed ? `, removed ${removed} old files` : '') +
      ` (${((Date.now() - started) / 1000).toFixed(1)}s)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
