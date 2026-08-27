import { Resend } from 'resend'

export class EmailService {
  static async sendVerificationOtp(to: string, otp: string): Promise<{ ok: boolean; error?: string }> {
    const key = process.env.RESEND_API_KEY
    if (!key) {
      console.error('[EmailService Error]: RESEND_API_KEY environment variable is not defined.')
      return { ok: false, error: 'RESEND_API_KEY_MISSING' }
    }

    const resend = new Resend(key)
    const email = process.env.EMAIL_FROM || 'verify@dsrtai.com'
    const name = process.env.EMAIL_FROM_NAME || 'DSRT Security'
    const fromAddress = `${name} <${email}>`
    const subject = `${otp} is your DSRT Connect verification code`

    const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#05070D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#0A0D14;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px;text-align:center;color:#fff;">
    <h1 style="margin:0 0 8px;font-size:22px;">DSRT Connect</h1>
    <p style="margin:0 0 24px;color:rgba(255,255,255,0.6);font-size:14px;">Use this code to verify your email and continue setting up your identity.</p>
    <div style="display:inline-block;letter-spacing:8px;font-size:32px;font-weight:800;color:#4F7CFF;background:rgba(79,124,255,0.12);padding:14px 18px;border-radius:12px;">${otp}</div>
    <p style="margin:24px 0 0;color:rgba(255,255,255,0.4);font-size:12px;">Expires in 10 minutes. If you did not request this, ignore this email.</p>
  </div>
</body>
</html>`

    try {
      const { error } = await resend.emails.send({
        from: fromAddress,
        to: [to],
        subject,
        html,
      })

      if (error) {
        console.error('[EmailService] delivery failed:', error)
        return { ok: false, error: 'EMAIL_DELIVERY_FAILED' }
      }
      return { ok: true }
    } catch (err: any) {
      console.error('[EmailService Exception]:', err)
      return { ok: false, error: err.message || 'EMAIL_DISPATCH_EXCEPTION' }
    }
  }
}