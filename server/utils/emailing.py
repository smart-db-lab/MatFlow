# core/utils/emailing.py
from typing import Iterable, Optional, Sequence, Union
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
import textwrap

Recipient = Union[str, Sequence[str]]

BRAND_PRIMARY = "#6754e8"
BG_LIGHT = "#f9fafc"

def render_brand_html(subject: str, body: str, *, button_text: str | None = None,
                      button_url: str | None = None, footer_note: str | None = None) -> str:
    """
    Wraps your body text into a consistent branded HTML shell.
    `body` can include basic HTML; newlines are preserved.
    """
    safe_body = body.replace("\n", "<br/>")
    footer = footer_note or (
        'Sent via <strong>Amar Prosno</strong> • '
        f'<a href="https://amarprosno.com" style="color:{BRAND_PRIMARY};text-decoration:none;">amarprosno.com</a>'
    )

    cta_html = (
        f"""
        <a href="{button_url}" 
           style="display:inline-block;background:{BRAND_PRIMARY};color:#fff;padding:12px 20px;
                  border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px;">
           {button_text}
        </a>
        """ if (button_text and button_url) else ""
    )

    return f"""
    <html>
    <body style="font-family:Inter,Arial,sans-serif;background:{BG_LIGHT};padding:20px;text-align:center;">
      <div style="background:#fff;max-width:640px;margin:auto;padding:28px;border-radius:12px;
                  box-shadow:0 6px 18px rgba(0,0,0,.06);text-align:left;">
        <div style="text-align:center;margin-bottom:16px;">
          <img src="{settings.FRONTEND_URL}/amar_p_e.png" alt="Amar Prosno" style="width:84px;height:auto;"/>
        </div>

        <h2 style="color:{BRAND_PRIMARY};margin:0 0 8px 0;font-size:22px;">{subject}</h2>

        <div style="color:#111;font-size:15px;line-height:1.6;margin-top:8px;">
          {safe_body}
          {cta_html}
        </div>

        <hr style="border:0;border-top:1px solid #eee;margin:24px 0;"/>
        <div style="color:#6b7280;font-size:12px;text-align:center;">{footer}</div>
      </div>
    </body>
    </html>
    """

def send_html_email(
    *,
    to: Recipient,
    subject: str,
    body_text: str,               # plain-text (source of truth)
    html_body: Optional[str] = None,  # optional custom HTML; else we render brand wrapper
    button_text: str | None = None,
    button_url: str | None = None,
    cc: Recipient | None = None,
    bcc: Recipient | None = None,
    reply_to: Iterable[str] | None = None,
    attachments: Iterable[tuple[str, bytes, str]] | None = None,  # (filename, content, mimetype)
) -> None:
    """
    Sends email with plain text + HTML alternative (branded).
    `to`, `cc`, `bcc` can be string or list of strings.
    """
    # normalize recipients
    def norm(x):
        if x is None: return None
        if isinstance(x, (list, tuple, set)): return list(x)
        return [x]

    to_list  = norm(to)
    cc_list  = norm(cc)
    bcc_list = norm(bcc)

    # plain text
    text_content = textwrap.dedent(f"""{body_text}

    ---
    Sent via Amar Prosno • https://amarprosno.com
    """)

    # html
    if not html_body:
        html_content = render_brand_html(subject, body_text, button_text=button_text, button_url=button_url)
    else:
        html_content = html_body

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=to_list,
        cc=cc_list,
        bcc=bcc_list,
        reply_to=reply_to or None,
    )
    email.attach_alternative(html_content, "text/html")

    if attachments:
        for fname, content, mimetype in attachments:
            email.attach(fname, content, mimetype)

    email.send()
