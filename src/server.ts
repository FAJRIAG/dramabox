import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DramaboxScraper } from './Dramabox.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize scraper
const scraper = new DramaboxScraper({
    language: process.env.SCRAPER_LANG || 'in',
    timeout: 30000,
    maxRetries: 3
});

// Helper to handle async route responses with emoji logging
const handleRequest = async (res: Response, scraperPromise: Promise<any>, label?: string) => {
    try {
        const result = await scraperPromise;
        if (label) {
            if (result.success) {
                console.log('✅ SUCCESS GET ' + label);
            } else {
                console.log('❌ FAILED GET ' + label + (result.message ? ' | ' + result.message : ''));
            }
        }
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error: any) {
        if (label) console.log('❌ ERROR GET ' + label + ' | ' + error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// ── ROUTES ──────────────────────────────────────────────────────────────

// Root / Health Check
const apiDocHTML = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buku Panduan API Jridev Dramabox v1.2</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f4f6f9; }
        h1 { color: #1e293b; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; font-weight: 800; display: flex; align-items: center; gap: 10px; }
        h2 { color: #2563eb; margin-top: 35px; border-left: 4px solid #3b82f6; padding-left: 10px; }
        .endpoint { background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 12px; box-shadow: 0 2px 4px -1px rgba(0,0,0,0.04); overflow: hidden; }
        .ep-header { display: flex; align-items: center; padding: 14px 18px; cursor: pointer; gap: 12px; user-select: none; background: #fff; border: none; width: 100%; text-align: left; }
        .ep-header:hover { background-color: #f8faff; }
        .ep-body { display: none; border-top: 1px solid #e2e8f0; background: #fafbfd; padding: 18px 20px; }
        .ep-body.open { display: block; }
        .method-get { display: inline-block; background: #61affe; color: white; padding: 5px 12px; border-radius: 4px; font-weight: 700; font-size: 0.8em; min-width: 60px; text-align: center; }
        .ep-path { font-family: 'Courier New', monospace; font-size: 1em; font-weight: 600; color: #1a1a1a; flex: 1; }
        .ep-title { color: #555; font-size: 0.9em; }
        .ep-desc { color: #475569; font-size: 0.9em; margin-bottom: 16px; }
        .chevron { margin-left: auto; color: #888; font-size: 0.75em; transition: transform 0.2s; }
        .ep-header.active .chevron { transform: rotate(180deg); }
        .params-title { font-weight: 700; font-size: 0.95em; border-bottom: 3px solid #4990e2; color: #2c3e50; padding-bottom: 4px; margin-bottom: 12px; display: inline-block; }
        .param-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .param-table th { text-align: left; font-weight: 700; font-size: 0.82em; color: #444; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
        .param-table td { padding: 8px 8px; border-bottom: 1px solid #f0f4f8; vertical-align: top; font-size: 0.88em; }
        .param-name { font-weight: 700; color: #212529; }
        .param-type { color: #777; font-size: 0.78em; }
        .param-req { color: #e74c3c; font-size: 0.78em; font-style: italic; }
        .param-input { width: 100%; padding: 7px 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9em; box-sizing: border-box; }
        .btn-execute { width: 100%; padding: 12px; background: #4990e2; color: white; border: none; border-radius: 5px; font-size: 1em; font-weight: 600; cursor: pointer; margin-top: 8px; }
        .btn-execute:hover { background: #3476c8; }
        .btn-cancel { float: right; padding: 4px 12px; background: white; color: #e74c3c; border: 1px solid #e74c3c; border-radius: 4px; font-size: 0.85em; cursor: pointer; }
        .response-area { margin-top: 14px; }
        .response-label { font-weight: 700; font-size: 0.82em; color: #444; margin-bottom: 6px; }
        pre.response-box { background: #1e1e2e; color: #cdd6f4; padding: 14px; border-radius: 6px; overflow-x: auto; font-size: 0.8em; white-space: pre-wrap; word-break: break-all; max-height: 350px; display: none; }
        .badge { background: #3b82f6; color: white; font-size: 0.7em; padding: 3px 8px; border-radius: 4px; vertical-align: middle; margin-left: 8px; }
        footer { margin-top: 60px; text-align: center; color: #64748b; font-size: 0.9em; border-top: 1px solid #e2e8f0; padding-top: 20px; }
    </style>
</head>
<body>
    <h1>🎬 API Jridev Dramabox <span class="badge">v1.2 Swagger</span></h1>
    <p>Selamat datang di Server API Publik Jridev Dramabox. Klik salah satu endpoint di bawah untuk mencoba langsung.</p>

    <h2>🌟 Dramabox Endpoints</h2>

    <!-- FORYOU -->
    <div class="endpoint">
        <button class="ep-header" onclick="toggleEp(this)">
            <span class="method-get">GET</span>
            <span class="ep-path">/dramabox/foryou</span>
            <span class="ep-title">For You (Untukmu)</span>
            <span class="chevron">▼</span>
        </button>
        <div class="ep-body">
            <div class="ep-desc">Mengambil daftar drama rekomendasi untuk pengguna.</div>
            <button class="btn-cancel" onclick="toggleEp(this.closest('.ep-body').previousElementSibling)">Cancel</button>
            <span class="params-title">Parameters</span>
            <table class="param-table">
                <tr><th>Name</th><th>Description</th></tr>
                <tr>
                    <td><div class="param-name">page</div><div class="param-type">integer (query)</div></td>
                    <td><div>Nomor halaman, default 1</div><input class="param-input" id="foryou_page" placeholder="page"></td>
                </tr>
            </table>
            <button class="btn-execute" onclick="execApi('/dramabox/foryou', {page: document.getElementById('foryou_page').value}, 'foryou_res')">Execute</button>
            <div class="response-area"><div class="response-label">Response:</div><pre class="response-box" id="foryou_res"></pre></div>
        </div>
    </div>

    <!-- VIP -->
    <div class="endpoint">
        <button class="ep-header" onclick="toggleEp(this)">
            <span class="method-get">GET</span>
            <span class="ep-path">/dramabox/vip</span>
            <span class="ep-title">Halaman VIP</span>
            <span class="chevron">▼</span>
        </button>
        <div class="ep-body">
            <div class="ep-desc">Mengambil daftar drama di halaman VIP.</div>
            <button class="btn-cancel" onclick="toggleEp(this.closest('.ep-body').previousElementSibling)">Cancel</button>
            <span class="params-title">Parameters</span>
            <p style="color:#888;font-size:0.85em">No parameters</p>
            <button class="btn-execute" onclick="execApi('/dramabox/vip', {}, 'vip_res')">Execute</button>
            <div class="response-area"><div class="response-label">Response:</div><pre class="response-box" id="vip_res"></pre></div>
        </div>
    </div>

    <!-- DUBINDO -->
    <div class="endpoint">
        <button class="ep-header" onclick="toggleEp(this)">
            <span class="method-get">GET</span>
            <span class="ep-path">/dramabox/dubindo</span>
            <span class="ep-title">Ambil list drama dub indo</span>
            <span class="chevron">▼</span>
        </button>
        <div class="ep-body">
            <div class="ep-desc">Mengambil list drama dub indo dari kategori terpopuler atau terbaru.</div>
            <button class="btn-cancel" onclick="toggleEp(this.closest('.ep-body').previousElementSibling)">Cancel</button>
            <span class="params-title">Parameters</span>
            <table class="param-table">
                <tr><th>Name</th><th>Description</th></tr>
                <tr>
                    <td><div class="param-name">classify <span class="param-req">* required</span></div><div class="param-type">string (query)</div></td>
                    <td><div>Classify = terpopuler atau terbaru</div><input class="param-input" id="dubindo_classify" placeholder="classify"></td>
                </tr>
                <tr>
                    <td><div class="param-name">page</div><div class="param-type">integer (query)</div></td>
                    <td><div>Nomor halaman.</div><input class="param-input" id="dubindo_page" placeholder="page"></td>
                </tr>
            </table>
            <button class="btn-execute" onclick="execApi('/dramabox/dubindo', {classify: document.getElementById('dubindo_classify').value, page: document.getElementById('dubindo_page').value}, 'dubindo_res')">Execute</button>
            <div class="response-area"><div class="response-label">Response:</div><pre class="response-box" id="dubindo_res"></pre></div>
        </div>
    </div>

    <!-- RANDOM DRAMA -->
    <div class="endpoint">
        <button class="ep-header" onclick="toggleEp(this)">
            <span class="method-get">GET</span>
            <span class="ep-path">/dramabox/randomdrama</span>
            <span class="ep-title">Random Drama Video</span>
            <span class="chevron">▼</span>
        </button>
        <div class="ep-body">
            <div class="ep-desc">Mengambil video drama secara acak (For You Versi Video).</div>
            <button class="btn-cancel" onclick="toggleEp(this.closest('.ep-body').previousElementSibling)">Cancel</button>
            <span class="params-title">Parameters</span>
            <p style="color:#888;font-size:0.85em">No parameters</p>
            <button class="btn-execute" onclick="execApi('/dramabox/randomdrama', {}, 'random_res')">Execute</button>
            <div class="response-area"><div class="response-label">Response:</div><pre class="response-box" id="random_res"></pre></div>
        </div>
    </div>

    <!-- LATEST -->
    <div class="endpoint">
        <button class="ep-header" onclick="toggleEp(this)">
            <span class="method-get">GET</span>
            <span class="ep-path">/dramabox/latest</span>
            <span class="ep-title">Drama Terbaru</span>
            <span class="chevron">▼</span>
        </button>
        <div class="ep-body">
            <div class="ep-desc">Mengambil daftar drama yang baru dirilis.</div>
            <button class="btn-cancel" onclick="toggleEp(this.closest('.ep-body').previousElementSibling)">Cancel</button>
            <span class="params-title">Parameters</span>
            <p style="color:#888;font-size:0.85em">No parameters</p>
            <button class="btn-execute" onclick="execApi('/dramabox/latest', {}, 'latest_res')">Execute</button>
            <div class="response-area"><div class="response-label">Response:</div><pre class="response-box" id="latest_res"></pre></div>
        </div>
    </div>

    <!-- TRENDING -->
    <div class="endpoint">
        <button class="ep-header" onclick="toggleEp(this)">
            <span class="method-get">GET</span>
            <span class="ep-path">/dramabox/trending</span>
            <span class="ep-title">Trending Drama</span>
            <span class="chevron">▼</span>
        </button>
        <div class="ep-body">
            <div class="ep-desc">Mengambil daftar drama yang sedang populer.</div>
            <button class="btn-cancel" onclick="toggleEp(this.closest('.ep-body').previousElementSibling)">Cancel</button>
            <span class="params-title">Parameters</span>
            <p style="color:#888;font-size:0.85em">No parameters</p>
            <button class="btn-execute" onclick="execApi('/dramabox/trending', {}, 'trending_res')">Execute</button>
            <div class="response-area"><div class="response-label">Response:</div><pre class="response-box" id="trending_res"></pre></div>
        </div>
    </div>

    <!-- POPULERSEARCH -->
    <div class="endpoint">
        <button class="ep-header" onclick="toggleEp(this)">
            <span class="method-get">GET</span>
            <span class="ep-path">/dramabox/populersearch</span>
            <span class="ep-title">Pencarian Populer</span>
            <span class="chevron">▼</span>
        </button>
        <div class="ep-body">
            <div class="ep-desc">Mengambil daftar kata kunci pencarian yang paling banyak dicari.</div>
            <button class="btn-cancel" onclick="toggleEp(this.closest('.ep-body').previousElementSibling)">Cancel</button>
            <span class="params-title">Parameters</span>
            <p style="color:#888;font-size:0.85em">No parameters</p>
            <button class="btn-execute" onclick="execApi('/dramabox/populersearch', {}, 'populer_res')">Execute</button>
            <div class="response-area"><div class="response-label">Response:</div><pre class="response-box" id="populer_res"></pre></div>
        </div>
    </div>

    <!-- SEARCH -->
    <div class="endpoint">
        <button class="ep-header" onclick="toggleEp(this)">
            <span class="method-get">GET</span>
            <span class="ep-path">/dramabox/search</span>
            <span class="ep-title">Cari Drama</span>
            <span class="chevron">▼</span>
        </button>
        <div class="ep-body">
            <div class="ep-desc">Mencari drama berdasarkan judul atau kueri tertentu.</div>
            <button class="btn-cancel" onclick="toggleEp(this.closest('.ep-body').previousElementSibling)">Cancel</button>
            <span class="params-title">Parameters</span>
            <table class="param-table">
                <tr><th>Name</th><th>Description</th></tr>
                <tr>
                    <td><div class="param-name">query <span class="param-req">* required</span></div><div class="param-type">string (query)</div></td>
                    <td><div>Kata kunci pencarian (contoh: pewaris)</div><input class="param-input" id="search_query" placeholder="query"></td>
                </tr>
            </table>
            <button class="btn-execute" onclick="execApi('/dramabox/search', {query: document.getElementById('search_query').value}, 'search_res')">Execute</button>
            <div class="response-area"><div class="response-label">Response:</div><pre class="response-box" id="search_res"></pre></div>
        </div>
    </div>

    <!-- DETAIL -->
    <div class="endpoint">
        <button class="ep-header" onclick="toggleEp(this)">
            <span class="method-get">GET</span>
            <span class="ep-path">/dramabox/detail</span>
            <span class="ep-title">Ambil Detail Drama</span>
            <span class="chevron">▼</span>
        </button>
        <div class="ep-body">
            <div class="ep-desc">Mengambil detail drama dari bookId.</div>
            <button class="btn-cancel" onclick="toggleEp(this.closest('.ep-body').previousElementSibling)">Cancel</button>
            <span class="params-title">Parameters</span>
            <table class="param-table">
                <tr><th>Name</th><th>Description</th></tr>
                <tr>
                    <td><div class="param-name">bookId <span class="param-req">* required</span></div><div class="param-type">string (query)</div></td>
                    <td><div>ID unik drama (contoh: 41000116666)</div><input class="param-input" id="detail_bookid" placeholder="bookId"></td>
                </tr>
            </table>
            <button class="btn-execute" onclick="execApi('/dramabox/detail', {bookId: document.getElementById('detail_bookid').value}, 'detail_res')">Execute</button>
            <div class="response-area"><div class="response-label">Response:</div><pre class="response-box" id="detail_res"></pre></div>
        </div>
    </div>

    <!-- ALL EPISODE -->
    <div class="endpoint">
        <button class="ep-header" onclick="toggleEp(this)">
            <span class="method-get">GET</span>
            <span class="ep-path">/dramabox/allepisode</span>
            <span class="ep-title">Ambil Semua Episode</span>
            <span class="chevron">▼</span>
        </button>
        <div class="ep-body">
            <div class="ep-desc">Mengambil link streaming untuk seluruh episode dari sebuah drama.<br><strong>NOTE:</strong> Proses ini membutuhkan waktu tergantung jumlah episode.</div>
            <button class="btn-cancel" onclick="toggleEp(this.closest('.ep-body').previousElementSibling)">Cancel</button>
            <span class="params-title">Parameters</span>
            <table class="param-table">
                <tr><th>Name</th><th>Description</th></tr>
                <tr>
                    <td><div class="param-name">bookId <span class="param-req">* required</span></div><div class="param-type">string (query)</div></td>
                    <td><div>ID unik drama (contoh: 41000116666)</div><input class="param-input" id="allep_bookid" placeholder="bookId"></td>
                </tr>
            </table>
            <button class="btn-execute" onclick="execApi('/dramabox/allepisode', {bookId: document.getElementById('allep_bookid').value}, 'allep_res')">Execute</button>
            <div class="response-area"><div class="response-label">Response:</div><pre class="response-box" id="allep_res"></pre></div>
        </div>
    </div>

    <footer><p>⚡ Diciptakan dengan kecepatan oleh <strong>Jridev</strong> • Express API Engine</p></footer>

    <script>
        function toggleEp(btn) {
            const body = btn.nextElementSibling;
            const isOpen = body.classList.contains('open');
            document.querySelectorAll('.ep-body.open').forEach(b => { b.classList.remove('open'); b.previousElementSibling.classList.remove('active'); });
            if (!isOpen) { body.classList.add('open'); btn.classList.add('active'); }
        }
        async function execApi(path, params, responseId) {
            const el = document.getElementById(responseId);
            el.style.display = 'block';
            el.textContent = 'Loading...';
            const filtered = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== '' && v !== null));
            const qs = new URLSearchParams(filtered).toString();
            const url = path + (qs ? '?' + qs : '');
            try {
                const r = await fetch(url);
                const data = await r.json();
                el.textContent = JSON.stringify(data, null, 2);
            } catch (e) {
                el.textContent = 'Error: ' + e.message;
            }
        }
    </script>
</body>
</html>
`;

app.get('/', (_req: Request, res: Response) => {
    res.send(apiDocHTML);
});

app.get('/api', (_req: Request, res: Response) => {
    res.send(apiDocHTML);
});

app.get('/api/ping', (_req: Request, res: Response) => {
    handleRequest(res, scraper.ping());
});

app.get('/api/config', (_req: Request, res: Response) => {
    handleRequest(res, scraper.getConfig());
});

// Auth (Generate Token)
app.post('/api/token', (_req: Request, res: Response) => {
    handleRequest(res, scraper.generateToken().then(data => ({ success: true, data })));
});

// Browse
app.get('/api/latest', (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    handleRequest(res, scraper.getLatest(page));
});

app.get('/api/trending', (_req: Request, res: Response) => {
    handleRequest(res, scraper.getTrending());
});

app.get('/api/vip', (_req: Request, res: Response) => {
    handleRequest(res, scraper.getVip());
});

app.get('/api/homepage', (_req: Request, res: Response) => {
    handleRequest(res, scraper.getHomepage());
});

app.get('/api/recommended', (_req: Request, res: Response) => {
    handleRequest(res, scraper.getRecommendedBooks());
});

// Drama Detail & Episodes
app.get('/api/drama/:id', (req: Request, res: Response) => {
    handleRequest(res, scraper.getDramaDetail(req.params.id as string));
});

app.get('/api/drama/v2/:id', (req: Request, res: Response) => {
    handleRequest(res, scraper.getDramaDetailV2(req.params.id as string));
});

app.get('/api/drama/:id/related', (req: Request, res: Response) => {
    handleRequest(res, scraper.getRelatedDramas(req.params.id as string));
});

app.get('/api/drama/:id/chapters', (req: Request, res: Response) => {
    handleRequest(res, scraper.getChapters(req.params.id as string));
});

app.get('/api/drama/:id/episode/:ep', (req: Request, res: Response) => {
    const ep = parseInt(req.params.ep as string) || 1;
    handleRequest(res, scraper.getEpisodeDetails(req.params.id as string, ep));
});

app.get('/api/drama/:id/stream/:ep', (req: Request, res: Response) => {
    const ep = parseInt(req.params.ep as string) || 1;
    handleRequest(res, scraper.getStreamUrl(req.params.id as string, ep));
});

// Search
app.get('/api/search/index', (_req: Request, res: Response) => {
    handleRequest(res, scraper.searchDramaIndex());
});

app.get('/api/search', (req: Request, res: Response) => {
    const keyword = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 20;

    if (!keyword) {
        res.status(400).json({ success: false, message: 'Query parameter "q" is required' });
        return;
    }
    handleRequest(res, scraper.searchDrama(keyword, page, size));
});

app.get('/api/search/suggest', (req: Request, res: Response) => {
    const keyword = req.query.q as string;
    if (!keyword) {
        res.status(400).json({ success: false, message: 'Query parameter "q" is required' });
        return;
    }
    handleRequest(res, scraper.suggestSearch(keyword));
});

app.get('/api/search/advanced', (req: Request, res: Response) => {
    const keyword = req.query.q as string;
    const pageNo = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.size as string) || 20;
    const type = req.query.type as string;

    handleRequest(res, scraper.advancedSearch(keyword, { type, pageNo, pageSize }));
});

// Categories & Lists
app.get('/api/list', (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 10;
    handleRequest(res, scraper.getDramaList(page, size));
});

app.get('/api/categories', (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 30;
    handleRequest(res, scraper.getCategories(page, size));
});

app.get('/api/category/:id', (req: Request, res: Response) => {
    const categoryId = parseInt(req.params.id as string);
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 20;
    handleRequest(res, scraper.getBooksByCategory(categoryId, page, size));
});

// ── SWAGGER UI ENDPOINTS ────────────────────────────────────────────────
app.get('/dramabox/foryou', (_req: Request, res: Response) => {
    handleRequest(res, scraper.getRecommendedBooks(), 'FORYOU');
});

app.get('/dramabox/vip', (_req: Request, res: Response) => {
    handleRequest(res, scraper.getVip(), 'VIP');
});

app.get('/dramabox/dubindo', (req: Request, res: Response) => {
    const classify = req.query.classify as string;
    const page = parseInt(req.query.page as string) || 1;
    let typeTwoId = 0;
    if (classify === 'terpopuler') typeTwoId = 1001;
    else if (classify === 'terbaru') typeTwoId = 1002;
    handleRequest(res, scraper.getBooksByCategory(typeTwoId, page, 20), 'DUBINDO (' + (classify || 'all') + ')');
});

app.get('/dramabox/randomdrama', async (_req: Request, res: Response) => {
    try {
        const result = await scraper.getRecommendedBooks();
        if (result.success && result.data && result.data.results) {
            const list = result.data.results as any[];
            const random = list[Math.floor(Math.random() * list.length)];
            console.log('✅ SUCCESS GET RANDOM DRAMA');
            res.json({ success: true, creator: 'Jridev', data: random, metadata: {}, message: null });
        } else {
            handleRequest(res, Promise.resolve(result), 'RANDOM DRAMA');
        }
    } catch (e: any) {
        console.log('❌ ERROR GET RANDOM DRAMA | ' + e.message);
        res.status(500).json({ success: false, message: e.message });
    }
});

app.get('/dramabox/latest', (_req: Request, res: Response) => {
    handleRequest(res, scraper.getLatest(1), 'LATEST');
});

app.get('/dramabox/trending', (_req: Request, res: Response) => {
    handleRequest(res, scraper.getTrending(), 'TRENDING');
});

app.get('/dramabox/populersearch', (_req: Request, res: Response) => {
    handleRequest(res, scraper.searchDramaIndex(), 'POPULERSEARCH');
});

app.get('/dramabox/search', (req: Request, res: Response) => {
    const query = req.query.query as string;
    if (!query) {
        res.status(400).json({ success: false, message: 'query parameter is required' });
        return;
    }
    handleRequest(res, scraper.searchDrama(query), 'SEARCH (' + query + ')');
});

app.get('/dramabox/detail', (req: Request, res: Response) => {
    const bookId = req.query.bookId as string;
    if (!bookId) {
        res.status(400).json({ success: false, message: 'bookId parameter is required' });
        return;
    }
    handleRequest(res, scraper.getDramaDetail(bookId), 'DETAIL [' + bookId + ']');
});

app.get('/dramabox/allepisode', (req: Request, res: Response) => {
    const bookId = req.query.bookId as string;
    if (!bookId) {
        res.status(400).json({ success: false, message: 'bookId parameter is required' });
        return;
    }
    const refresh = req.query.refresh === '1' || req.query.refresh === 'true';
    console.log('🚀 ALLEPISODE START [' + bookId + '] - proses batch dimulai...' + (refresh ? ' [CACHE BYPASS]' : ''));
    handleRequest(res, scraper.batchDownload(bookId, refresh), 'ALLEPISODE [' + bookId + ']');
});

// ── ERROR HANDLING & START ──────────────────────────────────────────────

// Handle 404
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

app.listen(Number(port), "0.0.0.0", () => {
    console.log("\n========================================");
    console.log("  Jridev Dramabox API Server is LIVE!");
    console.log("========================================");
    console.log("🚀 Server running on port " + port);
    console.log("👉 URL: http://localhost:" + port + "/");
    console.log("👉 Test: http://localhost:" + port + "/dramabox/foryou");
    console.log("========================================\n");
});
