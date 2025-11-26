
export async function POST(req) {
  try {
    const body = await req.json();

    const formData = new URLSearchParams();
    formData.append("MERCHANT_ID", body.merchantId);
    formData.append("SECURED_KEY", process.env.PAYFAST_SECURED_KEY);
    formData.append("BASKET_ID", body.basketId);
    formData.append("TXNAMT", body.amount);
    formData.append("CURRENCY_CODE", "PKR");

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

    const data = await res.json();

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
