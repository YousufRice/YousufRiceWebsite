import { tool } from "@openai/agents";
import { z } from "zod";
import { LoyaltyService } from "@/lib/services/loyalty-service";
import { databases, DATABASE_ID, CUSTOMERS_TABLE_ID } from "@/lib/appwrite";
import { Query } from "appwrite";

/**
 * Helper function to format phone numbers (copied from appwriteTools.ts to avoid circular deps if any, or just for safety)
 */
function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("92")) return "+" + digits;
  if (digits.startsWith("0")) return "+92" + digits.substring(1);
  return "+92" + digits;
}

/**
 * Tool to check if a customer has any active loyalty rewards
 */
export const checkLoyaltyRewardTool = tool({
  name: "check_loyalty_reward",
  description:
    "Check if a customer has an active loyalty discount code. Use this when identifying a customer to see if they have any available rewards to redeem.",
  parameters: z.object({
    phoneNumber: z
      .string()
      .nullable()
      .default(null)
      .describe("Customer phone number"),
    email: z
      .string()
      .nullable()
      .default(null)
      .describe("Customer email address"),
  }),
  async execute({ phoneNumber, email }) {
    try {
      if (!phoneNumber && !email) {
        return {
          success: false,
          error: "Please provide either phone number or email",
          reward: null,
        };
      }

      let customerId: string | null = null;
      let customerName: string = "Customer";

      // Find customer by phone or email
      const queries: any[] = [];
      if (phoneNumber) {
        queries.push(Query.equal("phone", formatPhoneNumber(phoneNumber)));
      } else if (email) {
        queries.push(Query.equal("email", email.trim().toLowerCase()));
      }

      const customerResponse = await databases.listDocuments(
        DATABASE_ID,
        CUSTOMERS_TABLE_ID,
        queries
      );

      if (customerResponse.documents.length > 0) {
        customerId = customerResponse.documents[0].$id;
        customerName = customerResponse.documents[0].full_name;
      } else {
        return {
          success: true,
          reward: null,
          message: "Customer not found in database.",
        };
      }

      // Get loyalty info
      const loyaltyInfo = await LoyaltyService.getCustomerLoyaltyInfo(customerId);

      if (loyaltyInfo && loyaltyInfo.discount_code) {
        return {
          success: true,
          reward: {
            code: loyaltyInfo.discount_code,
            percentage: loyaltyInfo.extra_discount_percentage,
            details: loyaltyInfo
          },
          message: `Yes! ${customerName} has an active loyalty reward. Code: ${loyaltyInfo.discount_code} (${loyaltyInfo.extra_discount_percentage}% off).`,
        };
      } else {
        return {
          success: true,
          reward: null,
          message: `${customerName} does not have any active loyalty rewards at the moment.`,
        };
      }

    } catch (error: any) {
      console.error("checkLoyaltyRewardTool error:", error);
      return {
        success: false,
        error: error.message || "Failed to check loyalty reward",
        reward: null,
      };
    }
  },
});
