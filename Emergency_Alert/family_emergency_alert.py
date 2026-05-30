import os
from twilio.rest import Client
from dotenv import load_dotenv

# Load credentials from .env file in the same directory
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
twilio_number = os.getenv("TWILIO_NUMBER", "")

family_contacts_raw = os.getenv("FAMILY_CONTACTS", "")
family_contacts = [n.strip() for n in family_contacts_raw.split(",") if n.strip()]

emergency_message = (
    "EMERGENCY ALERT! I need immediate help. "
    "Please contact me as soon as possible."
)


def send_emergency_alert():
    if not account_sid or not auth_token or not twilio_number:
        print("\nERROR: Twilio credentials not configured.")
        print("Copy Emergency_Alert/.env.example to Emergency_Alert/.env and fill in your details.\n")
        return

    if not family_contacts:
        print("\nERROR: No family contacts configured in .env (FAMILY_CONTACTS).\n")
        return

    client = Client(account_sid, auth_token)
    print("\nSending emergency alerts...\n")

    for number in family_contacts:
        sms = client.messages.create(
            body=emergency_message,
            from_=twilio_number,
            to=number,
        )
        print(f"SMS sent to {number} — SID: {sms.sid}")

        call = client.calls.create(
            twiml="<Response><Say>This is an emergency alert. Please contact your family member immediately.</Say></Response>",
            from_=twilio_number,
            to=number,
        )
        print(f"Call made to {number} — SID: {call.sid}\n")

    print("All emergency alerts sent successfully.")


print("===== FAMILY EMERGENCY CONTACT ALERT SYSTEM =====")
choice = input("Press E to trigger emergency alert (any other key to cancel): ")

if choice.lower() == "e":
    send_emergency_alert()
else:
    print("No emergency triggered.")
