// ==========================================
// PAYMENT SUCCESS EMAIL TEMPLATE
// ==========================================

export const paymentSuccessEmailTemplate = ({
  name,
  orderId,
  totalPrice,
}) => {
  // ==========================================
  // SAFE VALUES
  // ==========================================

  const customerName = name || "Customer";
  const formattedOrderId = String(orderId || "");
  const formattedTotal = Number(totalPrice || 0).toFixed(2);

  // ==========================================
  // EMAIL SUBJECT
  // ==========================================

  const subject =
    `AmitShop Payment Successful - Order #${formattedOrderId}`;

  // ==========================================
  // PLAIN TEXT EMAIL
  // ==========================================

  const text = `
Hi ${customerName},

Your payment has been successfully received.

Order ID: ${formattedOrderId}
Amount Paid: $${formattedTotal}

Your order is now being processed.

Thank you for shopping with AmitShop.

AmitShop Team
`;

  // ==========================================
  // HTML EMAIL
  // ==========================================

  const html = `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>Payment Successful</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f5f3ff;
    font-family:Arial,Helvetica,sans-serif;
  "
>

  <!-- MAIN CONTAINER -->

  <div
    style="
      width:100%;
      padding:40px 20px;
      box-sizing:border-box;
    "
  >

    <!-- EMAIL CARD -->

    <div
      style="
        max-width:600px;
        margin:0 auto;
        background:#ffffff;
        border-radius:16px;
        overflow:hidden;
        box-shadow:0 10px 30px rgba(0,0,0,0.08);
      "
    >

      <!-- HEADER -->

      <div
        style="
          background:linear-gradient(
            135deg,
            #4c1d95,
            #7c3aed
          );
          padding:30px;
          text-align:center;
        "
      >

        <h1
          style="
            margin:0;
            color:#ffffff;
            font-size:30px;
          "
        >
          AmitShop
        </h1>

        <p
          style="
            margin:10px 0 0;
            color:#ede9fe;
            font-size:15px;
          "
        >
          Your trusted online shopping store
        </p>

      </div>

      <!-- CONTENT -->

      <div
        style="
          padding:35px;
        "
      >

        <!-- SUCCESS TITLE -->

        <h2
          style="
            margin:0 0 20px;
            color:#16a34a;
            font-size:26px;
          "
        >
          Payment Successful ✅
        </h2>

        <!-- GREETING -->

        <p
          style="
            margin:0 0 15px;
            color:#27272a;
            font-size:16px;
            line-height:1.6;
          "
        >
          Hi
          <strong>${customerName}</strong>,
        </p>

        <!-- MESSAGE -->

        <p
          style="
            margin:0;
            color:#52525b;
            font-size:15px;
            line-height:1.7;
          "
        >
          Your payment has been successfully
          received. Thank you for shopping with
          AmitShop.
        </p>

        <!-- ORDER INFORMATION -->

        <div
          style="
            margin-top:25px;
            padding:22px;
            background:#f0fdf4;
            border:1px solid #bbf7d0;
            border-radius:12px;
          "
        >

          <!-- ORDER ID -->

          <p
            style="
              margin:0 0 12px;
              color:#27272a;
              font-size:15px;
            "
          >
            <strong>Order ID:</strong>

            ${formattedOrderId}
          </p>

          <!-- AMOUNT -->

          <p
            style="
              margin:0;
              color:#27272a;
              font-size:15px;
            "
          >
            <strong>Amount Paid:</strong>

            <span
              style="
                color:#16a34a;
                font-weight:bold;
              "
            >
              $${formattedTotal}
            </span>
          </p>

        </div>

        <!-- PROCESSING MESSAGE -->

        <p
          style="
            margin:25px 0 0;
            color:#52525b;
            font-size:15px;
            line-height:1.7;
          "
        >
          Your order is now being processed.
          We will keep you updated about your
          order status.
        </p>

        <!-- THANK YOU -->

        <p
          style="
            margin:25px 0 0;
            color:#27272a;
            font-size:15px;
            line-height:1.7;
          "
        >
          Thank you for choosing
          <strong>AmitShop</strong>.
        </p>

        <!-- TEAM -->

        <p
          style="
            margin:25px 0 0;
            color:#71717a;
            font-size:14px;
          "
        >
          AmitShop Team
        </p>

      </div>

      <!-- FOOTER -->

      <div
        style="
          padding:20px;
          background:#fafafa;
          border-top:1px solid #e4e4e7;
          text-align:center;
        "
      >

        <p
          style="
            margin:0;
            color:#71717a;
            font-size:13px;
          "
        >
          © ${new Date().getFullYear()}
          AmitShop. All rights reserved.
        </p>

      </div>

    </div>

  </div>

</body>

</html>
`;

  // ==========================================
  // RETURN EMAIL DATA
  // ==========================================

  return {
    subject,
    text,
    html,
  };
};