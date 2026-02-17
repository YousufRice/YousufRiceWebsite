import { Query, ID } from "appwrite";
import {
  databases,
  DATABASE_ID,
  ORDERS_TABLE_ID,
  ORDER_ITEMS_TABLE_ID,
  CUSTOMERS_TABLE_ID,
  ADDRESSES_TABLE_ID,
  PRODUCTS_TABLE_ID,
} from "@/lib/appwrite";
import { LoyaltyService } from "./loyalty-service";
import {
  Order,
  OrderWithDetails,
  OrderItem,
  Customer,
  Address,
  Product,
} from "@/lib/types";
import { CreateOrderRequest } from "../types";
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

          // Calculate tier discount amount (difference between base price and tier price)
          const tierDiscountAmount = itemRequest.is_custom_price
            ? 0 // No tier discount for custom prices
            : tierPricing.discountAmount;

          // Calculate additional percentage discount amount
          const percentageDiscountAmount = itemTotal.discountAmount;

          // Update running totals
          totalItemsCount += 1;
          totalWeightKg += itemRequest.quantity_kg;
          subtotalBeforeDiscount +=
            product.base_price_per_kg * itemRequest.quantity_kg;
          totalDiscountAmount += tierDiscountAmount + percentageDiscountAmount;

          return {
            itemRequest,
            product,
            tierPricing,
            pricePerKg,
            itemTotal,
            tierDiscountAmount,
            percentageDiscountAmount,
          };
        })
      );

      // Validate that no product has 0 price
      const zeroPriceProducts = processedItems.filter(
        (item) => item.product.base_price_per_kg === 0
      );
      if (zeroPriceProducts.length > 0) {
        const productNames = zeroPriceProducts
          .map((item) => item.product.name)
          .join(", ");
        throw new Error(
          `Cannot create order: The following products have invalid pricing: ${productNames}. Please check product pricing.`
        );
      }

      const totalPrice = subtotalBeforeDiscount - totalDiscountAmount;

      if (totalPrice <= 0) {
        throw new Error("Cannot create order with 0 or negative total price.");
      }

      // KEY FIX: Create Order Items FIRST to prevent "Zero Price" orders
      const orderItems: OrderItem[] = [];
      const createdItemIds: string[] = [];

      // Declare variables outside try/catch for scope access in return
      let order: Order;
      let address: Address;
      const addressId = ID.unique();

      try {
        for (const processedItem of processedItems) {
          const {
            itemRequest,
            product,
            tierPricing,
            pricePerKg,
            itemTotal,
            tierDiscountAmount,
            percentageDiscountAmount,
          } = processedItem;

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
              base_price_per_kg: product.base_price_per_kg,
              tier_applied: tierPricing.tierApplied,

              // Discount
              discount_percentage:
                product.base_price_per_kg * itemRequest.quantity_kg > 0
                  ? ((tierDiscountAmount + percentageDiscountAmount) /
                    (product.base_price_per_kg * itemRequest.quantity_kg)) *
                  100
                  : 0,
              discount_amount: tierDiscountAmount + percentageDiscountAmount,
              // Totals
              subtotal_before_discount:
                product.base_price_per_kg * itemRequest.quantity_kg,
              total_after_discount: itemTotal.total,

              // Metadata
              notes: itemRequest.notes || orderRequest.notes || "",
            }
          )) as unknown as OrderItem;

          orderItems.push(orderItem);
          createdItemIds.push(orderItemId);
        }

        // Create address
        const mapsUrl = generateMapsUrl(
          orderRequest.address.latitude,
          orderRequest.address.longitude
        );

        address = (await databases.createDocument(
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

        // Create the order
        order = (await databases.createDocument(
          DATABASE_ID,
          ORDERS_TABLE_ID,
          orderId,
          {
            customer_id: orderRequest.customer_id,
            address_id: addressId, // Set address_id immediately
            total_items_count: totalItemsCount,
            total_weight_kg: totalWeightKg,
            subtotal_before_discount: subtotalBeforeDiscount,
            total_discount_amount: totalDiscountAmount,
            total_price: totalPrice,
            status: "pending",
          }
        )) as unknown as Order;
      } catch (creationError) {
        console.error("Error during order service creation flow:", creationError);
        
        // ROLLBACK: If order creation failed but items were created, delete them
        if (createdItemIds.length > 0) {
          console.log("Rolling back created items in OrderService...");
          Promise.allSettled(
            createdItemIds.map(id => databases.deleteDocument(DATABASE_ID, ORDER_ITEMS_TABLE_ID, id))
          ).then(() => console.log("Rollback complete"));
        }
        
        throw creationError;
      }

      // Get customer details
      const customer = (await databases.getDocument(
        DATABASE_ID,
        CUSTOMERS_TABLE_ID,
        orderRequest.customer_id
      )) as unknown as Customer;

      // Process loyalty discount after order creation
      try {
        const productNames = processedItems.map((item) => item.product.name);
        await LoyaltyService.processLoyaltyDiscount(
          orderRequest.customer_id,
          customer.full_name || "",
          totalPrice,
          productNames,
          orderId
        );
      } catch (loyaltyError) {
        console.error("Error processing loyalty discount:", loyaltyError);
        // Don't fail the order if loyalty processing fails
      }

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
        [Query.equal("order_id", orderId)]
      );
      const items = itemsResponse.documents as unknown as OrderItem[];

      // Get customer
      const customer = (await databases.getDocument(
        DATABASE_ID,
        CUSTOMERS_TABLE_ID,
        order.customer_id
      )) as unknown as Customer;

      // Get address
      let address: Address | null = null;
      
      if (order.address_id) {
        try {
          address = (await databases.getDocument(
            DATABASE_ID,
            ADDRESSES_TABLE_ID,
            order.address_id
          )) as unknown as Address;
        } catch (e) {
          console.warn(`Address ${order.address_id} not found for order ${orderId}`);
        }
      }

      // Fallback: If address_id is missing or fetch failed, try to find address by order_id
      if (!address) {
        try {
          const addressList = await databases.listDocuments(
            DATABASE_ID,
            ADDRESSES_TABLE_ID,
            [Query.equal("order_id", orderId), Query.limit(1)]
          );
          
          if (addressList.documents.length > 0) {
             address = addressList.documents[0] as unknown as Address;
          }
        } catch (e) {
          console.error("Failed to find fallback address for order", orderId);
        }
      }

      return {
        ...order,
        items,
        customer,
        address: address || undefined,
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
  /**
   * Delete an order and all its related items
   */
  static async deleteOrder(orderId: string): Promise<void> {
    try {
      // 1. Get all order items for this order
      const itemsResponse = await databases.listDocuments(
        DATABASE_ID,
        ORDER_ITEMS_TABLE_ID,
        [Query.equal("order_id", orderId)]
      );

      // 2. Delete all order items
      const deleteItemPromises = itemsResponse.documents.map((item) =>
        databases.deleteDocument(DATABASE_ID, ORDER_ITEMS_TABLE_ID, item.$id)
      );
      await Promise.all(deleteItemPromises);

      // 3. Delete loyalty discount if exists
      try {
        await LoyaltyService.deleteLoyaltyDiscountByOrderId(orderId);
      } catch (loyaltyError) {
        console.error("Error deleting loyalty discount:", loyaltyError);
        // Continue with order deletion
      }

      // 4. Delete the order itself
      await databases.deleteDocument(DATABASE_ID, ORDERS_TABLE_ID, orderId);
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  }
}
