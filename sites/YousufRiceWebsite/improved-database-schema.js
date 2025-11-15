const { Client, Databases, ID, Permission, Role } = require('node-appwrite');

// Configuration
const config = {
  endpoint: 'https://sgp.cloud.appwrite.io/v1',
  projectId: '6915f70f003815538919',
  apiKey: 'standard_1809713173ba2bbfd4872efee22439a6842cb1c70f769202981d588f1a84964ddfdede3812af076be74f00d61ea99f87cc2e94c3697a2e82730ea14fe88b05ae87f04f23f3e79e883056e0b41fa69bf3459a3eb027e6d178fa06b62ce00dc00673f265fe2b2b7d0b016a9424aaabb97d73125af552e8273839fd1a70ca7b393e', // Replace with your actual API key
  databaseId: '6915ff74001aa13f6189'
};

// New table ID for order items
const ORDER_ITEMS_TABLE_ID = 'order_items_table';

async function createImprovedOrderItemsTable() {
  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);

  const databases = new Databases(client);

  try {
    console.log('🚀 Creating improved Order Items table...');

    // Create Order Items Table
    await databases.createCollection(
      config.databaseId,
      ORDER_ITEMS_TABLE_ID,
      'Order Items',
      [
        Permission.create(Role.any()),
        Permission.read(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any())
      ]
    );

    console.log('📦 Adding Order Items table attributes...');

    // Core relationship fields
    await databases.createStringAttribute(config.databaseId, ORDER_ITEMS_TABLE_ID, 'order_id', 255, true);
    await databases.createStringAttribute(config.databaseId, ORDER_ITEMS_TABLE_ID, 'product_id', 255, true);
    
    // Product snapshot at time of order (prevents data loss if product is deleted/modified)
    await databases.createStringAttribute(config.databaseId, ORDER_ITEMS_TABLE_ID, 'product_name', 255, true);
    await databases.createStringAttribute(config.databaseId, ORDER_ITEMS_TABLE_ID, 'product_description', 1000, false);
    
    // Quantity and weight information
    await databases.createFloatAttribute(config.databaseId, ORDER_ITEMS_TABLE_ID, 'quantity_kg', true);
    
    // Bag breakdown (for detailed inventory tracking)
    await databases.createIntegerAttribute(config.databaseId, ORDER_ITEMS_TABLE_ID, 'bags_1kg', false, 0);
    await databases.createIntegerAttribute(config.databaseId, ORDER_ITEMS_TABLE_ID, 'bags_5kg', false, 0);
    await databases.createIntegerAttribute(config.databaseId, ORDER_ITEMS_TABLE_ID, 'bags_10kg', false, 0);
    await databases.createIntegerAttribute(config.databaseId, ORDER_ITEMS_TABLE_ID, 'bags_25kg', false, 0);
    
    // Price information at time of order (CRITICAL for price integrity)
    await databases.createFloatAttribute(config.databaseId, ORDER_ITEMS_TABLE_ID, 'price_per_kg_at_order', true);
    await databases.createFloatAttribute(config.databaseId, ORDER_ITEMS_TABLE_ID, 'base_price_per_kg_at_order', true);
    
    // Tier pricing snapshot (what tier was applied)
    await databases.createStringAttribute(config.databaseId, ORDER_ITEMS_TABLE_ID, 'tier_applied', 50, false); // '2-4kg', '5-9kg', '10kg+', 'base'
    await databases.createFloatAttribute(config.databaseId, ORDER_ITEMS_TABLE_ID, 'tier_price_at_order', false);
    
    // Discount information
    await databases.createFloatAttribute(config.databaseId, ORDER_ITEMS_TABLE_ID, 'discount_percentage', false, 0);
    await databases.createFloatAttribute(config.databaseId, ORDER_ITEMS_TABLE_ID, 'discount_amount', false, 0);
    await databases.createStringAttribute(config.databaseId, ORDER_ITEMS_TABLE_ID, 'discount_reason', 255, false); // 'bulk_discount', 'promo_code', 'manual'
    
    // Calculated totals (stored for performance and audit trail)
    await databases.createFloatAttribute(config.databaseId, ORDER_ITEMS_TABLE_ID, 'subtotal_before_discount', true);
    await databases.createFloatAttribute(config.databaseId, ORDER_ITEMS_TABLE_ID, 'total_after_discount', true);
    
    // Additional metadata
    await databases.createStringAttribute(config.databaseId, ORDER_ITEMS_TABLE_ID, 'notes', 500, false);
    await databases.createBooleanAttribute(config.databaseId, ORDER_ITEMS_TABLE_ID, 'is_custom_price', false, false);

    console.log('📊 Creating indexes for Order Items table...');

    // Create indexes for efficient queries
    await databases.createIndex(config.databaseId, ORDER_ITEMS_TABLE_ID, 'order_id_idx', 'key', ['order_id']);
    await databases.createIndex(config.databaseId, ORDER_ITEMS_TABLE_ID, 'product_id_idx', 'key', ['product_id']);
    await databases.createIndex(config.databaseId, ORDER_ITEMS_TABLE_ID, 'order_product_idx', 'key', ['order_id', 'product_id']);

    console.log('✅ Order Items table created successfully!');

    // Now update the Orders table to remove the CSV field and add summary fields
    console.log('🔄 Updating Orders table...');
    
    // Add summary fields to Orders table
    await databases.createIntegerAttribute(config.databaseId, '6916ac06002cd3573362', 'total_items_count', false, 0);
    await databases.createFloatAttribute(config.databaseId, '6916ac06002cd3573362', 'total_weight_kg', false, 0);
    await databases.createFloatAttribute(config.databaseId, '6916ac06002cd3573362', 'subtotal_before_discount', false, 0);
    await databases.createFloatAttribute(config.databaseId, '6916ac06002cd3573362', 'total_discount_amount', false, 0);
    
    console.log('✅ Orders table updated with summary fields!');

    console.log('\n🎉 Database schema improvement completed!');
    console.log('\n📋 What was created:');
    console.log('✓ Order Items table with proper normalization');
    console.log('✓ Price integrity (stores prices at time of order)');
    console.log('✓ Discount tracking');
    console.log('✓ Bag breakdown for inventory');
    console.log('✓ Product snapshot (name, description)');
    console.log('✓ Tier pricing history');
    console.log('✓ Performance indexes');
    console.log('✓ Order summary fields');

  } catch (error) {
    console.error('❌ Error creating improved schema:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Migration function to convert existing CSV data to new structure
async function migrateExistingOrders() {
  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);

  const databases = new Databases(client);

  try {
    console.log('🔄 Starting migration of existing orders...');

    // Get all existing orders
    const orders = await databases.listDocuments(config.databaseId, '68ee0a64001bd2ca45c7');
    
    console.log(`📦 Found ${orders.documents.length} orders to migrate`);

    for (const order of orders.documents) {
      if (!order.order_items || order.order_items.trim() === '') {
        console.log(`⏭️  Skipping order ${order.$id} - no items`);
        continue;
      }

      console.log(`🔄 Migrating order ${order.$id}...`);

      // Parse CSV format: productId:5kg,productId:10kg
      const orderItems = order.order_items.split(',').map(item => {
        const [productId, quantityStr] = item.split(':');
        return {
          productId: productId.trim(),
          quantity: parseFloat(quantityStr.replace('kg', ''))
        };
      });

      let totalItemsCount = 0;
      let totalWeightKg = 0;
      let subtotalBeforeDiscount = 0;

      // Create order items
      for (const item of orderItems) {
        try {
          // Get current product data (for migration only)
          const product = await databases.getDocument(config.databaseId, '68ee0a5f00025a74262a', item.productId);
          
          // Calculate price as it would have been at order time
          let pricePerKg = product.base_price_per_kg;
          let tierApplied = 'base';
          let tierPrice = null;

          if (product.has_tier_pricing) {
            if (item.quantity >= 10 && product.tier_10kg_up_price) {
              pricePerKg = product.tier_10kg_up_price;
              tierApplied = '10kg+';
              tierPrice = product.tier_10kg_up_price;
            } else if (item.quantity >= 5 && product.tier_5_9kg_price) {
              pricePerKg = product.tier_5_9kg_price;
              tierApplied = '5-9kg';
              tierPrice = product.tier_5_9kg_price;
            } else if (item.quantity >= 2 && product.tier_2_4kg_price) {
              pricePerKg = product.tier_2_4kg_price;
              tierApplied = '2-4kg';
              tierPrice = product.tier_2_4kg_price;
            }
          }

          const itemSubtotal = pricePerKg * item.quantity;

          // Create order item record
          await databases.createDocument(
            config.databaseId,
            ORDER_ITEMS_TABLE_ID,
            ID.unique(),
            {
              order_id: order.$id,
              product_id: item.productId,
              product_name: product.name,
              product_description: product.description || '',
              quantity_kg: item.quantity,
              bags_1kg: 0, // Migration: we don't have bag breakdown data
              bags_5kg: 0,
              bags_10kg: 0,
              bags_25kg: 0,
              price_per_kg_at_order: pricePerKg,
              base_price_per_kg_at_order: product.base_price_per_kg,
              tier_applied: tierApplied,
              tier_price_at_order: tierPrice,
              discount_percentage: 0,
              discount_amount: 0,
              discount_reason: null,
              subtotal_before_discount: itemSubtotal,
              total_after_discount: itemSubtotal,
              notes: 'Migrated from CSV format',
              is_custom_price: false
            }
          );

          totalItemsCount++;
          totalWeightKg += item.quantity;
          subtotalBeforeDiscount += itemSubtotal;

        } catch (productError) {
          console.warn(`⚠️  Product ${item.productId} not found, creating placeholder`);
          
          // Create placeholder for deleted products
          await databases.createDocument(
            config.databaseId,
            ORDER_ITEMS_TABLE_ID,
            ID.unique(),
            {
              order_id: order.$id,
              product_id: item.productId,
              product_name: 'Unknown Product (Deleted)',
              product_description: 'Product was deleted after order was placed',
              quantity_kg: item.quantity,
              bags_1kg: 0,
              bags_5kg: 0,
              bags_10kg: 0,
              bags_25kg: 0,
              price_per_kg_at_order: 0,
              base_price_per_kg_at_order: 0,
              tier_applied: 'unknown',
              tier_price_at_order: null,
              discount_percentage: 0,
              discount_amount: 0,
              discount_reason: null,
              subtotal_before_discount: 0,
              total_after_discount: 0,
              notes: 'Product deleted - migrated from CSV',
              is_custom_price: false
            }
          );

          totalItemsCount++;
          totalWeightKg += item.quantity;
        }
      }

      // Update order with summary data
      await databases.updateDocument(
        config.databaseId,
        '68ee0a64001bd2ca45c7',
        order.$id,
        {
          total_items_count: totalItemsCount,
          total_weight_kg: totalWeightKg,
          subtotal_before_discount: subtotalBeforeDiscount,
          total_discount_amount: 0
        }
      );

      console.log(`✅ Migrated order ${order.$id} with ${totalItemsCount} items`);
    }

    console.log('🎉 Migration completed successfully!');
    console.log('\n⚠️  NEXT STEPS:');
    console.log('1. Test the new structure thoroughly');
    console.log('2. Update your application code to use the new Order Items table');
    console.log('3. Once confirmed working, you can remove the order_items CSV column');

  } catch (error) {
    console.error('❌ Migration error:', error);
    console.error('Error details:', error.message);
  }
}

// Run the schema improvement
if (require.main === module) {
  console.log('🔧 Yousuf Rice Database Schema Improvement');
  console.log('==========================================\n');
  
  if (config.apiKey === 'YOUR_API_KEY_HERE') {
    console.error('❌ Please update the API key in the script before running!');
    process.exit(1);
  }
  
  const action = process.argv[2];
  
  if (action === 'migrate') {
    migrateExistingOrders();
  } else {
    createImprovedOrderItemsTable();
  }
}

module.exports = { 
  createImprovedOrderItemsTable, 
  migrateExistingOrders, 
  ORDER_ITEMS_TABLE_ID 
};
