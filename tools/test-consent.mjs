import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../website/static/js/index.js', import.meta.url), 'utf8');
const consent = source.slice(source.indexOf('function readCookieConsent('), source.indexOf('function setupRegistrationBanner('));

function createPage({ saved = null, blocked = false } = {}) {
  const listeners = {};
  const records = new Map(saved === null ? [] : [['tedx-cookie-consent', saved]]);
  const events = [];
  const element = () => ({
    attrs: {}, dataset: {}, listeners: {}, hidden: false, offsetHeight: 140,
    classList: { values: new Set(), toggle(name, enabled) { enabled ? this.values.add(name) : this.values.delete(name); } },
    style: { setProperty(key, value) { this[key] = value; } },
    setAttribute(key, value) { this.attrs[key] = value; },
    removeAttribute(key) { delete this.attrs[key]; },
    hasAttribute(key) { return key in this.attrs; },
    addEventListener(name, callback) { this.listeners[name] = callback; },
    focus() { this.focused = true; },
    closest() { return null; }
  });
  const accept = element(), reject = element(), settings = element(), placeholder = element(), map = element();
  accept.dataset.cookieChoice = 'accept'; reject.dataset.cookieChoice = 'reject';
  map.dataset.consentSrc = 'https://www.google.com/maps?output=embed';
  map.parentElement = { querySelector: () => placeholder };
  const banner = Object.assign(element(), {
    querySelectorAll: () => [accept, reject], querySelector: () => accept
  });
  const body = Object.assign(element(), { append() {} });
  const context = vm.createContext({
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    document: {
      body,
      createElement: type => { assert.equal(type, 'aside', 'no tracker script is created'); return banner; },
      querySelectorAll: selector => selector === '[data-cookie-settings]' ? [settings] : [map]
    },
    window: {
      localStorage: {
        getItem(key) { if (blocked) throw new Error('Storage disabled'); return records.get(key) ?? null; },
        setItem(key, value) { if (blocked) throw new Error('Storage disabled'); records.set(key, value); }
      },
      addEventListener(name, callback) { listeners[name] = callback; },
      dispatchEvent(event) { events.push(event); }
    }
  });
  vm.runInContext(consent + '\nsetupCookieConsent();', context);
  return { context, accept, reject, settings, placeholder, map, banner, body, records, events, listeners };
}

const page = createPage();
assert.equal(page.banner.hidden, false);
assert.equal(page.map.hidden, true);
assert.equal(page.map.hasAttribute('src'), false);
assert.equal(page.context.window.tedxConsent.analytics, false);
assert.equal(page.body.classList.values.has('has-cookie-banner'), true);
page.reject.listeners.click();
assert.equal(page.banner.hidden, true);
assert.equal(page.map.hasAttribute('src'), false);
assert.equal(JSON.parse(page.records.get('tedx-cookie-consent')).optional, false);
assert.equal(page.body.classList.values.has('has-cookie-banner'), false);
assert.equal(page.body.style['--cookie-banner-height'], '0px');

page.settings.listeners.click();
assert.equal(page.banner.hidden, false);
assert.equal(page.accept.focused, true);
page.accept.listeners.click();
assert.equal(page.map.attrs.src, page.map.dataset.consentSrc);
assert.equal(page.map.hidden, false);
assert.equal(page.placeholder.hidden, true);
assert.equal(page.context.window.tedxConsent.analytics, true);
assert.equal(page.settings.focused, true);
const accepted = page.records.get('tedx-cookie-consent');
const reloaded = createPage({ saved: accepted });
assert.equal(reloaded.banner.hidden, true);
assert.equal(reloaded.map.hidden, false);
reloaded.settings.listeners.click();
reloaded.reject.listeners.click();
assert.equal(reloaded.map.hasAttribute('src'), false, 'withdrawal unloads the map');
assert.equal(reloaded.placeholder.hidden, false);
assert.equal(reloaded.context.window.tedxConsent.analytics, false);
assert.equal(createPage({ saved: reloaded.records.get('tedx-cookie-consent') }).banner.hidden, true);

for (const saved of ['bad json', '{}', 'null', '{"version":2,"optional":true}', '{"version":1,"optional":"true"}']) {
  const invalid = createPage({ saved });
  assert.equal(invalid.banner.hidden, false);
  assert.equal(invalid.map.hasAttribute('src'), false);
}
const restricted = createPage({ blocked: true });
restricted.accept.listeners.click();
assert.equal(restricted.banner.hidden, true);
assert.equal(restricted.map.hidden, false);
assert.equal(restricted.records.size, 0);
restricted.settings.listeners.click(); restricted.reject.listeners.click();
assert.equal(restricted.map.hasAttribute('src'), false);

page.listeners.storage({ key: 'tedx-cookie-consent', newValue: '{"version":1,"optional":false}' });
assert.equal(page.map.hasAttribute('src'), false);
page.listeners.storage({ key: null, newValue: null });
assert.equal(page.banner.hidden, false);
assert.ok(page.events.every(event => event.type === 'tedx:consent-change'));
assert.ok(page.events.some(event => event.detail.optional) && page.events.some(event => !event.detail.optional));
console.log('Cookie defaults, accept/reject, saved choices, withdrawal, settings, cross-tab changes, and blocked storage passed.');
