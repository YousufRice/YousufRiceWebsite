
export async function POST(req) {
  try {
    const body = await req.json();

    const formData = new URLSearchParams();
    formData.append("MERCHANT_ID", body.merchantId);
    formData.append("SECURED_KEY", process.env.PAYFAST_SECURED_KEY);
    formData.append("BASKET_ID", body.basketId);
    formData.append("TXNAMT", body.amount);
    formData.append("CURRENCY_CODE", "PKR");

    console.log("📤 PayFast Token Request:", {
      merchantId: body.merchantId,
      basketId: body.basketId,
      amount: body.amount,
      hasSecuredKey: !!process.env.PAYFAST_SECURED_KEY
    });

    const res = await fetch(
      "https://ipguat.apps.net.pk/Ecommerce/api/Transaction/GetAccessToken",
      {
        method: "POST",
        headers: {
          "User-Agent": "Next.js App",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }
    );

    console.log("📥 PayFast Response Status:", res.status, res.statusText);

    const data = await res.json();
    
    console.log("📥 PayFast Response Data:", data);

    return Response.json(data);
  } catch (error) {
    console.error("❌ PayFast Token Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
