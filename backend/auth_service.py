"""
MongoDB-based Authentication Service
Handles user signup, login, and password management
"""

import uuid
import logging
from datetime import datetime, timezone
from passlib.context import CryptContext
from typing import Optional

logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self, db):
        self.db = db
    
    def hash_password(self, password: str) -> str:
        """Hash a password using bcrypt"""
        return pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    async def create_user(self, email: str, password: str, name: str, handle: str = None, phone: str = None) -> dict:
        """Create a new user account"""
        # Check if email already exists
        existing_user = await self.db.users.find_one({"email": email.lower()})
        if existing_user:
            raise ValueError("Email already registered")
        
        # Check if handle already exists (if provided)
        if handle:
            existing_handle = await self.db.users.find_one({"handle": handle.lower()})
            if existing_handle:
                raise ValueError("Handle already taken")
        
        # Generate unique ID and handle if not provided
        user_id = str(uuid.uuid4())
        if not handle:
            handle = email.split('@')[0].lower()
            # Ensure unique handle
            base_handle = handle
            counter = 1
            while await self.db.users.find_one({"handle": handle}):
                handle = f"{base_handle}{counter}"
                counter += 1
        
        # Hash password
        hashed_password = self.hash_password(password)
        
        # Create user document
        user = {
            "id": user_id,
            "email": email.lower(),
            "password": hashed_password,  # Store hashed password
            "name": name,
            "handle": handle.lower(),
            "phone": phone or "",  # Store phone number with country code
            "avatar": f"https://api.dicebear.com/7.x/avataaars/svg?seed={handle}",
            "bio": "",
            "isVerified": False,
            "online": False,
            "friends": [],
            "friendRequestsSent": [],
            "friendRequestsReceived": [],
            "followers": [],
            "following": [],
            "walletBalance": 1000,  # Initial wallet balance
            "onboardingComplete": True,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "updatedAt": datetime.now(timezone.utc).isoformat()
        }
        
        # Insert into MongoDB
        await self.db.users.insert_one(user)
        logger.info(f"✅ Created new user: {email} (ID: {user_id})")
        
        # Remove password from return object
        user.pop('password', None)
        user.pop('_id', None)
        return user
    
    async def authenticate_user(self, email: str, password: str) -> Optional[dict]:
        """Authenticate user with email and password"""
        # Find user by email
        user = await self.db.users.find_one({"email": email.lower()})
        if not user:
            logger.warning(f"❌ Login failed: User not found - {email}")
            return None
        
        # Verify password
        if not self.verify_password(password, user.get('password', '')):
            logger.warning(f"❌ Login failed: Invalid password - {email}")
            return None
        
        # Update last login and online status
        await self.db.users.update_one(
            {"id": user["id"]},
            {
                "$set": {
                    "online": True,
                    "lastLogin": datetime.now(timezone.utc).isoformat(),
                    "updatedAt": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        logger.info(f"✅ User authenticated: {email} (ID: {user['id']})")
        
        # Remove sensitive data
        user.pop('password', None)
        user.pop('_id', None)
        return user
    
    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        """Get user by ID"""
        user = await self.db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        return user
    
    async def get_user_by_email(self, email: str) -> Optional[dict]:
        """Get user by email"""
        user = await self.db.users.find_one({"email": email.lower()}, {"_id": 0, "password": 0})
        return user
    
    async def update_password(self, user_id: str, old_password: str, new_password: str) -> bool:
        """Update user password"""
        user = await self.db.users.find_one({"id": user_id})
        if not user:
            return False
        
        # Verify old password
        if not self.verify_password(old_password, user.get('password', '')):
            return False
        
        # Hash and update new password
        hashed_password = self.hash_password(new_password)
        await self.db.users.update_one(
            {"id": user_id},
            {"$set": {"password": hashed_password, "updatedAt": datetime.now(timezone.utc).isoformat()}}
        )
        
        logger.info(f"✅ Password updated for user: {user_id}")
        return True
    
    async def reset_password(self, email: str, new_password: str) -> bool:
        """Reset password (for forgot password flow)"""
        user = await self.db.users.find_one({"email": email.lower()})
        if not user:
            return False
        
        # Hash and update password
        hashed_password = self.hash_password(new_password)
        await self.db.users.update_one(
            {"id": user["id"]},
            {"$set": {"password": hashed_password, "updatedAt": datetime.now(timezone.utc).isoformat()}}
        )
        
        logger.info(f"✅ Password reset for user: {email}")
        return True
    
    async def set_user_offline(self, user_id: str):
        """Set user as offline"""
        await self.db.users.update_one(
            {"id": user_id},
            {"$set": {"online": False, "updatedAt": datetime.now(timezone.utc).isoformat()}}
        )
