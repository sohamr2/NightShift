# =============================================================================
# ORM Models — User + Assessment
# =============================================================================

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base


class User(Base):
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    google_id  = Column(String(255), unique=True, nullable=False, index=True)
    email      = Column(String(320), unique=True, nullable=False)
    name       = Column(String(255), nullable=True)
    picture    = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    assessments = relationship("Assessment", back_populates="user", lazy="selectin")

    def __repr__(self):
        return f"<User id={self.id} email={self.email}>"


class Assessment(Base):
    __tablename__ = "assessments"

    id                      = Column(Integer, primary_key=True, autoincrement=True)
    user_id                 = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Quiz inputs
    age                     = Column(Integer)
    gender                  = Column(String(20))
    primary_platform        = Column(String(60))
    daily_screen_time_hours = Column(Float)
    sleep_duration_hours    = Column(Float)
    activity_type           = Column(String(30))
    dominant_content_type   = Column(String(60))
    user_archetype          = Column(String(60))
    late_night_usage        = Column(Boolean, default=False)
    social_comparison       = Column(Boolean, default=False)

    # ML results
    phq9_score              = Column(Float)
    gad7_score              = Column(Float)
    risk_probability        = Column(Float)
    is_at_risk              = Column(Boolean)

    created_at              = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="assessments")

    def __repr__(self):
        return f"<Assessment id={self.id} user_id={self.user_id} phq9={self.phq9_score}>"
