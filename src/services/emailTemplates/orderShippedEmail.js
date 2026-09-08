export const orderShippedEmailTemplate = ({
  name,
  orderId,
}) => {
  return {
    subject: `Your Order Has Shipped 🚚 - #${orderId}`,

    text: `Hi ${name},

Great news!

Your order #${orderId} has been shipped.

You will receive your order soon.

AmitShop Team`,

    html: `
      <div style="font-family:Arial,sans-serif;background:#f5f3ff;padding:30px;">
        <div style="max-width:600px;margin:auto;background:white;padding:30px;border-radius:12px;">

          <h1 style="color:#2563eb;">
            Your Order Has Shipped 🚚
          </h1>

          <p>Hi <strong>${name}</strong>,</p>

          <p>
            Great news! Your order has been shipped.
          </p>

          <div style="background:#eff6ff;padding:20px;border-radius:10px;">
            <strong>Order ID:</strong> ${orderId}
          </div>

          <p style="margin-top:25px;">
            Your package is now on its way.
          </p>

          <p style="color:#666;">
            AmitShop Team
          </p>

        </div>
      </div>
    `,
  };
};