import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  const mailOptions = {
    from: `"BardPOS Intelligence" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  };

  return await transporter.sendMail(mailOptions);
};

export const sendOTPEmail = async (to: string, code: string) => {
  const subject = "Verification Required: Your Dashboard Access Code";
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #ffffff; padding: 40px; border-radius: 24px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h2 style="color: #10b981; margin: 0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.4em;">Next-Gen POS Ecosystem</h2>
        <h1 style="font-size: 32px; font-weight: 900; margin: 10px 0; font-style: italic; letter-spacing: -0.05em;">LEGACY <span style="color: #10b981;">REDEFINED.</span></h1>
      </div>
      
      <div style="background: rgba(255, 255, 255, 0.05); padding: 30px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
        <p style="color: #94a3b8; font-size: 14px; text-transform: uppercase; font-weight: 900; letter-spacing: 0.1em; margin-bottom: 20px;">Identity Verification Protocol</p>
        <p style="color: #ffffff; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">An uplink request was detected for your terminal. Use the following synchronization code to authorize your access:</p>
        
        <div style="background: #ffffff; color: #000000; padding: 20px; text-align: center; border-radius: 16px; font-size: 48px; font-weight: 900; letter-spacing: 15px; font-family: monospace; border: 4px solid #10b981;">
          ${code}
        </div>
        
        <p style="color: #475569; font-size: 12px; margin-top: 30px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; text-align: center;">This code expires in 10 minutes. Do not share your signature.</p>
      </div>

      <div style="margin-top: 40px; text-align: center; color: #475569; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3em;">
        Marketplace Authority 2.4.0 &copy; 2026
      </div>
    </div>
  `;

  return await sendEmail(to, subject, html);
};

export const sendLowStockAlert = async (emails: string[], product: { name: string; sku: string; stock: number; alertQuantity: number }) => {
  if (emails.length === 0) return;

  const subject = `CRITICAL: Low Stock Alert - ${product.name}`;
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #ffffff; padding: 40px; border-radius: 24px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h2 style="color: #f59e0b; margin: 0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.4em;">Inventory Warning System</h2>
        <h1 style="font-size: 32px; font-weight: 900; margin: 10px 0; font-style: italic; letter-spacing: -0.05em;">LOW STOCK <span style="color: #f59e0b;">ALERT.</span></h1>
      </div>
      
      <div style="background: rgba(255, 255, 255, 0.05); padding: 30px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
        <p style="color: #94a3b8; font-size: 14px; text-transform: uppercase; font-weight: 900; letter-spacing: 0.1em; margin-bottom: 20px;">Asset Criticality Report</p>
        
        <div style="margin-bottom: 25px;">
            <p style="color: #94a3b8; font-size: 10px; text-transform: uppercase; margin: 0;">Product Identifier</p>
            <p style="color: #ffffff; font-size: 18px; font-weight: 700; margin: 5px 0;">${product.name}</p>
            <p style="color: #475569; font-size: 12px; font-family: monospace;">SKU: ${product.sku}</p>
        </div>

        <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-top: 30px; padding: 20px; background: rgba(245, 158, 11, 0.1); border-radius: 12px;">
            <div>
                <p style="color: #f59e0b; font-size: 10px; text-transform: uppercase; margin: 0;">Current Units</p>
                <p style="color: #f59e0b; font-size: 32px; font-weight: 900; margin: 5px 0;">${product.stock}</p>
            </div>
            <div>
                <p style="color: #94a3b8; font-size: 10px; text-transform: uppercase; margin: 0;">Danger Zone</p>
                <p style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 5px 0;">≤ ${product.alertQuantity}</p>
            </div>
        </div>
        
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-top: 30px;">
            Immediate replenishment is required to maintain operational stability. This asset has hit the system's low-stock threshold.
        </p>
      </div>

      <div style="margin-top: 40px; text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/inventory" style="display: inline-block; padding: 12px 30px; background: #f59e0b; color: #000000; text-decoration: none; border-radius: 30px; font-weight: 900; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Manage Inventory</a>
      </div>

      <div style="margin-top: 40px; text-align: center; color: #475569; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3em;">
        Supply Chain Intelligence &copy; 2026
      </div>
    </div>
  `;

  // Send to all admin emails
  const sendPromises = emails.map(email => sendEmail(email, subject, html));
  return Promise.all(sendPromises);
};
