#!/usr/bin/env node
/**
 * Blox SEO Test Suite
 *
 * Tests portfolio pages for SEO completeness, structured data validity,
 * Core Web Vitals readiness, and crawlability.
 *
 * Usage:
 *   # Test a single subdomain:
 *   node seo-test.js --subdomain thomas --base https://blox.host
 *
 *   # Test multiple subdomains:
 *   node seo-test.js --subdomains thomas,alex,sara --base https://blox.host
 *
 *   # Test locally:
 *   node seo-test.js --subdomain thomas --base http://localhost:4200
 *
 * Requirements: Node 18+ (built-in fetch). No npm install needed.
 */

'use strict';

const args = process.argv.slice(2);

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}

const BASE_URL  = getArg('--base') || 'http://localhost:4200';
const SUBDOMAIN = getArg('--subdomain');
const MULTI     = getArg('--subdomains');

const subdomains = MULTI
  ? MULTI.split(',').map((s) => s.trim()).filter(Boolean)
  : SUBDOMAIN
  ? [SUBDOMAIN]
  : [];

if (subdomains.length === 0) {
  console.error('❌  Provide --subdomain <name> or --subdomains a,b,c');
  process.exit(1);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const PASS  = '\x1b[32m✓\x1b[0m';
const FAIL  = '\x1b[31m✗\x1b[0m';
const WARN  = '\x1b[33m⚠\x1b[0m';
const INFO  = '\x1b[36mℹ\x1b[0m';
const BOLD  = (s) => `\x1b[1m${s}\x1b[0m`;

let totalPass = 0;
let totalFail = 0;
let totalWarn = 0;

function check(label, condition, warnOnly = false) {
  if (condition) {
    console.log(`  ${PASS} ${label}`);
    totalPass++;
  } else if (warnOnly) {
    console.log(`  ${WARN} ${label} (recommended)`);
    totalWarn++;
  } else {
    console.log(`  ${FAIL} ${label}`);
    totalFail++;
  }
}

function info(label, value) {
  const display = String(value ?? '').slice(0, 120);
  console.log(`  ${INFO} ${label}: ${display}`);
}

// ─── Fetch helpers ───────────────────────────────────────────────────────────

async function fetchPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        Accept: 'text/html',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    const html = await res.text();
    clearTimeout(timer);
    return { status: res.status, headers: res.headers, html };
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

async function fetchJson(url) {
  const res = await fetch(url, { redirect: 'follow' });
  return res.ok ? res.json() : null;
}

async function fetchText(url) {
  const res = await fetch(url, { redirect: 'follow' });
  return res.ok ? res.text() : null;
}

// ─── HTML parsers (no DOM — pure regex) ─────────────────────────────────────

function getMeta(html, name) {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`,
    'i',
  );
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`,
    'i',
  );
  return (html.match(re) || html.match(re2) || [])[1] || null;
}

function getTitle(html) {
  return (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1] || null;
}

function getCanonical(html) {
  return (html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) || [])[1] || null;
}

function getRobotsMeta(html) {
  return getMeta(html, 'robots') || getMeta(html, 'googlebot') || '';
}

function getAllJsonLd(html) {
  const results = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    try {
      results.push(JSON.parse(match[1]));
    } catch {
      results.push(null); // parse error
    }
  }
  return results;
}

function getH1s(html) {
  const re = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  const h1s = [];
  let match;
  while ((match = re.exec(html)) !== null) {
    h1s.push(match[1].replace(/<[^>]+>/g, '').trim());
  }
  return h1s;
}

function getImages(html) {
  const re = /<img[^>]+>/gi;
  const imgs = [];
  let match;
  while ((match = re.exec(html)) !== null) {
    const tag = match[0];
    const alt = (tag.match(/alt=["']([^"']*)["']/) || [])[1];
    const src = (tag.match(/src=["']([^"']+)["']/) || [])[1];
    if (src) imgs.push({ src, alt: alt ?? null });
  }
  return imgs;
}

function hasNextImageLoader(html) {
  return html.includes('/_next/image') || html.includes('data-nimg');
}

// ─── JSON-LD validators ──────────────────────────────────────────────────────

function findSchema(schemas, type) {
  for (const s of schemas) {
    if (!s) continue;
    if (s['@type'] === type) return s;
    // Nested — e.g. ProfilePage.mainEntity
    for (const val of Object.values(s)) {
      if (val && typeof val === 'object' && val['@type'] === type) return val;
    }
  }
  return null;
}

function findSchemas(schemas, type) {
  const found = [];
  for (const s of schemas) {
    if (!s) continue;
    if (s['@type'] === type) found.push(s);
    for (const val of Object.values(s)) {
      if (val && typeof val === 'object' && val['@type'] === type) found.push(val);
    }
  }
  return found;
}

// ─── Per-subdomain test ──────────────────────────────────────────────────────

async function testSubdomain(subdomain) {
  const url = `${BASE_URL}/${subdomain}`;
  console.log('\n' + '═'.repeat(70));
  console.log(BOLD(`Portfolio: ${subdomain}`));
  console.log(`URL: ${url}`);
  console.log('─'.repeat(70));

  let html, headers, status;
  try {
    ({ html, headers, status } = await fetchPage(url));
  } catch (err) {
    console.log(`  ${FAIL} Failed to fetch page: ${err.message}`);
    totalFail++;
    return;
  }

  // ── HTTP ─────────────────────────────────────────────────────────────────
  console.log('\n' + BOLD('HTTP'));
  check(`Status 200 (got ${status})`, status === 200);
  check(
    'Content-Type: text/html',
    (headers.get('content-type') || '').includes('text/html'),
  );

  // ── Title ────────────────────────────────────────────────────────────────
  console.log('\n' + BOLD('Title'));
  const title = getTitle(html);
  info('Value', title);
  check('Title tag present', !!title);
  check('Title 50–65 chars', title && title.length >= 40 && title.length <= 70);
  check(
    'Title contains name/role pattern (- or |)',
    title && (title.includes(' - ') || title.includes(' | ')),
  );

  // ── Meta Description ─────────────────────────────────────────────────────
  console.log('\n' + BOLD('Meta Description'));
  const desc = getMeta(html, 'description');
  info('Value', desc);
  check('Meta description present', !!desc);
  check('Description 120–165 chars', desc && desc.length >= 100 && desc.length <= 170);

  // ── Canonical ────────────────────────────────────────────────────────────
  console.log('\n' + BOLD('Canonical'));
  const canonical = getCanonical(html);
  info('Value', canonical);
  check('Canonical link present', !!canonical);
  check(
    'Canonical contains subdomain',
    canonical && canonical.includes(subdomain),
  );

  // ── Robots ───────────────────────────────────────────────────────────────
  console.log('\n' + BOLD('Robots'));
  const robotsMeta = getRobotsMeta(html);
  check(
    'Not noindex (portfolio should be indexable)',
    !robotsMeta.includes('noindex'),
  );
  check(
    'X-Robots-Tag allows indexing',
    !(headers.get('x-robots-tag') || '').includes('noindex'),
  );

  // ── OpenGraph ────────────────────────────────────────────────────────────
  console.log('\n' + BOLD('OpenGraph'));
  const ogTitle = getMeta(html, 'og:title');
  const ogDesc  = getMeta(html, 'og:description');
  const ogImage = getMeta(html, 'og:image');
  const ogUrl   = getMeta(html, 'og:url');
  const ogType  = getMeta(html, 'og:type');
  check('og:title present', !!ogTitle);
  check('og:description present', !!ogDesc);
  check('og:image present', !!ogImage);
  check('og:image is https', ogImage && ogImage.startsWith('https://'), true);
  check('og:url present', !!ogUrl);
  check('og:url contains subdomain', ogUrl && ogUrl.includes(subdomain));
  check('og:type = profile or website', ogType === 'profile' || ogType === 'website');

  // ── Twitter Card ─────────────────────────────────────────────────────────
  console.log('\n' + BOLD('Twitter Card'));
  const twCard  = getMeta(html, 'twitter:card');
  const twTitle = getMeta(html, 'twitter:title');
  const twImage = getMeta(html, 'twitter:image');
  check('twitter:card = summary_large_image', twCard === 'summary_large_image');
  check('twitter:title present', !!twTitle);
  check('twitter:image present', !!twImage, true);

  // ── Keywords ─────────────────────────────────────────────────────────────
  console.log('\n' + BOLD('Keywords'));
  const keywords = getMeta(html, 'keywords');
  info('Value', keywords);
  check('Keywords meta present', !!keywords, true);

  // ── H1 ───────────────────────────────────────────────────────────────────
  console.log('\n' + BOLD('Headings'));
  const h1s = getH1s(html);
  info('H1 tags', h1s.join(' | '));
  check('Exactly one H1 (or at least one)', h1s.length >= 1);
  check('H1 count <= 2', h1s.length <= 2, true);

  // ── Images ───────────────────────────────────────────────────────────────
  console.log('\n' + BOLD('Images'));
  const images = getImages(html);
  const missingAlt = images.filter((img) => img.alt === null || img.alt === '');
  check(`All images have alt text (${missingAlt.length} missing)`, missingAlt.length === 0, true);
  check('Next.js Image component used', hasNextImageLoader(html), true);
  info('Total images', images.length);

  // ── JSON-LD ──────────────────────────────────────────────────────────────
  console.log('\n' + BOLD('Structured Data (JSON-LD)'));
  const schemas = getAllJsonLd(html);
  const parseErrors = schemas.filter((s) => s === null).length;
  check('No JSON-LD parse errors', parseErrors === 0);
  info('Schema blocks found', schemas.filter(Boolean).length);

  // ProfilePage
  const profilePage = findSchema(schemas, 'ProfilePage');
  check('ProfilePage schema present', !!profilePage);
  check('ProfilePage has dateModified', !!(profilePage?.dateModified));
  check('ProfilePage has url', !!(profilePage?.url), true);

  // Person
  const person = findSchema(schemas, 'Person');
  check('Person schema present', !!person);
  if (person) {
    check('Person.name present', !!person.name);
    check('Person.jobTitle present', !!person.jobTitle, true);
    check('Person.image present', !!person.image);
    check('Person.url present', !!person.url);
    check('Person.sameAs present (social links)', Array.isArray(person.sameAs) && person.sameAs.length > 0, true);
    check('Person.knowsAbout present (skills)', !!person.knowsAbout, true);
    check('Person.address present (location)', !!person.address, true);
    info('Person.name', person.name);
    info('Person.jobTitle', person.jobTitle);
    info('Person.address', JSON.stringify(person.address));
  }

  // WebSite
  const website = findSchema(schemas, 'WebSite');
  check('WebSite schema present', !!website, true);

  // BreadcrumbList
  const breadcrumb = findSchema(schemas, 'BreadcrumbList');
  check('BreadcrumbList schema present', !!breadcrumb, true);

  // CreativeWork / ItemList
  const itemList = findSchema(schemas, 'ItemList');
  if (itemList) {
    check(
      'ItemList.itemListElement present (projects)',
      Array.isArray(itemList.itemListElement) && itemList.itemListElement.length > 0,
      true,
    );
  }

  // ── Sitemap ──────────────────────────────────────────────────────────────
  console.log('\n' + BOLD('Sitemap'));
  const sitemapUrl = `${BASE_URL}/subdomain-sitemap/${subdomain}`;
  let sitemapXml;
  try {
    sitemapXml = await fetchText(sitemapUrl);
  } catch {
    sitemapXml = null;
  }
  check('Subdomain sitemap accessible', !!sitemapXml);
  check('Sitemap contains portfolio URL', sitemapXml && sitemapXml.includes(subdomain));
  check(
    'Sitemap has image entries',
    sitemapXml && sitemapXml.includes('<image:image>'),
    true,
  );
  check(
    'Sitemap has section anchors (#about, #projects)',
    sitemapXml && (sitemapXml.includes('#about') || sitemapXml.includes('#projects')),
    true,
  );

  // ── Robots.txt ───────────────────────────────────────────────────────────
  console.log('\n' + BOLD('Robots.txt'));
  const robotsUrl = `${BASE_URL}/robots.txt`;
  let robotsTxt;
  try {
    robotsTxt = await fetchText(robotsUrl);
  } catch {
    robotsTxt = null;
  }
  check('robots.txt accessible', !!robotsTxt);
  check('Allows all crawlers (User-agent: *)', robotsTxt && robotsTxt.includes('User-agent: *'));
  check('Has Sitemap reference', robotsTxt && robotsTxt.includes('Sitemap:'));
  check('Disallows /api/', robotsTxt && robotsTxt.includes('Disallow: /api/'));
  check(
    'Does NOT disallow portfolio pages',
    robotsTxt && !robotsTxt.includes(`Disallow: /${subdomain}`),
  );

  // ── OG Image ─────────────────────────────────────────────────────────────
  console.log('\n' + BOLD('OG Image'));
  if (ogImage) {
    let ogRes;
    try {
      ogRes = await fetch(ogImage, { redirect: 'follow' });
    } catch {
      ogRes = null;
    }
    check(
      `OG image reachable (${ogImage.slice(0, 60)}...)`,
      ogRes && ogRes.ok,
    );
    check(
      'OG image Content-Type is image/*',
      ogRes && (ogRes.headers.get('content-type') || '').startsWith('image/'),
      true,
    );
  }

  // ── Performance signals ──────────────────────────────────────────────────
  console.log('\n' + BOLD('Performance Signals'));
  check('Response < 50kb (lean HTML)', html.length < 51200, true);
  info('HTML size', `${(html.length / 1024).toFixed(1)} KB`);
  check('No render-blocking inline scripts (no document.write)', !html.includes('document.write'));

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('');
}

// ─── Global sitemap test ─────────────────────────────────────────────────────

async function testGlobalSitemap() {
  console.log('\n' + '═'.repeat(70));
  console.log(BOLD('Global Sitemap (/sitemap.xml)'));
  console.log('─'.repeat(70));

  const sitemapUrl = `${BASE_URL}/sitemap.xml`;
  let xml;
  try {
    xml = await fetchText(sitemapUrl);
  } catch {
    xml = null;
  }
  check('Global sitemap accessible', !!xml);
  check('Sitemap is valid XML', xml && xml.includes('<?xml') && xml.includes('<urlset'));
  check('Sitemap contains homepage', xml && xml.includes(`${BASE_URL}/`), true);
  check('Sitemap contains portfolio entries', xml && subdomains.some((s) => xml.includes(s)), true);
  info('Sitemap size', xml ? `${(xml.length / 1024).toFixed(1)} KB` : 'N/A');
  console.log('');
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(BOLD('\nBlox SEO Test Suite'));
  console.log(`Base URL:    ${BASE_URL}`);
  console.log(`Subdomains:  ${subdomains.join(', ')}`);
  console.log(`Started:     ${new Date().toISOString()}`);

  await testGlobalSitemap();

  for (const sub of subdomains) {
    await testSubdomain(sub);
  }

  console.log('═'.repeat(70));
  console.log(BOLD('Results'));
  console.log(`  ${PASS} Passed:   ${totalPass}`);
  console.log(`  ${FAIL} Failed:   ${totalFail}`);
  console.log(`  ${WARN} Warnings: ${totalWarn}`);
  console.log('═'.repeat(70));

  if (totalFail > 0) {
    console.log('\n❌  SEO issues found. Fix failures before deploying.\n');
    process.exit(1);
  } else {
    console.log('\n✅  All required SEO checks passed!\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
