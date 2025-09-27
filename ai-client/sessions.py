import time
import uuid
import os
from typing import Dict, Any


def _resolve_session_ttl_seconds() -> int:
    env_value = os.getenv("SESSION_TTL_SECONDS") or os.getenv("CHAT_SESSION_TTL_SECONDS")
    if not env_value:
        return 30
    try:
        ttl = int(env_value)
        return max(1, ttl)
    except ValueError:
        return 30


SESSION_TTL_SECONDS = _resolve_session_ttl_seconds()


class SessionStore:
    def __init__(self):
        self._sessions: Dict[str, Dict[str, Any]] = {}

    def _now(self) -> float:
        return time.time()

    def _ttl(self) -> int:
        return SESSION_TTL_SECONDS

    def _new_session(self) -> Dict[str, Any]:
        return {
            "conversation": [],
            "document_uri": None,
            "last_seen": self._now(),
            "active": True,
        }

    def create(self) -> str:
        session_id = str(uuid.uuid4())
        self._sessions[session_id] = self._new_session()
        return session_id

    def get(self, session_id: str) -> Dict[str, Any]:
        self.purge_expired()
        session = self._sessions.get(session_id)
        if not session or not session.get("active"):
            raise KeyError("invalid_or_expired_session")
        return session

    def touch(self, session_id: str) -> None:
        session = self.get(session_id)
        session["last_seen"] = self._now()

    def set_document_uri(self, session_id: str, uri: str) -> None:
        session = self.get(session_id)
        session["document_uri"] = uri

    def append_user_turn(self, session_id: str, text: str) -> None:
        session = self.get(session_id)
        session["conversation"].append({"role": "user", "parts": [{"text": text}]})

    def append_model_turn(self, session_id: str, text: str) -> None:
        session = self.get(session_id)
        session["conversation"].append({"role": "model", "parts": [{"text": text}]})

    def end(self, session_id: str) -> None:
        session = self._sessions.get(session_id)
        if session:
            session["active"] = False
            session["conversation"] = []
            session["document_uri"] = None

    def purge_expired(self) -> None:
        now = self._now()
        to_delete = []
        for sid, sess in self._sessions.items():
            if not sess.get("active"):
                to_delete.append(sid)
                continue
            if now - sess.get("last_seen", 0) > self._ttl():
                to_delete.append(sid)
        for sid in to_delete:
            self._sessions.pop(sid, None)


session_store = SessionStore()
