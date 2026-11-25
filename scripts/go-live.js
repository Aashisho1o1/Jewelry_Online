// Publishes CMS content (never code) from this computer: check, commit to main, deploy.
import { execFile, spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import yaml from 'js-yaml';

// The CMS saves new products with a lowercase file name.
const PRODUCT = /^content\/jewelry\/([a-z]{2}\d{3,})\.md$/i;
const PAGE = /^client\/src\/content\/(home|about|settings)\.json$/;
const IMAGE = /^client\/public\/images\/jewelry\/[\w. ()-]+\.(jpe?g|png|webp)$/i;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const BIG_PRICE_CHANGE = 0.3;
const PROJECT_NAME = 'aashish-jewellers';
const SUBJECT = 'content: go live';
const LABELS = {
  name: 'Name', price: 'Price', originalPrice: 'Old price', priceMode: 'Price type', wastagePercent: 'Wastage %',
  makingCharge: 'Making charge', makingChargeType: 'Making charge is', stoneCost: 'Stone cost', weight: 'Weight',
  pricingWeightGrams: 'Weight without stones', material: 'Material', category: 'Category', inStock: 'In stock', image: 'Main photo',
};

export class GoLiveError extends Error {}

function readProduct(text) {
  const match = String(text).replace(/\r\n?/g, '\n').match(/^---\n([\s\S]*?)\n---(\n|$)/);
  if (!match) throw new Error('not a product file');
  const data = yaml.load(match[1], { schema: yaml.JSON_SCHEMA });
  if (!data || typeof data !== 'object') throw new Error('empty product file');
  return data;
}

// Windows can hold files open briefly; a leftover temp folder must not turn a good deploy into a failure.
function removeTemp(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { /* left for Windows to clean */ }
}

const imageFile = src => `client/public${src}`;

function checkProduct(code, data, imageExists) {
  const errors = [];
  const bad = message => errors.push(`${data.name || code}: ${message}`);
  if (String(data.id) !== code) bad(`product code must be ${code}. It can't be changed after saving.`);
  if (!String(data.name || '').trim()) bad('name is empty.');
  if (!data.category) bad('category is empty.');
  if (!data.material) bad('material is empty.');
  if (!(Number(data.price) >= 500 && Number(data.price) <= 5000000)) bad('sell price must be between NPR 500 and 5,000,000.');
  if (!(Number(data.wastagePercent || 0) >= 0 && Number(data.wastagePercent || 0) <= 50)) bad('wastage must be 0 to 50%.');
  for (const key of ['makingCharge', 'stoneCost']) {
    if (!(Number(data[key] || 0) >= 0)) bad(`${LABELS[key].toLowerCase()} can't be negative.`);
  }
  if (!data.image) bad('main photo is missing.');
  for (const src of [data.image, ...(Array.isArray(data.images) ? data.images : [])].filter(Boolean)) {
    if (!imageExists(src)) bad(`photo not found: ${src}`);
  }
  return errors;
}

function checkPage(name, data, imageExists) {
  if (name !== 'home') return [];
  const slides = Array.isArray(data.slides) ? data.slides : [];
  const errors = [];
  if (!slides.length) errors.push('Home page: there must be at least one banner slide.');
  if (new Set(slides.map(s => s.title)).size !== slides.length) errors.push('Home page: every slide needs a different title.');
  for (const slide of slides) {
    if (!/^(\/(?!\/)|https:\/\/)/.test(slide.href || '')) errors.push(`Slide "${slide.title}": link must start with / or https://`);
    if (!imageExists(slide.image)) errors.push(`Slide "${slide.title}": photo not found.`);
  }
  return errors;
}

async function deployWithVercel(cwd) {
  // Constant command, so the shell (needed for vercel.cmd on Windows) never sees user text.
  await new Promise((resolve, reject) => {
    const child = spawn('vercel deploy --prod --yes', { cwd, shell: true, windowsHide: true, stdio: 'ignore' });
    const timer = setTimeout(() => child.kill(), 8 * 60 * 1000);
    child.on('error', reject);
    child.on('exit', code => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`vercel exited with ${code}`));
    });
  });
}

export function createGoLive({ root, liveSite, deploy = deployWithVercel, fetchLive = fetch }) {
  const exec = (file, args) => new Promise((resolve, reject) => {
    execFile(file, args, { cwd: root, windowsHide: true, maxBuffer: 32 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) reject(new Error(stderr || error.message));
      else resolve(stdout);
    });
  });
  const git = (...args) => exec('git', args);
  const abs = file => path.join(root, file);
  const pendingFile = abs('.vercel/go-live-pending');
  let busy = false;

  async function checkRepo() {
    if ((await git('branch', '--show-current')).trim() !== 'main') throw new GoLiveError('This folder is not on the main version. Ask Claude to fix it first.');
    try {
      await git('fetch', '--quiet', 'origin', 'main');
    } catch {
      throw new GoLiveError("Couldn't reach GitHub. Check your internet and try again.");
    }
    const [head, remote] = (await git('rev-parse', 'HEAD', 'origin/main')).trim().split('\n');
    if (head !== remote) throw new GoLiveError('This folder and GitHub are different versions. Ask Claude to sync them first.');
    return head;
  }

  async function listChanges() {
    const parts = (await git('status', '--porcelain', '-z', '--untracked-files=all', '--no-renames')).split('\0').filter(Boolean);
    return parts.map(line => ({ status: line.slice(0, 2), file: line.slice(3) }));
  }

  async function preview() {
    const head = await checkRepo();
    const changes = await listChanges();
    const errors = [];
    const warnings = [];
    const items = [];
    const files = [];
    const newImages = new Map();
    const hash = crypto.createHash('sha256').update(head);

    const tracked = new Set((await git('ls-tree', '-r', '-z', '--name-only', 'HEAD', 'client/public/images')).split('\0'));
    for (const { status, file } of changes) {
      const exists = fs.existsSync(abs(file));
      hash.update(`\0${status}\0${file}\0`).update(exists ? fs.readFileSync(abs(file)) : 'deleted');
      if (IMAGE.test(file)) {
        if (!exists) errors.push(`Photo deleted: ${path.basename(file)}. Ask Claude, because other pages may use it.`);
        else if (fs.statSync(abs(file)).size > MAX_IMAGE_BYTES) errors.push(`${path.basename(file)} is over 5 MB. Make it smaller.`);
        else newImages.set(file, tracked.has(file));
      } else if (!PRODUCT.test(file) && !PAGE.test(file)) {
        errors.push(`Not a product, page or photo: ${file}. Ask Claude to handle it.`);
      }
    }
    const imageExists = src => typeof src === 'string' && !src.includes('..')
      && (tracked.has(imageFile(src)) || newImages.has(imageFile(src)));

    // One code, one product: a repeat would silently replace the other product on the website.
    const owners = new Map();
    for (const name of fs.readdirSync(abs('content/jewelry')).filter(f => f.endsWith('.md'))) {
      let product;
      try { product = readProduct(fs.readFileSync(abs(`content/jewelry/${name}`), 'utf8')); } catch { continue; }
      const id = String(product.id).toUpperCase();
      if (owners.has(id)) errors.push(`${id} is used by two products: ${owners.get(id)} and ${product.name}. Give one a new code.`);
      else owners.set(id, product.name);
    }
    let liveProducts = [];
    if (changes.some(({ file }) => PRODUCT.test(file))) {
      try {
        const res = await fetchLive(`${liveSite}/api/products?t=${Date.now()}`, { signal: AbortSignal.timeout(10000) });
        liveProducts = await res.json();
        if (!Array.isArray(liveProducts)) throw new Error('not a list');
      } catch {
        throw new GoLiveError("Couldn't check the live shop. Check your internet and try again.");
      }
    }

    const before = async file => {
      try { return await git('show', `HEAD:${file}`); } catch { return null; }
    };
    let usedText = '';
    for (const { file } of changes) {
      const code = file.match(PRODUCT)?.[1].toUpperCase();
      const page = file.match(PAGE)?.[1];
      if (!code && !page) continue;
      files.push(file);
      const oldText = await before(file);
      if (!fs.existsSync(abs(file))) {
        if (page) { errors.push(`The ${page} page file is missing.`); continue; }
        const text = `Product removed: ${readProduct(oldText).name} (${code})`;
        items.push({ title: text, lines: [] });
        warnings.push(text);
        continue;
      }
      const text = fs.readFileSync(abs(file), 'utf8');
      usedText += text;
      let data;
      try {
        data = page ? JSON.parse(text) : readProduct(text);
      } catch {
        errors.push(`${file} can't be read. Ask Claude to fix it.`);
        continue;
      }
      if (page) {
        errors.push(...checkPage(page, data, imageExists));
        items.push({ title: `Page changed: ${page}`, lines: [] });
        continue;
      }
      errors.push(...checkProduct(code, data, imageExists));
      const old = oldText ? readProduct(oldText) : null;
      if (!old) {
        const taken = liveProducts.find(p => String(p.id).toUpperCase() === code);
        if (taken) errors.push(`${code} is already used on the live shop by ${taken.name}. Give this product a new code.`);
        items.push({ title: `New product: ${data.name} (${code})`, lines: [`Price: NPR ${data.price}`] });
        continue;
      }
      const lines = [];
      for (const key of new Set([...Object.keys(old), ...Object.keys(data)])) {
        if (JSON.stringify(old[key]) === JSON.stringify(data[key])) continue;
        lines.push(LABELS[key] ? `${LABELS[key]}: ${old[key] ?? '(empty)'} → ${data[key] ?? '(empty)'}` : `${key} changed`);
      }
      items.push({ title: `${old.name} (${code})`, lines: lines.length ? lines : ['No visible change'] });
      const change = Math.abs(Number(data.price) - Number(old.price)) / Number(old.price);
      if (change > BIG_PRICE_CHANGE) warnings.push(`${data.name}: price changes by ${Math.round(change * 100)}% (${old.price} → ${data.price})`);
      if ((old.priceMode || 'manual') !== (data.priceMode || 'manual')) warnings.push(`${data.name}: price type changes to "${data.priceMode || 'manual'}"`);
      if (Number(data.originalPrice) > Number(data.price) * 2) warnings.push(`${data.name}: old price is more than double the sell price. Did you really sell it at that price?`);
    }

    // Unused uploads stay on this computer instead of filling the website.
    for (const [file, replaced] of newImages) {
      if (!replaced && !usedText.includes(file.replace('client/public', ''))) continue;
      files.push(file);
      items.push({ title: `${replaced ? 'Photo replaced' : 'New photo'}: ${path.basename(file)}`, lines: [] });
      if (replaced) warnings.push(`Photo replaced everywhere it is used: ${path.basename(file)}`);
    }

    const lastSubject = (await git('log', '-1', '--format=%s')).trim();
    return {
      items, errors, warnings, files,
      pending: fs.existsSync(pendingFile),
      canUndo: changes.length === 0 && lastSubject === SUBJECT,
      fingerprint: hash.digest('hex'),
    };
  }

  // Deploy a clean copy of the commit, so nothing uncommitted in this folder can leak online.
  async function deployHead() {
    const project = JSON.parse(fs.readFileSync(abs('.vercel/project.json'), 'utf8'));
    if (project.projectName !== PROJECT_NAME) throw new Error('wrong Vercel project');
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'go-live-'));
    const copy = path.join(temp, 'site');
    try {
      await git('worktree', 'add', '--detach', '--quiet', copy, 'HEAD');
      fs.mkdirSync(path.join(copy, '.vercel'));
      fs.copyFileSync(abs('.vercel/project.json'), path.join(copy, '.vercel/project.json'));
      await deploy(copy);
    } finally {
      await git('worktree', 'remove', '--force', copy).catch(() => {});
      removeTemp(temp);
      await git('worktree', 'prune').catch(() => {});
    }
  }

  async function buildCheck() {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'go-live-build-'));
    try {
      await exec(process.execPath, [abs('node_modules/vite/bin/vite.js'), 'build', '--outDir', out, '--emptyOutDir']);
    } finally {
      removeTemp(out);
    }
  }

  // The live shop must list the same products with the same names before we say "Live".
  async function verifyLive() {
    const dir = abs('content/jewelry');
    const expected = new Map(fs.readdirSync(dir).filter(f => f.endsWith('.md'))
      .map(f => readProduct(fs.readFileSync(path.join(dir, f), 'utf8'))).map(p => [String(p.id), String(p.name)]));
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const res = await fetchLive(`${liveSite}/api/products?t=${Date.now()}`, { signal: AbortSignal.timeout(15000) });
        const live = new Map((await res.json()).map(p => [String(p.id), String(p.name)]));
        if ([...expected].every(([id, name]) => live.get(id) === name)) return true;
      } catch { /* try again */ }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    return false;
  }

  async function pushAndDeploy() {
    try {
      await git('push', '--quiet', 'origin', 'HEAD:main');
    } catch {
      // Put the edit back to "unpublished"; the files on disk are kept.
      await git('reset', '--quiet', '--mixed', 'HEAD~1');
      throw new GoLiveError("Couldn't save to GitHub, so nothing went live. Your edits are safe; try again.");
    }
    fs.writeFileSync(pendingFile, '');
    return finishDeploy();
  }

  async function finishDeploy() {
    try {
      await deployHead();
    } catch (error) {
      console.error('Go Live deploy failed:', error.message);
      throw new GoLiveError('Saved to GitHub, but the website was not updated. Press Try again, or ask Claude.');
    }
    fs.rmSync(pendingFile, { force: true });
    return { live: true, verified: await verifyLive() };
  }

  async function locked(work) {
    if (busy) throw new GoLiveError('Already updating. Please wait.');
    busy = true;
    try { return await work(); } finally { busy = false; }
  }

  return {
    preview: () => locked(preview),

    publish: ({ fingerprint, confirmed }) => locked(async () => {
      const now = await preview();
      if (now.fingerprint !== fingerprint) throw new GoLiveError('Something changed since you opened this list. Check it again.');
      if (now.errors.length) throw new GoLiveError(now.errors.join(' '));
      if (now.warnings.length && confirmed !== true) throw new GoLiveError('Please tick the box to confirm first.');
      if (!now.files.length) throw new GoLiveError('There is nothing to update.');
      try {
        await buildCheck();
      } catch {
        throw new GoLiveError('The website would not build with these changes, so nothing went live. Ask Claude.');
      }
      if ((await preview()).fingerprint !== fingerprint) throw new GoLiveError('Something changed during the check. Check it again.');
      await git('add', '--', ...now.files);
      await git('commit', '--quiet', '-m', SUBJECT, '-m', now.items.map(i => `- ${i.title}`).join('\n'), '--', ...now.files);
      return pushAndDeploy();
    }),

    retry: () => locked(async () => {
      await checkRepo();
      if (!fs.existsSync(pendingFile)) throw new GoLiveError('There is nothing to try again.');
      return finishDeploy();
    }),

    undo: () => locked(async () => {
      if (!(await preview()).canUndo) throw new GoLiveError('Nothing to undo, or you have unpublished edits.');
      await git('revert', '--no-edit', 'HEAD');
      return pushAndDeploy();
    }),
  };
}
