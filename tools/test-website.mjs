import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../website/', import.meta.url));
const read = name => readFileSync(join(root, name), 'utf8');
const home = read('index.html');
const source = read('static/js/index.js');
const quoteText = 'Find out how every member of our community can adopt new tools to thrive, with curated speakers across AI, medicine, cybersecurity, art, neuroscience, history, recreation, and more.';
const ids = [...home.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map(match => match[1]);
assert.deepEqual(ids, ['home', 'why-retooled', 'register', 'speakers-preview', 'community', 'home-venue-map', 'what-is-tedx', 'participate']);
assert.equal(home.split(quoteText).length - 1, 1);
assert.ok(!home.includes('About Retooling'));
assert.equal([...home.matchAll(/<article class="home-speaker-card"/g)].length, 12);
assert.doesNotMatch(home + read('speakers.html'), /darin-weiss-official\.(jpg|webp)/);
assert.equal([...home.matchAll(/darin-weiss-supplied\.webp/g)].length, 2);
assert.equal([...read('speakers.html').matchAll(/darin-weiss-supplied\.webp/g)].length, 4);
assert.deepEqual(readFileSync(join(root, 'assets/images/darin-weiss-supplied.webp')), readFileSync(resolve(root, '../DarinWeiss Image for homepage.webp')), 'new Darin portrait is preserved exactly');

const graph = JSON.parse(home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
const event = graph.find(item => item['@type'] === 'Event');
assert.equal(event.startDate, '2026-10-10T10:00:00-04:00');
assert.equal(event.endDate, '2026-10-10T15:00:00-04:00');
const schedule = read('schedule.html');
const times = [...schedule.matchAll(/<time datetime="([^"]+)">([^<]+)<\/time>/g)];
assert.deepEqual(times.map(match => match[1].slice(11, 16)), ['09:45', '10:00', '10:10', '11:45', '12:35', '14:00', '14:10', '15:00', '17:00']);
for (const [, iso, label] of times) {
  const hour = Number(iso.slice(11, 13));
  assert.equal(label, `${hour % 12 || 12}:${iso.slice(14, 16)} ${hour >= 12 ? 'p.m.' : 'a.m.'}`);
}

for (const name of readdirSync(root).filter(name => name.endsWith('.html'))) {
  const html = read(name);
  const pageIds = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(pageIds).size, pageIds.length, `${name}: unique anchors`);
  const version = '20260904-layout-consent';
  assert.ok(html.includes(`index.js?v=${version}`), `${name}: current shared script`);
  assert.ok(html.includes(`index.css?v=${version}`), `${name}: current styles`);
  assert.doesNotMatch(html, /11:00|4:00 p\.m\.|4:00 PM|10:45|T16:00/);
  const sections = [...html.matchAll(/<section\b[^>]*>/g)].map(([tag]) => ({
    id: tag.match(/\bid="([^"]+)"/)[1],
    backdrop: tag.match(/\bdata-backdrop="([^"]+)"/)?.[1],
    classes: tag.match(/\bclass="([^"]+)"/)[1].split(/\s+/)
  }));
  sections.forEach((section, index) => {
    assert.ok(section.backdrop, `${name}: ${section.id} has an explicit background`);
    if (index) assert.notEqual(section.backdrop, sections[index - 1].backdrop, `${name}: neighboring backgrounds differ`);
    if (section.classes.includes('content-section') && ['spencer', 'rochester-one', 'rochester-two'].includes(section.backdrop)) {
      assert.ok(section.classes.includes('image-band'), `${section.id}: photograph is rendered`);
    }
    if (section.backdrop === 'ted-stage') {
      assert.ok(section.classes.includes('flow-background') && section.classes.includes('tone-dark'), `${section.id}: stage photograph uses readable light text`);
      assert.ok(!section.classes.includes('image-band'), `${section.id}: no conflicting light overlay`);
    }
    if (section.backdrop === 'quote') assert.equal(section.id, 'why-retooled');
    if (section.backdrop === 'speaker-grid') {
      assert.ok(section.classes.includes('speaker-list-section'));
      assert.ok(!section.classes.some(name => ['image-band', 'flow-background', 'tone-dark'].includes(name)));
    }
  });
  assert.doesNotMatch(html, /partners\.html/);
  for (const [frame] of html.matchAll(/<iframe\b[^>]*>/g)) {
    assert.match(frame, /data-consent-src=/);
    assert.doesNotMatch(frame, /\ssrc=/, 'external embeds cannot load before consent');
    assert.match(frame, /\shidden\b/);
  }
  for (const [, href] of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    if (/^(?:https?:|mailto:|data:)/.test(href)) continue;
    assert.ok(existsSync(resolve(root, href.split(/[?#]/)[0])), `${name}: local asset ${href}`);
  }
}
assert.ok(source.includes('Everyone must leave by 5:00 p.m.'));
assert.doesNotMatch(source, /11:00 a\.m\.|4:00 p\.m\./);
const css = read('static/css/index.css');
assert.ok(!existsSync(join(root, 'partners.html')));
assert.doesNotMatch(read('sitemap.xml') + read('llms.txt') + source, /partners\.html/);
assert.match(css, /\.home-speaker-grid\s*\{[^}]*grid-auto-rows: 1fr/);
assert.match(css, /\.home-speaker-card > :is\([^}]+flex: 0 0 auto;[^}]+height: auto;/);
assert.match(css, /\.home-speaker-card \.speaker-copy\s*\{[^}]*flex: 1 0 auto;/);
assert.match(css, /\.speaker-list-section\s*\{[^}]*background: #fff;/);
assert.match(css, /#what-is-tedx\.flow-background::before\s*\{[^}]*rgba\(3, 5, 12, \.80\)/);
assert.match(source, /querySelectorAll\("\.speaker-list-section"\)/);
for (const [, asset] of css.matchAll(/url\("([^"#]+)"\)/g)) {
  assert.ok(existsSync(resolve(root, 'static/css', asset)), `Stylesheet asset: ${asset}`);
}
assert.match(home, /id="what-is-tedx" data-backdrop="ted-stage"/);
assert.deepEqual(readFileSync(join(root, 'assets/images/ted-stage-supplied.webp')), readFileSync(resolve(root, '../TED about section background.webp')), 'supplied image is copied without alteration');
console.log('Page order, varied backgrounds, original image, quote, speaker count, links, cache versions, and event hours passed.');

// Test the scroll controller without a browser or animation dependencies.
const animation = source.slice(source.indexOf('function quoteWordState('), source.indexOf('function setupPointerAtmosphere('));
const stateContext = vm.createContext({});
vm.runInContext(animation, stateContext);
const count = quoteText.split(/\s+/).length;
for (let index = 0; index < count; index++) {
  const initial = stateContext.quoteWordState(0, index, count);
  assert.equal(initial.y, -1);
  assert.equal(initial.opacity, 0);
  for (const progress of [.365, .45, .55, .60]) {
    const state = stateContext.quoteWordState(progress, index, count);
    assert.equal(state.y, 0, 'every word settles during the readable pause');
    assert.equal(state.opacity, 1);
    assert.equal(state.blur, 0);
  }
  const end = stateContext.quoteWordState(1, index, count);
  assert.equal(end.y, 1);
  assert.equal(end.opacity, 0);
  let previous = -1;
  for (let step = 0; step <= 100; step++) {
    const state = stateContext.quoteWordState(step / 100, index, count);
    assert.ok(state.y >= previous - 1e-9, 'words always fall downward');
    assert.ok(state.opacity >= 0 && state.opacity <= 1);
    previous = state.y;
  }
}

function controller({ reduced = false, viewport = 900, paragraphHeight = 420 } = {}) {
  const callbacks = new Map();
  const listeners = {};
  let next = 0;
  let clock = 0;
  let sectionTop = 2000;
  const element = () => ({
    children: [], textContent: '', attrs: {}, style: {
      setProperty(key, value) { this[key] = value; },
      removeProperty(key) { delete this[key]; }
    },
    classList: {
      values: new Set(),
      toggle(name, value) { value ? this.values.add(name) : this.values.delete(name); },
      remove(name) { this.values.delete(name); },
      contains(name) { return this.values.has(name); }
    },
    append(child) { this.children.push(child); },
    setAttribute(key, value) { this.attrs[key] = value; },
    replaceChildren(...children) { this.children = children; }
  });
  const paragraph = Object.assign(element(), { textContent: quoteText, offsetHeight: paragraphHeight });
  const stage = element();
  const section = element();
  section.querySelector = selector => selector === '.quote-stage' ? stage : paragraph;
  section.getBoundingClientRect = () => ({ top: sectionTop, bottom: sectionTop + viewport - 72 + parseFloat(section.style['--quote-travel']) });
  const motion = { matches: reduced, addEventListener: (_, callback) => { listeners.motion = callback; } };
  const context = vm.createContext({
    document: {
      querySelector: () => section,
      createElement: element,
      createTextNode: text => ({ textContent: text }),
      documentElement: { clientHeight: viewport }
    },
    window: {
      CSS: { supports: () => true }, innerHeight: viewport,
      matchMedia: () => motion,
      addEventListener: (name, callback) => { listeners[name] = callback; },
      requestAnimationFrame(callback) { callbacks.set(++next, callback); return next; }
    },
    getComputedStyle: () => ({ getPropertyValue: () => '72', paddingTop: '32', paddingBottom: '32' })
  });
  vm.runInContext(animation + '\nsetupScrollQuote();', context);
  const flush = () => {
    let frames = 0;
    while (callbacks.size) {
      assert.ok(++frames < 100, 'animation stops scheduling frames once settled');
      const work = [...callbacks.values()]; callbacks.clear();
      work.forEach(callback => callback(clock += 16));
    }
  };
  flush();
  const words = paragraph.children[1].children.filter(child => child.className === 'quote-word');
  assert.equal(paragraph.children[0].textContent, quoteText);
  assert.equal(paragraph.children[1].attrs['aria-hidden'], 'true');
  assert.equal(words.map(word => word.textContent).join(' '), quoteText);
  return { section, motion, listeners, words, flush, scroll(progress) {
    const height = viewport - 72;
    sectionTop = 72 + height * .4 - progress * (parseFloat(section.style['--quote-travel']) + height * .4);
    listeners.scroll(); flush();
  } };
}

const normal = controller();
assert.ok(normal.section.classList.contains('is-scroll-animated'));
assert.equal(parseFloat(normal.section.style['--quote-travel']), (900 - 72) * .9);
assert.ok(!normal.section.classList.contains('is-quote-active'), 'gradient pauses offscreen');
normal.scroll(.5);
assert.ok(normal.section.classList.contains('is-quote-active'), 'gradient runs while visible');
assert.ok(normal.words.every(word => word.style.opacity === '1.000'));
normal.scroll(1);
assert.ok(normal.words.every(word => word.style.opacity === '0.000'));
normal.scroll(.5);
assert.ok(normal.words.every(word => word.style.opacity === '1.000'), 'scrolling backward restores the quote');
normal.motion.matches = true; normal.listeners.motion(); normal.flush();
assert.ok(!normal.section.classList.contains('is-scroll-animated'));
assert.ok(!normal.section.classList.contains('is-quote-active'), 'reduced motion stops the gradient');
assert.ok(normal.words.every(word => !('opacity' in word.style)), 'reduced motion clears hidden styles');
assert.ok(!controller({ reduced: true }).section.classList.contains('is-scroll-animated'));
const short = controller({ viewport: 400 });
assert.ok(!short.section.classList.contains('is-scroll-animated'));
short.scroll(.5);
assert.ok(short.section.classList.contains('is-quote-active'), 'short screens still get the moving gradient');
normal.motion.matches = false; normal.listeners.motion(); normal.flush();
normal.scroll(2);
assert.ok(!normal.section.classList.contains('is-quote-active'), 'gradient pauses after leaving the quote');
console.log('Word motion, slower pacing, readable pause, reverse scrolling, gradient visibility, accessibility, and static fallbacks passed.');
