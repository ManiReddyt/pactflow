from client import client
import state
from sessions import session_store


def upload_document(file_path: str):
    file_obj = client.files.upload(file=file_path)
    state.document_uri = file_obj.uri
    print(f"✅ Document uploaded and cached: {state.document_uri}")


def upload_document_for_session(session_id: str, file_path: str) -> str:
    file_obj = client.files.upload(file=file_path)
    session_store.set_document_uri(session_id, file_obj.uri)
    session_store.touch(session_id)
    return file_obj.uri
