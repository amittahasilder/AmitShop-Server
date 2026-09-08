export const orderDeliveredEmailTemplate = ({
  name,
  orderId,
}) => {
  return {
    subject: `Order Delivered 📦 - #${orderId}`,

    text: `Hi ${name},

Your order #${orderId} has been successfully delivered.

Thank you for shopping with AmitShop!

AmitShop Team`,

    html: `
      <div style="font-family:Arial,sans-serif;background:#f5f3ff;padding:30px;">
        <div style="max-width:600px;margin:auto;background:white;padding:30px;border-radius:12px;">

          <h1 style="color:#16a34a;">
            Order Delivered 📦
          </h1>

          <p>Hi <strong>${name}</strong>,</p>

          <p>
            Your order has been successfully delivered.
          </p>

          <div style="background:#f0fdf4;padding:20px;border-radius:10px;">
            <strong>Order ID:</strong> ${orderId}
          </div>

          <p style="margin-top:25px;">
            We hope you enjoy your purchase! ❤️
          </p>

          <p style="color:#666;">
            AmitShop Team
          </p>

        </div>
      </div>
    `,
  };
};