from pydantic import BaseModel, Field


class SafetyReportCreate(BaseModel):
    location: str = Field(min_length=2, max_length=120)
    note: str = Field(min_length=5, max_length=500)

