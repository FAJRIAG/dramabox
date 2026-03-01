const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            if (!filePath.includes('node_modules') && !filePath.includes('.git')) {
                results = results.concat(walk(filePath));
            }
        } else {
            results.push(filePath);
        }
    });
    return results;
}

const files = walk('./');
files.forEach(file => {
    if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.json') || file.endsWith('.md') || file.endsWith('LICENSE') || file.includes('package')) {
        let content = fs.readFileSync(file, 'utf8');

        // Replace logic
        let newContent = content
            .replace(/@jridev/dramabox/g, '@jridev/dramabox')
            .replace(/Jridev/g, 'Jridev')
            .replace(/Jridev/g, 'Jridev')
            .replace(/@jridev\//g, '@jridev/')
            .replace(/jridev/g, 'jridev')
            .replace(/Jridev/g, 'Jridev')
            .replace(/Jridev/g, 'Jridev');

        if (content !== newContent) {
            fs.writeFileSync(file, newContent);
            console.log('Updated:', file);
        }
    }
});
