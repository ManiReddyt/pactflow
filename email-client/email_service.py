import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr

from config import SMTP_SERVER, SMTP_PORT, SMTP_LOGIN, SMTP_PASSWORD, FROM_EMAIL, FROM_NAME


def build_sign_html_email(contract_link: str) -> str:
    return f"""\
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#FFFFFF;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#FFFFFF">
      <tr>
        <td align="center" style="padding:40px 20px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff"
                 style="border-radius:0; overflow:hidden; border:1px solid #E5E7EB; border-left:4px solid #1C01FE; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#111827;">

            <tr>
              <td align="left" style="padding:16px 24px; border-bottom:1px solid #F3F4F6;">
                <img src="https://i.ibb.co/3Lb99Mr/blue.png" alt="Contract Lock" width="180" style="display:block; border:0; outline:none; text-decoration:none; max-width:100%;">
              </td>
            </tr>

            <tr>
              <td style="padding:24px 24px 0 24px;">
                <div style="font-size:20px; line-height:1.35; font-weight:700; letter-spacing:-0.01em; color:#0B1220;">
                  Signature requested
                </div>
                <div style="margin-top:6px; font-size:15px; color:#4B5563; line-height:1.7;">
                  Please review and sign the agreement below to proceed.
                </div>
              </td>
            </tr>

            <tr>
              <td align="left" style="padding:20px 24px 0 24px;">
                <a href="{contract_link}"
                   style="background-color:#1C01FE; color:#FFFFFF; text-decoration:none; padding:12px 18px; border-radius:0; border:1px solid #1C01FE; font-weight:600; font-size:15px; display:inline-block;">
                  Review and Sign
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 24px 0 24px;">
                <div style="height:1px; background:#E5E7EB; width:100%;"></div>
              </td>
            </tr>

            <tr>
              <td style="padding:16px 24px 0 24px;">
                <p style="margin:0; font-size:13px; color:#6B7280; line-height:1.6;">
                  Button not working? Paste this link into your browser:<br>
                  <a href="{contract_link}" style="color:#1C01FE; text-decoration:none;">{contract_link}</a>
                </p>
              </td>
            </tr>

            <tr>
                <td style="padding:20px 24px 0 24px;">
                  <div style="height:1px; background:#E5E7EB; width:100%;"></div>
                </td>
              </tr>

            <tr>
              <td align="center" style="padding:12px 24px 0 24px;">
                <div style="font-size:12px; color:#6B7280; letter-spacing:0.06em; text-transform:uppercase; text-align:center;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
                    <tr>
                      <td valign="middle" style="padding:0 6px 0 0;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="12" height="12"><path fill="#9CA3AF" d="M24 14v-4a8 8 0 0 0-16 0v4a3.24 3.24 0 0 0-3 3.21v9.54A3.23 3.23 0 0 0 8.23 30h15.54A3.23 3.23 0 0 0 27 26.77v-9.54A3.24 3.24 0 0 0 24 14zM16 4a6 6 0 0 1 6 6v4H10v-4a6 6 0 0 1 6-6zm9 22.77A1.23 1.23 0 0 1 23.77 28H8.23A1.23 1.23 0 0 1 7 26.77v-9.54A1.23 1.23 0 0 1 8.23 16h15.54A1.23 1.23 0 0 1 25 17.23z"/></svg>
                      </td>
                      <td valign="middle" style="padding:0; color:#6B7280; font-size:12px;">
                        SHA-256 - End to End Security - Immutable
                      </td>
                    </tr>
                  </table>
                </div>
              </td>
            </tr>

            <tr>
                <td style="padding:20px 24px 0 24px;">
                  <div style="height:1px; background:#E5E7EB; width:100%;"></div>
                </td>
              </tr>

            <tr>
              <td align="center" style="padding:24px; background:#FAFAFB; border-top:1px solid #F3F4F6;">
                <div style="font-size:12px; color:#6B7280; line-height:1.6;">
                  © 2025 Contract Lock · All rights reserved · <a href="mailto:support@contractlock.com" style="color:#1C01FE; text-decoration:none;">support@contractlock.com</a>
                </div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
"""


def send_sign_contract_email(to_email: str, contract_link: str):
    subject = "Contract Awaiting Your Signature – Contract Lock"
    html_content = build_sign_html_email(contract_link)
    plain_text = f"Please sign your contract: {contract_link}"

    msg = MIMEMultipart("alternative")
    msg["From"] = formataddr((FROM_NAME, FROM_EMAIL))
    msg["To"] = to_email
    msg["Subject"] = subject

    msg.attach(MIMEText(plain_text, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_LOGIN, SMTP_PASSWORD)
        server.sendmail(msg["From"], to_email, msg.as_string())

    print(f"✅ Email sent to {to_email}")


def build_success_html_email(contract_link: str, nft_link: str | None) -> str:
    action_cta = f"""
                <a href=\"{contract_link}\"
                   style=\"background-color:#1C01FE; color:#FFFFFF; text-decoration:none; padding:12px 18px; border-radius:0; border:1px solid #1C01FE; font-weight:600; font-size:15px; display:inline-block;\">
                  View Signed Contract
                </a>
    """
    nft_section = ""
    if nft_link:
        nft_section = f"""
            <tr>
              <td align=\"left\" style=\"padding:12px 24px 0 24px;\">
                <div style=\"font-size:14px; color:#4B5563;\">Your on-chain proof (NFT):</div>
                <a href=\"{nft_link}\" style=\"color:#1C01FE; text-decoration:none; font-weight:600;\">View on OpenSea</a>
              </td>
            </tr>
        """

    return f"""\
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#FFFFFF;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#FFFFFF">
      <tr>
        <td align="center" style="padding:40px 20px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff"
                 style="border-radius:0; overflow:hidden; border:1px solid #E5E7EB; border-left:4px solid #1C01FE; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#111827;">

            <tr>
              <td align="left" style="padding:16px 24px; border-bottom:1px solid #F3F4F6;">
                <img src="https://i.ibb.co/3Lb99Mr/blue.png" alt="Contract Lock" width="180" style="display:block; border:0; outline:none; text-decoration:none; max-width:100%;">
              </td>
            </tr>

            <tr>
              <td style="padding:24px 24px 0 24px;">
                <div style="font-size:20px; line-height:1.35; font-weight:700; letter-spacing:-0.01em; color:#0B1220;">
                  Successfully signed the contract
                </div>
                <div style="margin-top:6px; font-size:15px; color:#4B5563; line-height:1.7;">
                  Your agreement has been signed and securely recorded.
                </div>
              </td>
            </tr>

            <tr>
              <td align="left" style="padding:20px 24px 0 24px;">
                {action_cta}
              </td>
            </tr>

            {nft_section}

            <tr>
              <td style="padding:20px 24px 0 24px;">
                <div style="height:1px; background:#E5E7EB; width:100%;"></div>
              </td>
            </tr>

            <tr>
              <td style="padding:16px 24px 0 24px;">
                <p style="margin:0; font-size:13px; color:#6B7280; line-height:1.6;">
                  Contract link:<br>
                  <a href="{contract_link}" style="color:#1C01FE; text-decoration:none;">{contract_link}</a>
                </p>
              </td>
            </tr>

            <tr>
                <td style="padding:20px 24px 0 24px;">
                  <div style="height:1px; background:#E5E7EB; width:100%;"></div>
                </td>
              </tr>

            <tr>
              <td align="center" style="padding:12px 24px 0 24px;">
                <div style="font-size:12px; color:#6B7280; letter-spacing:0.06em; text-transform:uppercase; text-align:center;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
                    <tr>
                      <td valign="middle" style="padding:0 6px 0 0;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="12" height="12"><path fill="#9CA3AF" d="M24 14v-4a8 8 0 0 0-16 0v4a3.24 3.24 0 0 0-3 3.21v9.54A3.23 3.23 0 0 0 8.23 30h15.54A3.23 3.23 0 0 0 27 26.77v-9.54A3.24 3.24 0 0 0 24 14zM16 4a6 6 0 0 1 6 6v4H10v-4a6 6 0 0 1 6-6zm9 22.77A1.23 1.23 0 0 1 23.77 28H8.23A1.23 1.23 0 0 1 7 26.77v-9.54A1.23 1.23 0 0 1 8.23 16h15.54A1.23 1.23 0 0 1 25 17.23z"/></svg>
                      </td>
                      <td valign="middle" style="padding:0; color:#6B7280; font-size:12px;">
                        SHA-256 - End to End Security - Immutable
                      </td>
                    </tr>
                  </table>
                </div>
              </td>
            </tr>

            <tr>
                <td style="padding:20px 24px 0 24px;">
                  <div style="height:1px; background:#E5E7EB; width:100%;"></div>
                </td>
              </tr>

            <tr>
              <td align="center" style="padding:24px; background:#FAFAFB; border-top:1px solid #F3F4F6;">
                <div style="font-size:12px; color:#6B7280; line-height:1.6;">
                  © 2025 Contract Lock · All rights reserved · <a href="mailto:support@contractlock.com" style="color:#1C01FE; text-decoration:none;">support@contractlock.com</a>
                </div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
"""


def send_success_contract_email(to_email: str, contract_link: str, nft_link: str | None):
    subject = "Contract Signed Successfully – Contract Lock"
    html_content = build_success_html_email(contract_link, nft_link)
    plain_text = f"Contract signed successfully. Contract: {contract_link}" + (f" | NFT: {nft_link}" if nft_link else "")

    msg = MIMEMultipart("alternative")
    msg["From"] = formataddr((FROM_NAME, FROM_EMAIL))
    msg["To"] = to_email
    msg["Subject"] = subject

    msg.attach(MIMEText(plain_text, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_LOGIN, SMTP_PASSWORD)
        server.sendmail(msg["From"], to_email, msg.as_string())

    print(f"✅ Success email sent to {to_email}")

