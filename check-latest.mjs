import DramaboxScraper from './dist/esm/Dramabox.js';

const scraper = new DramaboxScraper({ language: 'in' });

async function init() {
    await scraper.generateToken();
    const res = await scraper.getLatest(1);

    // Find the specific book in the results
    const book = res.data?.results?.find(b => b.bookId === '41000107296');
    console.log(JSON.stringify(book || { error: 'Not found in latest' }, null, 2));
}

init();
