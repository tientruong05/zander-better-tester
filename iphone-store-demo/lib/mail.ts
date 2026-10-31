import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "mail.privateemail.com",
  port: 465,
  secure: true, // Use SSL/TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const stripHtml = (htmlContent: string) => {
  return htmlContent
    .replace(/<style[^>]*>.*?<\/style>/gi, "") // Remove style tags and their content
    .replace(/<[^>]*>?/gm, " ") // Replace HTML tags with space
    .replace(/&nbsp;/g, " ") // Replace non-breaking spaces
    .replace(/\s+/g, " ") // Remove extra spaces
    .trim();
};

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  try {
    const info = await transporter.sendMail({
      from: `"iPhone Store" <${process.env.SMTP_USER}>`,
      replyTo: process.env.SMTP_USER,
      to,
      subject,
      text: stripHtml(html),
      html,
    });
    console.log("Email sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
};
