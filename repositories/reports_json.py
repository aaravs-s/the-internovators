from datetime import datetime, timezone
from uuid import uuid4

from core.config import settings
from repositories.json_store import read_list, write_list
from schemas.report import SafetyReportCreate


def list_reports() -> list[dict]:
    return read_list(settings.reports_file)


def create_report(report_data: SafetyReportCreate, user_id: str) -> dict:
    reports = list_reports()
    report = {
        "id": str(uuid4()),
        "user_id": user_id,
        "location": report_data.location.strip(),
        "note": report_data.note.strip(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    reports.append(report)
    write_list(settings.reports_file, reports)
    return report


def list_reports_for_user(user_id: str) -> list[dict]:
    return [report for report in list_reports() if report["user_id"] == user_id]
