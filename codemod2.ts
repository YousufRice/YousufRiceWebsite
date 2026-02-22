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

    // 1. Rename import
    content = content.replace(/import\s+\{([^}]*)(databases)([^}]*)\}\s+from\s+['"]@\/lib\/(appwrite|appwrite-server)['"]/g, (match, p1, p2, p3, p4) => {
        return `import {${p1}tablesDB${p3}} from "@/lib/${p4}"`;
    });

    // 2. Rename method calls
    content = content.replace(/databases\.listDocuments/g, 'tablesDB.listRows');
    content = content.replace(/databases\.createDocument/g, 'tablesDB.createRow');
    content = content.replace(/databases\.getDocument/g, 'tablesDB.getRow');
    content = content.replace(/databases\.updateDocument/g, 'tablesDB.updateRow');
    content = content.replace(/databases\.deleteDocument/g, 'tablesDB.deleteRow');
    content = content.replace(/databases\.upsertDocument/g, 'tablesDB.upsertRow');
    content = content.replace(/databases\./g, 'tablesDB.');

    // 3. Rename object properties inside tablesDB calls
    // collectionId -> tableId
    // documentId -> rowId
    // We'll just do a global replace for `collectionId:` -> `tableId:`, and `collectionId}` -> `tableId}`
    // To be safe, any `{ ..., collectionId: ..., ... }` or `{ ..., documentId: ..., ... }` block

    content = content.replace(/collectionId\s*:/g, 'tableId:');
    content = content.replace(/collectionId,/g, 'tableId,');
    content = content.replace(/collectionId\s*}/g, 'tableId }');
    content = content.replace(/documentId\s*:/g, 'rowId:');
    content = content.replace(/documentId,/g, 'rowId,');
    content = content.replace(/documentId\s*}/g, 'rowId }');

    // Also replace `collectionId` with `tableId` if it appears in `const { collectionId }` etc
    // We should just globally rename instances of the exact symbols because our whole schema uses table concepts now
    // Specifically:
    content = content.replace(/\bcollectionId\b/g, 'tableId');
    content = content.replace(/\bdocumentId\b/g, 'rowId');

    if (content !== originalContent) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`Updated ${filepath}`);
        modifiedCount++;
    }
});

console.log(`Updated ${modifiedCount} files.`);
