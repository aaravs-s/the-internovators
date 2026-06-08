from fastapi import APIRouter, HTTPException, Request

from core.dependencies import get_current_user
from repositories import reports_json
from schemas.report import SafetyReportCreate

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("")
async def create_report(report: SafetyReportCreate, request: Request) -> dict:
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required.")

    return reports_json.create_report(report, user.id)
