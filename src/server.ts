import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DramaboxScraper } from './Dramabox';

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
app.get('/', (_req: Request, res: Response) => {
    res.json({
        name: 'Dramabox API',
        status: 'Online',
        version: '1.0.0',
        creator: 'Jridev'
    });
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
    console.log(`🚀 Server running on port ${port}`);
    console.log(`👉 Test: http://localhost:${port}/api/ping`);
    console.log(`========================================\n`);
});
