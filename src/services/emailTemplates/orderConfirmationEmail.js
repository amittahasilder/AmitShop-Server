export const orderConfirmationEmailTemplate = ({
  name,
  orderId,
  items,
  totalPrice,
}) => {
  const itemsHtml = items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px; border-bottom:1px solid #eee;">
            ${item.name}
          </td>

          <td style="padding:10px; border-bottom:1px solid #eee;">
            ${item.quantity}
          </td>

          <td style="padding:10px; border-bottom:1px solid #eee;">
            $${Number(item.price).toFixed(2)}
          </td>
        </tr>
      `
    )
    .join("");

  return {
    subject: `Order Confirmed #${orderId}`,

    text: `Hi ${name},

Your order has been successfully placed.

Order ID: ${orderId}

Total: $${Number(totalPrice).toFixed(2)}

Thank you for shopping with AmitShop.`,

    html: `
      <div style="font-family:Arial,sans-serif;background:#f5f3ff;padding:30px;">
        <div style="max-width:650px;margin:auto;background:white;padding:30px;border-radius:12px;">

          <h1 style="color:#6d28d9;">
            Order Confirmed 🎉
          </h1>

          <p>Hi <strong>${name}</strong>,</p>

          <p>
            Thank you for your order. Your order has been successfully placed.
          </p>

          <p>
            <strong>Order ID:</strong> ${orderId}
          </p>

          <table style="width:100%;border-collapse:collapse;margin-top:20px;">
            <thead>
              <tr style="background:#f3f4f6;">
                <th style="padding:10px;text-align:left;">Product</th>
                <th style="padding:10px;text-align:left;">Qty</th>
                <th style="padding:10px;text-align:left;">Price</th>
              </tr>
            </thead>

            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <h2 style="margin-top:25px;">
            Total: $${Number(totalPrice).toFixed(2)}
          </h2>

          <p style="margin-top:30px;color:#666;">
            Thank you for shopping with AmitShop 🛍️
          </p>

        </div>
      </div>
    `,
  };
};