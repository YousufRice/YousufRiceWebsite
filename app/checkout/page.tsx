"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cart-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  databases,
  DATABASE_ID,
  ORDERS_TABLE_ID,
  CUSTOMERS_TABLE_ID,
  ADDRESSES_TABLE_ID,
  ORDER_ITEMS_TABLE_ID,
} from "@/lib/appwrite";
import {
  formatCurrency,
  formatOrderItems,
  generateMapsUrl,
  calculateSavings,
  calculateTierPricing,
  calculateItemTotal,
} from "@/lib/utils";
import { useMetaTracking } from "@/lib/hooks/use-meta-tracking";
import { ID, Query } from "appwrite";
import toast from "react-hot-toast";
import { MapPin, Gift, Check, X } from "lucide-react";
import { LoyaltyService, LoyaltyDiscount } from "@/lib/services/loyalty-service";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { user, customer, checkAuth } = useAuthStore();
  const { trackInitiateCheckout, trackPurchase } = useMetaTracking();
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    addressLine: "",
    latitude: 0,
    longitude: 0,
  });

  // Discount state
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<LoyaltyDiscount | null>(
    null
  );
  const [discountError, setDiscountError] = useState("");
  const [validatingDiscount, setValidatingDiscount] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Auto-fill customer information if logged in
  useEffect(() => {
    if (customer) {
      setFormData((prev) => ({
        ...prev,
        fullName: customer.full_name || prev.fullName,
        phone: customer.phone || prev.phone,
        email: customer.email || prev.email,
      }));
    }
  }, [customer]);

  useEffect(() => {
    if (items.length === 0) {
      router.push("/cart");
    } else {
      // Track InitiateCheckout when user lands on checkout page
      trackInitiateCheckout({
        value: getTotalPrice(),
        currency: "PKR",
        numItems: items.reduce((sum, item) => sum + item.quantity, 0),
        contentIds: items.map((item) => item.product.$id),
      });
    }
  }, [items, router, getTotalPrice, trackInitiateCheckout]);

  const handleGetLocation = () => {
    setGettingLocation(true);

    // Check if geolocation is supported
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not supported by your browser");
      setGettingLocation(false);
      return;
    }

    // Check if page is served over HTTPS or localhost
    const isSecureContext = window.isSecureContext;
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;

    console.log("Security context:", { isSecureContext, protocol, hostname });

    if (
      !isSecureContext &&
      hostname !== "localhost" &&
      hostname !== "127.0.0.1"
    ) {
      toast.error(
        "⚠️ Geolocation requires HTTPS! Current URL is not secure. " +
        "Please access via HTTPS or localhost.",
        { duration: 8000 }
      );
      console.error(
        "Insecure context - Geolocation requires HTTPS or localhost"
      );
      setGettingLocation(false);
      return;
    }

    // Request high accuracy location with timeout and retry
    const options = {
      enableHighAccuracy: true, // Use GPS if available
      timeout: 10000, // Wait up to 10 seconds
      maximumAge: 0, // Don't use cached position
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        // Check if accuracy is reasonable
        if (accuracy > 1000) {
          // Very poor accuracy (>1km) - likely using cell towers only
          toast(
            `Low GPS accuracy (${Math.round(accuracy)}m). Please enable location, move outside.`,
            { duration: 8000 }
          );

          console.warn("Very low accuracy - GPS not available:", {
            latitude,
            longitude,
            accuracy,
          });
          // Don't save this inaccurate location
          setGettingLocation(false);
          return;
        } else if (accuracy > 100) {
          // Moderate accuracy - warn but allow
          toast(
            `Low accuracy (${Math.round(
              accuracy
            )}m). • Go outdoors\n` +
            `• Enable GPS\n` +
            `• Or try again`,
            { duration: 4000 }
          );
          console.warn("Low accuracy location:", {
            latitude,
            longitude,
            accuracy,
          });
        } else if (accuracy > 50) {
          // Acceptable accuracy
          toast.success(
            `Location captured (Accuracy: ${Math.round(accuracy)}m - Fair)`,
            {
              duration: 4000,
            }
          );
        } else {
          // Good accuracy
          toast.success(
            `✓ Location captured! (Accuracy: ${Math.round(
              accuracy
            )}m - Excellent)`,
            {
              duration: 4000,
            }
          );
        }

        setFormData((prev) => ({
          ...prev,
          latitude,
          longitude,
        }));

        setGettingLocation(false);
      },
      (error) => {
        let errorMessage = "Failed to get location. ";

        // Log detailed error information
        console.error("Geolocation error details:", {
          code: error.code,
          message: error.message,
          PERMISSION_DENIED: error.PERMISSION_DENIED,
          POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
          TIMEOUT: error.TIMEOUT,
        });

        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorMessage +=
              "Please allow location access in your browser settings.";
            console.error("Permission denied - User blocked location access");
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage +=
              "Location information is unavailable. Check if location services are enabled on your device.";
            console.error(
              "Position unavailable - GPS/location services may be disabled"
            );
            break;
          case 3: // TIMEOUT
            errorMessage +=
              "Location request timed out. Try again or move to a location with better GPS signal.";
            console.error("Timeout - Could not get location within 10 seconds");
            break;
          default:
            errorMessage +=
              "Unknown error occurred. Please enter your address manually.";
            console.error("Unknown geolocation error");
        }

        toast.error(errorMessage, { duration: 5000 });
        setGettingLocation(false);
      },
      options
    );
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountError("Please enter a discount code");
      return;
    }

    setValidatingDiscount(true);
    setDiscountError("");

    try {
      const discount = await LoyaltyService.findLoyaltyDiscountByCode(
        discountCode.trim()
      );

      if (!discount) {
        setDiscountError("Invalid discount code");
        setAppliedDiscount(null);
        return;
      }

      if (discount.code_status !== "active") {
        setDiscountError("This discount code has already been used or is inactive");
        setAppliedDiscount(null);
        return;
      }

      // Check if customer matches (optional, but good for security)
      // if (customer && discount.customer_id !== customer.$id) {
      //   setDiscountError("This discount code belongs to another customer");
      //   setAppliedDiscount(null);
      //   return;
      // }

      setAppliedDiscount(discount);
      toast.success("Discount code applied successfully!");
    } catch (error) {
      console.error("Error validating discount:", error);
      setDiscountError("Failed to validate discount code");
      setAppliedDiscount(null);
    } finally {
      setValidatingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
    setDiscountError("");
    toast.success("Discount removed");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.phone || !formData.addressLine) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Coordinates are now optional for manual checkout

    setLoading(true);

    try {
      // Use phone number as customer identifier
      // Check if a customer with this phone number already exists
      const existingCustomerByPhone = await databases.listDocuments(
        DATABASE_ID,
        CUSTOMERS_TABLE_ID,
        [Query.equal("phone", formData.phone)]
      );

      let customerId: string;

      if (existingCustomerByPhone.documents.length > 0) {
        // Use existing customer with this phone number
        customerId = existingCustomerByPhone.documents[0].$id;

        // Update customer info (name, email, and link user_id if logged in)
        await databases.updateDocument(
          DATABASE_ID,
          CUSTOMERS_TABLE_ID,
          customerId,
          {
            user_id: user?.$id || "guest",
            full_name: formData.fullName,
            email: formData.email || null,
          }
        );
      } else {
        // Create new customer with phone as the primary identifier
        customerId = ID.unique();
        await databases.createDocument(
          DATABASE_ID,
          CUSTOMERS_TABLE_ID,
          customerId,
          {
            user_id: user?.$id || "guest",
            full_name: formData.fullName,
            phone: formData.phone,
            email: formData.email || null,
          }
        );
      }

      // Create order
      const orderId = ID.unique();
      const orderItems = formatOrderItems(
        items.map((item) => ({
          productId: item.product.$id,
          quantity: item.quantity,
        }))
      );

      // Calculate totals from items
      let totalItemsCount = 0;
      let totalWeightKg = 0;
      let subtotalBeforeDiscount = 0;
      let totalDiscountAmount = 0;
      let finalTotalPrice = 0;

      // Prepare item data with calculations
      const processedItems = items.map((item) => {
        const product = item.product;

        // Calculate tier pricing
        const tierPricing = calculateTierPricing(product, item.quantity);

        // Calculate item totals with loyalty discount if applicable
        const loyaltyDiscountPercent = appliedDiscount?.extra_discount_percentage || 0;
        const itemCalculations = calculateItemTotal(
          tierPricing.pricePerKg,
          item.quantity,
          loyaltyDiscountPercent
        );

        // Calculate total discount for this item (Tier Discount + Loyalty Discount)
        // Tier Discount = (Base Price - Tier Price) * Quantity
        // Loyalty Discount = itemCalculations.discountAmount
        const tierDiscountAmount = tierPricing.discountAmount;
        const totalItemDiscount = tierDiscountAmount + itemCalculations.discountAmount;

        // Update order-level totals
        totalItemsCount += 1;
        totalWeightKg += item.quantity;
        subtotalBeforeDiscount += product.base_price_per_kg * item.quantity;
        totalDiscountAmount += totalItemDiscount;
        finalTotalPrice += itemCalculations.total;

        return {
          item,
          product,
          tierPricing,
          itemCalculations,
          totalItemDiscount,
        };
      });

      // Create order with accurate calculated totals
      await databases.createDocument(DATABASE_ID, ORDERS_TABLE_ID, orderId, {
        customer_id: customerId,
        address_id: "", // Will be updated after address creation
        order_items: orderItems,

        // Summary fields
        total_items_count: totalItemsCount,
        total_weight_kg: totalWeightKg,
        subtotal_before_discount: subtotalBeforeDiscount,
        total_discount_amount: totalDiscountAmount,
        total_price: finalTotalPrice,

        status: "pending",
      });

      // Create order items (full normalization)
      for (const processed of processedItems) {
        const { item, product, tierPricing, itemCalculations, totalItemDiscount } = processed;

        await databases.createDocument(
          DATABASE_ID,
          ORDER_ITEMS_TABLE_ID,
          ID.unique(),
          {
            order_id: orderId,
            product_id: product.$id,
            product_name: product.name,
            product_description: product.description || "",

            // Quantity info
            quantity_kg: item.quantity,
            bags_1kg: item.bags?.kg1 || 0,
            bags_5kg: item.bags?.kg5 || 0,
            bags_10kg: item.bags?.kg10 || 0,
            bags_25kg: item.bags?.kg25 || 0,

            // Price info
            price_per_kg_at_order: tierPricing.pricePerKg, // Tier price (effective unit price)
            base_price_per_kg: product.base_price_per_kg, // Original base price

            // Tier info
            tier_applied: tierPricing.tierApplied,

            // Discount info
            discount_percentage: appliedDiscount?.extra_discount_percentage || 0,
            discount_amount: totalItemDiscount, // Includes tier + loyalty discount

            // Totals
            subtotal_before_discount: product.base_price_per_kg * item.quantity,
            total_after_discount: itemCalculations.total,

            // Metadata
            notes: "",
          }
        );
      }

      // Create address
      const mapsUrl = generateMapsUrl(formData.latitude, formData.longitude);
      const addressId = ID.unique();

      await databases.createDocument(
        DATABASE_ID,
        ADDRESSES_TABLE_ID,
        addressId,
        {
          customer_id: customerId,
          order_id: orderId,
          address_line: formData.addressLine,
          latitude: formData.latitude,
          longitude: formData.longitude,
          maps_url: mapsUrl,
        }
      );

      // Update order with address_id
      await databases.updateDocument(DATABASE_ID, ORDERS_TABLE_ID, orderId, {
        address_id: addressId,
      });

      // Track Purchase event
      await trackPurchase({
        value: getTotalPrice(),
        currency: "PKR",
        orderId,
        numItems: items.reduce((sum, item) => sum + item.quantity, 0),
        contentIds: items.map((item) => item.product.$id),
        contents: items.map((item) => ({
          id: item.product.$id,
          quantity: item.quantity,
          item_price: item.product.base_price_per_kg,
        })),
        userData: {
          email: formData.email || undefined,
          phone: formData.phone,
          firstName: formData.fullName.split(" ")[0],
          lastName: formData.fullName.split(" ").slice(1).join(" "),
        },
      });

      // Send order confirmation email if email is provided
      if (formData.email) {
        try {
          await fetch("/api/send-order-confirmation", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderId,
              customerName: formData.fullName,
              customerEmail: formData.email,
              customerPhone: formData.phone,
              deliveryAddress: formData.addressLine,
              mapsUrl,
              items: items.map((item) => {
                const savingsInfo = calculateSavings(
                  item.product,
                  item.quantity
                );
                return {
                  productName: item.product.name,
                  quantity: item.quantity,
                  price: savingsInfo.discountedPrice,
                  originalPrice: savingsInfo.originalPrice,
                  savings: savingsInfo.savings,
                  savingsPercentage: savingsInfo.savingsPercentage,
                  tierApplied: savingsInfo.tierApplied,
                };
              }),
              totalPrice: getTotalPrice(),
              totalSavings,
              totalOriginalPrice,
            }),
          });
          // Don't block order completion if email fails
          console.log("Order confirmation email sent");
        } catch (emailError) {
          console.error("Failed to send order confirmation email:", emailError);
          // Continue with order completion even if email fails
        }
      }

      // Mark discount code as used if applied
      if (appliedDiscount) {
        try {
          await LoyaltyService.validateAndUseDiscountCode(
            appliedDiscount.discount_code,
            orderId
          );
        } catch (discountError) {
          console.error("Error marking discount as used:", discountError);
          // Don't fail the order, but log it for admin attention
        }
      }

      // Process loyalty discount (for NEXT order)
      try {
        const productNames = items.map((item) => item.product.name);
        await LoyaltyService.processLoyaltyDiscount(
          customerId,
          formData.fullName,
          getTotalPrice(),
          productNames
        );
      } catch (loyaltyError) {
        console.error("Error processing loyalty discount:", loyaltyError);
        // Don't block the flow if loyalty processing fails
      }

      toast.success("Order placed successfully!");
      clearCart();
      router.push(`/orders/${orderId}`);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = getTotalPrice();

  // Calculate total savings across all items
  const totalSavings = items.reduce((total, item) => {
    const savingsInfo = calculateSavings(item.product, item.quantity);
    return total + savingsInfo.savings;
  }, 0);

  const totalOriginalPrice = items.reduce((total, item) => {
    const savingsInfo = calculateSavings(item.product, item.quantity);
    return total + savingsInfo.originalPrice;
  }, 0);

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-[#27247b] mb-2">Checkout</h1>
          <p className="text-gray-600">
            Complete your order with cash on delivery
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="border-2 border-gray-200 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-linear-to-r from-[#27247b] to-[#27247b]/90 text-white p-6">
                <CardTitle className="text-2xl font-bold text-whiteflex items-center">
                  <span className="text-3xl mr-3">📋</span>
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-[#27247b] mb-2">
                        Full Name *
                      </label>
                      <Input
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        required
                        className="border-2 border-gray-300 focus:border-[#ffff03] focus:ring-2 focus:ring-[#ffff03]/20 rounded-lg p-3 text-base"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-[#27247b] mb-2">
                          Phone Number *
                        </label>
                        <Input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          required
                          className="border-2 border-gray-300 focus:border-[#ffff03] focus:ring-2 focus:ring-[#ffff03]/20 rounded-lg p-3 text-base"
                          placeholder="03XX XXXXXXX"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#27247b] mb-2">
                          Email (Optional)
                        </label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="border-2 border-gray-300 focus:border-[#ffff03] focus:ring-2 focus:ring-[#ffff03]/20 rounded-lg p-3 text-base"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#27247b] mb-2">
                        Delivery Address *
                      </label>
                      <Input
                        value={formData.addressLine}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            addressLine: e.target.value,
                          })
                        }
                        required
                        className="border-2 border-gray-300 focus:border-[#ffff03] focus:ring-2 focus:ring-[#ffff03]/20 rounded-lg p-3 text-base"
                        placeholder="House #, Street, Area, City"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <div className="space-y-2">
                      <div className="bg-linear-to-br from-[#27247b]/5 to-[#27247b]/10 border-2 border-[#27247b]/20 rounded-xl p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <label className="text-sm text-[#27247b] font-bold mb-2 block">
                              📍 For Best Delivery Accuracy (Optional)
                            </label>
                            <ul className="text-xs text-[#27247b]/80 space-y-1 ml-4 list-disc">
                              <li>Turn on your phone's GPS/location</li>
                              <li className="text-[#27247b]/60 italic">Optional but recommended</li>
                            </ul>
                          </div>
                          <Button
                            type="button"
                            onClick={handleGetLocation}
                            disabled={gettingLocation}
                            className="bg-linear-to-r from-[#ffff03] to-[#ffed00] hover:from-[#ffff03]/90 hover:to-[#ffed00]/90 text-[#27247b] font-bold py-3 px-5 rounded-xl border-2 border-[#27247b]/30 shadow-lg hover:shadow-2xl hover:scale-[1.05] active:scale-[0.95] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 whitespace-nowrap"
                          >
                            <MapPin className={`w-5 h-5 ${gettingLocation ? 'animate-pulse' : ''}`} />
                            <span className="hidden sm:inline">
                              {gettingLocation ? "Getting Location..." : "Get Location"}
                            </span>
                            <span className="sm:hidden">
                              {gettingLocation ? "Getting..." : "GPS"}
                            </span>
                          </Button>
                        </div>
                      </div>

                      {/* Show location details only if actual coordinates are provided */}
                      {((formData.latitude !== 0 && formData.longitude !== 0) ||
                        (formData.latitude !== 0 && formData.longitude === 0) ||
                        (formData.latitude === 0 &&
                          formData.longitude !== 0)) && (
                          <div className="bg-[#ffff03]/20 border-2 border-[#ffff03] rounded-xl p-4">
                            <p className="text-sm font-bold text-[#27247b] mb-1">
                              ✓ Location Captured Successfully
                            </p>
                            <p className="text-xs text-[#27247b]/80">
                              Coordinates captured and ready for delivery
                            </p>
                            <a
                              href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#27247b] font-bold hover:underline mt-1 inline-block"
                            >
                              View on Google Maps
                            </a>
                          </div>
                        )}
                    </div>

                    <div className="space-y-2">

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="hidden text-xs font-bold text-[#27247b] mb-1">
                            Latitude
                          </label>
                          {/* Hidden latitude input - functionality preserved */}
                          <input
                            type="hidden"
                            step="any"
                            value={formData.latitude || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                latitude: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="hidden text-xs font-bold text-[#27247b] mb-1">
                            Longitude
                          </label>
                          {/* Hidden longitude input - functionality preserved */}
                          <input
                            type="hidden"
                            step="any"
                            value={formData.longitude || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                longitude: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-linear-to-r from-[#27247b] to-[#27247b]/90 hover:from-[#27247b]/90 hover:to-[#27247b] text-white font-bold py-6 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-[#ffff03]"
                    disabled={loading}
                  >
                    {loading
                      ? "⏳ Placing Order..."
                      : "🛒 Place Order (Cash on Delivery)"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            {/* Discount Code Section */}
            <Card className="border-2 border-gray-200 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-linear-to-r from-[#27247b] to-[#27247b]/90 p-6">
                <CardTitle className="text-xl font-bold text-white flex items-center">
                  <Gift className="w-5 h-5 mr-2 text-[#ffff03]" />
                  Discount Code
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {!appliedDiscount ? (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter code (e.g. LOYALTY...)"
                        value={discountCode}
                        onChange={(e) => {
                          setDiscountCode(e.target.value.toUpperCase());
                          setDiscountError("");
                        }}
                        className="uppercase"
                      />
                      <Button
                        type="button"
                        onClick={handleApplyDiscount}
                        disabled={validatingDiscount || !discountCode}
                        className="bg-[#ffff03] text-[#27247b] hover:bg-[#ffff03]/90 font-bold"
                      >
                        {validatingDiscount ? "..." : "Apply"}
                      </Button>
                    </div>
                    {discountError && (
                      <p className="text-red-500 text-sm flex items-center">
                        <X className="w-4 h-4 mr-1" />
                        {discountError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-green-800 font-bold flex items-center">
                          <Check className="w-4 h-4 mr-1" />
                          Code Applied!
                        </p>
                        <p className="text-sm text-green-600 font-mono mt-1">
                          {appliedDiscount.discount_code}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveDiscount}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-auto p-1"
                      >
                        Remove
                      </Button>
                    </div>
                    <p className="text-sm text-green-700">
                      {appliedDiscount.extra_discount_percentage}% discount will be
                      applied to your total.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="sticky top-20 border-2 border-gray-200 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-linear-to-r from-[#ffff03] to-[#ffff03]/90 p-6">
                <CardTitle className="text-2xl font-bold text-[#27247b] flex items-center">
                  <span className="text-3xl mr-3">🛒</span>
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 mb-6">
                  {items.map((item) => (
                    <div
                      key={item.product.$id}
                      className="flex justify-between items-center bg-gray-50 rounded-lg p-3 border border-gray-200"
                    >
                      <span className="text-sm font-medium text-[#27247b]">
                        {item.product.name}
                      </span>
                      <span className="text-sm font-bold text-[#27247b]">
                        {item.quantity}kg
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-gray-200 pt-4">
                  {totalSavings > 0 && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between items-center text-sm mb-1">
                        <span className="text-gray-600">Original Total:</span>
                        <span className="text-gray-500 line-through">
                          {formatCurrency(totalOriginalPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-green-700 font-semibold">
                          You Save:
                        </span>
                        <span className="text-green-700 font-bold">
                          -{formatCurrency(totalSavings)} (
                          {((totalSavings / totalOriginalPrice) * 100).toFixed(
                            0
                          )}
                          % off)
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-[#27247b]">
                      Subtotal
                    </span>
                    <span className="font-bold text-[#27247b]">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-[#27247b]">
                      Delivery
                    </span>
                    <span className="text-[#ffff03] font-bold bg-[#27247b] px-3 py-1 rounded-full text-sm">
                      FREE
                    </span>
                  </div>
                  <div className="border-t-2 border-[#ffff03] pt-4 bg-[#ffff03]/10 -mx-6 px-6 py-4">
                    {appliedDiscount && (
                      <div className="flex justify-between items-center mb-2 text-green-700">
                        <span className="font-semibold">Loyalty Discount ({appliedDiscount.extra_discount_percentage}%)</span>
                        <span className="font-bold">
                          -
                          {formatCurrency(
                            (totalPrice * appliedDiscount.extra_discount_percentage) /
                            100
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-[#27247b]">
                        Total
                      </span>
                      <span className="text-3xl font-bold text-[#27247b]">
                        {formatCurrency(
                          appliedDiscount
                            ? totalPrice -
                            (totalPrice *
                              appliedDiscount.extra_discount_percentage) /
                            100
                            : totalPrice
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-[#27247b] rounded-xl">
                  <p className="text-sm text-white font-bold flex items-center">
                    <span className="text-xl mr-2">💰</span>
                    Cash on Delivery
                  </p>
                  <p className="text-xs text-white/90 mt-1">
                    Pay when you receive your order
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div >
  );
}
