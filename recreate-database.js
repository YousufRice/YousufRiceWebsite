const { Client, Databases, Storage, ID, Permission, Role } = require('node-appwrite');

// Configuration from your env.example
const config = {
  endpoint: 'https://sgp.cloud.appwrite.io/v1',
  projectId: '6915f70f003815538919',
  apiKey: 'standard_1809713173ba2bbfd4872efee22439a6842cb1c70f769202981d588f1a84964ddfdede3812af076be74f00d61ea99f87cc2e94c3697a2e82730ea14fe88b05ae87f04f23f3e79e883056e0b41fa69bf3459a3eb027e6d178fa06b62ce00dc00673f265fe2b2b7d0b016a9424aaabb97d73125af552e8273839fd1a70ca7b393e', // Replace with your actual API key
  databaseId: '6915ff74001aa13f6189',
  databaseName: 'YousufRiceWebsite'
};

// Table IDs from your env.example
const tableIds = {
  products: ID.unique(),
  productImages: ID.unique(),
  customers: ID.unique(),
  orders: ID.unique(),
  addresses: ID.unique(),
  sessions: ID.unique(),
  millImages: ID.unique()
};

// Storage bucket IDs
const bucketIds = {
  productImages: 'product-images',
  banners: 'banner-images'
};

async function recreateDatabase() {
  // Initialize Appwrite client
  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);

  const databases = new Databases(client);
  const storage = new Storage(client);

  try {
    console.log('🚀 Starting database recreation...');

    // Step 1: Create Database
    console.log('📊 Creating database...');
    try {
      await databases.create(config.databaseId, config.databaseName);
      console.log('✅ Database created successfully');
    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️  Database already exists, continuing...');
      } else {
        throw error;
      }
    }

    // Step 2: Create Products Table
    console.log('🛍️  Creating Products table...');
    await databases.createCollection(
      config.databaseId,
      tableIds.products,
      'Products',
      [
        Permission.create(Role.any()),
        Permission.read(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any())
      ]
    );

    // Products table attributes
    await databases.createStringAttribute(config.databaseId, tableIds.products, 'name', 255, true);
    await databases.createBooleanAttribute(config.databaseId, tableIds.products, 'has_tier_pricing', true);
    await databases.createStringAttribute(config.databaseId, tableIds.products, 'description', 1000, false);
    await databases.createBooleanAttribute(config.databaseId, tableIds.products, 'available', true);
    await databases.createStringAttribute(config.databaseId, tableIds.products, 'primary_image_id', 255, false);
    await databases.createFloatAttribute(config.databaseId, tableIds.products, 'tier_2_4kg_price', false);
    await databases.createFloatAttribute(config.databaseId, tableIds.products, 'tier_5_9kg_price', false);
    await databases.createFloatAttribute(config.databaseId, tableIds.products, 'tier_10kg_up_price', false);
    await databases.createFloatAttribute(config.databaseId, tableIds.products, 'base_price_per_kg', false);

    // Products table indexes
    await databases.createIndex(config.databaseId, tableIds.products, 'name_idx', 'fulltext', ['name']);

    console.log('✅ Products table created');

    // Step 3: Create Product Images Table
    console.log('🖼️  Creating Product Images table...');
    await databases.createCollection(
      config.databaseId,
      tableIds.productImages,
      'Product Images',
      [
        Permission.create(Role.any()),
        Permission.read(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any())
      ]
    );

    // Product Images table attributes
    await databases.createStringAttribute(config.databaseId, tableIds.productImages, 'file_id', 255, true);
    await databases.createStringAttribute(config.databaseId, tableIds.productImages, 'product_id', 255, true);
    await databases.createBooleanAttribute(config.databaseId, tableIds.productImages, 'is_primary', false);

    // Product Images table indexes
    await databases.createIndex(config.databaseId, tableIds.productImages, 'product_id_idx', 'key', ['product_id']);

    console.log('✅ Product Images table created');

    // Step 4: Create Customers Table
    console.log('👥 Creating Customers table...');
    await databases.createCollection(
      config.databaseId,
      tableIds.customers,
      'Customers',
      [
        Permission.create(Role.any()),
        Permission.read(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any())
      ]
    );

    // Customers table attributes
    await databases.createStringAttribute(config.databaseId, tableIds.customers, 'email', 255, false);
    await databases.createStringAttribute(config.databaseId, tableIds.customers, 'user_id', 255, true);
    await databases.createStringAttribute(config.databaseId, tableIds.customers, 'full_name', 255, true);
    await databases.createStringAttribute(config.databaseId, tableIds.customers, 'phone', 20, true);

    console.log('✅ Customers table created');

    // Step 5: Create Orders Table
    console.log('📦 Creating Orders table...');
    await databases.createCollection(
      config.databaseId,
      tableIds.orders,
      'Orders',
      [
        Permission.create(Role.any()),
        Permission.read(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any())
      ]
    );

    // Orders table attributes
    await databases.createStringAttribute(config.databaseId, tableIds.orders, 'address_id', 255, true);
    await databases.createStringAttribute(config.databaseId, tableIds.orders, 'customer_id', 255, true);
    await databases.createIntegerAttribute(config.databaseId, tableIds.orders, 'total_price', true);
    await databases.createEnumAttribute(
      config.databaseId, 
      tableIds.orders, 
      'status', 
      ['pending', 'accepted', 'out_for_delivery', 'delivered'], 
      true
    );
    await databases.createStringAttribute(config.databaseId, tableIds.orders, 'order_items', 5000, true);

    // Orders table indexes
    await databases.createIndex(config.databaseId, tableIds.orders, 'status_idx', 'key', ['status']);

    console.log('✅ Orders table created');

    // Step 6: Create Addresses Table
    console.log('📍 Creating Addresses table...');
    await databases.createCollection(
      config.databaseId,
      tableIds.addresses,
      'Addresses',
      [
        Permission.create(Role.any()),
        Permission.read(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any())
      ]
    );

    // Addresses table attributes
    await databases.createStringAttribute(config.databaseId, tableIds.addresses, 'address_line', 1000, true);
    await databases.createFloatAttribute(config.databaseId, tableIds.addresses, 'longitude', true);
    await databases.createStringAttribute(config.databaseId, tableIds.addresses, 'customer_id', 255, true);
    await databases.createFloatAttribute(config.databaseId, tableIds.addresses, 'latitude', true);
    await databases.createStringAttribute(config.databaseId, tableIds.addresses, 'order_id', 255, true);
    await databases.createStringAttribute(config.databaseId, tableIds.addresses, 'maps_url', 255, false);

    // Addresses table indexes
    await databases.createIndex(config.databaseId, tableIds.addresses, 'customer_id_idx', 'key', ['customer_id']);

    console.log('✅ Addresses table created');

    // Step 7: Create Sessions Table
    console.log('🔐 Creating Sessions table...');
    await databases.createCollection(
      config.databaseId,
      tableIds.sessions,
      'Sessions',
      [
        Permission.create(Role.any()),
        Permission.read(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any())
      ]
    );

    // Sessions table attributes
    await databases.createStringAttribute(config.databaseId, tableIds.sessions, 'userId', 255, true);
    await databases.createStringAttribute(config.databaseId, tableIds.sessions, 'sessionId', 255, true);
    await databases.createDatetimeAttribute(config.databaseId, tableIds.sessions, 'createdAt', true);
    await databases.createDatetimeAttribute(config.databaseId, tableIds.sessions, 'lastAccessedAt', true);

    // Sessions table indexes
    await databases.createIndex(config.databaseId, tableIds.sessions, 'userId_idx', 'key', ['userId']);
    await databases.createIndex(config.databaseId, tableIds.sessions, 'sessionId_idx', 'unique', ['sessionId']);
    await databases.createIndex(config.databaseId, tableIds.sessions, 'lastAccessed_idx', 'key', ['lastAccessedAt'], ['DESC']);

    console.log('✅ Sessions table created');

    // Step 8: Create Mill Images Table (for about us page)
    console.log('🏭 Creating Mill Images table...');
    await databases.createCollection(
      config.databaseId,
      tableIds.millImages,
      'mill image for about us'
    );

    // Mill Images table attributes
    await databases.createStringAttribute(config.databaseId, tableIds.millImages, 'file_id', 255, true);

    console.log('✅ Mill Images table created');

    // Step 9: Create Storage Buckets
    console.log('🗄️  Creating storage buckets...');
    
    // Product Images Bucket
    try {
      await storage.createBucket(
        bucketIds.productImages,
        'product-images',
        [],
        false,
        true,
        5242880, // 5MB
        ['jpg', 'jpeg', 'png', 'webp'],
        'none',
        true,
        false
      );
      console.log('✅ Product Images bucket created');
    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️  Product Images bucket already exists');
      } else {
        console.error('❌ Error creating Product Images bucket:', error.message);
      }
    }

    // Banner Images Bucket (if needed)
    try {
      await storage.createBucket(
        bucketIds.banners,
        'banner-images',
        [],
        false,
        true,
        5242880, // 5MB
        ['jpg', 'jpeg', 'png', 'webp'],
        'none',
        true,
        false
      );
      console.log('✅ Banner Images bucket created');
    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️  Banner Images bucket already exists');
      } else {
        console.error('❌ Error creating Banner Images bucket:', error.message);
      }
    }

    console.log('🎉 Database recreation completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Database: yousuf_rice');
    console.log('- Tables: 7 (Products, Product Images, Customers, Orders, Addresses, Sessions, Mill Images)');
    console.log('- Storage Buckets: 2 (product-images, banner-images)');
    console.log('\n✨ Your database is ready to use!');

  } catch (error) {
    console.error('❌ Error during database recreation:', error);
    console.error('Error details:', error.message);
    
    if (error.code) {
      console.error('Error code:', error.code);
    }
    
    process.exit(1);
  }
}

// Add delay function to handle rate limiting
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the recreation script
if (require.main === module) {
  console.log('🔧 Yousuf Rice Database Recreation Script');
  console.log('========================================\n');
  
  // Check if API key is provided
  if (config.apiKey === 'YOUR_API_KEY_HERE') {
    console.error('❌ Please update the API key in the script before running!');
    console.log('1. Open recreate-database.js');
    console.log('2. Replace "YOUR_API_KEY_HERE" with your actual Appwrite API key');
    console.log('3. Run the script again: node recreate-database.js');
    process.exit(1);
  }
  
  recreateDatabase();
}

module.exports = { recreateDatabase, config, tableIds, bucketIds };
