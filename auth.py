# =============================================================================
# Auth — Google OAuth 2.0 + JWT session tokens
# =============================================================================

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from urllib.parse import urlencode
import httpx
import os
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from dotenv import load_dotenv

from database import get_db
from models import User

load_dotenv()

GOOGLE_CLIENT_ID     = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
JWT_SECRET           = os.environ.get("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET environment variable is not set")
FRONTEND_URL         = os.environ.get("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL          = os.environ.get("BACKEND_URL", "http://localhost:8000")

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24 * 7  # 1 week

GOOGLE_AUTH_URL  = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO  = "https://www.googleapis.com/oauth2/v2/userinfo"

router = APIRouter(prefix="/auth", tags=["auth"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def create_jwt(user_id: int, email: str) -> str:
    """Create a signed JWT with user claims."""
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_jwt(token: str) -> dict:
    """Decode and validate a JWT. Raises HTTPException on failure."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> User:
    """FastAPI dependency — extracts user from Authorization: Bearer <token>."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization header")
    token = auth_header.split(" ", 1)[1]
    claims = decode_jwt(token)
    user = (await db.execute(select(User).where(User.id == int(claims["sub"])))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/google")
async def google_login():
    """Redirect user to Google consent screen."""
    redirect_uri = f"{BACKEND_URL}/auth/google/callback"
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    qs = urlencode(params)
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{qs}")


@router.get("/google/callback")
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    """Exchange authorization code for tokens, upsert user, redirect to frontend."""
    redirect_uri = f"{BACKEND_URL}/auth/google/callback"

    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_res = await client.post(GOOGLE_TOKEN_URL, data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        })
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code with Google")
        tokens = token_res.json()

        # Fetch user profile
        userinfo_res = await client.get(GOOGLE_USERINFO, headers={
            "Authorization": f"Bearer {tokens['access_token']}"
        })
        if userinfo_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch user info from Google")
        profile = userinfo_res.json()

    # Upsert user
    google_id = profile["id"]
    email     = profile.get("email", "")
    name      = profile.get("name", "")
    picture   = profile.get("picture", "")

    existing = (await db.execute(select(User).where(User.google_id == google_id))).scalar_one_or_none()

    if existing:
        existing.email   = email
        existing.name    = name
        existing.picture = picture
        user = existing
    else:
        user = User(google_id=google_id, email=email, name=name, picture=picture)
        db.add(user)

    await db.commit()
    await db.refresh(user)

    # Issue JWT and redirect to frontend
    token = create_jwt(user.id, user.email)
    return RedirectResponse(f"{FRONTEND_URL}?token={token}")


@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    """Return the current authenticated user's profile."""
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
    }
