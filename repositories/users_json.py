from datetime import datetime, timezone
from uuid import uuid4

from core.config import settings
from core.security import hash_password, verify_password
from repositories.json_store import read_list, write_list
from schemas.user import UserCreate, UserProfileUpdate


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
        "bio": "",
        "picture_url": "",
        "is_verified": False,
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


def update_user_profile(user_id: str, profile_data: UserProfileUpdate) -> dict | None:
    users = list_users()
    for user in users:
        if user["id"] == user_id:
            user["bio"] = profile_data.bio.strip()
            user["picture_url"] = profile_data.picture_url.strip()
            write_list(settings.users_file, users)
            return user
    return None


def verify_user(user_id: str) -> dict | None:
    users = list_users()
    for user in users:
        if user["id"] == user_id:
            user["is_verified"] = True
            write_list(settings.users_file, users)
            return user
    return None


def change_password(user_id: str, current_password: str, new_password: str) -> bool:
    users = list_users()
    for user in users:
        if user["id"] != user_id:
            continue
        if not verify_password(current_password, user.get("password_hash", "")):
            return False
        user["password_hash"] = hash_password(new_password)
        write_list(settings.users_file, users)
        return True
    return False
