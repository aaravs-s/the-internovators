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

router = APIRouter()
templates = Jinja2Templates(directory=str(settings.templates_dir))
VERIFICATION_CODE = "123456"


def render(request: Request, name: str, context: dict | None = None, status_code: int = 200):
    page_context = {"user": get_current_user(request)}
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


def route_with_owner(saved_route: dict) -> dict:
    route = dict(saved_route)
    route["owner"] = route_owner(saved_route)
    return route


def get_route_record(route_id: str) -> tuple[dict | None, bool]:
    saved_route = saved_routes_json.get_saved_route(route_id)
    if saved_route:
        return route_with_owner(saved_route), True
    generated_route = generated_routes_json.get_generated_route(route_id)
    if generated_route:
        return generated_route, False
    return None, False


@router.get("/", response_class=HTMLResponse)
async def home(request: Request):
    user = get_current_user(request)
    recent_routes = []
    if user:
        recent_routes = [
            route_with_owner(route)
            for route in saved_routes_json.list_saved_routes()
            if route["user_id"] != user.id
        ][-6:]
        recent_routes.reverse()
    return render(request, "index.html", {"recent_routes": recent_routes})


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
        routes = generated_routes_json.store_generated_routes(search_routes(search))
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


@router.get("/routes/saved", response_class=HTMLResponse)
async def saved_routes(request: Request):
    user = get_current_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)
    return render(
        request,
        "saved_routes.html",
        {"saved_routes": saved_routes_json.list_saved_routes_for_user(user.id)},
    )


@router.get("/routes/{route_id}", response_class=HTMLResponse)
async def route_detail(request: Request, route_id: str):
    route, is_saved_route = get_route_record(route_id)
    if not route:
        return render(request, "route_detail.html", {"route": None}, status_code=404)

    user = get_current_user(request)
    user_saved_route = None
    if user:
        lookup_id = route.get("route_id", route["id"])
        user_saved_route = saved_routes_json.get_saved_route_for_user(lookup_id, user.id)

    return render(
        request,
        "route_detail.html",
        {
            "route": route,
            "is_saved_route": is_saved_route,
            "user_saved_route": user_saved_route,
        },
    )


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
):
    user = get_current_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)

    highlights = []
    route, _ = get_route_record(route_id)
    if route:
        highlights = route.get("highlights", [])

    try:
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
        )
    except ValidationError:
        return RedirectResponse("/generate", status_code=303)

    saved_routes_json.save_route(route_data, user.id)
    return RedirectResponse("/routes/saved", status_code=303)


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
        return RedirectResponse(f"/routes/{saved_route_id}", status_code=303)

    saved_routes_json.update_route_notes(saved_route_id, user.id, notes)
    return RedirectResponse(f"/routes/{saved_route_id}", status_code=303)


@router.get("/login", response_class=HTMLResponse)
async def login_page(
    request: Request,
    mode: str = Query("login"),
    message: str = Query(""),
):
    return render(
        request,
        "login.html",
        {"mode": mode if mode == "signup" else "login", "error": None, "message": message},
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

    response = RedirectResponse("/", status_code=303)
    response.set_cookie(
        settings.session_cookie_name,
        sign_user_id(user["id"]),
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 14,
    )
    return response


@router.get("/signup", response_class=HTMLResponse)
async def signup_page():
    return RedirectResponse("/login?mode=signup", status_code=303)


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
            "login.html",
            {"mode": "signup", "error": "Passwords must match.", "message": ""},
            status_code=400,
        )

    try:
        user = users_json.create_user(
            UserCreate(email=email, username=username, password=password)
        )
    except ValidationError:
        return render(
            request,
            "login.html",
            {
                "mode": "signup",
                "error": "Enter a valid email, username, and password.",
                "message": "",
            },
            status_code=400,
        )
    except ValueError as error:
        return render(
            request,
            "login.html",
            {"mode": "signup", "error": str(error), "message": ""},
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
        return RedirectResponse("/login?mode=signup", status_code=303)
    if user.is_verified:
        return RedirectResponse("/", status_code=303)
    return render(request, "verify_email.html", {"error": None})


@router.post("/verify-email")
async def verify_email(request: Request, code: str = Form(...)):
    user = get_current_user(request)
    if not user:
        return RedirectResponse("/login?mode=signup", status_code=303)
    if code.strip() != VERIFICATION_CODE:
        return render(
            request,
            "verify_email.html",
            {"error": "Use prototype code 123456 to continue."},
            status_code=400,
        )
    users_json.verify_user(user.id)
    return RedirectResponse("/", status_code=303)


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
            "saved_routes": saved_routes_json.list_saved_routes_for_user(user.id),
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
    return render(
        request,
        "profile.html",
        {
            "profile_user": user_record,
            "is_self": is_self,
            "saved_routes": saved_routes_json.list_saved_routes_for_user(user_record["id"]),
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
