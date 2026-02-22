import * as fs from 'fs';
import * as path from 'path';

function walkDir(dir: string, callback: (filepath: string) => void) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'public') continue;
        const filepath = path.join(dir, file);
        const stats = fs.statSync(filepath);
        if (stats.isDirectory()) {
            walkDir(filepath, callback);
        } else if (
            stats.isFile() &&
            (filepath.endsWith('.ts') || filepath.endsWith('.tsx')) &&
            !filepath.includes('codemod')
        ) {
            callback(filepath);
        }
    }
}

let modifiedCount = 0;

walkDir(__dirname, (filepath) => {
    let content = fs.readFileSync(filepath, 'utf8');
    let originalContent = content;

    content = content.replace(/tablesDB\.listDocuments/g, 'tablesDB.listRows');
    content = content.replace(/tablesDB\.createDocument/g, 'tablesDB.createRow');
    content = content.replace(/tablesDB\.getDocument/g, 'tablesDB.getRow');
    content = content.replace(/tablesDB\.updateDocument/g, 'tablesDB.updateRow');
    content = content.replace(/tablesDB\.deleteDocument/g, 'tablesDB.deleteRow');
    content = content.replace(/tablesDB\.upsertDocument/g, 'tablesDB.upsertRow');

    if (content !== originalContent) {
        fs.writeFileSync(filepath, content, 'utf8');
        modifiedCount++;
        console.log('Fixed ' + filepath);
    }
});
console.log('Fixed ' + modifiedCount + ' files.');
