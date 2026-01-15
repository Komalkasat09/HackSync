import json
from datetime import datetime
from typing import Dict, List, Optional, Union
from dataclasses import dataclass, field, asdict
from enum import Enum

@dataclass
class Skill:
    name: str
    proficiency: str  # e.g., "Beginner", "Intermediate", "Advanced"
    verified: bool = False
    last_assessed: Optional[str] = None  # ISO format date
    confidence_score: float = 0.0  # 0-1 scale

@dataclass
class CareerGoal:
    target_role: str
    target_skills: List[str]
    timeline_months: int
    priority_level: str = "Medium"  # High, Medium, Low

@dataclass
class LearningPreferences:
    content_types: List[str]  # e.g., ["Video", "Article", "Interactive"]
    difficulty_preference: str = "Adaptive"
    mentor_mode: bool = True  # Enable AI mentor by default
    learning_style: str = "Visual"  # Visual, Auditory, Kinesthetic
    pace: str = "Self-paced"  # Self-paced, Structured, Intensive

@dataclass
class TimeAvailability:
    hours_per_week: int
    preferred_days: List[str]  # e.g., ["Saturday", "Sunday"]
    preferred_time_slots: List[str] = field(default_factory=lambda: ["Evening"])

@dataclass
class Badge:
    name: str
    description: str
    earned_date: str
    category: str  # "Skill", "Progress", "Consistency", "Special"

@dataclass
class LearningActivity:
    resource_title: str
    resource_type: str
    topic: str
    completion_status: str  # "completed", "in_progress", "paused"
    time_spent_minutes: int
    completion_date: Optional[str] = None
    rating: Optional[int] = None  # 1-5 stars
    notes: Optional[str] = None

@dataclass
class LearningStreak:
    current_streak: int = 0
    longest_streak: int = 0
    last_activity_date: Optional[str] = None

class UserProfile:
    def __init__(
        self,
        user_id: str,
        name: str,
        email: str,
        current_skills: List[Dict[str, Union[str, bool]]] = None,
        goals: Dict = None,
        preferences: Dict = None,
        availability: Dict = None
    ):
        self.user_id = user_id
        self.name = name
        self.email = email
        self.created_at = datetime.now().isoformat()
        self.updated_at = self.created_at
        
        # Initialize Skills
        self.skills: Dict[str, Skill] = {}
        if current_skills:
            for s in current_skills:
                confidence = s.get('confidence_score', 0.7)
                self.add_skill(s['name'], s['proficiency'], s.get('verified', False), confidence)

        # Initialize Complex Objects
        if goals:
            target_role = goals.get('target_role', 'General Developer')
            target_skills = goals.get('target_skills', [])
            timeline_months = goals.get('timeline_months', 6)
            priority_level = goals.get('priority_level', 'Medium')
            self.career_goal = CareerGoal(
                target_role=target_role,
                target_skills=target_skills,
                timeline_months=timeline_months,
                priority_level=priority_level
            )
        else:
            self.career_goal = None
        
        pref_dict = preferences or {}
        self.preferences = LearningPreferences(
            content_types=pref_dict.get('content_types', ["Video", "Article"]),
            difficulty_preference=pref_dict.get('difficulty_preference', 'Adaptive'),
            mentor_mode=pref_dict.get('mentor_mode', True),
            learning_style=pref_dict.get('learning_style', 'Visual'),
            pace=pref_dict.get('pace', 'Self-paced')
        )
        
        avail_dict = availability or {}
        self.availability = TimeAvailability(
            hours_per_week=avail_dict.get('hours_per_week', 5),
            preferred_days=avail_dict.get('preferred_days', ["Saturday"]),
            preferred_time_slots=avail_dict.get('preferred_time_slots', ["Evening"])
        )

        # Gamification & Progress Tracking
        self.total_xp: int = 0
        self.level: int = 1
        self.badges: List[Badge] = []
        self.learning_activities: List[LearningActivity] = []
        self.streak: LearningStreak = LearningStreak()
        self.weekly_goal_hours: int = self.availability.hours_per_week
        self.weekly_hours_completed: int = 0

    def add_skill(self, name: str, proficiency: str, verified: bool = False, confidence_score: float = 0.7):
        """Add or update a skill."""
        self.skills[name] = Skill(
            name=name,
            proficiency=proficiency,
            verified=verified,
            last_assessed=datetime.now().isoformat(),
            confidence_score=confidence_score
        )
        self.updated_at = datetime.now().isoformat()

    def add_learning_activity(self, resource_title: str, resource_type: str, topic: str, 
                             time_spent_minutes: int, status: str = "completed"):
        """Add a completed learning activity and update XP."""
        activity = LearningActivity(
            resource_title=resource_title,
            resource_type=resource_type,
            topic=topic,
            completion_status=status,
            time_spent_minutes=time_spent_minutes,
            completion_date=datetime.now().isoformat() if status == "completed" else None
        )
        self.learning_activities.append(activity)
        
        if status == "completed":
            self._update_xp_and_level(time_spent_minutes)
            self._update_streak()
            self.weekly_hours_completed += time_spent_minutes / 60
            self._check_and_award_badges()
        
        self.updated_at = datetime.now().isoformat()

    def _update_xp_and_level(self, time_spent_minutes: int):
        """Update XP and level based on activity completion."""
        # XP calculation: base points + time bonus + type multiplier
        base_xp = 50  # base completion XP
        time_bonus = time_spent_minutes // 10  # 1 XP per 10 minutes
        self.total_xp += base_xp + time_bonus
        
        # Level calculation (simple formula)
        new_level = (self.total_xp // 500) + 1
        if new_level > self.level:
            self.level = new_level
            # Award level-up badge
            self._award_badge(f"Level {new_level}", f"Reached level {new_level}!", "Progress")

    def _update_streak(self):
        """Update learning streak."""
        today = datetime.now().date().isoformat()
        
        if not self.streak.last_activity_date:
            self.streak.current_streak = 1
            self.streak.longest_streak = 1
        else:
            last_date = datetime.fromisoformat(self.streak.last_activity_date).date()
            today_date = datetime.now().date()
            
            if (today_date - last_date).days == 1:
                # Consecutive day
                self.streak.current_streak += 1
                self.streak.longest_streak = max(self.streak.longest_streak, self.streak.current_streak)
            elif (today_date - last_date).days > 1:
                # Streak broken
                self.streak.current_streak = 1
        
        self.streak.last_activity_date = today

    def _check_and_award_badges(self):
        """Check and award badges based on achievements."""
        # First completion badge
        if len(self.learning_activities) == 1:
            self._award_badge("First Steps", "Completed your first learning activity!", "Special")
        
        # Activity count badges
        completed_count = len([a for a in self.learning_activities if a.completion_status == "completed"])
        if completed_count == 10 and not self._has_badge("Learning Enthusiast"):
            self._award_badge("Learning Enthusiast", "Completed 10 learning activities!", "Progress")
        elif completed_count == 50 and not self._has_badge("Knowledge Seeker"):
            self._award_badge("Knowledge Seeker", "Completed 50 learning activities!", "Progress")
        
        # Streak badges
        if self.streak.current_streak == 7 and not self._has_badge("Week Warrior"):
            self._award_badge("Week Warrior", "7-day learning streak!", "Consistency")
        elif self.streak.current_streak == 30 and not self._has_badge("Monthly Master"):
            self._award_badge("Monthly Master", "30-day learning streak!", "Consistency")

    def _award_badge(self, name: str, description: str, category: str):
        """Award a badge to the user."""
        badge = Badge(
            name=name,
            description=description,
            earned_date=datetime.now().isoformat(),
            category=category
        )
        self.badges.append(badge)

    def _has_badge(self, badge_name: str) -> bool:
        """Check if user already has a specific badge."""
        return any(badge.name == badge_name for badge in self.badges)

    def get_progress_summary(self) -> Dict:
        """Get comprehensive progress summary."""
        total_hours = sum(a.time_spent_minutes for a in self.learning_activities) / 60
        completed_activities = [a for a in self.learning_activities if a.completion_status == "completed"]
        
        return {
            "total_xp": self.total_xp,
            "level": self.level,
            "total_hours_learned": round(total_hours, 1),
            "activities_completed": len(completed_activities),
            "current_streak": self.streak.current_streak,
            "longest_streak": self.streak.longest_streak,
            "badges_earned": len(self.badges),
            "weekly_progress": {
                "goal_hours": self.weekly_goal_hours,
                "completed_hours": round(self.weekly_hours_completed, 1),
                "progress_percentage": min(100, int((self.weekly_hours_completed / self.weekly_goal_hours) * 100))
            }
        }

    def update_proficiency(self, skill_name: str, new_level: str):
        """Update proficiency of an existing skill."""
        if skill_name in self.skills:
            self.skills[skill_name].proficiency = new_level
            self.skills[skill_name].last_assessed = datetime.now().isoformat()
            self.updated_at = datetime.now().isoformat()
        else:
            raise ValueError(f"Skill {skill_name} not found.")

    def update_preferences(self, **kwargs):
        """Update learning preferences."""
        current_prefs = asdict(self.preferences)
        current_prefs.update(kwargs)
        self.preferences = LearningPreferences(**current_prefs)
        self.updated_at = datetime.now().isoformat()

    def update_goals(self, target_role: str = None, target_skills: List[str] = None, timeline: int = None):
        """Update career goals."""
        if not self.career_goal:
            self.career_goal = CareerGoal("", [], 0)
        
        if target_role: self.career_goal.target_role = target_role
        if target_skills: self.career_goal.target_skills = target_skills
        if timeline: self.career_goal.timeline_months = timeline
        self.updated_at = datetime.now().isoformat()

    def to_dict(self) -> Dict:
        """Serialize user profile to dictionary."""
        return {
            "user_id": self.user_id,
            "name": self.name,
            "email": self.email,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "skills": {k: asdict(v) for k, v in self.skills.items()},
            "career_goal": asdict(self.career_goal) if self.career_goal else None,
            "preferences": asdict(self.preferences),
            "availability": asdict(self.availability)
        }

    def to_json(self) -> str:
        """Serialize user profile to JSON string."""
        return json.dumps(self.to_dict(), indent=2)

    @classmethod
    def from_json(cls, json_str: str):
        """Create UserProfile from JSON string."""
        data = json.loads(json_str)
        
        # Flatten skills back to list for init
        skills_list = [v for k, v in data.get('skills', {}).items()]
        
        profile = cls(
            user_id=data['user_id'],
            name=data['name'],
            email=data['email'],
            current_skills=skills_list,
            goals=data.get('career_goal'),
            preferences=data.get('preferences'),
            availability=data.get('availability')
        )
        # Restore timestamps
        profile.created_at = data['created_at']
        profile.updated_at = data['updated_at']
        return profile


if __name__ == "__main__":
    # Test Usage
    print("Creating User Profile...")
    user = UserProfile(
        user_id="u123",
        name="Alex Dev",
        email="alex@example.com",
        current_skills=[
            {"name": "Python", "proficiency": "Intermediate"},
            {"name": "HTML", "proficiency": "Advanced"}
        ],
        goals={
            "target_role": "Full Stack Engineer",
            "target_skills": ["React", "Node.js", "AWS"],
            "timeline_months": 6
        },
        availability={
            "hours_per_week": 10,
            "preferred_days": ["Weekend"]
        }
    )

    print("\nInitial State (JSON):")
    print(user.to_json())

    print("\nUpdating Profile...")
    user.add_skill("CSS", "Intermediate")
    user.update_proficiency("Python", "Advanced")
    user.update_preferences(mentor_mode=True)

    print("\nUpdated State (JSON):")
    print(user.to_json())
