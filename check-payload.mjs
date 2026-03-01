import DramaboxScraper from './dist/esm/Dramabox.js';

const scraper = new DramaboxScraper({ language: 'in' });

async function init() {
    await scraper.generateToken();
    const res = await scraper.getDramaDetailV2('41000107296');
    console.log(JSON.stringify(res.data, null, 2));
}

init();
