from fastapi import Request

from core.config import settings
from core.security import verify_signed_user_id
from repositories import users_json
from schemas.user import UserPublic


def get_current_user(request: Request) -> UserPublic | None:
    token = request.cookies.get(settings.session_cookie_name)
    user_id = verify_signed_user_id(token)
    if not user_id:
        return None

    user = users_json.get_user_by_id(user_id)
    if not user:
        return None

    return UserPublic(
        id=user["id"],
        username=user["username"],
        email=user["email"],
    )
