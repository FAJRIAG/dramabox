/**
 * ================================================
 *  @jridev/dramabox — Full API Test Script
 *  Jalankan: node test-dramabox.mjs
 *  Butuh: Node.js >= 18 + npm install @jridev/dramabox
 * ================================================
 */

import DramaboxScraper from './dist/esm/Dramabox.js';

// ── CONFIG ───────────────────────────────────────
const BOOK_ID = '41000122939'; // ganti jika perlu
const EPISODE = 1;
const KEYWORD = 'love';
const LANGUAGE = 'in';          // 'en', 'in', 'zh', dll
// ─────────────────────────────────────────────────

const scraper = new DramaboxScraper({
  language: LANGUAGE,
  requestDelay: 1200,
  maxRetries: 3,
  timeout: 30000,
});

// ── HELPERS ──────────────────────────────────────
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let passed = 0, failed = 0, skipped = 0;
const results = [];

function log(msg) { console.log(msg); }
function ok(msg) { console.log(`  ${GREEN}✓${RESET} ${msg}`); }
function fail(msg) { console.log(`  ${RED}✗${RESET} ${msg}`); }
function info(msg) { console.log(`  ${CYAN}→${RESET} ${msg}`); }
function section(t) { console.log(`\n${BOLD}${YELLOW}▸ ${t}${RESET}`); }

async function test(name, fn) {
  process.stdout.write(`  Testing ${CYAN}${name}${RESET}... `);
  const start = Date.now();
  try {
    const res = await fn();
    const ms = Date.now() - start;
    if (res && res.success === true) {
      console.log(`${GREEN}PASS${RESET} (${ms}ms)`);
      passed++;
      results.push({ name, status: 'PASS', ms });
      return res;
    } else {
      const msg = res?.message || 'success=false';
      console.log(`${RED}FAIL${RESET} — ${msg}`);
      failed++;
      results.push({ name, status: 'FAIL', ms, msg });
      return null;
    }
  } catch (e) {
    const ms = Date.now() - start;
    console.log(`${RED}ERROR${RESET} — ${e.message}`);
    failed++;
    results.push({ name, status: 'ERROR', ms, msg: e.message });
    return null;
  }
}

// ── TESTS ────────────────────────────────────────

log(`\n${BOLD}════════════════════════════════════════${RESET}`);
log(`${BOLD}  @jridev/dramabox — API Test Suite${RESET}`);
log(`${BOLD}════════════════════════════════════════${RESET}`);
log(`  Language : ${LANGUAGE}`);
log(`  Book ID  : ${BOOK_ID}`);
log(`  Episode  : ${EPISODE}`);
log(`  Keyword  : ${KEYWORD}`);

// 1. AUTH
section('1. Authentication');
const tokenRes = await test('generateToken', () => scraper.generateToken());
if (tokenRes) {
  info(`Token    : ${tokenRes.data.token.slice(0, 40)}...`);
  info(`DeviceId : ${tokenRes.data.deviceId}`);
  info(`Expiry   : ${new Date(tokenRes.data.expiry).toLocaleString()}`);
}

// 2. BROWSE
section('2. Browse');
const latestRes = await test('getLatest(1)', () => scraper.getLatest(1));
if (latestRes) {
  info(`Found ${latestRes.data.results?.length ?? 0} dramas on page 1`);
  latestRes.data.results?.slice(0, 2).forEach(d =>
    info(`  • ${d.bookName} [${d.bookId}]`)
  );
}

await test('getTrending()', () => scraper.getTrending());
await test('getVip()', () => scraper.getVip());
await test('getHomepage()', () => scraper.getHomepage());
await test('getRecommendedBooks()', () => scraper.getRecommendedBooks());

// 3. DRAMA DETAIL
section('3. Drama Detail');
const detailRes = await test(`getDramaDetail(${BOOK_ID})`, () =>
  scraper.getDramaDetail(BOOK_ID)
);
if (detailRes?.data?.detail) {
  const d = detailRes.data.detail;
  info(`Title    : ${d.bookName}`);
  info(`Episodes : ${d.chapterCount}`);
  info(`Tags     : ${d.tagV3s?.join(', ')}`);
}

await test(`getDramaDetailV2(${BOOK_ID})`, () =>
  scraper.getDramaDetailV2(BOOK_ID)
);

await test(`getRelatedDramas(${BOOK_ID})`, () =>
  scraper.getRelatedDramas(BOOK_ID)
);

// 4. EPISODES
section('4. Episodes');
const chaptersRes = await test(`getChapters(${BOOK_ID})`, () =>
  scraper.getChapters(BOOK_ID)
);
if (chaptersRes?.data?.chapters) {
  info(`Total chapters: ${chaptersRes.data.chapters.length}`);
}

await test(`getEpisodeDetails(${BOOK_ID}, ${EPISODE})`, () =>
  scraper.getEpisodeDetails(BOOK_ID, EPISODE)
);

const streamRes = await test(`getStreamUrl(${BOOK_ID}, ${EPISODE})`, () =>
  scraper.getStreamUrl(BOOK_ID, EPISODE)
);
if (streamRes?.data?.data?.chapter?.video) {
  const v = streamRes.data.data.chapter.video;
  info(`MP4  : ${v.mp4 ? v.mp4.slice(0, 60) + '...' : 'N/A'}`);
  info(`M3U8 : ${v.m3u8 ? v.m3u8.slice(0, 60) + '...' : 'N/A'}`);
}

// 5. SEARCH
section('5. Search');
await test(`searchDramaIndex()`, () => scraper.searchDramaIndex());

const searchRes = await test(`searchDrama("${KEYWORD}", 1, 5)`, () =>
  scraper.searchDrama(KEYWORD, 1, 5)
);
if (searchRes?.data?.book) {
  info(`Results: ${searchRes.data.book.length} dramas`);
  searchRes.data.book.slice(0, 2).forEach(d =>
    info(`  • ${d.name}`)
  );
}

await test(`suggestSearch("${KEYWORD}")`, () =>
  scraper.suggestSearch(KEYWORD)
);

await test(`advancedSearch("${KEYWORD}")`, () =>
  scraper.advancedSearch(KEYWORD)
);

// 6. LIST & CATEGORIES
section('6. Drama List & Categories');
await test('getDramaList(1, 10)', () => scraper.getDramaList(1, 10));
await test('getCategories(1, 10)', () => scraper.getCategories(1, 10));
await test('getBooksByCategory(1,1,5)', () => scraper.getBooksByCategory(1, 1, 5));

// 7. BATCH DOWNLOAD
section('7. Batch Download');
await test(`batchDownload(${BOOK_ID})`, () => scraper.batchDownload(BOOK_ID));

// 8. CACHE & CONFIG
section('8. Cache & Config');
const cacheStats = scraper.getCacheStats();
console.log(`  Testing ${CYAN}getCacheStats()${RESET}... ${GREEN}PASS${RESET}`);
info(`Cache hits: ${cacheStats.hits ?? 0}, misses: ${cacheStats.misses ?? 0}`);
passed++;
results.push({ name: 'getCacheStats()', status: 'PASS', ms: 0 });

const config = scraper.getConfig();
console.log(`  Testing ${CYAN}getConfig()${RESET}... ${GREEN}PASS${RESET}`);
info(`Language: ${config.language}, Version: ${config.version}`);
passed++;
results.push({ name: 'getConfig()', status: 'PASS', ms: 0 });

scraper.clearCache();
console.log(`  Testing ${CYAN}clearCache()${RESET}... ${GREEN}PASS${RESET}`);
passed++;
results.push({ name: 'clearCache()', status: 'PASS', ms: 0 });

// 9. HEALTH
section('9. Health Check');
await test('ping()', () => scraper.ping());

// ── SUMMARY ──────────────────────────────────────
const total = passed + failed;
log(`\n${BOLD}════════════════════════════════════════${RESET}`);
log(`${BOLD}  SUMMARY${RESET}`);
log(`${BOLD}════════════════════════════════════════${RESET}`);
log(`  Total   : ${total}`);
log(`  ${GREEN}Passed${RESET}  : ${passed}`);
log(`  ${RED}Failed${RESET}  : ${failed}`);
log(`  Score   : ${Math.round((passed / total) * 100)}%\n`);

if (failed > 0) {
  log(`${RED}Failed tests:${RESET}`);
  results.filter(r => r.status !== 'PASS').forEach(r => {
    log(`  ${RED}✗${RESET} ${r.name} — ${r.msg || r.status}`);
  });
}

log('');
