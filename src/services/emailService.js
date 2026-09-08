import nodemailer from "nodemailer";

import { welcomeEmailTemplate } from "./emailTemplates/welcomeEmail.js";
import { orderConfirmationEmailTemplate } from "./emailTemplates/orderConfirmationEmail.js";
import { paymentSuccessEmailTemplate } from "./emailTemplates/paymentSuccessEmail.js";
import { orderShippedEmailTemplate } from "./emailTemplates/orderShippedEmail.js";
import { orderDeliveredEmailTemplate } from "./emailTemplates/orderDeliveredEmail.js";
import { orderCancelledEmailTemplate } from "./emailTemplates/orderCancelledEmail.js";

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

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
      throw new Error("Email html or text content is required");
    }

    const mailOptions = {
      from: `"AmitShop" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`📧 Email sent successfully: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Send Email Error:", error.message);

    return {
      success: false,
      message: error.message,
    };
  }
};

export const sendWelcomeEmail = async ({
  to,
  name,
}) => {
  const email = welcomeEmailTemplate({
    name,
  });

  return sendEmail({
    to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
};

export const sendOrderConfirmationEmail = async ({
  to,
  name,
  orderId,
  items,
  totalPrice,
}) => {
  const email = orderConfirmationEmailTemplate({
    name,
    orderId,
    items,
    totalPrice,
  });

  return sendEmail({
    to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
};

export const sendPaymentSuccessEmail = async ({
  to,
  name,
  orderId,
  totalPrice,
}) => {
  const email = paymentSuccessEmailTemplate({
    name,
    orderId,
    totalPrice,
  });

  return sendEmail({
    to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
};

export const sendOrderShippedEmail = async ({
  to,
  name,
  orderId,
}) => {
  const email = orderShippedEmailTemplate({
    name,
    orderId,
  });

  return sendEmail({
    to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
};

export const sendOrderDeliveredEmail = async ({
  to,
  name,
  orderId,
}) => {
  const email = orderDeliveredEmailTemplate({
    name,
    orderId,
  });

  return sendEmail({
    to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
};

export const sendOrderCancelledEmail = async ({
  to,
  name,
  orderId,
}) => {
  const email = orderCancelledEmailTemplate({
    name,
    orderId,
  });

  return sendEmail({
    to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
};

export const verifyEmailConnection = async () => {
  try {
    await transporter.verify();

    console.log("✅ Email service connected successfully");

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