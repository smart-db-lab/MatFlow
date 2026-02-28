from django.core.mail import EmailMessage
from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import EmailMultiAlternatives


class EmailTokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        data = f"{user.email}{timestamp}{user.is_email_verified}"
        return data

email_token_generator = EmailTokenGenerator()


import textwrap

def send_verification_email(user, verification_link):
    try:
        subject = "Verify Your Email! – Amar Prosno"
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [user.email]

        # Plain text fallback
        text_content = textwrap.dedent(f"""
            Hi {user.full_name},

            Thank you for signing up with Amar Prosno!

            To complete your registration, please verify your email by clicking the link below:

            {verification_link}

            If the button doesn't work, copy and paste the link into your browser.

            About Amar Prosno:
            Amar Prosno is an online MCQ-based learning and exam platform where students can:
            - Practice MCQs by chapter, topic, or subject
            - Take timed mock exams
            - Get performance insights and AI-powered recommendations
            - Learn with expert mentorship and detailed explanations

            Best regards,
            The Amar Prosno Team
            https://amarprosno.com
        """)

        # HTML version with branding and features
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; text-align: center;">
            <div style="background-color: white; max-width: 600px; margin: auto; padding: 30px;
                        border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);">

                <img src="{settings.FRONTEND_URL}/amar_p_e.png" alt="Amar Prosno Logo"
                     style="width: 100px; margin-bottom: 20px;" />

                <h2 style="font-size: 24px; font-weight: bold; color: #6754e8;">Welcome, {user.full_name}!</h2>

                <p style="font-size: 16px; color: #333; margin-top: 10px;">
                    Thank you for creating an account with Amar Prosno! <br>
                    Please verify your email address to activate your account.
                </p>

                <a href="{verification_link}"
                   style="display: inline-block; background-color: #6754e8; color: white; text-decoration: none;
                          padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: bold; margin-top: 20px;">
                    Verify My Email
                </a>


                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />

                <h3 style="color: #6754e8;">Why Amar Prosno?</h3>
                <p style="color: #444; font-size: 15px; line-height: 1.6;">
                    Amar Prosno is your online MCQ exam mentor. Join thousands of learners improving their
                    exam readiness with:
                </p>
                <ul style="text-align: left; padding-left: 40px; font-size: 15px; color: #555;">
                    <li>MCQ practice by subject, chapter, and topic</li>
                    <li>Timed full-length mock exams</li>
                    <li>AI-powered weak topic suggestions</li>
                    <li>Detailed answer explanations</li>
                    <li>Mentor-guided exam preparation</li>
                </ul>

                <p style="color: #444; font-size: 15px; margin-top: 20px;">
                    Visit <a href="https://amarprosno.com" style="color: #6754e8;">amarprosno.com</a> and start preparing smarter.
                </p>
            </div>

            <p style="font-size: 12px; color: #888; margin-top: 20px;">
                Need help? <a href="mailto:info@amarprosno.com" style="color: #6754e8;">Contact Support</a>
            </p>
        </body>
        </html>
        """

        email = EmailMultiAlternatives(subject, text_content, from_email, recipient_list)
        email.attach_alternative(html_content, "text/html")
        sent = email.send(fail_silently=False)
        return sent == 1

    except Exception as e:
        # Optional: Log the exception here
        print(f"Email sending failed: {e}")
        return False


def send_password_reset_email(user, reset_link):
    subject = "Reset Your Password - Amar Prosno"
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [user.email]

    # Fallback plain text version (won't usually be shown in Gmail, but is good practice)
    text_content = f"""
Hi {user.full_name},

We received a request to reset the password for your MLFLow account. If you didn’t request this, you can safely ignore this email.

To reset your password, click the link below:
{reset_link}

If the button above doesn’t work, copy and paste the link into your browser.

About Amar Prosno:
Amar Prosno is your personal MCQ mentor. Prepare smarter with topic-wise practice, full mock exams, AI-powered recommendations, and expert guidance. 
Join thousands of learners and mentors building a smarter future.

Best regards,
The Amar Prosno Team
https://amarprosno.com
"""

    # HTML version with extended service info
    html_content = f"""
<html>
  <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: 'Segoe UI', sans-serif;">
    <table width="100%" cellspacing="0" cellpadding="0" style="padding: 40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
            <tr>
              <td style="text-align: center;">
                <img src="{settings.FRONTEND_URL}/amar_p_e.png" alt="Amar Prosno Logo" width="80" style="margin-bottom: 20px;" />
              </td>
            </tr>
            <tr>
              <td style="text-align: center;">
                <h2 style="color: #6754e8; margin-bottom: 10px;">Reset Your Password</h2>
                <p style="color: #555555; font-size: 16px; margin: 0 0 20px;">
                  Hi <strong>{user.full_name}</strong>,<br>
                  You requested a password reset. Just click the button below:
                </p>
                <a href="{reset_link}" style="
                  display: inline-block;
                  padding: 12px 24px;
                  background-color: #6754e8;
                  color: white;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: bold;
                  font-size: 16px;
                  margin-top: 15px;">
                  Reset Password
                </a>
                <p style="font-size: 14px; color: #666; margin-top: 20px;">This link is only valid for a limited time.</p>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 30px; color: #333; font-size: 15px; line-height: 1.6; text-align: left;">
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
                <h3 style="color: #6754e8; text-align: center;">About Amar Prosno</h3>
                <p style="text-align: center; color: #444;">
                  Amar Prosno is your smart MCQ exam companion — built to help you succeed in board, admission, and competitive exams.
                </p>
                <ul style="padding-left: 20px; max-width: 500px; margin: 0 auto; color: #555;">
                  <li>Practice MCQs by class, subject, chapter, or topic</li>
                  <li>Take full-length timed mock exams</li>
                  <li>Track your strengths and weak areas</li>
                  <li>Get personalized topic suggestions using AI</li>
                  <li>Learn from expert mentors and explanations</li>
                </ul>
                <p style="text-align: center; margin-top: 15px; color: #555;">
                  Learn faster. Practice smarter. Succeed with confidence — only on <a href="https://amarprosno.com" style="color: #6754e8; text-decoration: none;">amarprosno.com</a>
                </p>
              </td>
            </tr>
          </table>
          <p style="margin-top: 20px; color: #bbbbbb; font-size: 12px;">
            Need help? <a href="mailto:info@amarprosno.com" style="color: #6754e8;">Contact Support</a>
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
"""

    email = EmailMultiAlternatives(subject, text_content, from_email, recipient_list)
    email.attach_alternative(html_content, "text/html")
    return email.send(fail_silently=False) == 1
