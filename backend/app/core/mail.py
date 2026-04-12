"""
Async Email Service for sending verification codes.
In development (SMTP not configured), it mocks email by logging to the console.
"""

from __future__ import annotations

import logging
import os
from email.message import EmailMessage

import aiosmtplib

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "codemind@example.com")


async def send_verification_email(to_email: str, code: str) -> None:
    """Send a 6-digit verification code email."""
    if not SMTP_HOST or not SMTP_USER:
        # Development / Mock mode
        logger.warning(
            "\n" + "="*50 + "\n"
            "MOCK EMAIL SENT TO: %s\n"
            "VERIFICATION CODE: %s\n"
            + "="*50 + "\n",
            to_email, code,
        )
        return

    # Production SMTP sending
    message = EmailMessage()
    message["From"] = SENDER_EMAIL
    message["To"] = to_email
    message["Subject"] = "Verify your CodeMind account"
    message.set_content(f"Welcome to CodeMind!\n\nYour verification code is: {code}\n\nEnter this code to verify your account.")

    try:
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            use_tls=SMTP_PORT == 465,
            start_tls=SMTP_PORT == 587,
        )
        logger.info("Verification email sent to %s", to_email)
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, e)
        # Optionally raise exception if you want registration to fail when email fails
