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

    // Fix response.documents -> response.rows
    // Just generic `.documents` to `.rows`
    content = content.replace(/\.documents\b/g, '.rows');
    content = content.replace(/\{ documents \}/g, '{ rows }');
    content = content.replace(/\bdocuments\b/g, 'rows'); // Wait, global `documents` to `rows` might be too aggressive if variables are named `documents`.

    // Let's be safer. The errors were like: Property 'documents' does not exist...
    // Usually it is `res.documents` or `response.documents` or `{ documents } = await tablesDB.listRows(...)`
    // Actually, replacing `documents` to `rows` everywhere might be fine because it's an Appwrite specific app and they changed the nomenclature from documents to rows.
    // Wait, I will just replace `documents` with `rows` ONLY if preceded by a dot or inside destructuring, OR I can just replace `documents` variable names too because why not have consistency?
    // Let's replace ONLY `.documents` and `{ documents }` and `{ documents:` to be safe.

    // Fix imports that didn't get caught because of multiline or differently formatted
    // e.g. import { databases } from '../appwrite';
    content = content.replace(/\bdatabases\b/g, 'tablesDB');

    // Now for property access
    // we did `content = content.replace(/\.documents\b/g, '.rows');` above.

    // Let's recreate from `originalContent` to do clean replaces.
    let newContent = originalContent;

    // 1. Rename `databases` variable to `tablesDB` universally.
    newContent = newContent.replace(/\bdatabases\b/g, 'tablesDB');

    // 2. Rename `.documents` property access to `.rows` universally.
    newContent = newContent.replace(/\.documents\b/g, '.rows');

    // 3. Rename destructuring `{ documents }` to `{ rows }`
    newContent = newContent.replace(/\{\s*documents\s*\}/g, '{ rows }');
    newContent = newContent.replace(/\{\s*documents\s*:/g, '{ rows:');

    if (newContent !== originalContent) {
        fs.writeFileSync(filepath, newContent, 'utf8');
        modifiedCount++;
        console.log('Fixed ' + filepath);
    }
});
console.log('Fixed ' + modifiedCount + ' files.');
