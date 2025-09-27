from pydantic import BaseModel, HttpUrl, EmailStr


class NotifyRequest(BaseModel):
    link: HttpUrl
    email: EmailStr | None = None
    mail: EmailStr | None = None
    mail_id: EmailStr | None = None


class NotifySuccessRequest(BaseModel):
    link: HttpUrl
    nft_link: HttpUrl | None = None
    email: EmailStr | None = None
    mail: EmailStr | None = None
    mail_id: EmailStr | None = None

