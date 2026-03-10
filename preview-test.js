#!/usr/bin/env node
/**
 * Blox Preview & Code Editor Test Suite
 *
 * Tests portfolio preview cards, template rendering, snapshot URLs,
 * and code customization CSS injection.
 *
 * Usage:
 *   node preview-test.js --subdomain thomas --base http://localhost:4200
 *   node preview-test.js --subdomain thomas --base https://blox.host
 *
 * Requirements: Node 18+ (built-in fetch). No npm install needed.
 */

'use strict';

const args = process.argv.slice(2);
function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}

const BASE_URL  = getArg('--base')      || 'http://localhost:4200';
const SUBDOMAIN = getArg('--subdomain') || '';

const PASS = '\x1b[32m✓\x1b[0m';
const FAIL = '\x1b[31m✗\x1b[0m';
const WARN = '\x1b[33m⚠\x1b[0m';
const BOLD = (s) => `\x1b[1m${s}\x1b[0m`;

let totalPass = 0, totalFail = 0, totalWarn = 0;

function check(label, condition, warnOnly = false) {
  if (condition) { console.log(`  ${PASS} ${label}`); totalPass++; }
  else if (warnOnly) { console.log(`  ${WARN} ${label} (recommended)`); totalWarn++; }
  else { console.log(`  ${FAIL} ${label}`); totalFail++; }
}

function info(label, value) {
  console.log(`  \x1b[36mℹ\x1b[0m ${label}: ${String(value ?? '').slice(0, 120)}`);
}

async function fetchHtml(url) {
  const r = await fetch(url, {
    headers: { 'User-Agent': 'BloxPreviewTest/1.0', Accept: 'text/html' },
    signal: AbortSignal.timeout(15000),
    redirect: 'follow',
  });
  return { status: r.status, html: await r.text(), headers: r.headers };
}

function getMeta(html, name) {
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, 'i');
  return (html.match(re) || html.match(re2) || [])[1] || null;
}

function hasTag(html, tag) { return html.includes(tag); }
function hasStyleInjection(html) {
  // Check for <style> tags with content (custom CSS injection)
  return /<style[^>]*>[^<]+<\/style>/i.test(html);
}
function hasJsonLd(html) {
  return html.includes('application/ld+json');
}
function getJsonLdBlocks(html) {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const blocks = [];
  let match;
  while ((match = re.exec(html)) !== null) {
    try { blocks.push(JSON.parse(match[1])); } catch { blocks.push(null); }
  }
  return blocks;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

async function testPortfolioPage(subdomain) {
  if (!subdomain) { console.log('  (no subdomain provided — skip portfolio test)'); return; }
  const url = `${BASE_URL}/${subdomain}`;
  console.log(`\nPortfolio page: ${url}`);

  let html, status;
  try {
    ({ status, html } = await fetchHtml(url));
  } catch (err) {
    console.log(`  ${FAIL} Could not reach page: ${err.message}`);
    totalFail++;
    return;
  }

  check(`HTTP 200 (got ${status})`, status === 200);

  // Meta tags
  const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1];
  check('Title tag present', !!title);
  info('Title', title);
  check('OG title present', !!getMeta(html, 'og:title'));
  check('OG image present', !!getMeta(html, 'og:image'));
  check('Canonical present', /<link[^>]+rel=["']canonical["']/i.test(html));

  // JSON-LD
  check('JSON-LD present', hasJsonLd(html));
  const schemas = getJsonLdBlocks(html);
  const parseErrors = schemas.filter((s) => s === null).length;
  check('No JSON-LD parse errors', parseErrors === 0);

  const person = schemas.find((s) => s?.['@type'] === 'Person' || s?.mainEntity?.['@type'] === 'Person');
  check('Person schema present', !!person, true);
  check('WebSite schema present', !!schemas.find((s) => s?.['@type'] === 'WebSite'), true);

  // CSS customizations
  const hasCustomStyle = hasStyleInjection(html);
  info('Custom CSS injected', hasCustomStyle ? 'Yes (code editor customizations found)' : 'No (none set)');

  // Template rendering markers
  check('Template content rendered (no empty body)', html.length > 5000);
  info('Page size', `${(html.length / 1024).toFixed(1)} KB`);
}

async function testOgImageEndpoint() {
  console.log(`\nOG Image generator: ${BASE_URL}/og`);
  const params = new URLSearchParams({
    title: 'Test User',
    subtitle: 'Full-Stack Developer',
    domain: 'testuser.blox.host',
    avatar: 'https://via.placeholder.com/100',
  });
  const url = `${BASE_URL}/og?${params}`;
  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  } catch (err) {
    console.log(`  ${FAIL} OG endpoint unreachable: ${err.message}`);
    totalFail++;
    return;
  }
  check(`OG image status 200 (got ${res.status})`, res.status === 200);
  check('OG image content-type is image/', (res.headers.get('content-type') || '').startsWith('image/'));

  // Test without avatar
  const urlNoAvatar = `${BASE_URL}/og?title=Test+User&subtitle=Developer`;
  const res2 = await fetch(urlNoAvatar, { signal: AbortSignal.timeout(10000) });
  check('OG image works without avatar', res2.status === 200);
}

async function testSubdomainSitemap(subdomain) {
  if (!subdomain) return;
  console.log(`\nSubdomain sitemap: /subdomain-sitemap/${subdomain}`);
  const url = `${BASE_URL}/subdomain-sitemap/${subdomain}`;
  let text;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    text = await res.text();
    check(`Sitemap status 200 (got ${res.status})`, res.status === 200);
  } catch (err) {
    console.log(`  ${FAIL} Sitemap unreachable: ${err.message}`);
    totalFail++;
    return;
  }
  check('Sitemap is valid XML', text.includes('<?xml') && text.includes('<urlset'));
  check('Homepage URL present', text.includes(`/${subdomain}`));
  check('Image sitemap extension', text.includes('<image:image>'), true);
  check('Section anchors (#about or #projects)', text.includes('#about') || text.includes('#projects'), true);
  info('Sitemap size', `${(text.length / 1024).toFixed(1)} KB`);
}

async function testDashboardApi() {
  console.log('\nDashboard portfolio list API');
  const url = `${BASE_URL.replace('4200', '3333')}/v1/assets?type=PORTFOLIO`;
  let data;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) { console.log(`  ${WARN} API not reachable (${res.status}) — skip`); totalWarn++; return; }
    data = await res.json();
  } catch {
    console.log(`  ${WARN} API not reachable — skip`);
    totalWarn++;
    return;
  }
  const items = Array.isArray(data) ? data : (data?.items ?? []);
  info('Portfolios in list', items.length);
  if (items.length > 0) {
    const first = items[0];
    check('List item has id', !!first.id);
    check('List item has title', !!first.title);
    check('List item has updatedAt', !!first.updatedAt);
    check('List item has templateId (for card thumbnails)', !!first.templateId, true);
    check('List item has snapshotUrl (for card previews)', !!first.snapshotUrl, true);
  }
}

async function testCodeEditorAssets() {
  console.log('\nCode Editor — codeCustomizations in asset content');
  // This test verifies that when codeCustomizations.css is set in an asset,
  // it is served in the public profile and injected on the page.
  // We check the public API endpoint instead.
  if (!SUBDOMAIN) { console.log('  (no subdomain provided — skip)'); return; }
  const url = `${BASE_URL.replace('4200', '3333')}/v1/public/${SUBDOMAIN}`;
  let profile;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) { console.log(`  ${WARN} Public profile API not reachable — skip`); totalWarn++; return; }
    profile = await res.json();
  } catch {
    console.log(`  ${WARN} API not reachable — skip`);
    totalWarn++;
    return;
  }
  check('Profile has sections', !!profile?.sections);
  check('Profile has user.fullName', !!profile?.user?.fullName);
  check('Profile has SEO title', !!profile?.seo?.title);
  const hasCodeCustom = !!profile?.codeCustomizations;
  info('codeCustomizations', hasCodeCustom ? JSON.stringify(Object.keys(profile.codeCustomizations)) : 'none');
  if (hasCodeCustom) {
    check('codeCustomizations.css is string', typeof profile.codeCustomizations.css === 'string');
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(BOLD('\nBlox Preview & Code Editor Test Suite'));
  console.log(`Base URL:   ${BASE_URL}`);
  console.log(`Subdomain:  ${SUBDOMAIN || '(none)'}`);
  console.log(`Started:    ${new Date().toISOString()}`);

  await testOgImageEndpoint();
  await testSubdomainSitemap(SUBDOMAIN);
  await testPortfolioPage(SUBDOMAIN);
  await testDashboardApi();
  await testCodeEditorAssets();

  console.log('\n' + '═'.repeat(60));
  console.log(BOLD('Results'));
  console.log(`  ${PASS} Passed:   ${totalPass}`);
  console.log(`  ${FAIL} Failed:   ${totalFail}`);
  console.log(`  ${WARN} Warnings: ${totalWarn}`);
  console.log('═'.repeat(60));

  if (totalFail > 0) {
    console.log('\n❌  Issues found.\n');
    process.exit(1);
  } else {
    console.log('\n✅  All checks passed!\n');
    process.exit(0);
  }
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
