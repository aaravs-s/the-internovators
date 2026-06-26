from fastapi import APIRouter, HTTPException, Request

from core.dependencies import get_current_user
from repositories import reports_json, users_json
from schemas.report import SafetyReportCreate
from schemas.user import UserProfileUpdate

from pydantic import ValidationError

router = APIRouter(prefix="/users", tags=["reports"])


@router.post("/update-bio")
async def update_user(new_bio: str, request: Request) -> str:
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required.")
    try:
        users_json.update_user_profile(
            user.id,
            UserProfileUpdate(bio=new_bio, picture_url=user.picture_url),
        )
    except ValidationError:
        raise HTTPException(status_code=422, detail="Invalid parameters.")

    return new_bio
