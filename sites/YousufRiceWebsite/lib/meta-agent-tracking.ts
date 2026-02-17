import {
  sendMetaEvent,
  prepareUserData,
  getCurrentTimestamp,
  generateEventId,
  sanitizeCustomerNameForMeta,
  type MetaEvent,
  type MetaCustomData,
} from '@/lib/meta';

/**
 * Server-side Meta tracking for AI Agent orders
 * 
 * This utility sends Meta Conversion API events when the AI agent
 * places orders on behalf of users. Since these are server-side
 * operations, we don't have browser cookies (fbp/fbc) but we can
 * still track conversions using customer data.
 */

interface AgentOrderData {
  orderId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  totalAmount: number;
  currency?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  deliveryAddress: string;
  userAgent?: string;
  clientIp?: string;
}

/**
 * Track Purchase event for agent-placed orders
 * 
 * This sends a Purchase event to Meta Conversions API when the AI agent
 * successfully creates an order. Since this is server-side, we use
 * customer data for tracking instead of browser cookies.
 */
export async function trackAgentPurchase(orderData: AgentOrderData): Promise<{
  success: boolean;
  error?: string;
  eventId?: string;
}> {
  try {
    console.log(`[META DEBUG] trackAgentPurchase called for order ${orderData.orderId}`);
    const eventId = generateEventId();
    
    // Prepare user data for Meta (will be hashed automatically)
    // Clean the name by removing agent symbols before sending to Meta
    const cleanedName = sanitizeCustomerNameForMeta(orderData.customerName) || orderData.customerName;
    
    const userData = prepareUserData({
      email: orderData.customerEmail,
      phone: orderData.customerPhone,
      firstName: cleanedName.split(' ')[0], // Extract first name
      lastName: cleanedName.split(' ').slice(1).join(' '), // Extract last name
      clientIp: orderData.clientIp,
      userAgent: orderData.userAgent,
      externalId: orderData.orderId, // Use order ID as external ID for tracking
    });

    // Prepare custom data for the purchase
    const customData: MetaCustomData = {
      value: orderData.totalAmount,
      currency: orderData.currency || 'PKR',
      content_type: 'product',
      content_ids: orderData.items.map(item => item.productId),
      contents: orderData.items.map(item => ({
        id: item.productId,
        quantity: item.quantity,
        item_price: item.price,
      })),
      num_items: orderData.items.length,
      // Add order ID for reference
      content_name: `Agent Order ${orderData.orderId}`,
    };

    // Create Meta event
    const metaEvent: MetaEvent = {
      event_name: 'Purchase',
      event_time: getCurrentTimestamp(),
      event_id: eventId,
      event_source_url: 'https://yousufrice.com/agent-order', // Indicate this came from agent
      action_source: 'website',
      user_data: userData,
      custom_data: customData,
    };

    // Send to Meta Conversions API
    console.log(`[META DEBUG] Sending Purchase event to Meta API:`, JSON.stringify(metaEvent, null, 2));
    
    // Use test event code if provided in environment
    const testEventCode = process.env.NEXT_PUBLIC_META_TEST_EVENT_CODE;
    console.log(`[META DEBUG] Test event code:`, testEventCode ? 'ENABLED' : 'DISABLED');
    
    const result = await sendMetaEvent(metaEvent, testEventCode);

    console.log(`[META DEBUG] Meta API response:`, result);
    if (result.success) {
      console.log(`[Meta Agent Tracking] Purchase event sent for order ${orderData.orderId} with event ID: ${eventId}`);
      return { success: true, eventId };
    } else {
      console.error(`[Meta Agent Tracking] Failed to send Purchase event for order ${orderData.orderId}:`, result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('[Meta Agent Tracking] Error tracking agent purchase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Track InitiateCheckout event for agent orders
 * 
 * This is called when the agent is about to create an order
 * with customer information available.
 */
export async function trackAgentInitiateCheckout(orderData: {
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  totalAmount: number;
  currency?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
  }>;
  userAgent?: string;
  clientIp?: string;
}): Promise<{
  success: boolean;
  error?: string;
  eventId?: string;
}> {
  try {
    console.log(`[META DEBUG] trackAgentInitiateCheckout called for customer ${orderData.customerName}`);
    const eventId = generateEventId();
    
    // Prepare user data with required customer information
    // Clean the name by removing agent symbols before sending to Meta
    const cleanedName = sanitizeCustomerNameForMeta(orderData.customerName) || orderData.customerName;
    
    const userData = prepareUserData({
      email: orderData.customerEmail,
      phone: orderData.customerPhone,
      firstName: cleanedName.split(' ')[0],
      lastName: cleanedName.split(' ').slice(1).join(' '),
      clientIp: orderData.clientIp,
      userAgent: orderData.userAgent,
    });

    // Prepare custom data
    const customData: MetaCustomData = {
      value: orderData.totalAmount,
      currency: orderData.currency || 'PKR',
      content_type: 'product',
      content_ids: orderData.items.map(item => item.productId),
      num_items: orderData.items.length,
      content_name: 'Agent Checkout Initiated',
    };

    // Create Meta event
    const metaEvent: MetaEvent = {
      event_name: 'InitiateCheckout',
      event_time: getCurrentTimestamp(),
      event_id: eventId,
      event_source_url: 'https://yousufrice.com/agent-checkout',
      action_source: 'website',
      user_data: userData,
      custom_data: customData,
    };

    // Send to Meta Conversions API
    console.log(`[META DEBUG] Sending InitiateCheckout event to Meta API:`, JSON.stringify(metaEvent, null, 2));
    
    // Use test event code if provided in environment
    const testEventCode = process.env.NEXT_PUBLIC_META_TEST_EVENT_CODE;
    console.log(`[META DEBUG] Test event code:`, testEventCode ? 'ENABLED' : 'DISABLED');
    
    const result = await sendMetaEvent(metaEvent, testEventCode);

    console.log(`[META DEBUG] InitiateCheckout Meta API response:`, result);
    if (result.success) {
      console.log(`[Meta Agent Tracking] InitiateCheckout event sent with event ID: ${eventId}`);
      return { success: true, eventId };
    } else {
      console.error(`[Meta Agent Tracking] Failed to send InitiateCheckout event:`, result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('[Meta Agent Tracking] Error tracking agent checkout initiation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Track ViewContent event for agent product views
 * 
 * This can be called when the agent searches or views products
 * to track user interest.
 */
export async function trackAgentViewContent(productData: {
  productId: string;
  productName: string;
  value?: number;
  currency?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  userAgent?: string;
  clientIp?: string;
}): Promise<{
  success: boolean;
  error?: string;
  eventId?: string;
}> {
  try {
    const eventId = generateEventId();
    
    // Prepare user data (only if we have customer info)
    // Clean the name by removing agent symbols before sending to Meta
    const cleanedName = productData.customerName ? 
      sanitizeCustomerNameForMeta(productData.customerName) || productData.customerName : 
      undefined;
    
    const userData = cleanedName ? prepareUserData({
      email: productData.customerEmail,
      phone: productData.customerPhone,
      firstName: cleanedName.split(' ')[0],
      lastName: cleanedName.split(' ').slice(1).join(' '),
      clientIp: productData.clientIp,
      userAgent: productData.userAgent,
    }) : prepareUserData({
      clientIp: productData.clientIp,
      userAgent: productData.userAgent,
    });

    // Prepare custom data
    const customData: MetaCustomData = {
      content_name: productData.productName,
      content_ids: [productData.productId],
      content_type: 'product',
      value: productData.value,
      currency: productData.currency || 'PKR',
    };

    // Create Meta event
    const metaEvent: MetaEvent = {
      event_name: 'ViewContent',
      event_time: getCurrentTimestamp(),
      event_id: eventId,
      event_source_url: 'https://yousufrice.com/agent-product-view',
      action_source: 'website',
      user_data: userData,
      custom_data: customData,
    };

    // Send to Meta Conversions API
    const result = await sendMetaEvent(metaEvent);

    if (result.success) {
      console.log(`[Meta Agent Tracking] ViewContent event sent for product ${productData.productId} with event ID: ${eventId}`);
      return { success: true, eventId };
    } else {
      console.error(`[Meta Agent Tracking] Failed to send ViewContent event for product ${productData.productId}:`, result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('[Meta Agent Tracking] Error tracking agent product view:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
