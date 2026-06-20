from fastapi import APIRouter, Form, Query, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from pydantic import ValidationError

from core.config import settings
from core.dependencies import get_current_user
from core.security import sign_user_id
from repositories import generated_routes_json, reports_json, saved_routes_json, users_json
from schemas.report import SafetyReportCreate
from schemas.route import RouteSearchRequest, SavedRouteCreate, SavedRouteNotesUpdate
from schemas.user import UserCreate, UserProfileUpdate
from services.route_planner import search_routes

import os
import requests
import json

router = APIRouter()
templates = Jinja2Templates(directory=str(settings.templates_dir))
VERIFICATION_CODE = "123456"


def render(request: Request, name: str, context: dict | None = None, status_code: int = 200):
    page_context = {
        "user": get_current_user(request),
        "current_path": request.url.path,
    }
    if context:
        page_context.update(context)
    return templates.TemplateResponse(
        request=request,
        name=name,
        context=page_context,
        status_code=status_code,
    )


def route_owner(saved_route: dict) -> dict | None:
    return users_json.get_user_by_id(saved_route["user_id"])


def route_with_map_state(route: dict) -> dict:
    route = dict(route)
    filename = route.get("filename", "")
    route["map_available"] = bool(
        filename
        and filename == os.path.basename(filename)
        and (settings.maps_dir / filename).is_file()
    )
    return route


def route_with_owner(saved_route: dict, viewer_id: str | None = None) -> dict:
    route = route_with_map_state(
        saved_routes_json.route_with_social_fields(saved_route, viewer_id)
    )
    route["owner"] = route_owner(saved_route)
    return route


def get_route_record(route_id: str) -> tuple[dict | None, bool]:
    saved_route = saved_routes_json.get_saved_route(route_id)
    if saved_route:
        return route_with_owner(saved_route), True
    generated_route = generated_routes_json.get_generated_route(route_id)
    if generated_route:
        return route_with_map_state(generated_route), False
    return None, False


def dashboard_context(user) -> dict:
    saved_routes = [
        route_with_owner(route, user.id)
        for route in saved_routes_json.list_saved_routes_for_user(user.id)
    ]
    recent_routes = list(reversed(saved_routes[-6:]))

    if saved_routes:
        total_distance = round(sum(route["distance_miles"] for route in saved_routes), 1)
        average_safety = round(
            sum(route["safety_score"] for route in saved_routes) / len(saved_routes),
            1,
        )
        if average_safety > 10:
            average_safety = round(average_safety / 10, 1)
        total_likes = sum(route.get("like_count", 0) for route in saved_routes)
        dashboard_stats = [
            {"label": "Average safety", "value": str(average_safety), "detail": "Across saved routes"},
            {"label": "Planned distance", "value": f"{total_distance} mi", "detail": "Across your collection"},
            {"label": "Saved routes", "value": str(len(saved_routes)), "detail": "Ready when you are"},
            {"label": "Community likes", "value": str(total_likes), "detail": "On routes you shared"},
        ]
        activity_title = "Recent route distance"
        activity_series = [
            {
                "label": route["name"][:10],
                "value": route["distance_miles"],
                "height": max(12, min(100, round(route["distance_miles"] * 10))),
            }
            for route in saved_routes[-7:]
        ]
    else:
        dashboard_stats = [
            {"label": "Area safety index", "value": "9.1", "detail": "+0.3 from yesterday"},
            {"label": "Distance today", "value": "5.5 mi", "detail": "+2.1 from average"},
            {"label": "Routes walked", "value": "2", "detail": "This week: 12"},
            {"label": "Calories burned", "value": "412", "detail": "Active day"},
        ]
        activity_title = "This week's activity"
        sample = [("Mon", 41), ("Tue", 23), ("Wed", 78), ("Thu", 8), ("Fri", 55), ("Sat", 100), ("Sun", 30)]
        activity_series = [
            {"label": label, "value": value / 10, "height": value}
            for label, value in sample
        ]

    return {
        "dashboard_stats": dashboard_stats,
        "activity_title": activity_title,
        "activity_series": activity_series,
        "recent_routes": recent_routes,
    }


@router.get("/", response_class=HTMLResponse)
async def landing(request: Request):
    user = get_current_user(request)
    if user:
        return RedirectResponse("/home", status_code=303)
    return render(request, "index.html")


@router.get("/home", response_class=HTMLResponse)
async def home(request: Request):
    user = get_current_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)
    return render(request, "home.html", dashboard_context(user))


@router.get("/about", response_class=HTMLResponse)
async def about(request: Request):
    return render(request, "about.html")


@router.get("/generate", response_class=HTMLResponse)
async def generate_route(request: Request):
    return render(request, "generate.html", {"error": None})


@router.post("/routes/results", response_class=HTMLResponse)
@router.post("/routes/search", response_class=HTMLResponse)
async def route_results(
    request: Request,
    start: str = Form(...),
    destination: str = Form(...),
    route_type: str = Form("walking"),
):
    try:
        search = RouteSearchRequest(
            start=start,
            destination=destination,
            route_type=route_type,
        )
        routes = [
            route_with_map_state(route)
            for route in generated_routes_json.store_generated_routes(search_routes(search))
        ]
        error = None
    except ValidationError:
        routes = []
        error = "Enter a valid start, destination, and route type."

    return render(
        request,
        "route_results.html",
        {
            "routes": routes,
            "start": start,
            "destination": destination,
            "route_type": route_type,
            "error": error,
        },
    )


@router.get("/saved", response_class=HTMLResponse)
async def saved_routes(request: Request):
    user = get_current_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)
    return render(
        request,
        "saved_routes.html",
        {
            "saved_routes": [
                route_with_owner(route, user.id)
                for route in saved_routes_json.list_saved_routes_for_user(user.id)
            ]
        },
    )


@router.get("/routes/saved")
async def legacy_saved_routes():
    return RedirectResponse("/saved", status_code=307)


@router.get("/explore", response_class=HTMLResponse)
async def route_gallery(
    request: Request,
    route_type: str = Query("all"),
    focus: str = Query("all"),
    sort: str = Query("recent"),
):
    user = get_current_user(request)
    viewer_id = user.id if user else None
    normalized_route_type = route_type if route_type in saved_routes_json.VALID_ROUTE_TYPES else "all"
    normalized_focus = focus if focus in saved_routes_json.VALID_FOCUS_FILTERS else "all"
    normalized_sort = sort if sort in saved_routes_json.VALID_SORTS else "recent"
    routes = [
        route_with_owner(route, viewer_id)
        for route in saved_routes_json.list_gallery_routes(
            normalized_route_type,
            normalized_focus,
            normalized_sort,
            viewer_id,
        )
    ]

    return render(
        request,
        "route_gallery.html",
        {
            "routes": routes,
            "route_type": normalized_route_type,
            "focus": normalized_focus,
            "sort": normalized_sort,
        },
    )
@router.get("/routes/gallery")
async def legacy_route_gallery(request: Request):
    target = "/explore"
    if request.url.query:
        target = f"{target}?{request.url.query}"
    return RedirectResponse(target, status_code=307)


@router.get("/social", response_class=HTMLResponse)
async def social(request: Request):
    user = get_current_user(request)
    viewer_id = user.id if user else None
    routes = [
        route_with_owner(route, viewer_id)
        for route in saved_routes_json.list_gallery_routes(viewer_id=viewer_id)
    ]
    community = []
    for member in users_json.list_users():
        member_routes = [route for route in routes if route["user_id"] == member["id"]]
        if not member_routes:
            continue
        community.append(
            {
                "user": member,
                "route_count": len(member_routes),
                "average_safety": round(
                    (
                        sum(route["safety_score"] for route in member_routes)
                        / len(member_routes)
                    )
                    / 10,
                    1,
                ),
                "like_count": sum(route.get("like_count", 0) for route in member_routes),
            }
        )
    community.sort(key=lambda member: (member["like_count"], member["route_count"]), reverse=True)
    return render(
        request,
        "social.html",
        {"community": community, "recent_routes": list(reversed(routes[-6:]))},
    )


@router.get("/route/{route_id}", response_class=HTMLResponse)
async def route_detail(request: Request, route_id: str):
    route, is_saved_route = get_route_record(route_id)
    user = get_current_user(request)
    if not route:
        return render(request, "route_detail.html", {"route": None}, status_code=404)
    if (
        is_saved_route
        and not route.get("is_shared", True)
        and not (user and user.id == route["user_id"])
    ):
        return render(request, "route_detail.html", {"route": None}, status_code=404)

    if is_saved_route:
        route = route_with_owner(route, user.id if user else None)

    user_saved_route = None
    if user:
        user_saved_route = saved_routes_json.get_saved_route_for_user_by_source(route, user.id)

    return render(
        request,
        "route_detail.html",
        {
            "route": route,
            "is_saved_route": is_saved_route,
            "user_saved_route": user_saved_route,
        },
    )
@router.get("/routes/{route_id}")
async def legacy_route_detail(route_id: str):
    return RedirectResponse(f"/route/{route_id}", status_code=307)


@router.post("/routes/save")
async def save_route(
    request: Request,
    route_id: str = Form(...),
    name: str = Form(...),
    start: str = Form(...),
    destination: str = Form(...),
    distance_miles: float = Form(...),
    estimated_minutes: int = Form(0),
    safety_score: int = Form(...),
    summary: str = Form(""),
    route_type: str = Form("walking"),
    map_style: str = Form("balanced"),
    filename: str = Form(""),
    directions: str = Form("[]"),
):
    user = get_current_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)

    highlights = []
    route, _ = get_route_record(route_id)
    if route:
        if (
            route.get("user_id")
            and route.get("user_id") != user.id
            and not route.get("is_shared", True)
        ):
            return RedirectResponse("/explore", status_code=303)
        route_id = route.get("route_id", route_id)
        highlights = route.get("highlights", [])

    try:
        route_directions = route.get("directions", []) if route else json.loads(directions)
        route_data = SavedRouteCreate(
            route_id=route_id,
            name=name,
            start=start,
            destination=destination,
            distance_miles=distance_miles,
            estimated_minutes=estimated_minutes,
            safety_score=safety_score,
            summary=summary,
            highlights=highlights,
            route_type=route_type,
            map_style=map_style,
            filename=filename,
            directions=route_directions,
        )
    except (json.JSONDecodeError, ValidationError):
        return RedirectResponse("/generate", status_code=303)

    saved_routes_json.save_route(route_data, user.id)
    return RedirectResponse("/saved", status_code=303)


@router.post("/routes/{saved_route_id}/sharing")
async def update_route_sharing(
    request: Request,
    saved_route_id: str,
    is_shared: str = Form("false"),
):
    user = get_current_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)

    saved_routes_json.set_route_sharing(
        saved_route_id,
        user.id,
        is_shared.lower() == "true",
    )
    return RedirectResponse(f"/route/{saved_route_id}", status_code=303)


@router.post("/routes/{saved_route_id}/like")
async def like_route(request: Request, saved_route_id: str):
    user = get_current_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)

    saved_routes_json.toggle_like(saved_route_id, user.id)
    return RedirectResponse(f"/route/{saved_route_id}", status_code=303)


@router.post("/routes/{saved_route_id}/rating")
async def rate_route(
    request: Request,
    saved_route_id: str,
    rating: int = Form(...),
):
    user = get_current_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)

    saved_routes_json.rate_route(saved_route_id, user.id, rating)
    return RedirectResponse(f"/route/{saved_route_id}", status_code=303)


@router.post("/routes/{saved_route_id}/notes")
async def update_route_notes(
    request: Request,
    saved_route_id: str,
    comments: str = Form(""),
    tags: str = Form(""),
):
    user = get_current_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)

    try:
        notes = SavedRouteNotesUpdate(comments=comments, tags=tags)
    except ValidationError:
        return RedirectResponse(f"/route/{saved_route_id}", status_code=303)

    saved_routes_json.update_route_notes(saved_route_id, user.id, notes)
    return RedirectResponse(f"/route/{saved_route_id}", status_code=303)


@router.get("/login", response_class=HTMLResponse)
async def login_page(
    request: Request,
    mode: str = Query("login"),
    message: str = Query(""),
):
    if mode == "signup":
        return RedirectResponse("/signup", status_code=303)
    return render(
        request,
        "login.html",
        {"error": None, "message": message},
    )


@router.post("/login")
async def login_user(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
):
    user = users_json.authenticate_user(username, password)
    if not user:
        return render(
            request,
            "login.html",
            {
                "mode": "login",
                "error": "Invalid username or password.",
                "message": "",
            },
            status_code=401,
        )

    response = RedirectResponse("/home", status_code=303)
    response.set_cookie(
        settings.session_cookie_name,
        sign_user_id(user["id"]),
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 14,
    )
    return response


@router.get("/signup", response_class=HTMLResponse)
async def signup_page(request: Request):
    return render(request, "signup.html", {"error": None})


@router.post("/signup")
async def signup_user(
    request: Request,
    email: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    confirm_password: str = Form(...),
):
    if password != confirm_password:
        return render(
            request,
            "signup.html",
            {"error": "Passwords must match."},
            status_code=400,
        )

    try:
        user = users_json.create_user(
            UserCreate(email=email, username=username, password=password)
        )
    except ValidationError:
        return render(
            request,
            "signup.html",
            {
                "error": "Enter a valid email, username, and password.",
            },
            status_code=400,
        )
    except ValueError as error:
        return render(
            request,
            "signup.html",
            {"error": str(error)},
            status_code=400,
        )

    response = RedirectResponse("/verify-email", status_code=303)
    response.set_cookie(
        settings.session_cookie_name,
        sign_user_id(user["id"]),
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 14,
    )
    return response


@router.get("/verify-email", response_class=HTMLResponse)
async def verify_email_page(request: Request):
    user = get_current_user(request)
    if not user:
        return RedirectResponse("/signup", status_code=303)
    if user.is_verified:
        return RedirectResponse("/home", status_code=303)
    return render(request, "verify_email.html", {"error": None})


@router.post("/verify-email")
async def verify_email(request: Request, code: str = Form(...)):
    user = get_current_user(request)
    if not user:
        return RedirectResponse("/signup", status_code=303)
    if code.strip() != VERIFICATION_CODE:
        return render(
            request,
            "verify_email.html",
            {"error": "Use prototype code 123456 to continue."},
            status_code=400,
        )
    users_json.verify_user(user.id)
    return RedirectResponse("/home", status_code=303)


@router.post("/verify-email/resend")
async def resend_verification():
    return RedirectResponse("/verify-email", status_code=303)


@router.get("/profile", response_class=HTMLResponse)
async def profile(request: Request):
    user = get_current_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)

    return render(
        request,
        "profile.html",
        {
            "profile_user": user,
            "is_self": True,
            "saved_routes": [
                route_with_owner(route, user.id)
                for route in saved_routes_json.list_saved_routes_for_user(user.id)
            ],
            "reports": reports_json.list_reports_for_user(user.id),
            "error": None,
            "message": "",
        },
    )


@router.get("/users/{username}", response_class=HTMLResponse)
async def public_profile(request: Request, username: str):
    user_record = users_json.get_user_by_username(username)
    if not user_record:
        return render(request, "profile.html", {"profile_user": None}, status_code=404)

    current_user = get_current_user(request)
    is_self = bool(current_user and current_user.id == user_record["id"])
    visible_routes = (
        saved_routes_json.list_saved_routes_for_user(user_record["id"])
        if is_self
        else saved_routes_json.list_shared_routes_for_user(user_record["id"])
    )
    return render(
        request,
        "profile.html",
        {
            "profile_user": user_record,
            "is_self": is_self,
            "saved_routes": [
                route_with_owner(route, current_user.id if current_user else None)
                for route in visible_routes
            ],
            "reports": [],
            "error": None,
            "message": "",
        },
    )


@router.post("/profile")
async def update_profile(
    request: Request,
    bio: str = Form(""),
    picture_url: str = Form(""),
):
    user = get_current_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)
    try:
        users_json.update_user_profile(
            user.id,
            UserProfileUpdate(bio=bio, picture_url=picture_url),
        )
    except ValidationError:
        return RedirectResponse("/profile", status_code=303)
    return RedirectResponse("/profile", status_code=303)


@router.post("/profile/password")
async def update_password(
    request: Request,
    current_password: str = Form(...),
    new_password: str = Form(...),
):
    user = get_current_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)
    if len(new_password) < 8:
        return RedirectResponse("/profile", status_code=303)
    users_json.change_password(user.id, current_password, new_password)
    return RedirectResponse("/profile", status_code=303)


@router.post("/reports")
async def submit_report(
    request: Request,
    location: str = Form(...),
    note: str = Form(...),
):
    user = get_current_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)

    try:
        report_data = SafetyReportCreate(location=location, note=note)
    except ValidationError:
        return RedirectResponse("/profile", status_code=303)

    reports_json.create_report(report_data, user.id)
    return RedirectResponse("/profile", status_code=303)


@router.post("/logout")
async def logout():
    response = RedirectResponse("/", status_code=303)
    response.delete_cookie(settings.session_cookie_name)
    return response


@router.get("/autocomplete")
async def autocomplete(q: str = Query(...)):
    response = requests.get(
        "https://api.openrouteservice.org/geocode/autocomplete",
        params={
            "api_key": os.getenv("ORS_API_KEY"),
            "layers": "venue,address,locality",
            "text": q,
        },
    )
    return response.json()
