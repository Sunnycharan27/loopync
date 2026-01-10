"""
Authentication routes for Loopync API
Handles user signup, login, password reset, and verification
"""
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime, timezone, timedelta
import random
import jwt
import os
import logging

from .deps import get_db, get_current_user, security

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Request/Response Models
class SignupRequest(BaseModel):
    email: str
    password: str
    name: str
    handle: Optional[str] = None
    phone: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    
    @field_validator('password')
    @classmethod
    def strip_password_whitespace(cls, v: str) -> str:
        return v.strip() if v else v

class ChangePasswordRequest(BaseModel):
    userId: str
    currentPassword: str
    newPassword: str

class EmailVerificationRequest(BaseModel):
    email: str
    code: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    newPassword: str


def create_access_token(user_id: str) -> str:
    """Create a JWT access token for a user"""
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        'sub': user_id,
        'exp': expiration,
        'iat': datetime.now(timezone.utc)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token


@router.get("/check-handle/{handle}")
async def check_handle_availability(handle: str):
    """Check if a username/handle is available"""
    db = get_db()
    existing = await db.users.find_one({"handle": handle}, {"_id": 0})
    return {
        "available": existing is None,
        "handle": handle
    }


@router.post("/signup", response_model=dict)
async def signup(request: Request, req: SignupRequest):
    """Create a new user account with email and password"""
    from auth_service import AuthService
    
    db = get_db()
    auth_service = AuthService(db)
    
    try:
        user = await auth_service.create_user(
            email=req.email,
            password=req.password,
            name=req.name,
            handle=req.handle,
            phone=req.phone
        )
        
        token = create_access_token(user['id'])
        logger.info(f"✅ New user signed up: {req.email}")
        
        return {
            "token": token,
            "user": user,
            "message": "Account created successfully!"
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(status_code=500, detail="Signup failed")


@router.post("/login", response_model=dict)
async def login(request: Request, req: LoginRequest):
    """Login with email and password"""
    from auth_service import AuthService
    
    db = get_db()
    auth_service = AuthService(db)
    
    try:
        user = await auth_service.authenticate_user(req.email, req.password)
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Handle demo user test data setup
        if req.email == 'demo@loopync.com':
            user = await _setup_demo_user(db, auth_service, user)
        
        token = create_access_token(user['id'])
        
        return {
            "token": token,
            "user": user
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")


async def _setup_demo_user(db, auth_service, user: dict) -> dict:
    """Setup demo user with test friends and wallet balance"""
    current_friends = user.get('friends', [])
    
    if len(current_friends) == 0:
        logger.info("🔧 Creating test friends for demo user...")
        
        test_users = [
            {"id": "test_user_1", "name": "Alice Johnson", "email": "alice@test.com", "handle": "alice", "password": "test123"},
            {"id": "test_user_2", "name": "Bob Smith", "email": "bob@test.com", "handle": "bob", "password": "test123"},
            {"id": "test_user_3", "name": "Charlie Brown", "email": "charlie@test.com", "handle": "charlie", "password": "test123"}
        ]
        
        updated_friends = []
        for test_user_data in test_users:
            existing = await db.users.find_one({"id": test_user_data["id"]}, {"_id": 0})
            if not existing:
                test_user = {
                    "id": test_user_data["id"],
                    "handle": test_user_data["handle"],
                    "name": test_user_data["name"],
                    "email": test_user_data["email"],
                    "password": auth_service.hash_password(test_user_data["password"]),
                    "avatar": f"https://api.dicebear.com/7.x/avataaars/svg?seed={test_user_data['handle']}",
                    "isVerified": True,
                    "online": False,
                    "friends": [user['id']],
                    "friendRequestsSent": [],
                    "friendRequestsReceived": [],
                    "bio": "Test user for demo purposes",
                    "walletBalance": 1000.0,
                    "onboardingComplete": True,
                    "createdAt": datetime.now(timezone.utc).isoformat()
                }
                await db.users.insert_one(test_user)
                logger.info(f"✅ Created test user: {test_user_data['name']}")
            else:
                if user['id'] not in existing.get('friends', []):
                    await db.users.update_one(
                        {"id": test_user_data["id"]},
                        {"$addToSet": {"friends": user['id']}}
                    )
            
            updated_friends.append(test_user_data["id"])
        
        if updated_friends:
            await db.users.update_one(
                {"id": user['id']},
                {"$set": {"friends": updated_friends}}
            )
            user['friends'] = updated_friends
            logger.info(f"✅ Demo user now has {len(updated_friends)} friends")
    
    # Ensure demo user has sufficient wallet balance
    if user.get('walletBalance', 0) < 5000:
        await db.users.update_one(
            {"id": user['id']},
            {"$set": {"walletBalance": 10000.0}}
        )
        user['walletBalance'] = 10000.0
        logger.info("💰 Demo user wallet topped up to ₹10,000")
    
    return user


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get the current authenticated user's profile"""
    return current_user


@router.post("/change-password")
async def change_password(data: ChangePasswordRequest):
    """Change user password"""
    from passlib.hash import bcrypt
    
    db = get_db()
    user = await db.users.find_one({"id": data.userId}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not bcrypt.verify(data.currentPassword, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    new_password_hash = bcrypt.hash(data.newPassword)
    await db.users.update_one(
        {"id": data.userId},
        {"$set": {"password": new_password_hash}}
    )
    
    return {"success": True, "message": "Password changed successfully"}


@router.post("/verify-email")
async def verify_email(data: EmailVerificationRequest):
    """Verify email with code"""
    db = get_db()
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("verificationCode") != data.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    await db.users.update_one(
        {"email": data.email},
        {"$set": {"isVerified": True, "verificationCode": None}}
    )
    
    return {"success": True, "message": "Email verified successfully"}


@router.post("/resend-verification")
async def resend_verification(data: dict):
    """Resend verification code"""
    db = get_db()
    email = data.get("email")
    
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("isVerified"):
        raise HTTPException(status_code=400, detail="Email already verified")
    
    verification_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    await db.users.update_one(
        {"email": email},
        {"$set": {"verificationCode": verification_code}}
    )
    
    # Mock email - log to console
    print(f"\n=== VERIFICATION EMAIL ===\nTo: {email}\nCode: {verification_code}\n========================\n")
    
    return {
        "success": True,
        "message": "Verification code sent",
        "code": verification_code  # Only for testing
    }


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    """Request password reset"""
    db = get_db()
    email = data.email
    
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        return {"success": True, "message": "If the email exists, a reset code will be sent"}
    
    reset_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    expires = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
    
    await db.users.update_one(
        {"email": email},
        {"$set": {"resetPasswordToken": reset_code, "resetPasswordExpires": expires}}
    )
    
    print(f"\n=== PASSWORD RESET EMAIL ===\nTo: {email}\nCode: {reset_code}\nExpires: {expires}\n===========================\n")
    
    return {
        "success": True,
        "message": "If the email exists, a reset code will be sent",
        "code": reset_code  # Only for testing
    }


@router.post("/verify-reset-code")
async def verify_reset_code(data: dict):
    """Verify password reset code"""
    db = get_db()
    email = data.get("email")
    code = data.get("code")
    
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("resetPasswordToken") != code:
        raise HTTPException(status_code=400, detail="Invalid reset code")
    
    if user.get("resetPasswordExpires"):
        expires = datetime.fromisoformat(user.get("resetPasswordExpires"))
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(status_code=400, detail="Reset code has expired")
    
    return {"success": True, "message": "Code verified", "token": code}


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    """Reset password with verified code"""
    from passlib.hash import bcrypt
    
    db = get_db()
    
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("resetPasswordToken") != data.code:
        raise HTTPException(status_code=400, detail="Invalid reset code")
    
    if user.get("resetPasswordExpires"):
        expires = datetime.fromisoformat(user.get("resetPasswordExpires"))
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(status_code=400, detail="Reset code has expired")
    
    new_password_hash = bcrypt.hash(data.newPassword)
    
    await db.users.update_one(
        {"email": data.email},
        {"$set": {
            "password": new_password_hash,
            "resetPasswordToken": None,
            "resetPasswordExpires": None
        }}
    )
    
    return {"success": True, "message": "Password reset successfully"}
