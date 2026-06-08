from datetime import datetime, timezone
from uuid import uuid4

from core.config import settings
from core.security import hash_password, verify_password
from repositories.json_store import read_list, write_list
from schemas.user import UserCreate


def list_users() -> list[dict]:
    return read_list(settings.users_file)


def get_user_by_id(user_id: str) -> dict | None:
    return next((user for user in list_users() if user["id"] == user_id), None)


def get_user_by_username(username: str) -> dict | None:
    normalized_username = username.strip().lower()
    return next(
        (
            user
            for user in list_users()
            if user["username"].strip().lower() == normalized_username
        ),
        None,
    )


def get_user_by_email(email: str) -> dict | None:
    normalized_email = email.strip().lower()
    return next(
        (
            user
            for user in list_users()
            if user["email"].strip().lower() == normalized_email
        ),
        None,
    )


def create_user(user_data: UserCreate) -> dict:
    users = list_users()
    if get_user_by_username(user_data.username):
        raise ValueError("That username is already taken.")
    if get_user_by_email(user_data.email):
        raise ValueError("That email is already registered.")

    user = {
        "id": str(uuid4()),
        "email": user_data.email.strip().lower(),
        "username": user_data.username.strip(),
        "password_hash": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    users.append(user)
    write_list(settings.users_file, users)
    return user


def authenticate_user(username: str, password: str) -> dict | None:
    user = get_user_by_username(username)
    if not user:
        return None
    if not verify_password(password, user.get("password_hash", "")):
        return None
    return user
