from fastapi import APIRouter, HTTPException, Query, Request, Response, status

from core.dependencies import get_current_user
from repositories import follows_json, route_comments_json, saved_routes_json, users_json
from schemas.community import (
    CommentCreate,
    CommunityCommentPublic,
    CommunityProfilePublic,
    CommunityRoutePublic,
    CommunityUserPublic,
    FollowStatePublic,
    LikeStatePublic,
)
from services import community


router = APIRouter(prefix="/community", tags=["community"])


def require_user(request: Request):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def shared_route_or_404(route_id: str) -> dict:
    route = saved_routes_json.get_saved_route(route_id)
    if not route or not route.get("is_shared", True):
        raise HTTPException(status_code=404, detail="Route not found")
    return route


@router.get("/feed", response_model=list[CommunityRoutePublic])
async def feed(request: Request, scope: str = Query("following")):
    user = require_user(request)
    selected_scope = scope if scope in {"following", "everyone"} else "following"
    return community.activity_feed(user.id, selected_scope)


@router.get("/users", response_model=list[CommunityUserPublic])
async def users(
    request: Request,
    view: str = Query("discover"),
    query: str = Query("", max_length=100),
):
    user = require_user(request)
    selected_view = view if view in {"following", "discover"} else "discover"
    return community.list_community_users(user.id, selected_view, query)


@router.get("/users/{user_id}", response_model=CommunityProfilePublic)
async def user_profile(request: Request, user_id: str):
    viewer = require_user(request)
    user = users_json.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    routes = [
        community.community_route(route, viewer.id)
        for route in community.shared_routes_owned_by(user_id)
    ]
    return {**community.public_user(user, viewer.id), "shared_routes": routes}


@router.put("/follows/{user_id}", response_model=FollowStatePublic)
async def follow_user(request: Request, user_id: str):
    viewer = require_user(request)
    if viewer.id == user_id:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")
    if not users_json.get_user_by_id(user_id):
        raise HTTPException(status_code=404, detail="User not found")
    follows_json.follow(viewer.id, user_id)
    return {
        "user_id": user_id,
        "is_following": True,
        "follower_count": follows_json.follower_count(user_id),
    }


@router.delete("/follows/{user_id}", response_model=FollowStatePublic)
async def unfollow_user(request: Request, user_id: str):
    viewer = require_user(request)
    if not users_json.get_user_by_id(user_id):
        raise HTTPException(status_code=404, detail="User not found")
    follows_json.unfollow(viewer.id, user_id)
    return {
        "user_id": user_id,
        "is_following": False,
        "follower_count": follows_json.follower_count(user_id),
    }


def set_like(request: Request, route_id: str, is_liked: bool) -> dict:
    viewer = require_user(request)
    shared_route_or_404(route_id)
    route = saved_routes_json.set_route_like(route_id, viewer.id, is_liked)
    if not route:
        raise HTTPException(status_code=400, detail="You cannot like this route")
    return {
        "route_id": route_id,
        "is_liked": route["user_has_liked"],
        "like_count": route["like_count"],
    }


@router.put("/routes/{route_id}/like", response_model=LikeStatePublic)
async def like_route(request: Request, route_id: str):
    return set_like(request, route_id, True)


@router.delete("/routes/{route_id}/like", response_model=LikeStatePublic)
async def unlike_route(request: Request, route_id: str):
    return set_like(request, route_id, False)


@router.get(
    "/routes/{route_id}/comments",
    response_model=list[CommunityCommentPublic],
)
async def comments(request: Request, route_id: str):
    viewer = require_user(request)
    route = shared_route_or_404(route_id)
    return community.route_discussion(route, viewer.id)


@router.post(
    "/routes/{route_id}/comments",
    response_model=CommunityCommentPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_comment(request: Request, route_id: str, data: CommentCreate):
    viewer = require_user(request)
    route = shared_route_or_404(route_id)
    body = data.body.strip()
    if not body:
        raise HTTPException(status_code=422, detail="Comment cannot be blank")
    if data.parent_id:
        parent = route_comments_json.get_comment(data.parent_id)
        if (
            not parent
            or parent.get("route_id") != route_id
            or parent.get("parent_id")
        ):
            raise HTTPException(status_code=400, detail="Replies can only target a top-level comment")
    created = route_comments_json.create_comment(
        route_id,
        viewer.id,
        body,
        data.parent_id,
    )
    discussion = community.route_discussion(route, viewer.id)
    if data.parent_id:
        return next(
            reply
            for comment in discussion
            if comment["id"] == data.parent_id
            for reply in comment["replies"]
            if reply["id"] == created["id"]
        )
    return next(comment for comment in discussion if comment["id"] == created["id"])


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(request: Request, comment_id: str):
    viewer = require_user(request)
    comment = route_comments_json.get_comment(comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    route = shared_route_or_404(comment["route_id"])
    if viewer.id not in {comment["author_id"], community.canonical_owner_id(route)}:
        raise HTTPException(status_code=403, detail="You cannot delete this comment")
    route_comments_json.delete_comment_thread(comment_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
