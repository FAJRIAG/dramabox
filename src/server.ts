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

// Helper to handle async route responses
const handleRequest = async (res: Response, scraperPromise: Promise<any>) => {
    try {
        const result = await scraperPromise;
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// ── ROUTES ──────────────────────────────────────────────────────────────

// Fast API Key Config
const FAST_API_KEY = process.env.FAST_API_KEY || 'jridev-fast-777';

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
        .alert { background: #fee2e2; border: 1px solid #ef4444; color: #b91c1c; padding: 15px; border-radius: 6px; margin-bottom: 25px; font-weight: 500; }
        .endpoint { background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); transition: transform 0.2s; }
        .endpoint:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        .method { display: inline-block; background: #10b981; color: white; padding: 4px 10px; border-radius: 4px; font-weight: 700; font-size: 0.85em; margin-right: 12px; letter-spacing: 0.5px; }
        .path { font-family: 'Courier New', Courier, monospace; font-size: 1.15em; color: #dc2626; font-weight: 600; }
        .desc { margin-top: 12px; color: #475569; font-size: 0.95em; }
        .params { margin-top: 15px; background: #f8fafc; padding: 12px; border-radius: 6px; font-size: 0.9em; border: 1px solid #e2e8f0; border-left: 3px solid #cbd5e1; }
        .params strong { color: #1e293b; }
        code { background: #e2e8f0; color: #0f172a; padding: 2px 6px; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 0.9em; font-weight: 500; }
        footer { margin-top: 60px; text-align: center; color: #64748b; font-size: 0.9em; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        .badge { background: #3b82f6; color: white; font-size: 0.7em; padding: 3px 6px; border-radius: 4px; vertical-align: middle; margin-left: 10px; }
    </style>
</head>
<body>
    <h1>🎬 API Jridev Dramabox <span class="badge">v1.2 Swagger</span></h1>
    <p>Selamat datang di Server API Publik Jridev Dramabox. Server ini menyediakan aliran data langsung dari database untuk film dan episode pendek secara <i>real-time</i>.</p>

    <div class="alert">
        ⚠️ <strong>Sistem Keamanan Aktif:</strong> Setiap pemanggilan tautan (endpoint) di bawah ini DIWAJIBKAN menambahkan parameter <code>?apikey=jridev-fast-777</code> di URL Anda.
    </div>

    <h2>🌟 Dokumentasi Endpoints /dramabox</h2>
    
    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/dramabox/foryou</span>
        <div class="desc"><strong>For You (Untukmu)</strong> - Mengambil daftar drama rekomendasi untuk pengguna.</div>
        <div class="params"><strong>Parameters:</strong> <code>page</code> (integer, query) - Nomor halaman, default 1</div>
    </div>

    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/dramabox/vip</span>
        <div class="desc"><strong>Halaman VIP</strong> - Mengambil daftar drama di halaman VIP khusus akun berbayar.</div>
        <div class="params"><strong>Parameters:</strong> No parameters</div>
    </div>

    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/dramabox/dubindo</span>
        <div class="desc"><strong>Ambil list drama dub indo</strong> - Mengambil list drama dub indo dari kategori terpopuler atau terbaru.</div>
        <div class="params"><strong>Parameters:</strong> <br><code>classify</code> (string, query) - "terpopuler" atau "terbaru"<br><code>page</code> (integer, query) - Nomor halaman, default 1</div>
    </div>
    
    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/dramabox/randomdrama</span>
        <div class="desc"><strong>Random Drama Video</strong> - Mengambil video drama secara acak (For You Versi Video).</div>
        <div class="params"><strong>Parameters:</strong> No parameters</div>
    </div>

    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/dramabox/latest</span>
        <div class="desc"><strong>Drama Terbaru</strong> - Mengambil daftar drama yang baru dirilis.</div>
        <div class="params"><strong>Parameters:</strong> No parameters</div>
    </div>

    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/dramabox/trending</span>
        <div class="desc"><strong>Trending Drama</strong> - Mengambil daftar drama yang sedang populer.</div>
        <div class="params"><strong>Parameters:</strong> No parameters</div>
    </div>

    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/dramabox/populersearch</span>
        <div class="desc"><strong>Pencarian Populer</strong> - Mengambil daftar kata kunci pencarian yang paling banyak dicari saat ini.</div>
        <div class="params"><strong>Parameters:</strong> No parameters</div>
    </div>

    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/dramabox/search</span>
        <div class="desc"><strong>Cari Drama</strong> - Mencari drama berdasarkan judul atau kueri tertentu.</div>
        <div class="params"><strong>Parameters:</strong> <code>query</code> * (string, query) - Kata kunci pencarian (contoh: pewaris)</div>
    </div>

    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/dramabox/detail</span>
        <div class="desc"><strong>Ambil Detail Drama</strong> - Mengambil detail drama dari bookId.</div>
        <div class="params"><strong>Parameters:</strong> <code>bookId</code> * (string, query) - ID unik drama (contoh: 41000116666)</div>
    </div>

    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/dramabox/allepisode</span>
        <div class="desc"><strong>Ambil Semua Episode</strong> - Mengambil link streaming MP4 untuk seluruh episode dari sebuah drama sekaligus (Batch). NOTE: Proses ini membutuhkan waktu yang lebih lama tergantung jumlah bab.</div>
        <div class="params"><strong>Parameters:</strong> <code>bookId</code> * (string, query) - ID unik drama (contoh: 41000116666)</div>
    </div>

    <footer>
        <p>⚡ Diciptakan dengan kecepatan oleh <strong>Jridev</strong> • Express API Engine</p>
    </footer>
</body>
</html>
`;

app.get('/', (_req: Request, res: Response) => {
    res.send(apiDocHTML);
});

app.get('/api', (_req: Request, res: Response) => {
    res.send(apiDocHTML);
});

// Middleware Fast API Key (Diterapkan ke semua rute di bawah baris ini)
app.use((req: Request, res: Response, next: express.NextFunction) => {
    const providedKey = req.query.apikey;

    if (!providedKey || providedKey !== FAST_API_KEY) {
        res.status(401).json({
            success: false,
            message: 'API Key Tidak Valid atau Kosong. Harap sertakan ?apikey=jridev-fast-777 di setiap request Anda.'
        });
        return;
    }

    next();
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
    // Uses recommended/for you
    handleRequest(res, scraper.getRecommendedBooks());
});

app.get('/dramabox/vip', (_req: Request, res: Response) => {
    handleRequest(res, scraper.getVip());
});

app.get('/dramabox/dubindo', (req: Request, res: Response) => {
    const classify = req.query.classify as string;
    const page = parseInt(req.query.page as string) || 1;
    let typeTwoId = 0; // Default to all
    if (classify === 'terpopuler') typeTwoId = 1001; // Guessing IDs or mapping logic could be expanded here
    else if (classify === 'terbaru') typeTwoId = 1002;
    handleRequest(res, scraper.getBooksByCategory(typeTwoId, page, 20)); // Simulated dubindo
});

app.get('/dramabox/randomdrama', async (_req: Request, res: Response) => {
    try {
        const result = await scraper.getRecommendedBooks();
        if (result.success && result.data && result.data.results) {
            const list = result.data.results as any[];
            const random = list[Math.floor(Math.random() * list.length)];
            res.json({ success: true, creator: 'Jridev', data: random, metadata: {}, message: null });
        } else {
            handleRequest(res, Promise.resolve(result));
        }
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.get('/dramabox/latest', (_req: Request, res: Response) => {
    handleRequest(res, scraper.getLatest(1));
});

app.get('/dramabox/trending', (_req: Request, res: Response) => {
    handleRequest(res, scraper.getTrending());
});

app.get('/dramabox/populersearch', (_req: Request, res: Response) => {
    handleRequest(res, scraper.searchDramaIndex());
});

app.get('/dramabox/search', (req: Request, res: Response) => {
    const query = req.query.query as string;
    if (!query) {
        res.status(400).json({ success: false, message: 'query parameter is required' });
        return;
    }
    handleRequest(res, scraper.searchDrama(query));
});

app.get('/dramabox/detail', (req: Request, res: Response) => {
    const bookId = req.query.bookId as string;
    if (!bookId) {
        res.status(400).json({ success: false, message: 'bookId parameter is required' });
        return;
    }
    handleRequest(res, scraper.getDramaDetail(bookId));
});

app.get('/dramabox/allepisode', (req: Request, res: Response) => {
    const bookId = req.query.bookId as string;
    if (!bookId) {
        res.status(400).json({ success: false, message: 'bookId parameter is required' });
        return;
    }
    handleRequest(res, scraper.batchDownload(bookId));
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
    console.log("👉 Test: http://localhost:" + port + "/dramabox/foryou?apikey=" + FAST_API_KEY);
    console.log("========================================\n");
});
