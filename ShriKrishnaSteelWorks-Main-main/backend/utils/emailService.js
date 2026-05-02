import nodemailer from "nodemailer";

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email using the configured transporter.
 * If credentials are not configured, it simulates sending the email via console.log.
 */
const sendMail = async (mailOptions) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("⚠️ SMTP_USER or SMTP_PASS not set in .env. Email would have been sent:");
    console.log(mailOptions);
    return;
  }
  
  try {
    const info = await transporter.sendMail({
      from: `"ShriKrishna SteelWorks" <${process.env.SMTP_USER}>`,
      ...mailOptions,
    });
    console.log("✅ Email sent: %s", info.messageId);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
};

/**
 * Send an update email when an order status changes.
 */
export const sendOrderUpdateEmail = async (userEmail, orderDetails, newStatus) => {
  if (!userEmail) return;
  
  const mailOptions = {
    to: userEmail,
    subject: `Order Update: ${orderDetails.orderId} is now ${newStatus}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Order Status Update</h2>
        <p>Your order <strong>${orderDetails.orderId}</strong> for <strong>${orderDetails.product}</strong> has been updated.</p>
        <p>New Status: <strong style="color: #0284C7;">${newStatus}</strong></p>
        ${newStatus === "Shipped" || newStatus === "Delivered" ? `<p>You can download your invoice from your dashboard.</p>` : ""}
        <br />
        <p>Thank you for choosing ShriKrishna SteelWorks!</p>
      </div>
    `,
  };
  await sendMail(mailOptions);
};

/**
 * Send an update email when a project's status or notes change.
 */
export const sendProjectUpdateEmail = async (userEmail, projectDetails, newStatus, adminNotes) => {
  if (!userEmail) return;

  const mailOptions = {
    to: userEmail,
    subject: `Project Update: ${projectDetails.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Project Update</h2>
        <p>There is an update regarding your project request: <strong>${projectDetails.title}</strong></p>
        <p>Current Status: <strong style="color: #F59E0B;">${newStatus}</strong></p>
        ${adminNotes ? `
        <div style="background-color: #f1f5f9; padding: 15px; border-left: 4px solid #3b82f6; margin-top: 15px;">
          <strong style="color: #1e293b;">Admin Notes:</strong><br />
          <p style="white-space: pre-wrap;">${adminNotes}</p>
        </div>` : ""}
        <br />
        <p>Please log in to your dashboard to view more details.</p>
        <p>Thank you,<br/>ShriKrishna SteelWorks</p>
      </div>
    `,
  };
  await sendMail(mailOptions);
};

/**
 * Send an email when an admin responds to an inquiry.
 */
export const sendInquiryResponseEmail = async (userEmail, inquiryDetails, adminResponse) => {
  if (!userEmail) return;

  const mailOptions = {
    to: userEmail,
    subject: `Response to your Inquiry: ${inquiryDetails.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Inquiry Response</h2>
        <p>Hello ${inquiryDetails.name},</p>
        <p>We have reviewed your inquiry and have an update for you:</p>
        <div style="background-color: #f1f5f9; padding: 15px; border-left: 4px solid #3b82f6; margin-top: 15px;">
          <strong style="color: #1e293b;">ShriKrishna SteelWorks:</strong><br />
          <p style="white-space: pre-wrap;">${adminResponse}</p>
        </div>
        <br />
        <p>If you have any further questions, feel free to reply or contact us through the website.</p>
        <p>Best regards,<br/>ShriKrishna SteelWorks Team</p>
      </div>
    `,
  };
  await sendMail(mailOptions);
};
