const { Client, Databases, Query } = require('node-appwrite');
const fs = require('fs');

try {
    const envFile = fs.readFileSync('.env', 'utf8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            process.env[match[1]] = match[2].replace(/^["'](.*)["']$/, '$1');
        }
    });
} catch (e) {
    console.log("No .env file found or error reading it.");
}

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'yousufrice')
    .setKey(process.env.APPWRITE_API_KEY || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

async function run() {
    try {
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'productsDB';
        const prodTable = process.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_TABLE_ID || 'products';
        const imgTable = process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_IMAGES_TABLE_ID || 'productImages';

        const products = await databases.listDocuments(dbId, prodTable);
        const targetProducts = products.documents.filter(p => 
            p.name.toLowerCase().includes('x-steam') || 
            p.name.toLowerCase().includes('x steam') || 
            p.name.toLowerCase().includes('ultimate sella')
        );

        for (const p of targetProducts) {
            console.log(`\nProduct: ${p.name} (ID: ${p.$id})`);
            const images = await databases.listDocuments(dbId, imgTable, [
                Query.equal('product_id', p.$id)
            ]);
            console.log('Images:', images.documents.map(img => ({
                id: img.$id,
                file_id: img.file_id,
                is_primary: img.is_primary
            })));
        }
    } catch (err) {
        console.error("Error:", err.message);
    }
}

run();
