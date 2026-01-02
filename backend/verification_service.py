"""
Verification Service - Handles all verification-related logic
"""
import os
import logging
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone, timedelta
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

class VerificationService:
    def __init__(self, db):
        self.db = db
        
    async def submit_verification_request(self, user_id: str, request_data: dict) -> dict:
        """Submit a new verification request"""
        try:
            # Check if user already has a pending request
            existing = await self.db.verification_requests.find_one({
                "userId": user_id,
                "status": {"$in": ["pending", "approved"]}
            })
            
            if existing:
                if existing.get("status") == "approved":
                    return {"success": False, "message": "Account is already verified"}
                else:
                    return {"success": False, "message": "You already have a pending verification request"}
            
            # Create verification request
            request_data["userId"] = user_id
            request_data["status"] = "pending"
            request_data["submittedAt"] = datetime.now(timezone.utc).isoformat()
            
            await self.db.verification_requests.insert_one(request_data)
            
            # Update user verification status
            await self.db.users.update_one(
                {"id": user_id},
                {"$set": {"verificationStatus": "pending"}}
            )
            
            return {"success": True, "message": "Verification request submitted successfully"}
            
        except Exception as e:
            logger.error(f"Error submitting verification request: {e}")
            return {"success": False, "message": str(e)}
    
    async def get_pending_requests(self, skip: int = 0, limit: int = 50):
        """Get all pending verification requests for admin"""
        try:
            cursor = self.db.verification_requests.find(
                {"status": "pending"},
                {"_id": 0}
            ).sort("submittedAt", -1).skip(skip).limit(limit)
            
            requests = await cursor.to_list(length=limit)
            
            # Fetch user info for each request
            for req in requests:
                user = await self.db.users.find_one({"id": req["userId"]}, {"_id": 0})
                if user:
                    req["userInfo"] = {
                        "name": user.get("name"),
                        "handle": user.get("handle"),
                        "avatar": user.get("avatar"),
                        "email": user.get("email")
                    }
            
            total = await self.db.verification_requests.count_documents({"status": "pending"})
            
            return {
                "success": True,
                "requests": requests,
                "total": total,
                "page": skip // limit + 1,
                "totalPages": (total + limit - 1) // limit
            }
            
        except Exception as e:
            logger.error(f"Error fetching verification requests: {e}")
            return {"success": False, "message": str(e)}
    
    async def review_verification(self, request_id: str, admin_id: str, review_data: dict):
        """Approve or reject a verification request"""
        try:
            status = review_data.get("status")  # "approved" or "rejected"
            
            if status not in ["approved", "rejected"]:
                return {"success": False, "message": "Invalid status"}
            
            # Get the verification request
            request = await self.db.verification_requests.find_one({"id": request_id}, {"_id": 0})
            if not request:
                return {"success": False, "message": "Verification request not found"}
            
            user_id = request["userId"]
            
            # Get user info
            user = await self.db.users.find_one({"id": user_id}, {"_id": 0})
            if not user:
                return {"success": False, "message": "User not found"}
            
            # Update verification request
            update_data = {
                "status": status,
                "reviewedAt": datetime.now(timezone.utc).isoformat(),
                "reviewedBy": admin_id,
                "rejectionReason": review_data.get("rejectionReason"),
                "adminNotes": review_data.get("adminNotes")
            }
            
            await self.db.verification_requests.update_one(
                {"id": request_id},
                {"$set": update_data}
            )
            
            # Update user account
            if status == "approved":
                # Create Page for verified user
                page_data = {
                    "id": f"page_{user_id}",
                    "userId": user_id,
                    "pageName": request.get("fullName") or request.get("businessName"),
                    "handle": user.get("handle", ""),
                    "accountType": request["accountType"],
                    "category": request.get("pageCategory", "public_figure"),
                    "about": request.get("aboutText", ""),
                    "bio": request.get("aboutText", "")[:160] if request.get("aboutText") else "",
                    "email": request.get("email"),
                    "phone": request.get("phone"),
                    "websiteUrl": request.get("websiteUrl"),
                    "socialMediaLinks": {link: link for link in request.get("socialMediaLinks", [])},
                    "isVerified": True,
                    "verifiedAt": datetime.now(timezone.utc).isoformat(),
                    "followerCount": 0,
                    "postCount": 0,
                    "createdAt": datetime.now(timezone.utc).isoformat(),
                    "updatedAt": datetime.now(timezone.utc).isoformat()
                }
                
                # Get user's avatar
                if user.get("avatar"):
                    page_data["avatar"] = user["avatar"]
                
                await self.db.pages.insert_one(page_data)
                
                # Update user
                await self.db.users.update_one(
                    {"id": user_id},
                    {"$set": {
                        "isVerified": True,
                        "verificationStatus": "approved",
                        "accountType": request["accountType"],
                        "pageId": page_data["id"]
                    }}
                )
                
                message = "Verification approved successfully! Page created."
            else:
                # Rejected
                await self.db.users.update_one(
                    {"id": user_id},
                    {"$set": {
                        "verificationStatus": "rejected"
                    }}
                )
                message = "Verification rejected"
            
            return {"success": True, "message": message}
            
        except Exception as e:
            logger.error(f"Error reviewing verification: {e}")
            return {"success": False, "message": str(e)}
    
    async def get_user_verification_status(self, user_id: str):
        """Get user's verification status and request details"""
        try:
            user = await self.db.users.find_one({"id": user_id}, {"_id": 0})
            if not user:
                return {"success": False, "message": "User not found"}
            
            result = {
                "isVerified": user.get("isVerified", False),
                "verificationStatus": user.get("verificationStatus", "none"),
                "accountType": user.get("accountType", "personal"),
                "pageId": user.get("pageId")
            }
            
            # If there's a request, get details
            if user.get("verificationStatus") in ["pending", "rejected"]:
                request = await self.db.verification_requests.find_one(
                    {"userId": user_id},
                    {"_id": 0},
                    sort=[("submittedAt", -1)]
                )
                result["request"] = request
            
            return {"success": True, "data": result}
            
        except Exception as e:
            logger.error(f"Error getting verification status: {e}")
            return {"success": False, "message": str(e)}
    
    async def suspend_verification(self, user_id: str, admin_id: str, reason: str):
        """Suspend/revoke verification status"""
        try:
            # Update user
            await self.db.users.update_one(
                {"id": user_id},
                {"$set": {
                    "isVerified": False,
                    "verificationStatus": "suspended"
                }}
            )
            
            # Update page if exists
            await self.db.pages.update_one(
                {"userId": user_id},
                {"$set": {"isVerified": False}}
            )
            
            # Log action
            await self.db.admin_actions.insert_one({
                "action": "suspend_verification",
                "userId": user_id,
                "adminId": admin_id,
                "reason": reason,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
            return {"success": True, "message": "Verification suspended"}
            
        except Exception as e:
            logger.error(f"Error suspending verification: {e}")
            return {"success": False, "message": str(e)}


class TwoFactorAuthService:
    def __init__(self, db):
        self.db = db
        self.smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.environ.get('SMTP_PORT', 587))
        self.smtp_user = os.environ.get('SMTP_USER')
        self.smtp_password = os.environ.get('SMTP_PASSWORD')
        self.smtp_from = os.environ.get('SMTP_FROM', 'noreply@loopync.com')
    
    def generate_otp(self) -> str:
        """Generate 6-digit OTP"""
        return ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    async def send_otp_email(self, email: str, otp_code: str) -> bool:
        """Send OTP via email"""
        try:
            # If SMTP not configured, just log it (for development)
            if not self.smtp_user or not self.smtp_password:
                logger.warning(f"SMTP not configured. OTP for {email}: {otp_code}")
                return True
            
            msg = MIMEMultipart()
            msg['From'] = self.smtp_from
            msg['To'] = email
            msg['Subject'] = 'Loopync - Your Verification Code'
            
            body = f"""
            <html>
                <body>
                    <h2>Loopync Verification Code</h2>
                    <p>Your verification code is: <strong style="font-size: 24px;">{otp_code}</strong></p>
                    <p>This code will expire in 10 minutes.</p>
                    <p>If you didn't request this code, please ignore this email.</p>
                </body>
            </html>
            """
            
            msg.attach(MIMEText(body, 'html'))
            
            server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            server.starttls()
            server.login(self.smtp_user, self.smtp_password)
            server.send_message(msg)
            server.quit()
            
            logger.info(f"OTP sent to {email}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending OTP email: {e}")
            # For development, still return True and log OTP
            logger.warning(f"OTP for {email}: {otp_code}")
            return True
    
    async def request_otp(self, email: str) -> dict:
        """Request OTP for 2FA"""
        try:
            # Generate OTP
            otp_code = self.generate_otp()
            
            # Set expiration (10 minutes)
            expires_at = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
            
            # Store OTP
            await self.db.two_factor_auth.delete_many({"email": email})  # Remove old OTPs
            await self.db.two_factor_auth.insert_one({
                "email": email,
                "otpCode": otp_code,
                "expiresAt": expires_at,
                "verified": False,
                "createdAt": datetime.now(timezone.utc).isoformat()
            })
            
            # Send email
            sent = await self.send_otp_email(email, otp_code)
            
            if sent:
                return {"success": True, "message": "OTP sent to your email"}
            else:
                return {"success": False, "message": "Failed to send OTP"}
                
        except Exception as e:
            logger.error(f"Error requesting OTP: {e}")
            return {"success": False, "message": str(e)}
    
    async def verify_otp(self, email: str, otp_code: str) -> dict:
        """Verify OTP code"""
        try:
            # Find OTP
            otp_record = await self.db.two_factor_auth.find_one({
                "email": email,
                "otpCode": otp_code,
                "verified": False
            })
            
            if not otp_record:
                return {"success": False, "message": "Invalid OTP code"}
            
            # Check expiration
            expires_at = datetime.fromisoformat(otp_record["expiresAt"])
            if datetime.now(timezone.utc) > expires_at:
                return {"success": False, "message": "OTP expired"}
            
            # Mark as verified
            await self.db.two_factor_auth.update_one(
                {"_id": otp_record["_id"]},
                {"$set": {"verified": True}}
            )
            
            return {"success": True, "message": "OTP verified successfully"}
            
        except Exception as e:
            logger.error(f"Error verifying OTP: {e}")
            return {"success": False, "message": str(e)}
