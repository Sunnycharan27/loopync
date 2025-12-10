"""
Models for Verification System and Special Pages
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid

# ===== ENUMS =====

class AccountType(str, Enum):
    PERSONAL = "personal"  # Regular user
    CREATOR = "creator"  # Creator profile
    PUBLIC_FIGURE = "public_figure"  # Verified celebrity/influencer/politician
    BUSINESS = "business"  # Verified company/brand

class VerificationStatus(str, Enum):
    NONE = "none"  # Not requested
    PENDING = "pending"  # Submitted, awaiting review
    APPROVED = "approved"  # Verified
    REJECTED = "rejected"  # Denied
    SUSPENDED = "suspended"  # Verification revoked

class PageCategory(str, Enum):
    CELEBRITY = "celebrity"
    INFLUENCER = "influencer"
    POLITICIAN = "politician"
    COMPANY = "company"
    BRAND = "brand"
    MEDIA = "media"
    ORGANIZATION = "organization"
    PUBLIC_FIGURE = "public_figure"

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"

# ===== VERIFICATION REQUEST MODEL =====

class VerificationRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    accountType: AccountType
    
    # User submitted data
    fullName: str
    email: EmailStr
    phone: Optional[str] = None
    
    # Documents
    aadhaarCardUrl: Optional[str] = None  # Uploaded Aadhaar card
    selfieUrl: Optional[str] = None  # Selfie with Aadhaar
    websiteUrl: Optional[str] = None  # Official website (optional)
    socialMediaLinks: List[str] = Field(default_factory=list)  # FB, Instagram, Twitter links
    
    # Business specific
    businessName: Optional[str] = None
    businessRegistrationNumber: Optional[str] = None
    businessRegistrationDocUrl: Optional[str] = None
    
    # Page details
    pageCategory: Optional[PageCategory] = None
    aboutText: Optional[str] = None
    
    # Status
    status: VerificationStatus = VerificationStatus.PENDING
    submittedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    reviewedAt: Optional[str] = None
    reviewedBy: Optional[str] = None  # Admin user ID
    rejectionReason: Optional[str] = None
    
    # Notes
    adminNotes: Optional[str] = None

class VerificationRequestCreate(BaseModel):
    accountType: AccountType
    fullName: str
    email: EmailStr
    phone: Optional[str] = None
    websiteUrl: Optional[str] = None
    socialMediaLinks: List[str] = Field(default_factory=list)
    businessName: Optional[str] = None
    businessRegistrationNumber: Optional[str] = None
    pageCategory: Optional[PageCategory] = None
    aboutText: Optional[str] = None

class VerificationReview(BaseModel):
    status: VerificationStatus  # APPROVED or REJECTED
    rejectionReason: Optional[str] = None
    adminNotes: Optional[str] = None

# ===== PAGE MODEL =====

class Page(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str  # Owner user ID
    
    # Basic info
    pageName: str
    handle: str  # @handle
    accountType: AccountType
    category: PageCategory
    
    # Media
    avatar: str = "https://api.dicebear.com/7.x/avataaars/svg?seed=default"
    bannerImage: Optional[str] = None
    
    # Content
    about: str = ""
    bio: str = ""
    
    # Contact & Links
    email: Optional[str] = None
    phone: Optional[str] = None
    websiteUrl: Optional[str] = None
    location: Optional[str] = None
    
    # Social media
    socialMediaLinks: Dict[str, str] = Field(default_factory=dict)  # {platform: url}
    
    # Verification
    isVerified: bool = False
    verifiedAt: Optional[str] = None
    
    # Stats
    followerCount: int = 0
    postCount: int = 0
    
    # Timestamps
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PageCreate(BaseModel):
    pageName: str
    handle: str
    accountType: AccountType
    category: PageCategory
    about: str = ""
    bio: str = ""
    email: Optional[str] = None
    phone: Optional[str] = None
    websiteUrl: Optional[str] = None
    location: Optional[str] = None
    socialMediaLinks: Dict[str, str] = Field(default_factory=dict)

class PageUpdate(BaseModel):
    pageName: Optional[str] = None
    about: Optional[str] = None
    bio: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    websiteUrl: Optional[str] = None
    location: Optional[str] = None
    socialMediaLinks: Optional[Dict[str, str]] = None
    bannerImage: Optional[str] = None
    avatar: Optional[str] = None

# ===== ANALYTICS MODEL =====

class PageAnalytics(BaseModel):
    pageId: str
    date: str  # YYYY-MM-DD
    
    # Follower metrics
    followersGained: int = 0
    followersLost: int = 0
    totalFollowers: int = 0
    
    # Engagement metrics
    likes: int = 0
    comments: int = 0
    shares: int = 0
    views: int = 0
    
    # Post metrics
    postsCreated: int = 0
    
    # Demographics
    topLocations: List[str] = Field(default_factory=list)
    ageGroups: Dict[str, int] = Field(default_factory=dict)  # {"18-24": 100, "25-34": 200}
    genderDistribution: Dict[str, int] = Field(default_factory=dict)  # {"male": 60, "female": 40}

# ===== 2FA MODEL =====

class TwoFactorAuth(BaseModel):
    userId: str
    email: str
    otpCode: str
    expiresAt: str  # ISO timestamp
    verified: bool = False
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TwoFactorRequest(BaseModel):
    email: EmailStr

class TwoFactorVerify(BaseModel):
    email: EmailStr
    otpCode: str

# ===== ADMIN ACTIONS =====

class AdminAssignRole(BaseModel):
    userId: str
    role: UserRole

class AdminVerificationAction(BaseModel):
    action: str  # "approve", "reject", "suspend"
    reason: Optional[str] = None
