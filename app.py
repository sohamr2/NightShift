# =============================================================================
# NightShift ML Engine — FastAPI Backend
# =============================================================================
# IMPORTANT: DigitalStressEncoder MUST be defined before joblib.load() calls
# so that pickle can reconstruct the custom transformer objects embedded inside
# the saved pipeline files.
# =============================================================================

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Union
import joblib
import pandas as pd
import numpy as np
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from sklearn.base import BaseEstimator, TransformerMixin

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
# App & Middleware
# ---------------------------------------------------------------------------

load_dotenv()
GOOGLE_API = os.environ.get("GOOGLE_API")
gemini_client = genai.Client(api_key=GOOGLE_API)

app = FastAPI(title="NightShift ML Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Load ML models on startup
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Pickle compatibility patches — must run BEFORE joblib.load()
# ---------------------------------------------------------------------------

# 1) Models were pickled with __main__.DigitalStressEncoder; inject it so pickle
#    can find the class regardless of how uvicorn loads this module.
import __main__
__main__.DigitalStressEncoder = DigitalStressEncoder

# 2) _RemainderColsList is an internal sklearn class added in 1.5+. If the pkl
#    was built with a version that serialised this class, we stub it out so
#    older/newer installs can still load the pipeline cleanly.
try:
    from sklearn.compose._column_transformer import _RemainderColsList  # noqa: F401
except ImportError:
    import sklearn.compose._column_transformer as _ct_mod
    class _RemainderColsList(list):
        """Compatibility stub for sklearn ColumnTransformer remainder list."""
        def __reduce__(self):
            return (list, (list(self),))
    _ct_mod._RemainderColsList = _RemainderColsList

print("Loading ML models into memory...")
try:
    classifier      = joblib.load("best_risk_classifier.pkl")
    phq_regressor   = joblib.load("phq9_depression_regressor.pkl")
    gad_regressor   = joblib.load("gad7_anxiety_regressor.pkl")
    print("✅ Ensemble models loaded successfully!")
except Exception as e:
    print(f"❌ Error loading models: {e}")
    classifier = phq_regressor = gad_regressor = None

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
# /predict — Ensemble inference endpoint
# ---------------------------------------------------------------------------

@app.post("/predict")
async def get_predictions(user: UserProfile):
    if classifier is None or phq_regressor is None or gad_regressor is None:
        raise HTTPException(status_code=503, detail="ML models are not loaded. Check server logs.")

    try:
        data = user.model_dump()

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

        return {
            "risk_probability": round(risk_prob, 4),
            "is_at_risk": risk_prob >= 0.5,
            "phq9_score": round(phq_score, 2),
            "gad7_score": round(gad_score, 2),
        }

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
# /health — Liveness probe
# ---------------------------------------------------------------------------

@app.get("/health")
async def health_check():
    models_ok = all(m is not None for m in [classifier, phq_regressor, gad_regressor])
    return {
        "status": "NightShift API is live!",
        "models_loaded": models_ok,
    }