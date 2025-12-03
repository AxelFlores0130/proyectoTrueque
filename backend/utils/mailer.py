import smtplib
from email.message import EmailMessage
from flask import current_app

def send_mail(to_email: str, subject: str, html: str):
    cfg = current_app.config
    if cfg.get("EMAIL_MOCK", True):
        print("=== EMAIL MOCK ===")
        print("TO:", to_email)
        print("SUBJECT:", subject)
        print("HTML:", html)
        print("==================")
        return True

    msg = EmailMessage()
    msg["From"] = cfg["MAIL_SENDER"]
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content("HTML only", subtype="plain")
    msg.add_alternative(html, subtype="html")

    with smtplib.SMTP(cfg["SMTP_HOST"], cfg["SMTP_PORT"]) as s:
        s.starttls()
        s.login(cfg["SMTP_USER"], cfg["SMTP_PASSWORD"])
        s.send_message(msg)
    return True
