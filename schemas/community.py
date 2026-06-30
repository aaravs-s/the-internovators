from pydantic import BaseModel, Field


class CommunityUserPublic(BaseModel):
    id: str
    username: str
    bio: str = ""
    picture_url: str = ""
    created_at: str = ""
    shared_route_count: int = 0
    follower_count: int = 0
    following_count: int = 0
    is_following: bool = False


class FollowStatePublic(BaseModel):
    user_id: str
    is_following: bool
    follower_count: int


class CommunityRoutePublic(BaseModel):
    id: str
    name: str
    summary: str = ""
    distance_miles: float
    estimated_minutes: int
    safety_score: float
    tags: list[str] = Field(default_factory=list)
    image_url: str | None = None
    coordinates: list[list[float]] = Field(default_factory=list)
    is_demo: bool = False
    created_at: str = ""
    owner: CommunityUserPublic
    like_count: int = 0
    comment_count: int = 0
    is_liked: bool = False
    is_owner: bool = False


class LikeStatePublic(BaseModel):
    route_id: str
    is_liked: bool
    like_count: int


class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=500)
    parent_id: str | None = None


class CommunityCommentPublic(BaseModel):
    id: str
    route_id: str
    body: str
    created_at: str
    author: CommunityUserPublic
    can_delete: bool = False
    replies: list["CommunityCommentPublic"] = Field(default_factory=list)


class CommunityProfilePublic(CommunityUserPublic):
    shared_routes: list[CommunityRoutePublic] = Field(default_factory=list)
