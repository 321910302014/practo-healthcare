import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  // Fail fast if outbound SMTP is blocked/slow (common on cloud hosts like
  // Render) instead of hanging the request that awaits the email.
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000
});

/**
 * Sends an email with up to 2 attachments:
 * 1. A PDF buffer (summary)
 * 2. A raw file buffer (original uploaded report)
 */
const sendEmail = async (
  to,
  subject,
  text,
  pdfBufferOrAttachments = null, // legacy PDF buffer OR a ready nodemailer attachments array
  pdfFilename = null,
  extraAttachment = null // { buffer, filename }
) => {
  let attachments = [];

  if (Array.isArray(pdfBufferOrAttachments)) {
    // New style: caller passes a ready-made nodemailer attachments array,
    // e.g. [{ path: <fileUrl>, filename }, { content: <pdfBuffer>, filename }].
    attachments = pdfBufferOrAttachments;
  } else {
    // Legacy positional style: (pdfBuffer, pdfFilename, extraAttachment).
    const pdfBuffer = pdfBufferOrAttachments;

    if (pdfBuffer && pdfFilename) {
      attachments.push({
        filename: pdfFilename,
        content: pdfBuffer,
        contentType: 'application/pdf'
      });
    }

    if (extraAttachment?.buffer && extraAttachment?.filename) {
      attachments.push({
        filename: extraAttachment.filename,
        content: extraAttachment.buffer,
        contentType: 'application/octet-stream' // general file
      });
    }
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    ...(attachments.length > 0 && { attachments })
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
  }
};

export default sendEmail;
