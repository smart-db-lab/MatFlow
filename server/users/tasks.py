# users/tasks.py
from celery import shared_task
from users.emails import send_password_reset_email, send_verification_email

@shared_task(bind=True, max_retries=3)
def send_password_reset_task(self, email, reset_link):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = User.objects.get(email=email)
    try:
        return send_password_reset_email(user, reset_link)
    except Exception as e:
        raise self.retry(exc=e, countdown=30)

@shared_task(bind=True, max_retries=3)
def send_verification_email_task(self, email, verification_link):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = User.objects.get(email=email)
    try:
        return send_verification_email(user, verification_link)
    except Exception as e:
        raise self.retry(exc=e, countdown=30)


from utils.emailing import send_html_email
@shared_task(bind=True, max_retries=3)
def send_html_email_task(
    self,
    to,
    subject,
    body_text,
    button_text=None,
    button_url=None,
    cc=None,
    bcc=None,
    reply_to=None
):
    """
    Asynchronous task to send an HTML email.
    """
    try:
        return send_html_email(
            to=to,
            subject=subject,
            body_text=body_text,
            button_text=button_text,
            button_url=button_url,
            cc=cc,
            bcc=bcc,
            reply_to=reply_to,
        )
    except Exception as e:
        # retry after 30s if failed
        raise self.retry(exc=e, countdown=30)