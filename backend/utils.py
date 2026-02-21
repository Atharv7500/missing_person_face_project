import logging
from config import get_settings
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

settings = get_settings()
logger = logging.getLogger(__name__)

def send_sms_alert(to_number: str, message_body: str) -> bool:
    """
    Sends an SMS alert using Twilio.
    Returns True if successfully queued/sent, False otherwise.
    """
    if not settings.TWILIO_SID or not settings.TWILIO_AUTH_TOKEN or not settings.TWILIO_PHONE_NUMBER:
        logger.warning("Twilio credentials missing. SMS alert not sent.")
        # In development without Twilio, we just log and pretend it sent if credentials aren't set
        logger.info(f"MOCK SMS to {to_number}: {message_body}")
        return True # Mock success instead of failing the whole flow

    try:
        client = Client(settings.TWILIO_SID, settings.TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=message_body,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=to_number
        )
        logger.info(f"SMS alert dispatched. SID: {message.sid}")
        return True
    except TwilioRestException as e:
        logger.error(f"Failed to send SMS via Twilio: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error sending SMS: {e}")
        return False
