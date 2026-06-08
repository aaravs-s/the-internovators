from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

app = FastAPI()

templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def read_item(request: Request):
    # "request" must be passed to the template context
    return templates.TemplateResponse(
        request=request, 
        name="index.html"
       
    )

@app.get("/login", response_class=HTMLResponse)
async def read_item(request: Request):
    # "request" must be passed to the template context
    return templates.TemplateResponse(
        request=request, 
        name="login.html"
       
    )

@app.get("/signup", response_class=HTMLResponse)
async def read_item(request: Request):
    # "request" must be passed to the template context
    return templates.TemplateResponse(
        request=request, 
        name="signup.html"
       
    )

