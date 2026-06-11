from fastapi import APIRouter, Form, Request, Query
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from pydantic import ValidationError

from core.config import settings
from core.dependencies import get_current_user
from core.security import sign_user_id
from repositories import reports_json, saved_routes_json, users_json
from schemas.report import SafetyReportCreate
from schemas.route import RouteSearchRequest, SavedRouteCreate
from schemas.user import UserCreate
from services.route_planner import search_routes

import requests
import os

router = APIRouter()
templates = Jinja2Templates(directory=str(settings.templates_dir))


@router.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"user": get_current_user(request)},
    )


@router.post("/routes/search", response_class=HTMLResponse)
async def route_results(
    request: Request,
    start: str = Form(...),
    destination: str = Form(...),
):
    try:
        search = RouteSearchRequest(start=start, destination=destination)
        routes = search_routes(search)
        error = None
    except ValidationError:
        routes = []
        error = "Enter a valid start and destination."

    return templates.TemplateResponse(
        request=request,
        name="route_results.html",
        context={
            "user": get_current_user(request),
            "routes": routes,
            "start": start,
            "destination": destination,
            "error": error,
        },
    )


@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="login.html",
        context={"user": get_current_user(request), "error": None},
    )


@router.post("/login")
async def login_user(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
):
    user = users_json.authenticate_user(username, password)
    if not user:
        return templates.TemplateResponse(
            request=request,
            name="login.html",
            context={
                "user": None,
                "error": "Invalid username or password.",
            },
            status_code=401,
        )

    response = RedirectResponse("/profile", status_code=303)
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
    return templates.TemplateResponse(
        request=request,
        name="signup.html",
        context={"user": get_current_user(request), "error": None},
    )


@router.post("/signup")
async def signup_user(
    request: Request,
    email: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    confirm_password: str = Form(...),
):
    if password != confirm_password:
        return templates.TemplateResponse(
            request=request,
            name="signup.html",
            context={"user": None, "error": "Passwords must match."},
            status_code=400,
        )

    try:
        user = users_json.create_user(
            UserCreate(email=email, username=username, password=password)
        )
    except ValidationError:
        return templates.TemplateResponse(
            request=request,
            name="signup.html",
            context={
                "user": None,
                "error": "Enter a valid email, username, and password.",
            },
            status_code=400,
        )
    except ValueError as error:
        return templates.TemplateResponse(
            request=request,
            name="signup.html",
            context={"user": None, "error": str(error)},
            status_code=400,
        )

    response = RedirectResponse("/profile", status_code=303)
    response.set_cookie(
        settings.session_cookie_name,
        sign_user_id(user["id"]),
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 14,
    )
    return response


@router.get("/profile", response_class=HTMLResponse)
async def profile(request: Request):
    user = get_current_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)

    return templates.TemplateResponse(
        request=request,
        name="profile.html",
        context={
            "user": user,
            "saved_routes": saved_routes_json.list_saved_routes_for_user(user.id),
            "reports": reports_json.list_reports_for_user(user.id),
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
    safety_score: int = Form(...),
):
    user = get_current_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)

    try:
        route_data = SavedRouteCreate(
            route_id=route_id,
            name=name,
            start=start,
            destination=destination,
            distance_miles=distance_miles,
            safety_score=safety_score,
        )
    except ValidationError:
        return RedirectResponse("/", status_code=303)

    saved_routes_json.save_route(route_data, user.id)
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
        f"https://api.openrouteservice.org/geocode/autocomplete",
        params={
            "api_key": os.getenv("ORS_API_KEY"),
            "layers": "venue,address,locality",
            "text": q
        }
    )

    data = response.json()

    return data