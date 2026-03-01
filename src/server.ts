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

// Root / Health Check
const apiDocHTML = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buku Panduan API Jridev Dramabox</title>
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
        .badge { background: #f59e0b; color: white; font-size: 0.7em; padding: 3px 6px; border-radius: 4px; vertical-align: middle; margin-left: 10px; }
    </style>
</head>
<body>
    <h1>🎬 API Jridev Dramabox <span class="badge">v1.1 Fast</span></h1>
    <p>Selamat datang di Server API Publik Jridev Dramabox. Server ini menyediakan aliran data langsung dari database untuk film dan episode pendek secara <i>real-time</i>.</p>

    <div class="alert">
        ⚠️ <strong>Sistem Keamanan Aktif:</strong> Setiap pemanggilan tautan (endpoint) di bawah ini DIWAJIBKAN menambahkan parameter <code>?apikey=jridev-fast-777</code> di akhir URL. Jika tidak, permintaan Anda akan ditolak secara otomatis.
    </div>

    <h2>🌟 Jalur Utama (Core)</h2>
    
    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/ping</span>
        <div class="desc">Memeriksa apakah mesin server menyala dan merespon dengan baik.</div>
        <div class="params"><strong>Contoh:</strong> <code>/api/ping?apikey=jridev-fast-777</code></div>
    </div>

    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/homepage</span>
        <div class="desc">Mengambil struktur lengkap halaman depan (banner promo, sekmen rekomendasi).</div>
    </div>

    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/trending</span>
        <div class="desc">Mendapatkan daftar film dengan peringkat paling populer / tren saat ini.</div>
    </div>

    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/latest</span>
        <div class="desc">Mengambil daftar film yang baru saja diperbarui episode-nya.</div>
        <div class="params"><strong>Parameter:</strong> <code>?page=1</code> (halaman tabel, bawaan: 1)</div>
    </div>

    <h2>🔍 Penemuan & Pencarian</h2>

    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/search</span>
        <div class="desc">Mencari judul film secara spesifik berdasarkan kata kunci.</div>
        <div class="params"><strong>Parameter Wajib:</strong> <code>?q=katakunci</code><br><strong>Opsional:</strong> <code>?page=1</code>, <code>?size=20</code></div>
    </div>

    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/categories</span>
        <div class="desc">Menampilkan seluruh daftar kategori dan genre film yang tersedia.</div>
    </div>

    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/category/:id</span>
        <div class="desc">Menampilkan daftar film yang masuk ke dalam kategori tertentu.</div>
        <div class="params"><strong>Format:</strong> <code>id</code> diganti dengan Angka Kategori (contoh: 1001).<br><strong>Opsional:</strong> <code>?page=1</code></div>
    </div>

    <h2>📖 Detail Judul & Episode Filem</h2>

    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/drama/:id</span>
        <div class="desc">Mengambil informasi sangat lengkap mengenai satu film, termasuk sinopsis, tag, dan jumlah tayang.</div>
        <div class="params"><strong>Format:</strong> <code>id</code> adalah angka Book ID (contoh: 41000107296).</div>
    </div>

    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/drama/:id/chapters</span>
        <div class="desc">Menampilkan daftar urutan babak (chapter) beserta ID video yang siap diputar.</div>
    </div>

    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/drama/:id/stream/:ep</span>
        <div class="desc">Mengekstrasi langsung *link* video murni (MP4 / M3U8) dari episode yang dipilih untuk diputar di aplikasi Anda.</div>
        <div class="params"><strong>Format:</strong> <code>ep</code> adalah nomor episode (contoh: 1 atau 5).</div>
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
    console.log("👉 Test: http://localhost:" + port + "/api/ping?apikey=" + FAST_API_KEY);
    console.log("========================================\n");
});
