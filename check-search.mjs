import DramaboxScraper from './dist/esm/Dramabox.js';

const scraper = new DramaboxScraper({ language: 'in' });

async function init() {
    await scraper.generateToken();
    const res = await scraper.searchDrama('El Regreso del Hombre Poderoso', 1, 5);
    console.log(JSON.stringify(res.data, null, 2));
}

init();
