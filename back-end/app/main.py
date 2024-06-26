from fastapi import FastAPI, Response, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from .routers import user_auth, manage_post, homepage
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from fastapi.responses import FileResponse, JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from .slowapiedit import SlowAPIMiddleware, blocked_ips
from datetime import datetime, timedelta


def _rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> Response:
    """
    Build a simple JSON response that includes the details of the rate limit
    that was hit. If no limit is hit, the countdown is added to headers.
    """
    print("rate limit function called")
    ip = get_remote_address(request)
    blocked_ips[ip] = datetime.now()

    response = JSONResponse(
        {"error": f"Rate limit exceeded: {exc.detail}"}, status_code=429
    )
    response = request.app.state.limiter._inject_headers(
        response, request.state.view_rate_limit
    )
    return response


app = FastAPI()
limiter = Limiter(key_func=get_remote_address, default_limits=["50/10seconds"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)


# https://stackoverflow.com/questions/62928450/how-to-put-backend-and-frontend-together-returning-react-frontend-from-fastapi
# Sets the templates directory to the `build` folder from `npm run build`
# this is where you'll find the index.html file.
dist_dir = "app/static/dist"
templates = Jinja2Templates(directory=dist_dir)


# https://stackoverflow.com/questions/75299908/how-to-add-custom-headers-to-static-files-in-fastapi
@app.get("/assets/{file_path:path}")
async def assets(file_path: str):
    response = FileResponse(f"{dist_dir}/assets/{file_path}")
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


# Mount the static folder to be served at '/static' URL path
app.mount("/app/static", StaticFiles(directory="app/static/"), name="static")

# Set CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(user_auth.router)
app.include_router(manage_post.router)
app.include_router(homepage.router)


# Defines a route handler for `/*` essentially.
# NOTE: this needs to be the last route defined b/c it's a catch all route
@app.get("/{rest_of_path:path}")
async def react_app(response: Response, req: Request, rest_of_path: str):
    response = templates.TemplateResponse("index.html", {"request": req})
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response
