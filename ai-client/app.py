import os
import tempfile
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn

from sessions import session_store
from documents import upload_document_for_session
from chat import ask_gemini_for_session


app = FastAPI()

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods including OPTIONS
    allow_headers=["*"],  # Allow all headers
)


class MessageBody(BaseModel):
    session_id: str
    prompt: str


class EndBody(BaseModel):
    session_id: str


@app.post("/sessions/start")
async def start_session(document: UploadFile = File(...)):
    session_id = session_store.create()

    filename = document.filename or "document"

    # Store to temp file (not persisted beyond request)
    with tempfile.TemporaryDirectory() as tmpdir:
        temp_path = os.path.join(tmpdir, filename)
        with open(temp_path, "wb") as f:
            f.write(await document.read())
        uri = upload_document_for_session(session_id, temp_path)

    return {"session_id": session_id, "document_uri": uri}


@app.get("/sessions/poll")
async def poll_session(session_id: Optional[str] = Query(None)):
    if not session_id:
        raise HTTPException(status_code=400, detail="missing_session_id")
    try:
        session_store.touch(session_id)
        session = session_store.get(session_id)
        return {"active": True, "has_document": bool(session.get("document_uri"))}
    except KeyError:
        return {"active": False}


@app.post("/sessions/message")
async def post_message(body: MessageBody):
    try:
        reply = ask_gemini_for_session(body.session_id, body.prompt)
        return {"reply": reply}
    except KeyError:
        raise HTTPException(status_code=410, detail="invalid_or_expired_session")


@app.post("/sessions/end")
async def end_session(body: EndBody):
    if not body.session_id:
        raise HTTPException(status_code=400, detail="missing_session_id")
    session_store.end(body.session_id)
    return {"ended": True}


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
