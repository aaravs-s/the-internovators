from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    email: str = Field(min_length=3, max_length=80)
    username: str = Field(min_length=2, max_length=30)
    password: str = Field(min_length=8, max_length=100)


class UserLogin(BaseModel):
    username: str = Field(min_length=2, max_length=30)
    password: str = Field(min_length=1, max_length=100)


class UserPublic(BaseModel):
    id: str
    username: str
    email: str
    bio: str = ""
    picture_url: str = ""
    is_verified: bool = False
    created_at: str


class UserProfileUpdate(BaseModel):
    bio: str = Field(default="", max_length=500)
    picture_url: str = Field(default="", max_length=300)
