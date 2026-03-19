import textwrap
from django.core.mail import EmailMultiAlternatives
from django.conf import settings

def send_registration_otp_email(user, otp_code):
    try:
        subject = "Verify Your Email! – MLFlow"
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [user.email]

        text_content = textwrap.dedent(f"""
            Hi {user.full_name},

            Thank you for signing up with MLFlow!

            Your verification code is: {otp_code}

            This code will expire in 5 minutes.

            Best regards,
            The MLFlow Team
        """)

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; text-align: center;">
            <div style="background-color: white; max-width: 600px; margin: auto; padding: 30px;
                        border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);">
                <h2 style="color: #6754e8;">Welcome, {user.full_name}!</h2>
                <p>Please use the code below to verify your email address:</p>
                <div style="font-size: 32px; font-weight: bold; color: #6754e8; margin: 20px 0; letter-spacing: 5px;">
                    {otp_code}
                </div>
                <p style="color: #666;">This code is valid for 5 minutes.</p>
            </div>
        </body>
        </html>
        """

        email = EmailMultiAlternatives(subject, text_content, from_email, recipient_list)
        email.attach_alternative(html_content, "text/html")
        return email.send(fail_silently=False) == 1
    except Exception as e:
        print(f"Email sending failed: {e}")
        return False

def send_password_reset_otp_email(user, otp_code):
    try:
        subject = "Reset Your Password - MLFlow"
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [user.email]

        text_content = textwrap.dedent(f"""
            Hi {user.full_name},

            We received a request to reset your password.
            Your password reset code is: {otp_code}

            This code will expire in 5 minutes.

            Best regards,
            The MLFlow Team
        """)

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; text-align: center;">
            <div style="background-color: white; max-width: 600px; margin: auto; padding: 30px;
                        border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);">
                <h2 style="color: #6754e8;">Password Reset Request</h2>
                <p>Your password reset code is:</p>
                <div style="font-size: 32px; font-weight: bold; color: #6754e8; margin: 20px 0; letter-spacing: 5px;">
                    {otp_code}
                </div>
                <p style="color: #666;">This code is valid for 5 minutes.</p>
            </div>
        </body>
        </html>
        """

        email = EmailMultiAlternatives(subject, text_content, from_email, recipient_list)
        email.attach_alternative(html_content, "text/html")
        return email.send(fail_silently=False) == 1
    except Exception as e:
        print(f"Email sending failed: {e}")
        return False