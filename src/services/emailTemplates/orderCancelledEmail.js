// ==========================================
// ORDER CANCELLED EMAIL TEMPLATE
// ==========================================

export const orderCancelledEmailTemplate = ({
  name,
  orderId,
  totalPrice,
}) => {
  // ==========================================
  // EMAIL SUBJECT
  // ==========================================

  const subject =
    `Order Cancelled - Order #${orderId}`;

  // ==========================================
  // PLAIN TEXT EMAIL
  // ==========================================

  const text = `
Hi ${name},

Your AmitShop order has been successfully cancelled.

Order ID: ${orderId}
Order Amount: $${Number(totalPrice).toFixed(2)}

If you cancelled this order by mistake, you can place a new order from AmitShop.

Thank you for shopping with AmitShop.

AmitShop Team
`;

  // ==========================================
  // HTML EMAIL
  // ==========================================

  const html = `
    <!DOCTYPE html>

    <html>
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>
          Order Cancelled
        </title>
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

              <!-- CANCELLED TITLE -->

              <h2
                style="
                  margin:0 0 20px;
                  color:#dc2626;
                  font-size:26px;
                "
              >
                Order Cancelled ❌
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
                <strong>${name}</strong>,
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
                Your AmitShop order has been
                successfully cancelled.
              </p>

              <!-- ORDER INFORMATION -->

              <div
                style="
                  margin-top:25px;
                  padding:22px;
                  background:#fef2f2;
                  border:1px solid #fecaca;
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
                  <strong>
                    Order ID:
                  </strong>

                  ${orderId}
                </p>

                <!-- TOTAL PRICE -->

                <p
                  style="
                    margin:0;
                    color:#27272a;
                    font-size:15px;
                  "
                >
                  <strong>
                    Order Amount:
                  </strong>

                  <span
                    style="
                      color:#dc2626;
                      font-weight:bold;
                    "
                  >
                    $${Number(totalPrice).toFixed(2)}
                  </span>
                </p>

              </div>

              <!-- CANCEL MESSAGE -->

              <p
                style="
                  margin:25px 0 0;
                  color:#52525b;
                  font-size:15px;
                  line-height:1.7;
                "
              >
                If you cancelled this order by
                mistake, you can place a new order
                from AmitShop.
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