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

// Root / Health Check
const apiDocHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jridev Dramabox API Documentation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #2980b9; margin-top: 30px; }
        .endpoint { background: #fff; border-left: 4px solid #3498db; padding: 15px; margin-bottom: 20px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .method { display: inline-block; background: #2ecc71; color: white; padding: 3px 8px; border-radius: 3px; font-weight: bold; font-size: 0.85em; margin-right: 10px; }
        .path { font-family: monospace; font-size: 1.1em; color: #e74c3c; }
        .desc { margin-top: 10px; color: #555; }
        .params { margin-top: 10px; background: #f8f9fa; padding: 10px; border-radius: 4px; font-size: 0.9em; }
        .params strong { color: #2c3e50; }
        code { background: #eee; padding: 2px 5px; border-radius: 3px; font-family: monospace; }
        footer { margin-top: 50px; text-align: center; color: #7f8c8d; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>🎬 Jridev Dramabox API</h1>
    <p>Welcome to the Unofficial Dramabox API Wrapper. Below is the list of available endpoints and how to use them.</p>

    <h2>🌟 Core Endpoints</h2>
    
    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/ping</span>
        <div class="desc">Check if the scraper and API are online and functioning.</div>
    </div>

    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/homepage</span>
        <div class="desc">Retrieve the main Dramabox homepage data (banners, sections).</div>
    </div>

    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/trending</span>
        <div class="desc">Get the trending/top globally ranked dramas.</div>
    </div>

    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/latest</span>
        <div class="desc">Get the latest updated dramas.</div>
        <div class="params"><strong>Query Parameters:</strong> <code>?page=1</code> (default: 1)</div>
    </div>

    <h2>🔍 Search & Discovery</h2>

    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/search</span>
        <div class="desc">Search for a specific drama by title or keyword.</div>
        <div class="params"><strong>Query Parameters:</strong> <code>?q=keyword</code> (required), <code>?page=1</code>, <code>?size=20</code></div>
    </div>

    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/categories</span>
        <div class="desc">List all available drama genres and categories.</div>
    </div>

    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/category/:id</span>
        <div class="desc">Get dramas belonging to a specific category ID (e.g., 1001).</div>
        <div class="params"><strong>Params:</strong> <code>id</code> (Category ID). <strong>Query:</strong> <code>?page=1</code>, <code>?size=20</code></div>
    </div>

    <h2>📖 Drama Details & Episodes</h2>

    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/drama/:id</span>
        <div class="desc">Get full metadata, tags, and summary for a specific drama/book ID (e.g., 41000107296).</div>
    </div>

    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/drama/:id/chapters</span>
        <div class="desc">Get the list of all available episodes/chapters for a drama.</div>
    </div>

    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/drama/:id/stream/:ep</span>
        <div class="desc">Get the raw MP4 and M3U8 streaming URLs for a specific episode.</div>
        <div class="params"><strong>Params:</strong> <code>id</code> (Drama ID), <code>ep</code> (Episode number, default: 1)</div>
    </div>

    <footer>
        <p>Created by Jridev ⚡ Powered by Node.js & Express</p>
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

app.listen(port as number, '0.0.0.0', () => {
    console.log(`\n========================================`);
    console.log(`  Jridev Dramabox API Server is LIVE!`);
    console.log(`========================================`);
    console.log(`🚀 Server running on port ${port} `);
    console.log(`👉 Test: http://localhost:${port}/api/ping`);
    console.log(`========================================\n`);
});
