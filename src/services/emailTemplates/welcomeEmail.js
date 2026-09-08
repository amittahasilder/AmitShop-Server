export const welcomeEmailTemplate = ({ name }) => {
  return {
    subject: "Welcome to AmitShop 🎉",

    text: `Hi ${name},

Welcome to AmitShop!

Your account has been successfully created.

Thank you for joining us.

Happy Shopping!
AmitShop Team`,

    html: `
      <div style="font-family: Arial, sans-serif; background:#f5f3ff; padding:30px;">
        <div style="max-width:600px; margin:auto; background:white; padding:30px; border-radius:12px;">
          
          <h1 style="color:#6d28d9;">Welcome to AmitShop 🎉</h1>

          <p>Hi <strong>${name}</strong>,</p>

          <p>
            Welcome to AmitShop! Your account has been successfully created.
          </p>

          <p>
            We're excited to have you with us.
          </p>

          <div style="margin-top:25px;">
            <strong>Happy Shopping! 🛍️</strong>
          </div>

          <p style="margin-top:30px; color:#666;">
            AmitShop Team
          </p>

        </div>
      </div>
    `,
  };
};