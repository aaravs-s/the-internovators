from fastapi import APIRouter, HTTPException, Response, Request

from core.config import settings
from core.dependencies import get_current_user
from core.security import sign_user_id
from repositories import users_json
from schemas.user import UserCreate, UserLogin, UserPublic

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=UserPublic)
async def signup(user_data: UserCreate, response: Response, request: Request) -> UserPublic:
    try:
        user = users_json.create_user(user_data)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    
    response.set_cookie(
        settings.session_cookie_name,
        sign_user_id(user["id"]),
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 14,
    )

    return UserPublic(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        bio=user["bio"],
        picture_url=user["picture_url"],
        is_verified=user["is_verified"],
        created_at=user["created_at"]
    )

@router.post("/login")
async def login(credentials: UserLogin, response: Response) -> dict[str, str]:
    user = users_json.authenticate_user(credentials.username, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    response.set_cookie(
        settings.session_cookie_name,
        sign_user_id(user["id"]),
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 14,
    )
    return {"status": "ok"}

@router.get("/me")
async def me(request: Request):
    user = get_current_user(request)

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "bio": user.bio,
        "created_at": user.created_at.split("-")[0]
    }

@router.get("/other-user")
async def other_user(id: str, request: Request):
    user = users_json.get_user_by_id(id)
    return user

@router.get("/get-other-users")
async def other_user(request: Request):
    users = users_json.list_users()
    print([{"username": u["username"], "email": u["email"]} for u in users])
    return [{"username": u["username"], "email": u["email"]} for u in users]