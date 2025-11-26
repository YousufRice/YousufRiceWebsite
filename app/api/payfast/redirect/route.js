
export async function POST(req) {
  const body = await req.json();

  const payfastURL =
    "https://ipguat.apps.net.pk/Ecommerce/api/Transaction/PostTransaction";

  // HTML auto-submitting form
  const htmlForm = `
    <html>
    <body onload="document.forms[0].submit()">
      <form method="POST" action="${payfastURL}">
        <input type="hidden" name="MERCHANT_ID" value="${body.merchantId}" />
        <input type="hidden" name="MERCHANT_NAME" value="${body.merchantName}" />
        <input type="hidden" name="TOKEN" value="${body.token}" />
        <input type="hidden" name="TXNAMT" value="${body.amount}" />
        <input type="hidden" name="CUSTOMER_EMAIL_ADDRESS" value="${body.email}" />
        <input type="hidden" name="CUSTOMER_MOBILE_NO" value="${body.phone}" />
        <input type="hidden" name="BASKET_ID" value="${body.basketId}" />
        <input type="hidden" name="ORDER_DATE" value="${body.orderDate}" />
        <input type="hidden" name="SIGNATURE" value="${body.signature}" />
        <input type="hidden" name="TXNDESC" value="${body.description}" />
        <input type="hidden" name="PROCCODE" value="00" />
        <input type="hidden" name="VERSION" value="MERCHANTCART-0.1" />

        <input type="hidden" name="SUCCESS_URL" value="${body.successUrl}" />
        <input type="hidden" name="FAILURE_URL" value="${body.failureUrl}" />
        <input type="hidden" name="CHECKOUT_URL" value="${body.checkoutUrl}" />

        <input type="hidden" name="MERCHANT_USERAGENT" value="${body.userAgent}" />
      </form>
    </body>
    </html>
  `;

  return new Response(htmlForm, {
    headers: { "Content-Type": "text/html" },
  });
}
