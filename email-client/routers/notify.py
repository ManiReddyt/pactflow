import logging
from fastapi import APIRouter, HTTPException

from schemas import NotifyRequest, NotifySuccessRequest
from email_service import send_sign_contract_email, send_success_contract_email


logger = logging.getLogger("email-client")

router = APIRouter()


@router.post("/notify-customer")
async def notify_customer(payload: NotifyRequest):
    contract_link = str(payload.link)
    to_email = payload.email or payload.mail or payload.mail_id

    if not to_email:
        raise HTTPException(status_code=400, detail="email is required (email | mail | mail_id)")

    try:
        send_sign_contract_email(to_email, contract_link)
        return {"status": "ok"}
    except Exception as exc:
        logger.exception("notify_customer failed: %s", exc)
        raise HTTPException(status_code=500, detail="failed to send email")


@router.post("/notify-success")
async def notify_success(payload: NotifySuccessRequest):
    contract_link = str(payload.link)
    nft_link = str(payload.nft_link) if payload.nft_link else None
    to_email = payload.email or payload.mail or payload.mail_id

    if not to_email:
        raise HTTPException(status_code=400, detail="email is required (email | mail | mail_id)")

    try:
        send_success_contract_email(to_email, contract_link, nft_link)
        return {"status": "ok"}
    except Exception as exc:
        logger.exception("notify_success failed: %s", exc)
        raise HTTPException(status_code=500, detail="failed to send email")

