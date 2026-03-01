const { DramaboxScraper } = require('./src/Dramabox.ts');

async function main() {
    console.log("Inisialisasi Dramabox API Jridev...");
    const scraper = new DramaboxScraper({ language: 'in', timeout: 30000 });

    try {
        console.log("\n1. Mengambil Token Baru...");
        const token = await scraper.generateToken();
        console.log("Token Berhasil Didapat!");
        console.log("- Device ID:", token.deviceId);
        console.log("- Expiry:", new Date(token.expiry).toLocaleString());

        console.log("\n2. Mengambil Daftar Drama Terbaru (Page 1)...");
        const latest = await scraper.getLatest(1);

        if (latest.success) {
            console.log(`Berhasil mengambil ${latest.data.results.length} drama terbaru:`);
            latest.data.results.slice(0, 5).forEach((drama, index) => {
                console.log(`${index + 1}. ${drama.bookName} (${drama.chapterCount} Episode)`);
            });
            console.log("... dan seterusnya.");
        } else {
            console.log("Gagal mengambil data:", latest.message);
        }

    } catch (error) {
        console.error("Terjadi Kesalahan:", error.message);
    }
}

main();
