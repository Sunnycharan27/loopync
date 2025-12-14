# 🔐 Admin Access & Security Guide

## ✅ Your Admin Account

**Email:** sunnycharan181@gmail.com  
**Password:** Ramcharan  
**Role:** admin  
**User ID:** 976b91d9-31f1-48f8-945c-09bc61760534

---

## 🌐 Access URLs

### Login Page
```
https://loopync-social-3.preview.emergentagent.com/auth
```

### Admin Verification Dashboard
```
https://loopync-social-3.preview.emergentagent.com/admin/verification
```

---

## 🛡️ Security Status - VERIFIED

### ✅ Backend Protection (SECURE)
- **Access Control:** Only users with `role: "admin"` can access admin endpoints
- **Authentication Required:** All admin endpoints require valid JWT token
- **Error Response:** Non-admin users get `403 Forbidden - "Admin access required"`

### ✅ Test Results
- ❌ Regular users **CANNOT** access admin endpoints
- ✅ Your admin account **CAN** access all admin features

### Protected Admin Endpoints
1. `GET /api/admin/verification/requests` - View all verification requests
2. `POST /api/admin/verification/{request_id}/review` - Approve/Reject requests
3. `POST /api/admin/users/{user_id}/assign-role` - Assign admin roles (super admin only)
4. `POST /api/admin/users/{user_id}/suspend-verification` - Suspend verified status

---

## 📊 Current Status

**Total Users in Database:** 15
**Admin Users:** 1 (only you)
**Pending Verification Requests:** 3

---

## 🎯 What You Can Do

### As Admin, You Can:
1. **View Verification Requests**
   - See all pending verification requests
   - View user profile info, documents, contact details
   - See uploaded documents (Aadhaar, selfie, business docs)

2. **Approve Requests**
   - Grant verified badge (blue checkmark)
   - Automatically create a special Page for the user
   - Update user's account type (creator/public_figure/business)

3. **Reject Requests**
   - Reject with a reason
   - User can see rejection reason
   - User can reapply later

4. **View Analytics**
   - Pending requests count
   - Creator/Public Figure/Business breakdown
   - Request submission dates

---

## 🚫 What Regular Users CANNOT Do

Regular users (without admin role):
- ❌ Cannot access `/admin/verification` page
- ❌ Cannot view verification requests
- ❌ Cannot approve or reject requests
- ❌ Cannot assign admin roles
- ❌ API returns `403 Forbidden` error

---

## 🧪 Testing Verification Flow

### Step 1: Login
1. Go to: https://loopync-social-3.preview.emergentagent.com/auth
2. Enter your credentials
3. Click Login

### Step 2: Access Dashboard
1. Navigate to: https://loopync-social-3.preview.emergentagent.com/admin/verification
2. You should see 3 pending requests from backend testing

### Step 3: Review & Approve
1. Click on a verification request
2. Review user details and documents
3. Click "Approve" or "Reject"
4. User will receive verified badge if approved

---

## 🔧 How to Make Another User Admin (If Needed)

If you want to add another admin in the future:

```bash
# Login to MongoDB
mongosh "mongodb://localhost:27017/test_database"

# Update user role
db.users.updateOne(
  { "email": "another-admin@example.com" },
  { $set: { "role": "admin" } }
)

# Verify
db.users.findOne(
  { "email": "another-admin@example.com" },
  { _id: 0, name: 1, email: 1, role: 1 }
)
```

---

## 📱 Admin Dashboard Features

### View Pending Requests
- User avatar and profile info
- Account type (Creator/Public Figure/Business)
- Category (Influencer, Celebrity, Company, etc.)
- Contact details (email, phone, website)
- Uploaded documents with preview links
- Submission date

### Approve Request
- Grants verified badge
- Creates special Page automatically
- Updates account type
- User sees verified badge everywhere (posts, profile, discover)

### Reject Request
- Must provide rejection reason
- User status remains unverified
- User can reapply after fixing issues

### Stats Dashboard
- Total pending requests
- Breakdown by account type
- Quick filtering options

---

## ⚠️ Important Notes

1. **Only Your Account Has Admin Access**
   - All test admin accounts have been removed
   - Only `sunnycharan181@gmail.com` has admin role

2. **Backend Security is Active**
   - Even if someone reaches the admin page URL
   - API will block them with 403 error
   - Only valid admin tokens work

3. **Token Expiration**
   - JWT tokens expire after 24 hours
   - You'll need to login again after expiration

4. **Database Direct Access**
   - If needed, you can always verify/modify roles directly in MongoDB
   - Connection: `mongodb://localhost:27017/test_database`

---

## 🆘 Troubleshooting

### "Admin access required" Error
- Make sure you're logged in with the correct admin account
- Check if your token expired (try logging in again)
- Verify your role in MongoDB: should be `"role": "admin"`

### Can't Access Dashboard
- Verify you're using the correct URL
- Make sure you're logged in first
- Check browser console for errors

### No Pending Requests Showing
- There are currently 3 test requests in the database
- If not showing, check backend logs
- Try refreshing the page

---

## 📞 Support

If you encounter any issues:
1. Check browser console for errors
2. Check backend logs: `tail -f /var/log/supervisor/backend.err.log`
3. Verify your admin role in MongoDB
4. Contact the development team

---

**Last Updated:** December 10, 2025  
**Security Status:** ✅ Verified & Secure  
**Admin Account:** sunnycharan181@gmail.com
