import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { basket_id, txnamt, customer_mobile, customer_email } = body;

    const merchant_id = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID;
    const secured_key = process.env.PAYFAST_SECURED_KEY;
    const api_url = process.env.NEXT_PUBLIC_PAYFAST_API_URL || "https://ipguat.apps.net.pk/Ecommerce/api";

    if (!merchant_id || !secured_key) {
      return NextResponse.json(
        { error: "Server configuration error: Missing PayFast credentials" },
        { status: 500 }
      );
    }

    if (!basket_id || !txnamt) {
      return NextResponse.json(
        { error: "Missing required fields: basket_id, txnamt" },
        { status: 400 }
      );
    }

    // 1. Get Access Token - Exactly matching payment.php example
    const tokenUrl = `${api_url}/Transaction/GetAccessToken`;
    const currency_code = "PKR";

    // Build POST body EXACTLY as shown in payment.php line 60-67
    // Format: MERCHANT_ID=%s&SECURED_KEY=%s&BASKET_ID=%s&TXNAMT=%s&CURRENCY_CODE=%s
    const urlPostParams = `MERCHANT_ID=${merchant_id}&SECURED_KEY=${secured_key}&BASKET_ID=${basket_id}&TXNAMT=${txnamt}&CURRENCY_CODE=${currency_code}`;

    console.log("Requesting PayFast Token:", tokenUrl);
    console.log("POST Body:", urlPostParams);

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "CURL/PHP PayFast Integration",
      },
      body: urlPostParams,
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("PayFast Token Error:", tokenResponse.status, errorText);
      return NextResponse.json(
        { error: "Failed to get access token from PayFast", details: errorText },
        { status: 502 }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.ACCESS_TOKEN;

    if (!accessToken) {
      console.error("PayFast Token Response missing ACCESS_TOKEN:", tokenData);
      return NextResponse.json(
        { error: "Invalid response from PayFast" },
        { status: 502 }
      );
    }

    // 2. Prepare Form Data for Frontend
    // The frontend will use this to submit the form to PayFast
    const successUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/checkout/success?orderId=${basket_id}`;
    const failureUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/checkout/failure?orderId=${basket_id}`;
    const checkoutUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/payfast/notify`; // IPN URL

    // Generate Signature (Random String as per guide, but guide says "SIGNATURE: A random string value")
    // Wait, the guide says "SIGNATURE: A random string value". It doesn't specify a hash for the REQUEST.
    // It only specifies a hash for the RESPONSE/IPN validation.
    const signature = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const version = "MERCHANT-CART-0.1";

    const formData = {
      CURRENCY_CODE: currency_code,
      MERCHANT_ID: merchant_id,
      MERCHANT_NAME: "Yousuf Rice", // You might want to make this configurable
      TOKEN: accessToken,
      BASKET_ID: basket_id,
      TXNAMT: txnamt.toString(),
      ORDER_DATE: new Date().toISOString().slice(0, 19).replace('T', ' '), // Format: YYYY-MM-DD HH:mm:ss
      SUCCESS_URL: successUrl,
      FAILURE_URL: failureUrl,
      CHECKOUT_URL: checkoutUrl,
      CUSTOMER_EMAIL_ADDRESS: customer_email || "",
      CUSTOMER_MOBILE_NO: customer_mobile || "",
      SIGNATURE: signature,
      VERSION: version,
      TXNDESC: "Order from Yousuf Rice",
      PROCCODE: "00",
      TRAN_TYPE: "ECOMM_PURCHASE",
    };

    return NextResponse.json({
      token: accessToken,
      postUrl: `${api_url}/Transaction/PostTransaction`,
      formData: formData,
    });

  } catch (error: any) {
    console.error("PayFast API Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
