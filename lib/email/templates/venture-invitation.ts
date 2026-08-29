interface InvitationEmailParams {
  ventureName: string
  ventureLogo?: string | null
  ventureTagline?: string | null
  inviterName: string
  inviterAvatar?: string | null
  recipientFirstName: string
  proposedRoleTitle: string
  teamName?: string | null
  personalMessage?: string | null
  reviewUrl: string
  expiresInDays: number
}

export function ventureInvitationEmail(params: InvitationEmailParams) {
  const {
    ventureName, ventureLogo, ventureTagline,
    inviterName, inviterAvatar,
    recipientFirstName, proposedRoleTitle, teamName,
    personalMessage, reviewUrl, expiresInDays
  } = params

  const subject = `${inviterName} invited you to join ${ventureName}`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escape(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e4e4e7;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#09090b;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;background-color:#121215;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;">

          <!-- Top bar -->
          <tr>
            <td style="padding:16px 24px;border-bottom:1px solid rgba(255,255,255,0.06);background-color:rgba(0,0,0,0.3);">
              <p style="margin:0;font-family:'SF Mono',Monaco,monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#71717a;font-weight:700;">
                DSRT Connect · Team Invitation
              </p>
            </td>
          </tr>

          <!-- Venture header -->
          <tr>
            <td style="padding:32px 24px 24px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-right:16px;vertical-align:top;">
                    ${ventureLogo
                      ? `<img src="${escape(ventureLogo)}" alt="${escape(ventureName)}" width="56" height="56" style="border-radius:12px;border:1px solid rgba(255,255,255,0.08);display:block;">`
                      : `<div style="width:56px;height:56px;border-radius:12px;background:linear-gradient(135deg,#3f3f46,#18181b);display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;font-weight:700;">${escape(ventureName.charAt(0).toUpperCase())}</div>`
                    }
                  </td>
                  <td style="vertical-align:top;">
                    <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;line-height:1.3;">
                      ${escape(ventureName)}
                    </h1>
                    ${ventureTagline
                      ? `<p style="margin:4px 0 0 0;font-size:13px;color:#a1a1aa;line-height:1.5;">${escape(ventureTagline)}</p>`
                      : ''
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main message -->
          <tr>
            <td style="padding:0 24px 24px 24px;">
              <h2 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
                Hey ${escape(recipientFirstName)},
              </h2>
              <p style="margin:0;font-size:14px;color:#d4d4d8;line-height:1.6;">
                <strong style="color:#ffffff;">${escape(inviterName)}</strong> invited you to join
                <strong style="color:#ffffff;">${escape(ventureName)}</strong> as a
                <strong style="color:#ffffff;">${escape(proposedRoleTitle)}</strong>${teamName ? ` on the <strong style="color:#ffffff;">${escape(teamName)}</strong> team` : ''}.
              </p>
            </td>
          </tr>

          ${personalMessage ? `
          <tr>
            <td style="padding:0 24px 24px 24px;">
              <div style="padding:16px;background-color:rgba(255,255,255,0.02);border-left:3px solid rgba(255,255,255,0.15);border-radius:8px;">
                <p style="margin:0;font-family:'SF Mono',Monaco,monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#71717a;font-weight:700;margin-bottom:8px;">
                  Personal Note
                </p>
                <p style="margin:0;font-size:14px;color:#e4e4e7;line-height:1.6;font-style:italic;">
                  "${escape(personalMessage)}"
                </p>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- CTA Button -->
          <tr>
            <td style="padding:8px 24px 24px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${escape(reviewUrl)}" style="display:inline-block;padding:14px 32px;background-color:#ffffff;color:#000000;text-decoration:none;font-size:14px;font-weight:700;border-radius:10px;box-shadow:0 4px 16px rgba(255,255,255,0.15);">
                      Review Invitation
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0 0;font-size:12px;color:#71717a;text-align:center;line-height:1.5;">
                Expires in ${expiresInDays} ${expiresInDays === 1 ? 'day' : 'days'} · You can Accept, Hold, or Decline
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:0 24px;"><div style="height:1px;background-color:rgba(255,255,255,0.06);"></div></td></tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 24px 24px 24px;">
              <p style="margin:0;font-size:11px;color:#52525b;line-height:1.6;text-align:center;">
                You're receiving this because ${escape(inviterName)} added your DSRT profile to a team invitation.
                Accepting will make you an active member of ${escape(ventureName)}. Email is a notification only —
                the real decision happens inside DSRT Connect.
              </p>
              <p style="margin:12px 0 0 0;font-size:11px;color:#52525b;line-height:1.6;text-align:center;">
                <a href="https://dsrtai.com" style="color:#71717a;text-decoration:none;">DSRT Connect</a>
                · Where builders find their team
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = `${inviterName} invited you to join ${ventureName}

Hey ${recipientFirstName},

${inviterName} invited you to join ${ventureName} as a ${proposedRoleTitle}${teamName ? ` on the ${teamName} team` : ''}.

${personalMessage ? `Personal note:\n"${personalMessage}"\n\n` : ''}Review the invitation and respond (Accept, Hold, or Decline):
${reviewUrl}

Expires in ${expiresInDays} ${expiresInDays === 1 ? 'day' : 'days'}.

—
DSRT Connect · https://dsrtai.com`

  return { subject, html, text }
}

function escape(str: string | null | undefined): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}