import nodemailer from "nodemailer";

// ==========================================
// EMAIL TRANSPORTER
// ==========================================

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ==========================================
// SEND EMAIL
// ==========================================

export const sendEmail = async ({
  to,
  subject,
  html,
  text = "",
}) => {
  try {
    if (!to) {
      throw new Error("Recipient email is required");
    }

    if (!subject) {
      throw new Error("Email subject is required");
    }

    if (!html && !text) {
      throw new Error(
        "Email html or text content is required"
      );
    }

    const mailOptions = {
      from: `"AmitShop" <${process.env.EMAIL_USER}>`,

      to,

      subject,

      text,

      html,
    };

    const info =
      await transporter.sendMail(mailOptions);

    console.log(
      `📧 Email sent successfully: ${info.messageId}`
    );

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error(
      "Send Email Error:",
      error.message
    );

    return {
      success: false,
      message: error.message,
    };
  }
};

// ==========================================
// VERIFY EMAIL CONFIG
// ==========================================

export const verifyEmailConnection = async () => {
  try {
    await transporter.verify();

    console.log(
      "✅ Email service connected successfully"
    );

    return true;
  } catch (error) {
    console.error(
      "❌ Email service connection failed:",
      error.message
    );

    return false;
  }
};

export default transporter;