export const paymentSuccessEmailTemplate = ({
  name,
  orderId,
  totalPrice,
}) => {
  return {
    subject: `Payment Successful - Order #${orderId}`,

    text: `Hi ${name},

Your payment has been successfully received.

Order ID: ${orderId}
Amount Paid: $${Number(totalPrice).toFixed(2)}

Thank you for shopping with AmitShop.`,

    html: `
      <div style="font-family:Arial,sans-serif;background:#f5f3ff;padding:30px;">
        <div style="max-width:600px;margin:auto;background:white;padding:30px;border-radius:12px;">

          <h1 style="color:#16a34a;">
            Payment Successful ✅
          </h1>

          <p>Hi <strong>${name}</strong>,</p>

          <p>
            Your payment has been successfully received.
          </p>

          <div style="background:#f0fdf4;padding:20px;border-radius:10px;margin-top:20px;">
            <p>
              <strong>Order ID:</strong> ${orderId}
            </p>

            <p>
              <strong>Amount Paid:</strong>
              $${Number(totalPrice).toFixed(2)}
            </p>
          </div>

          <p style="margin-top:25px;">
            Your order is now being processed.
          </p>

          <p style="color:#666;">
            AmitShop Team
          </p>

        </div>
      </div>
    `,
  };
};