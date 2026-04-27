# =============================================================================
# NightShift ML Engine — FastAPI Backend
# =============================================================================
# IMPORTANT: DigitalStressEncoder MUST be defined before joblib.load() calls
# so that pickle can reconstruct the custom transformer objects embedded inside
# the saved pipeline files.
# =============================================================================

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Union, Optional
import joblib
import pandas as pd
import numpy as np
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from sklearn.base import BaseEstimator, TransformerMixin
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from contextlib import asynccontextmanager

from database import get_db, create_tables
from models import Assessment
from auth import router as auth_router, get_current_user, decode_jwt
from models import User

# ---------------------------------------------------------------------------
# Custom scikit-learn transformer — MUST be present for joblib.load() to work
# ---------------------------------------------------------------------------

class DigitalStressEncoder(BaseEstimator, TransformerMixin):
    def __init__(
        self,
        shortform_platforms=None,
        microblog_platforms=None,
        optimal_sleep=7.0,
    ):
        self.shortform_platforms = shortform_platforms or {"TikTok", "Instagram", "YouTube"}
        self.microblog_platforms = microblog_platforms or {"Twitter/X"}
        self.optimal_sleep = optimal_sleep
        self._screen_min = None
        self._screen_rng = None
        self._scroll_max = None

    def fit(self, X, y=None):
        df = pd.DataFrame(X).copy() if not isinstance(X, pd.DataFrame) else X.copy()
        screen = df["Daily_Screen_Time_Hours"].astype(float)
        self._screen_min = screen.min()
        self._screen_rng = screen.max() - screen.min() + 1e-9
        tmp = self._base_flags(df)
        scroll = self._raw_scroll(tmp)
        self._scroll_max = scroll.max() + 1e-9
        return self

    def transform(self, X, y=None):
        df = pd.DataFrame(X).copy() if not isinstance(X, pd.DataFrame) else X.copy()
        for col in ["Late_Night_Usage", "Social_Comparison_Trigger"]:
            if col in df.columns:
                if df[col].dtype == object:
                    df[col] = df[col].map({"Yes": 1, "No": 0}).fillna(0).astype(int)
                else:
                    df[col] = df[col].fillna(0).astype(int)
        df = self._base_flags(df)
        raw_scroll = self._raw_scroll(df)
        df["scroll_risk_score"] = raw_scroll / self._scroll_max
        df["screen_sleep_ratio"] = df["Daily_Screen_Time_Hours"] / (df["Sleep_Duration_Hours"] + 1e-9)
        screen_norm = (df["Daily_Screen_Time_Hours"].astype(float) - self._screen_min) / self._screen_rng
        sleep_burden = np.clip(
            (self.optimal_sleep - df["Sleep_Duration_Hours"].astype(float)) / 4.0, 0, 1
        )
        df["mental_load_index"] = (
            1.2 * screen_norm
            + 1.1 * sleep_burden
            + 0.9 * df["scroll_risk_score"]
            + 0.8 * df["feed_type_flag"]
            + 0.8 * df["Social_Comparison_Trigger"]
        )
        return df

    def _base_flags(self, df):
        df = df.copy()
        df["feed_type_flag"] = df["Primary_Platform"].isin(self.shortform_platforms).astype(int)
        df["microblog_flag"] = df["Primary_Platform"].isin(self.microblog_platforms).astype(int)
        df["passive_user"] = (df["Activity_Type"].str.lower() == "passive").astype(int)
        return df

    def _raw_scroll(self, df):
        return (
            1.0 * df["microblog_flag"]
            + 1.0 * df["Late_Night_Usage"]
            + 0.7 * df["passive_user"]
            + 0.8 * df["Social_Comparison_Trigger"]
        )


# ---------------------------------------------------------------------------
# Lifespan — DB init + ML model loading
# ---------------------------------------------------------------------------

load_dotenv()
GOOGLE_API = os.environ.get("GOOGLE_API")
gemini_client = genai.Client(api_key=GOOGLE_API)

# Pickle compatibility patches — must run BEFORE joblib.load()
import __main__
__main__.DigitalStressEncoder = DigitalStressEncoder

try:
    from sklearn.compose._column_transformer import _RemainderColsList  # noqa: F401
except ImportError:
    import sklearn.compose._column_transformer as _ct_mod
    class _RemainderColsList(list):
        """Compatibility stub for sklearn ColumnTransformer remainder list."""
        def __reduce__(self):
            return (list, (list(self),))
    _ct_mod._RemainderColsList = _RemainderColsList

classifier = phq_regressor = gad_regressor = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create DB tables + load ML models."""
    # --- DB ---
    print("Creating database tables...")
    await create_tables()
    print("Database tables ready!")

    # --- ML ---
    global classifier, phq_regressor, gad_regressor
    print("Loading ML models into memory...")
    try:
        classifier    = joblib.load("best_risk_classifier.pkl")
        phq_regressor = joblib.load("phq9_depression_regressor.pkl")
        gad_regressor = joblib.load("gad7_anxiety_regressor.pkl")
        print("Ensemble models loaded successfully!")
    except Exception as e:
        print(f"Error loading models: {e}")
        classifier = phq_regressor = gad_regressor = None

    yield  # app runs here

    # Shutdown (nothing needed)


# ---------------------------------------------------------------------------
# App & Middleware
# ---------------------------------------------------------------------------

app = FastAPI(title="NightShift ML Engine", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://night-shift-sandy.vercel.app",
        "https://nightshift-s5rm.onrender.com",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount auth routes
app.include_router(auth_router)


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------

class UserProfile(BaseModel):
    Age: int
    Gender: str
    Primary_Platform: str
    Daily_Screen_Time_Hours: float
    Sleep_Duration_Hours: float
    Activity_Type: str
    Dominant_Content_Type: str
    User_Archetype: str
    Late_Night_Usage: Union[int, str]
    Social_Comparison_Trigger: Union[int, str]


class ChatMessage(BaseModel):
    role: str   # "user" or "luna"
    text: str


class ChatRequest(BaseModel):
    depression_severity: str
    anxiety_severity: str
    history: List[ChatMessage]
    message: str


# ---------------------------------------------------------------------------
# Helper: extract user from token (optional — doesn't 401 if missing)
# ---------------------------------------------------------------------------

async def _optional_user(request: Request, db: AsyncSession) -> Optional[User]:
    """Try to get the logged-in user; return None if no valid token."""
    from sqlalchemy import select
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    try:
        claims = decode_jwt(token)
    except Exception:
        return None
    user = (await db.execute(select(User).where(User.id == int(claims["sub"])))).scalar_one_or_none()
    return user


# ---------------------------------------------------------------------------
# /predict — Ensemble inference endpoint (saves to DB if authenticated)
# ---------------------------------------------------------------------------

@app.post("/predict")
async def get_predictions(user_profile: UserProfile, request: Request, db: AsyncSession = Depends(get_db)):
    if classifier is None or phq_regressor is None or gad_regressor is None:
        raise HTTPException(status_code=503, detail="ML models are not loaded. Check server logs.")

    try:
        data = user_profile.model_dump()

        # Normalize Yes/No → 1/0 before sklearn sees the data
        _yes = {"yes", "1", "true"}
        for field in ("Late_Night_Usage", "Social_Comparison_Trigger"):
            v = data[field]
            if isinstance(v, str):
                data[field] = 1 if v.strip().lower() in _yes else 0

        df = pd.DataFrame([data])

        risk_prob  = float(classifier.predict_proba(df)[0][1])
        phq_score  = float(phq_regressor.predict(df)[0])
        gad_score  = float(gad_regressor.predict(df)[0])

        result = {
            "risk_probability": round(risk_prob, 4),
            "is_at_risk": risk_prob >= 0.5,
            "phq9_score": round(phq_score, 2),
            "gad7_score": round(gad_score, 2),
        }

        # Save to DB if user is logged in
        current_user = await _optional_user(request, db)
        if current_user:
            assessment = Assessment(
                user_id=current_user.id,
                age=data["Age"],
                gender=data["Gender"],
                primary_platform=data["Primary_Platform"],
                daily_screen_time_hours=data["Daily_Screen_Time_Hours"],
                sleep_duration_hours=data["Sleep_Duration_Hours"],
                activity_type=data["Activity_Type"],
                dominant_content_type=data["Dominant_Content_Type"],
                user_archetype=data["User_Archetype"],
                late_night_usage=bool(data["Late_Night_Usage"]),
                social_comparison=bool(data["Social_Comparison_Trigger"]),
                phq9_score=phq_score,
                gad7_score=gad_score,
                risk_probability=risk_prob,
                is_at_risk=risk_prob >= 0.5,
            )
            db.add(assessment)
            await db.commit()

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# /chat — Luna AI companion (Gemini)
# ---------------------------------------------------------------------------

@app.post("/chat")
async def luna_chat(req: ChatRequest):
    try:
        system_prompt = f"""You are Luna, an empathetic AI wellness companion inside the NightShift app.

USER PROFILE (from our ML model):
- Depression Severity: {req.depression_severity}
- Anxiety Severity: {req.anxiety_severity}

YOUR PERSONALITY & RULES:
- Be warm, empathetic, and conversational — never robotic or clinical.
- Always directly answer what the user asked. Do NOT deflect with a counter-question unless you genuinely need clarification.
- Tailor every response to their specific Depression and Anxiety severity levels.
- Keep responses concise: 2-4 sentences. Never use bullet lists.
- You may occasionally suggest one small, specific offline action (e.g. a 5-minute walk, drinking water).
- Do NOT repeat yourself across turns."""

        gemini_history = []
        for msg in req.history:
            gemini_role = "user" if msg.role == "user" else "model"
            gemini_history.append(
                types.Content(role=gemini_role, parts=[types.Part(text=msg.text)])
            )

        gemini_history.append(
            types.Content(role="user", parts=[types.Part(text=req.message)])
        )

        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=gemini_history,
            config=types.GenerateContentConfig(system_instruction=system_prompt),
        )

        return {"reply": response.text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# /assessments/latest — Return the most recent assessment for the logged-in user
# ---------------------------------------------------------------------------

@app.get("/assessments/latest")
async def get_latest_assessment(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = (await db.execute(
        select(Assessment)
        .where(Assessment.user_id == current_user.id)
        .order_by(desc(Assessment.created_at))
        .limit(1)
    )).scalar_one_or_none()

    if not result:
        raise HTTPException(status_code=404, detail="No assessments found")

    return {
        "phq9_score":       result.phq9_score,
        "gad7_score":       result.gad7_score,
        "risk_probability": result.risk_probability,
        "is_at_risk":       result.is_at_risk,
        "screen_time":      result.daily_screen_time_hours,
        "sleep_hours":      result.sleep_duration_hours,
        "late_night":       1 if result.late_night_usage else 0,
        "activity_type":    result.activity_type,
        "social_comparison": 1 if result.social_comparison else 0,
    }


# ---------------------------------------------------------------------------
# /analytics — Dataset aggregations for the DV Dashboard
# ---------------------------------------------------------------------------

_analytics_df = None

def _get_analytics_df():
    global _analytics_df
    if _analytics_df is None:
        _analytics_df = pd.read_csv("social_media_mental_health.csv")
        _analytics_df["combined_mh"] = _analytics_df["PHQ_9_Score"] + _analytics_df["GAD_7_Score"]
        _analytics_df["screen_bucket"] = pd.cut(
            _analytics_df["Daily_Screen_Time_Hours"],
            bins=[0, 3, 6, 9, float("inf")],
            labels=["Low", "Moderate", "High", "Very High"],
        )
        _analytics_df["sleep_bucket"] = pd.cut(
            _analytics_df["Sleep_Duration_Hours"],
            bins=[0, 5, 7, float("inf")],
            labels=["Poor Sleep", "Moderate Sleep", "Healthy Sleep"],
        )
    return _analytics_df.copy()


@app.get("/analytics")
async def get_analytics(
    gender: Optional[str] = None,
    platform: Optional[str] = None,
    activity_type: Optional[str] = None,
    age_group: Optional[str] = None,
):
    df = _get_analytics_df()

    if gender:
        df = df[df["Gender"] == gender]
    if platform:
        df = df[df["Primary_Platform"] == platform]
    if activity_type:
        df = df[df["Activity_Type"] == activity_type]
    if age_group:
        if age_group == "Early College":
            df = df[df["Age"] <= 20]
        elif age_group == "Mid College":
            df = df[(df["Age"] >= 21) & (df["Age"] <= 23)]
        elif age_group == "Senior":
            df = df[df["Age"] >= 24]

    if df.empty:
        return {"error": "No data for selected filters"}

    kpis = {
        "total_users": len(df),
        "avg_screen_time": round(float(df["Daily_Screen_Time_Hours"].mean()), 2),
        "avg_sleep": round(float(df["Sleep_Duration_Hours"].mean()), 2),
        "avg_gad": round(float(df["GAD_7_Score"].mean()), 2),
        "avg_phq": round(float(df["PHQ_9_Score"].mean()), 2),
        "at_risk_pct": round(float(((df["PHQ_9_Score"] >= 10) | (df["GAD_7_Score"] >= 10)).mean()), 2),
    }

    gad_by_screen = (
        df.groupby("screen_bucket", observed=True)["GAD_7_Score"]
        .mean().round(2).reset_index()
        .rename(columns={"screen_bucket": "bucket", "GAD_7_Score": "avg_gad"})
        .to_dict(orient="records")
    )

    phq_by_sleep = (
        df.groupby("sleep_bucket", observed=True)["PHQ_9_Score"]
        .mean().round(2).reset_index()
        .rename(columns={"sleep_bucket": "bucket", "PHQ_9_Score": "avg_phq"})
        .to_dict(orient="records")
    )

    activity_split = (
        df["Activity_Type"].value_counts().reset_index()
        .rename(columns={"Activity_Type": "type", "count": "count"})
        .to_dict(orient="records")
    )

    gad_by_late_night = (
        df.groupby("Late_Night_Usage")["GAD_7_Score"]
        .mean().round(2).reset_index()
        .rename(columns={"Late_Night_Usage": "late_night", "GAD_7_Score": "avg_gad"})
        .to_dict(orient="records")
    )

    phq_by_activity = (
        df.groupby("Activity_Type")["PHQ_9_Score"]
        .mean().round(2).reset_index()
        .rename(columns={"Activity_Type": "activity", "PHQ_9_Score": "avg_phq"})
        .to_dict(orient="records")
    )

    mh_by_social = (
        df.groupby("Social_Comparison_Trigger")["combined_mh"]
        .mean().round(2).reset_index()
        .rename(columns={"Social_Comparison_Trigger": "social_comparison", "combined_mh": "avg_combined_mh"})
        .to_dict(orient="records")
    )

    scatter = (
        df[["Daily_Screen_Time_Hours", "combined_mh"]]
        .sample(min(600, len(df)), random_state=42)
        .round(2)
        .rename(columns={"Daily_Screen_Time_Hours": "screen_time", "combined_mh": "combined_mh"})
        .to_dict(orient="records")
    )

    return {
        "kpis": kpis,
        "gad_by_screen": gad_by_screen,
        "phq_by_sleep": phq_by_sleep,
        "activity_split": activity_split,
        "gad_by_late_night": gad_by_late_night,
        "phq_by_activity": phq_by_activity,
        "mh_by_social": mh_by_social,
        "scatter": scatter,
    }


# ---------------------------------------------------------------------------
# /health — Liveness probe
# ---------------------------------------------------------------------------

@app.get("/health")
async def health_check():
    models_ok = all(m is not None for m in [classifier, phq_regressor, gad_regressor])
    return {
        "status": "NightShift API is live!",
        "models_loaded": models_ok,
    }