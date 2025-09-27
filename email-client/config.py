import os

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp-relay.brevo.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_LOGIN = os.getenv("SMTP_LOGIN", "7e56a5003@smtp-brevo.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

FROM_NAME = os.getenv("FROM_NAME", "Contract Lock")
FROM_EMAIL = os.getenv("FROM_EMAIL", "contract.lock@abdulsahil.me")

