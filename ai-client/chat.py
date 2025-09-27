from client import client
from config import system_prompt
import state
from sessions import session_store


def ask_gemini(prompt: str):
    # Add user turn
    state.conversation.append({"role": "user", "parts": [{"text": prompt}]})

    # Build request
    contents = [{"role": "user", "parts": [{"text": system_prompt}]}]

    # Always include document reference
    if state.document_uri:
        contents.append({
            "role": "user",
            "parts": [
                {"file_data": {"file_uri": state.document_uri}},
                {"text": "Reference document attached for context."}
            ]
        })

    # Add the whole conversation
    contents.extend(state.conversation)

    # Call Gemini
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=contents
    )

    # Append model reply
    state.conversation.append({"role": "model", "parts": [{"text": response.text}]})

    return response.text


def ask_gemini_for_session(session_id: str, prompt: str) -> str:
    session = session_store.get(session_id)

    # Add user turn
    session_store.append_user_turn(session_id, prompt)

    # Build request
    contents = [{"role": "user", "parts": [{"text": system_prompt}]}]

    # Always include document reference
    if session.get("document_uri"):
        contents.append({
            "role": "user",
            "parts": [
                {"file_data": {"file_uri": session["document_uri"]}},
                {"text": "Reference document attached for context."}
            ]
        })

    # Add the whole conversation
    contents.extend(session["conversation"])

    # Call Gemini
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=contents
    )

    # Append model reply
    session_store.append_model_turn(session_id, response.text)

    # Touch to keep alive
    session_store.touch(session_id)

    return response.text
