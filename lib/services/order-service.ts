import { Query, ID } from "appwrite";
import {
  databases,
  DATABASE_ID,
  ORDERS_TABLE_ID,
  ORDER_ITEMS_TABLE_ID,
  CUSTOMERS_TABLE_ID,
  ADDRESSES_TABLE_ID,
  PRODUCTS_TABLE_ID,
} from "../appwrite";
import {
  Order,
  OrderItem,
  OrderWithDetails,
  Customer,
  Address,
  Product,
  CreateOrderRequest,
} from "../types";
import {
  calculateTierPricing,
  calculateItemTotal,
  generateMapsUrl,
} from "../utils";

export class OrderService {
  /**
   * Create a new order with items
   */
  static async createOrder(
    orderRequest: CreateOrderRequest
  ): Promise<OrderWithDetails> {
    try {
      // Create the main order first
      const orderId = ID.unique();

      // Calculate totals from items
      let totalItemsCount = 0;
      let totalWeightKg = 0;
      let subtotalBeforeDiscount = 0;
      let totalDiscountAmount = 0;

      // Process each item to calculate totals
      const processedItems = await Promise.all(
        orderRequest.items.map(async (itemRequest) => {
          // Get product details for pricing
          const product = (await databases.getDocument(
            DATABASE_ID,
            PRODUCTS_TABLE_ID,
            itemRequest.product_id
          )) as unknown as Product;

          // Calculate pricing
          const tierPricing = calculateTierPricing(
            product,
            itemRequest.quantity_kg
          );
          const pricePerKg = itemRequest.is_custom_price
            ? itemRequest.custom_price_per_kg || product.base_price_per_kg
            : tierPricing.pricePerKg;

          // Calculate item total
          const itemTotal = calculateItemTotal(
            pricePerKg,
            itemRequest.quantity_kg,
            itemRequest.discount?.percentage || 0
          );

          // Update running totals
          totalItemsCount += 1;
          totalWeightKg += itemRequest.quantity_kg;
          subtotalBeforeDiscount += itemTotal.subtotal;
          totalDiscountAmount += itemTotal.discountAmount;

          return {
            itemRequest,
            product,
            tierPricing,
            pricePerKg,
            itemTotal,
          };
        })
      );

      const totalPrice = subtotalBeforeDiscount - totalDiscountAmount;

      // Create the order
      const order = (await databases.createDocument(
        DATABASE_ID,
        ORDERS_TABLE_ID,
        orderId,
        {
          customer_id: orderRequest.customer_id,
          address_id: "", // Will be set after address creation
          total_items_count: totalItemsCount,
          total_weight_kg: totalWeightKg,
          subtotal_before_discount: subtotalBeforeDiscount,
          total_discount_amount: totalDiscountAmount,
          total_price: totalPrice,
          status: "pending",
        }
      )) as unknown as Order;

      // Create address
      const addressId = ID.unique();
      const mapsUrl = generateMapsUrl(
        orderRequest.address.latitude,
        orderRequest.address.longitude
      );

      const address = (await databases.createDocument(
        DATABASE_ID,
        ADDRESSES_TABLE_ID,
        addressId,
        {
          customer_id: orderRequest.customer_id,
          order_id: orderId,
          address_line: orderRequest.address.address_line,
          latitude: orderRequest.address.latitude,
          longitude: orderRequest.address.longitude,
          maps_url: mapsUrl,
        }
      )) as unknown as Address;

      // Update order with address_id
      await databases.updateDocument(DATABASE_ID, ORDERS_TABLE_ID, orderId, {
        address_id: addressId,
      });

      // Create order items
      const orderItems: OrderItem[] = [];
      for (const processedItem of processedItems) {
        const { itemRequest, product, tierPricing, pricePerKg, itemTotal } =
          processedItem;

        const orderItemId = ID.unique();
        const orderItem = (await databases.createDocument(
          DATABASE_ID,
          ORDER_ITEMS_TABLE_ID,
          orderItemId,
          {
            order_id: orderId,
            product_id: itemRequest.product_id,

            // Product snapshot
            product_name: product.name,
            product_description: product.description || "",

            // Quantity
            quantity_kg: itemRequest.quantity_kg,

            // Bag breakdown
            bags_1kg: itemRequest.bags.kg1,
            bags_5kg: itemRequest.bags.kg5,
            bags_10kg: itemRequest.bags.kg10,
            bags_25kg: itemRequest.bags.kg25,

            // Pricing snapshot
            price_per_kg_at_order: pricePerKg,
            base_price_per_kg_at_order: product.base_price_per_kg,
            tier_applied: tierPricing.tierApplied,
            tier_price_at_order: tierPricing.pricePerKg,

            // Discount
            discount_percentage: itemRequest.discount?.percentage || 0,
            discount_amount: itemTotal.discountAmount,
            discount_reason: itemRequest.discount?.reason || "",

            // Totals
            subtotal_before_discount: itemTotal.subtotal,
            total_after_discount: itemTotal.total,

            // Metadata
            notes: itemRequest.notes || "",
            is_custom_price: itemRequest.is_custom_price || false,
          }
        )) as unknown as OrderItem;

        orderItems.push(orderItem);
      }

      // Get customer details
      const customer = (await databases.getDocument(
        DATABASE_ID,
        CUSTOMERS_TABLE_ID,
        orderRequest.customer_id
      )) as unknown as Customer;

      // Return complete order with details
      return {
        ...order,
        address_id: addressId,
        items: orderItems,
        customer,
        address,
      };
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  /**
   * Get order with full details (items, customer, address)
   */
  static async getOrderWithDetails(
    orderId: string
  ): Promise<OrderWithDetails | null> {
    try {
      // Get the main order
      const order = (await databases.getDocument(
        DATABASE_ID,
        ORDERS_TABLE_ID,
        orderId
      )) as unknown as Order;

      // Get order items
      const itemsResponse = await databases.listDocuments(
        DATABASE_ID,
        ORDER_ITEMS_TABLE_ID,
        [`order_id=${orderId}`]
      );
      const items = itemsResponse.documents as unknown as OrderItem[];

      // Get customer
      const customer = (await databases.getDocument(
        DATABASE_ID,
        CUSTOMERS_TABLE_ID,
        order.customer_id
      )) as unknown as Customer;

      // Get address
      const address = (await databases.getDocument(
        DATABASE_ID,
        ADDRESSES_TABLE_ID,
        order.address_id
      )) as unknown as Address;

      return {
        ...order,
        items,
        customer,
        address,
      };
    } catch (error) {
      console.error("Error fetching order with details:", error);
      return null;
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(
    orderId: string,
    status: Order["status"]
  ): Promise<Order> {
    try {
      const updatedOrder = (await databases.updateDocument(
        DATABASE_ID,
        ORDERS_TABLE_ID,
        orderId,
        { status }
      )) as unknown as Order;

      return updatedOrder;
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  }

  /**
   * Get orders for a customer
   */
  static async getCustomerOrders(
    customerId: string
  ): Promise<OrderWithDetails[]> {
    try {
      const ordersResponse = await databases.listDocuments(
        DATABASE_ID,
        ORDERS_TABLE_ID,
        [`customer_id=${customerId}`]
      );

      const orders: OrderWithDetails[] = [];

      for (const order of ordersResponse.documents as unknown as Order[]) {
        const orderWithDetails = await this.getOrderWithDetails(order.$id);
        if (orderWithDetails) {
          orders.push(orderWithDetails);
        }
      }

      return orders;
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      return [];
    }
  }
}
