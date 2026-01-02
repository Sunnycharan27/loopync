# Student Features Models and Constants
# Phase 1: Core Student Identity

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
import uuid

# ===== USER CATEGORIES =====
USER_CATEGORIES = [
    {"id": "student", "label": "Student", "icon": "🎓", "description": "Currently pursuing education"},
    {"id": "graduate", "label": "Graduate", "icon": "📜", "description": "Recently graduated"},
    {"id": "working_professional", "label": "Working Professional", "icon": "💼", "description": "Currently employed"},
    {"id": "creator", "label": "Creator", "icon": "🎨", "description": "Content creator / Artist"},
    {"id": "influencer", "label": "Influencer", "icon": "⭐", "description": "Social media influencer"},
    {"id": "entrepreneur", "label": "Entrepreneur", "icon": "🚀", "description": "Building a startup"},
    {"id": "freelancer", "label": "Freelancer", "icon": "💻", "description": "Self-employed professional"},
    {"id": "mentor", "label": "Mentor", "icon": "🧠", "description": "Guiding others"},
    {"id": "recruiter", "label": "Recruiter", "icon": "🔍", "description": "Hiring talent"},
    {"id": "other", "label": "Other", "icon": "👤", "description": "Something else"}
]

# ===== INTERESTS =====
INTERESTS = [
    # Tech & Programming
    {"id": "web_development", "label": "Web Development", "icon": "🌐", "category": "tech"},
    {"id": "mobile_development", "label": "Mobile Development", "icon": "📱", "category": "tech"},
    {"id": "ai_ml", "label": "AI & Machine Learning", "icon": "🤖", "category": "tech"},
    {"id": "data_science", "label": "Data Science", "icon": "📊", "category": "tech"},
    {"id": "cybersecurity", "label": "Cybersecurity", "icon": "🔒", "category": "tech"},
    {"id": "cloud_computing", "label": "Cloud Computing", "icon": "☁️", "category": "tech"},
    {"id": "blockchain", "label": "Blockchain & Web3", "icon": "⛓️", "category": "tech"},
    {"id": "game_development", "label": "Game Development", "icon": "🎮", "category": "tech"},
    {"id": "devops", "label": "DevOps", "icon": "⚙️", "category": "tech"},
    {"id": "iot", "label": "IoT & Hardware", "icon": "🔌", "category": "tech"},
    
    # Design & Creative
    {"id": "ui_ux_design", "label": "UI/UX Design", "icon": "🎨", "category": "design"},
    {"id": "graphic_design", "label": "Graphic Design", "icon": "🖼️", "category": "design"},
    {"id": "video_editing", "label": "Video Editing", "icon": "🎬", "category": "design"},
    {"id": "photography", "label": "Photography", "icon": "📷", "category": "design"},
    {"id": "3d_modeling", "label": "3D Modeling", "icon": "🎭", "category": "design"},
    
    # Business & Entrepreneurship
    {"id": "startups", "label": "Startups", "icon": "🚀", "category": "business"},
    {"id": "marketing", "label": "Marketing", "icon": "📈", "category": "business"},
    {"id": "finance", "label": "Finance & Fintech", "icon": "💰", "category": "business"},
    {"id": "product_management", "label": "Product Management", "icon": "📋", "category": "business"},
    {"id": "entrepreneurship", "label": "Entrepreneurship", "icon": "💡", "category": "business"},
    
    # Academic & Research
    {"id": "research", "label": "Research", "icon": "🔬", "category": "academic"},
    {"id": "competitive_programming", "label": "Competitive Programming", "icon": "🏆", "category": "academic"},
    {"id": "open_source", "label": "Open Source", "icon": "🌍", "category": "academic"},
    {"id": "hackathons", "label": "Hackathons", "icon": "⚡", "category": "academic"},
    {"id": "certifications", "label": "Certifications", "icon": "📜", "category": "academic"},
    
    # Soft Skills & Career
    {"id": "public_speaking", "label": "Public Speaking", "icon": "🎤", "category": "career"},
    {"id": "networking", "label": "Networking", "icon": "🤝", "category": "career"},
    {"id": "leadership", "label": "Leadership", "icon": "👑", "category": "career"},
    {"id": "internships", "label": "Internships", "icon": "🎯", "category": "career"},
    {"id": "placements", "label": "Placements", "icon": "📝", "category": "career"},
    
    # Lifestyle & Hobbies
    {"id": "music", "label": "Music", "icon": "🎵", "category": "lifestyle"},
    {"id": "fitness", "label": "Fitness", "icon": "💪", "category": "lifestyle"},
    {"id": "travel", "label": "Travel", "icon": "✈️", "category": "lifestyle"},
    {"id": "reading", "label": "Reading", "icon": "📚", "category": "lifestyle"},
    {"id": "gaming", "label": "Gaming", "icon": "🎮", "category": "lifestyle"}
]

# ===== SKILLS (Tech-focused for students) =====
SKILLS = [
    # Programming Languages
    {"id": "python", "label": "Python", "category": "language"},
    {"id": "javascript", "label": "JavaScript", "category": "language"},
    {"id": "typescript", "label": "TypeScript", "category": "language"},
    {"id": "java", "label": "Java", "category": "language"},
    {"id": "cpp", "label": "C++", "category": "language"},
    {"id": "c", "label": "C", "category": "language"},
    {"id": "csharp", "label": "C#", "category": "language"},
    {"id": "go", "label": "Go", "category": "language"},
    {"id": "rust", "label": "Rust", "category": "language"},
    {"id": "kotlin", "label": "Kotlin", "category": "language"},
    {"id": "swift", "label": "Swift", "category": "language"},
    {"id": "php", "label": "PHP", "category": "language"},
    {"id": "ruby", "label": "Ruby", "category": "language"},
    {"id": "sql", "label": "SQL", "category": "language"},
    
    # Frontend
    {"id": "react", "label": "React", "category": "frontend"},
    {"id": "vue", "label": "Vue.js", "category": "frontend"},
    {"id": "angular", "label": "Angular", "category": "frontend"},
    {"id": "nextjs", "label": "Next.js", "category": "frontend"},
    {"id": "html_css", "label": "HTML/CSS", "category": "frontend"},
    {"id": "tailwind", "label": "Tailwind CSS", "category": "frontend"},
    {"id": "sass", "label": "SASS/SCSS", "category": "frontend"},
    
    # Backend
    {"id": "nodejs", "label": "Node.js", "category": "backend"},
    {"id": "express", "label": "Express.js", "category": "backend"},
    {"id": "fastapi", "label": "FastAPI", "category": "backend"},
    {"id": "django", "label": "Django", "category": "backend"},
    {"id": "flask", "label": "Flask", "category": "backend"},
    {"id": "spring", "label": "Spring Boot", "category": "backend"},
    {"id": "dotnet", "label": ".NET", "category": "backend"},
    {"id": "graphql", "label": "GraphQL", "category": "backend"},
    {"id": "rest_api", "label": "REST APIs", "category": "backend"},
    
    # Mobile
    {"id": "react_native", "label": "React Native", "category": "mobile"},
    {"id": "flutter", "label": "Flutter", "category": "mobile"},
    {"id": "android", "label": "Android", "category": "mobile"},
    {"id": "ios", "label": "iOS", "category": "mobile"},
    
    # Database
    {"id": "mongodb", "label": "MongoDB", "category": "database"},
    {"id": "postgresql", "label": "PostgreSQL", "category": "database"},
    {"id": "mysql", "label": "MySQL", "category": "database"},
    {"id": "redis", "label": "Redis", "category": "database"},
    {"id": "firebase", "label": "Firebase", "category": "database"},
    
    # Cloud & DevOps
    {"id": "aws", "label": "AWS", "category": "cloud"},
    {"id": "gcp", "label": "Google Cloud", "category": "cloud"},
    {"id": "azure", "label": "Azure", "category": "cloud"},
    {"id": "docker", "label": "Docker", "category": "cloud"},
    {"id": "kubernetes", "label": "Kubernetes", "category": "cloud"},
    {"id": "cicd", "label": "CI/CD", "category": "cloud"},
    {"id": "git", "label": "Git", "category": "cloud"},
    
    # AI/ML
    {"id": "tensorflow", "label": "TensorFlow", "category": "ai_ml"},
    {"id": "pytorch", "label": "PyTorch", "category": "ai_ml"},
    {"id": "scikit_learn", "label": "Scikit-learn", "category": "ai_ml"},
    {"id": "opencv", "label": "OpenCV", "category": "ai_ml"},
    {"id": "nlp", "label": "NLP", "category": "ai_ml"},
    {"id": "computer_vision", "label": "Computer Vision", "category": "ai_ml"},
    {"id": "deep_learning", "label": "Deep Learning", "category": "ai_ml"},
    
    # Design
    {"id": "figma", "label": "Figma", "category": "design"},
    {"id": "adobe_xd", "label": "Adobe XD", "category": "design"},
    {"id": "photoshop", "label": "Photoshop", "category": "design"},
    {"id": "illustrator", "label": "Illustrator", "category": "design"},
    {"id": "blender", "label": "Blender", "category": "design"},
    
    # Other
    {"id": "blockchain", "label": "Blockchain", "category": "other"},
    {"id": "solidity", "label": "Solidity", "category": "other"},
    {"id": "unity", "label": "Unity", "category": "other"},
    {"id": "unreal", "label": "Unreal Engine", "category": "other"},
    {"id": "linux", "label": "Linux", "category": "other"},
    {"id": "agile", "label": "Agile/Scrum", "category": "other"}
]

# ===== PROJECT STATUS =====
PROJECT_STATUS = [
    {"id": "idea", "label": "Idea", "color": "yellow"},
    {"id": "in_progress", "label": "In Progress", "color": "blue"},
    {"id": "completed", "label": "Completed", "color": "green"},
    {"id": "on_hold", "label": "On Hold", "color": "gray"}
]

# ===== TEAM ROLES =====
TEAM_ROLES = [
    {"id": "frontend", "label": "Frontend Developer", "icon": "🖥️"},
    {"id": "backend", "label": "Backend Developer", "icon": "⚙️"},
    {"id": "fullstack", "label": "Full Stack Developer", "icon": "💻"},
    {"id": "mobile", "label": "Mobile Developer", "icon": "📱"},
    {"id": "ui_ux", "label": "UI/UX Designer", "icon": "🎨"},
    {"id": "ml_engineer", "label": "ML Engineer", "icon": "🤖"},
    {"id": "data_scientist", "label": "Data Scientist", "icon": "📊"},
    {"id": "devops", "label": "DevOps Engineer", "icon": "🔧"},
    {"id": "product_manager", "label": "Product Manager", "icon": "📋"},
    {"id": "marketing", "label": "Marketing", "icon": "📈"},
    {"id": "content_writer", "label": "Content Writer", "icon": "✍️"},
    {"id": "video_editor", "label": "Video Editor", "icon": "🎬"},
    {"id": "other", "label": "Other", "icon": "👤"}
]

# ===== PYDANTIC MODELS =====

class StudentProfile(BaseModel):
    """Extended student profile data"""
    model_config = ConfigDict(extra="ignore")
    userId: str
    userCategory: str = "student"  # student, graduate, creator, etc.
    
    # Education
    collegeName: str = ""
    branch: str = ""  # e.g., Computer Science, Electronics
    graduationYear: str = ""  # e.g., "2025"
    degree: str = ""  # e.g., B.Tech, M.Tech, BCA
    
    # Academic Bio
    academicBio: str = ""  # Academic focus description
    
    # Skills & Interests
    skills: List[str] = Field(default_factory=list)  # Skill IDs
    customSkills: List[str] = Field(default_factory=list)  # User-added skills
    interests: List[str] = Field(default_factory=list)  # Interest IDs
    
    # Stats (computed)
    projectsCount: int = 0
    certificationsCount: int = 0
    teamParticipations: int = 0
    
    # Reputation
    reputationScore: int = 0
    
    # Visibility
    isPublic: bool = True
    showEducation: bool = True
    showSkills: bool = True
    showProjects: bool = True
    showCertifications: bool = True
    
    # Links
    githubUrl: str = ""
    linkedinUrl: str = ""
    portfolioUrl: str = ""
    resumeUrl: str = ""
    
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class StudentProfileCreate(BaseModel):
    userCategory: str
    collegeName: str = ""
    branch: str = ""
    graduationYear: str = ""
    degree: str = ""
    academicBio: str = ""
    skills: List[str] = []
    customSkills: List[str] = []
    interests: List[str] = []
    isPublic: bool = True
    githubUrl: str = ""
    linkedinUrl: str = ""
    portfolioUrl: str = ""


class StudentProfileUpdate(BaseModel):
    userCategory: Optional[str] = None
    collegeName: Optional[str] = None
    branch: Optional[str] = None
    graduationYear: Optional[str] = None
    degree: Optional[str] = None
    academicBio: Optional[str] = None
    skills: Optional[List[str]] = None
    customSkills: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    isPublic: Optional[bool] = None
    showEducation: Optional[bool] = None
    showSkills: Optional[bool] = None
    showProjects: Optional[bool] = None
    showCertifications: Optional[bool] = None
    githubUrl: Optional[str] = None
    linkedinUrl: Optional[str] = None
    portfolioUrl: Optional[str] = None
    resumeUrl: Optional[str] = None


class Certification(BaseModel):
    """Certification post model"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    
    # Certificate details
    title: str  # e.g., "AWS Solutions Architect"
    issuer: str  # e.g., "Amazon Web Services"
    issueDate: str = ""  # ISO date
    expiryDate: Optional[str] = None
    credentialId: str = ""
    credentialUrl: str = ""  # Verification link
    
    # Media
    certificateImage: str = ""  # Image URL
    certificatePdf: str = ""  # PDF URL
    
    # Skills & Tags
    skills: List[str] = Field(default_factory=list)
    
    # Stats
    likes: List[str] = Field(default_factory=list)
    likeCount: int = 0
    comments: int = 0
    shares: int = 0
    
    # Visibility
    isPublic: bool = True
    
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CertificationCreate(BaseModel):
    title: str
    issuer: str
    issueDate: str = ""
    expiryDate: Optional[str] = None
    credentialId: str = ""
    credentialUrl: str = ""
    certificateImage: str = ""
    certificatePdf: str = ""
    skills: List[str] = []
    isPublic: bool = True


class Project(BaseModel):
    """Project post model"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    
    # Project details
    title: str
    description: str = ""
    shortDescription: str = ""  # One-liner
    
    # Status
    status: str = "in_progress"  # idea, in_progress, completed, on_hold
    
    # Links
    githubUrl: str = ""
    demoUrl: str = ""
    liveUrl: str = ""
    videoUrl: str = ""  # Demo video
    
    # Media
    coverImage: str = ""
    imageUrl: str = ""
    screenshots: List[str] = Field(default_factory=list)
    
    # Skills & Tags
    skills: List[str] = Field(default_factory=list)
    techStack: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    
    # Team (for collaborative projects)
    teamMembers: List[str] = Field(default_factory=list)  # User IDs
    isTeamProject: bool = False
    lookingForMembers: bool = False
    memberRoles: List[str] = Field(default_factory=list)
    
    # Is this a startup?
    isStartup: bool = False
    startupStage: str = ""  # idea, mvp, launched
    
    # Tribe association
    tribeId: Optional[str] = None
    author: Optional[dict] = None
    authorId: Optional[str] = None
    
    # Stats
    likes: List[str] = Field(default_factory=list)
    likeCount: int = 0
    comments: List[dict] = Field(default_factory=list)
    saves: int = 0  # Bookmarks
    views: int = 0
    interestedUsers: List[str] = Field(default_factory=list)  # Users who expressed interest
    
    # Visibility
    isPublic: bool = True
    isFeatured: bool = False
    
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ProjectCreate(BaseModel):
    title: str
    description: str = ""
    shortDescription: str = ""
    status: str = "in_progress"
    githubUrl: str = ""
    demoUrl: str = ""
    liveUrl: str = ""
    videoUrl: str = ""
    coverImage: str = ""
    imageUrl: str = ""
    screenshots: List[str] = []
    skills: List[str] = []
    techStack: List[str] = []
    tags: List[str] = []
    isTeamProject: bool = False
    teamMembers: List[str] = []
    isStartup: bool = False
    startupStage: str = ""
    isPublic: bool = True
    lookingForMembers: bool = False
    memberRoles: List[str] = []
    tribeId: Optional[str] = None
    author: Optional[dict] = None
    authorId: Optional[str] = None


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    shortDescription: Optional[str] = None
    status: Optional[str] = None
    githubUrl: Optional[str] = None
    demoUrl: Optional[str] = None
    liveUrl: Optional[str] = None
    videoUrl: Optional[str] = None
    coverImage: Optional[str] = None
    imageUrl: Optional[str] = None
    screenshots: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    techStack: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    isTeamProject: Optional[bool] = None
    teamMembers: Optional[List[str]] = None
    lookingForMembers: Optional[bool] = None
    memberRoles: Optional[List[str]] = None
    isStartup: Optional[bool] = None
    startupStage: Optional[str] = None
    isPublic: Optional[bool] = None
    tribeId: Optional[str] = None


class TeamPost(BaseModel):
    """Team formation / Looking for team post"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    
    # Project/Idea info
    projectTitle: str
    projectDescription: str = ""
    projectId: Optional[str] = None  # Link to existing project
    
    # Requirements
    requiredRoles: List[dict] = Field(default_factory=list)  # [{roleId, count, description}]
    requiredSkills: List[str] = Field(default_factory=list)
    
    # Timeline
    commitmentLevel: str = "part_time"  # full_time, part_time, flexible
    duration: str = ""  # e.g., "3 months", "Ongoing"
    startDate: str = ""
    
    # Contact
    contactMethod: str = "dm"  # dm, email, discord
    contactInfo: str = ""
    
    # Status
    status: str = "open"  # open, closed, filled
    
    # Applications
    applications: List[dict] = Field(default_factory=list)  # [{userId, roleId, message, status, createdAt}]
    teamMembers: List[dict] = Field(default_factory=list)  # [{userId, roleId, joinedAt}]
    
    # Stats
    views: int = 0
    applicationCount: int = 0
    
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class TeamPostCreate(BaseModel):
    projectTitle: str
    projectDescription: str = ""
    projectId: Optional[str] = None
    requiredRoles: List[dict] = []
    requiredSkills: List[str] = []
    commitmentLevel: str = "part_time"
    duration: str = ""
    startDate: str = ""
    contactMethod: str = "dm"
    contactInfo: str = ""


class TeamApplication(BaseModel):
    """Application to join a team"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    teamPostId: str
    userId: str
    roleId: str
    message: str = ""
    status: str = "pending"  # pending, accepted, rejected
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Comment(BaseModel):
    """Comment on certifications/projects"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    contentType: str  # certification, project, team_post
    contentId: str
    text: str
    parentId: Optional[str] = None  # For nested comments
    likes: List[str] = Field(default_factory=list)
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
