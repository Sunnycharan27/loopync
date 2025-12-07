# 🔑 Loopync API Credentials & Configuration Reference

**⚠️ CONFIDENTIAL - DO NOT SHARE PUBLICLY**

---

## 📋 Current Configuration Status

### ✅ Already Configured (Test/Development)
These are already set up and working in your current app:

| Service | Status | Action Needed |
|---------|--------|---------------|
| Agora.io | ✅ Active | Upgrade to production plan |
| Emergent AI | ✅ Active | Monitor usage & billing |
| JWT Secret | ⚠️ Test | Change for production |
| MongoDB | ⚠️ Local | Migrate to MongoDB Atlas |
| Cloudinary | ❌ Not Set | Set up required |
| Razorpay | ⚠️ Test Mode | Switch to live mode |
| Firebase FCM | ❌ Not Set | Required for mobile |

---

## 🔐 Production Environment Variables

### Backend Configuration (`/app/backend/.env`)

```env
# ==========================================
# DATABASE CONFIGURATION
# ==========================================
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=loopync_production

# ==========================================
# SERVER CONFIGURATION
# ==========================================
CORS_ORIGINS=https://loopync.com,https://www.loopync.com,https://api.loopync.com
FRONTEND_URL=https://loopync.com

# ==========================================
# SECURITY
# ==========================================
JWT_SECRET=CHANGE_THIS_TO_SECURE_64_CHARACTER_RANDOM_STRING_FOR_PRODUCTION
# Generate with: openssl rand -base64 64

# ==========================================
# CLOUDINARY (Image/Video Storage)
# ==========================================
CLOUDINARY_CLOUD=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
CLOUDINARY_UNSIGNED=your_upload_preset_name

# ==========================================
# RAZORPAY (Payments) - PRODUCTION KEYS
# ==========================================
RAZORPAY_KEY=rzp_live_XXXXXXXXXXXXXXXXXX
RAZORPAY_SECRET=your_live_secret_key_here
# Get from: https://dashboard.razorpay.com/app/keys

# ==========================================
# EMERGENT AI (Already Active)
# ==========================================
EMERGENT_LLM_KEY=sk-emergent-2A08f0464C83fA2299
# Current balance check: https://emergent.agent/dashboard

# ==========================================
# AGORA.IO (Video/Audio Calls) - Already Active
# ==========================================
AGORA_APP_ID=9d727260580f40d2ae8c131dbfd8ba08
AGORA_APP_CERTIFICATE=59fd8e967f754664b3aa994c9b356e12
# Dashboard: https://console.agora.io/

# ==========================================
# FIREBASE (Push Notifications)
# ==========================================
FCM_SERVER_KEY=your_firebase_server_key_here
# Get from: Firebase Console → Project Settings → Cloud Messaging

# ==========================================
# EMAIL (Optional - for notifications)
# ==========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your_app_specific_password
SMTP_FROM=noreply@loopync.com
```

---

### Frontend Configuration (`/app/frontend/.env`)

```env
# ==========================================
# BACKEND API
# ==========================================
REACT_APP_BACKEND_URL=https://api.loopync.com

# ==========================================
# AGORA.IO (Video/Audio Calls)
# ==========================================
REACT_APP_AGORA_APP_ID=9d727260580f40d2ae8c131dbfd8ba08

# ==========================================
# CLOUDINARY (Image/Video Upload)
# ==========================================
REACT_APP_CLOUDINARY_CLOUD=your_cloud_name_here
REACT_APP_CLOUDINARY_UNSIGNED=your_upload_preset_name

# ==========================================
# RAZORPAY (Payments)
# ==========================================
REACT_APP_RAZORPAY_KEY=rzp_live_XXXXXXXXXXXXXXXXXX

# ==========================================
# FIREBASE (Push Notifications - Mobile)
# ==========================================
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# ==========================================
# BUILD CONFIGURATION
# ==========================================
WDS_SOCKET_PORT=3000
REACT_APP_ENABLE_VISUAL_EDITS=false
ENABLE_HEALTH_CHECK=true
```

---

## 📝 Step-by-Step: How to Get Each Credential

### 1️⃣ MongoDB Atlas (Database)

#### Sign Up:
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up with email
3. Verify email

#### Create Cluster:
1. Click "Build a Cluster"
2. Choose **FREE** tier for testing (M0 Sandbox)
3. For production: Choose **M30** or higher
4. Select **AWS Mumbai (ap-south-1)** region
5. Cluster Name: `loopync-production`
6. Click "Create Cluster" (takes 5-10 minutes)

#### Get Connection String:
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy connection string:
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/
   ```
4. Replace `<username>` and `<password>` with your database user credentials

#### Create Database User:
1. Database Access → Add New Database User
2. Username: `loopync_admin`
3. Password: Generate secure password (save it!)
4. Database User Privileges: "Atlas Admin"
5. Add User

#### Whitelist IP:
1. Network Access → Add IP Address
2. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
3. For production: Add your server's static IP

**Your credentials:**
```env
MONGO_URL=mongodb+srv://loopync_admin:YOUR_PASSWORD@cluster.mongodb.net/
DB_NAME=loopync_production
```

---

### 2️⃣ Cloudinary (Image/Video Storage)

#### Sign Up:
1. Go to: https://cloudinary.com/users/register/free
2. Sign up with email
3. Verify email

#### Get Credentials:
1. After login, go to **Dashboard**
2. You'll see:
   - **Cloud Name**: (e.g., dxyz123abc)
   - **API Key**: (e.g., 123456789012345)
   - **API Secret**: (click to reveal)
3. Copy all three

#### Create Upload Preset:
1. Settings → Upload
2. Click "Add upload preset"
3. Upload preset name: `loopync_uploads`
4. Signing Mode: **Unsigned**
5. Folder: `loopync/`
6. Save

**Your credentials:**
```env
CLOUDINARY_CLOUD=dxyz123abc
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123
CLOUDINARY_UNSIGNED=loopync_uploads
```

---

### 3️⃣ Razorpay (Payments)

#### Sign Up:
1. Go to: https://dashboard.razorpay.com/signup
2. Sign up with email
3. Complete email verification

#### KYC for Live Mode:
1. Settings → Business Settings
2. Upload required documents:
   - PAN Card
   - GST Certificate (if applicable)
   - Bank Account Details
   - Business Proof
3. Wait for approval (2-3 business days)

#### Get Test Keys (Immediate):
1. Settings → API Keys
2. Mode: **Test Mode**
3. Click "Generate Test Key"
4. Save:
   - Key ID: `rzp_test_XXXXXX`
   - Key Secret: `YYYYYY`

#### Get Live Keys (After KYC):
1. Settings → API Keys
2. Mode: **Live Mode**
3. Click "Generate Live Key"
4. Save:
   - Key ID: `rzp_live_XXXXXX`
   - Key Secret: `YYYYYY`

**Your credentials:**
```env
# Test (Current)
RAZORPAY_KEY=rzp_test_xxx
RAZORPAY_SECRET=xxx

# Production (After KYC approval)
RAZORPAY_KEY=rzp_live_XXXXXXXXXXXXXXXXXX
RAZORPAY_SECRET=your_live_secret_key
```

---

### 4️⃣ Firebase (Push Notifications)

#### Create Project:
1. Go to: https://console.firebase.google.com/
2. Click "Add Project"
3. Project Name: `Loopync`
4. Disable Google Analytics (optional)
5. Create Project

#### Add Android App:
1. Click "Add app" → Android icon
2. Android Package Name: `com.loopync.app`
3. Register App
4. Download `google-services.json`
5. Save this file for mobile app

#### Add iOS App:
1. Click "Add app" → iOS icon
2. iOS Bundle ID: `com.loopync.app`
3. Register App
4. Download `GoogleService-Info.plist`
5. Save this file for mobile app

#### Get Server Key:
1. Project Settings → Cloud Messaging
2. Under "Cloud Messaging API", click "Manage API in Google Cloud Console"
3. Enable "Cloud Messaging API"
4. Go back to Firebase Console
5. Copy "Server key" (starts with `AAAA`)

#### Get Web Config:
1. Project Settings → General
2. Scroll to "Your apps"
3. Click "Web app" icon (</>) or "Add app"
4. App nickname: `Loopync Web`
5. Also set up Firebase Hosting: ✅
6. Register App
7. Copy Firebase configuration object

**Your credentials:**
```env
# Backend
FCM_SERVER_KEY=AAAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Frontend
REACT_APP_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
REACT_APP_FIREBASE_AUTH_DOMAIN=loopync-xxxxx.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=loopync-xxxxx
REACT_APP_FIREBASE_STORAGE_BUCKET=loopync-xxxxx.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxxxxx
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

### 5️⃣ Agora.io (Already Configured)

**Status**: ✅ Your credentials are already set up and working!

**Current Credentials:**
```env
AGORA_APP_ID=9d727260580f40d2ae8c131dbfd8ba08
AGORA_APP_CERTIFICATE=59fd8e967f754664b3aa994c9b356e12
```

#### Actions Needed:
1. Go to: https://console.agora.io/
2. Log in with the account that created these credentials
3. Check usage and billing
4. For production:
   - Enable Cloud Recording
   - Set up webhooks for analytics
   - Upgrade to paid plan (pay-as-you-go)

**No changes needed** - these credentials work for production!

---

### 6️⃣ Emergent AI (Already Configured)

**Status**: ✅ Your key is active!

**Current Key:**
```env
EMERGENT_LLM_KEY=sk-emergent-2A08f0464C83fA2299
```

#### Actions Needed:
1. Check balance at: https://emergent.agent/dashboard
2. Add payment method for auto-recharge
3. Set usage limits/alerts
4. Monitor API usage

**No changes needed** - this key works for production!

---

### 7️⃣ JWT Secret (Security Token)

**Current (Development):**
```env
JWT_SECRET=loopync-production-secret-key-2024-secure-jwt-token
```

**⚠️ MUST CHANGE FOR PRODUCTION**

#### Generate Secure Secret:
```bash
# Option 1: OpenSSL (Recommended)
openssl rand -base64 64

# Option 2: Python
python3 -c "import secrets; print(secrets.token_urlsafe(64))"

# Option 3: Online (use trusted sites only)
# https://www.random.org/strings/
```

**New Production Secret:**
```env
JWT_SECRET=YOUR_NEW_SUPER_SECURE_RANDOM_64_CHARACTER_STRING_HERE_NEVER_SHARE_THIS
```

---

## 🔄 Migration Checklist

### Before Going Live:

#### 1. Update All Credentials:
- [ ] MongoDB: Migrate to MongoDB Atlas
- [ ] Cloudinary: Set up account and upload preset
- [ ] Razorpay: Complete KYC and switch to live keys
- [ ] Firebase: Set up project and get keys
- [ ] JWT Secret: Generate new secure secret
- [ ] Update both backend and frontend `.env` files

#### 2. Test All Services:
```bash
# Test MongoDB connection
python3 -c "from motor.motor_asyncio import AsyncIOMotorClient; import asyncio; asyncio.run(AsyncIOMotorClient('YOUR_MONGO_URL').admin.command('ping'))"

# Test Cloudinary upload
curl -X POST https://api.cloudinary.com/v1_1/YOUR_CLOUD/image/upload \
  -F "file=@test.jpg" \
  -F "upload_preset=YOUR_PRESET"

# Test Razorpay
curl -u YOUR_KEY:YOUR_SECRET https://api.razorpay.com/v1/payments

# Test Agora (already working)
# Test via your app's video call feature
```

#### 3. Secure Your Credentials:
- [ ] Never commit `.env` files to Git
- [ ] Use environment variables in production server
- [ ] Store backup of credentials in password manager
- [ ] Share credentials securely (not via email/Slack)
- [ ] Rotate secrets every 90 days

---

## 🆘 Troubleshooting

### MongoDB Connection Issues:
```
Error: MongoServerError: bad auth : authentication failed
```
**Solution**: 
- Verify username/password are correct
- Check database user has correct permissions
- Ensure IP is whitelisted

### Cloudinary Upload Failing:
```
Error: Upload preset not found
```
**Solution**:
- Verify upload preset name matches exactly
- Ensure preset is set to "Unsigned" mode
- Check cloud name is correct

### Razorpay Payment Failing:
```
Error: Invalid API key
```
**Solution**:
- Verify you're using Live keys (not Test)
- Check keys are copied correctly (no extra spaces)
- Ensure KYC is completed

### Firebase Not Sending Notifications:
```
Error: Sender ID mismatch
```
**Solution**:
- Verify Server Key is correct
- Check `google-services.json` is in Android app
- Ensure Cloud Messaging API is enabled

---

## 📞 Support Contacts

### Service Support:
- **MongoDB**: support@mongodb.com (24/7)
- **Cloudinary**: support@cloudinary.com
- **Razorpay**: support@razorpay.com
- **Agora.io**: support@agora.io
- **Firebase**: Firebase Community (no direct support for free tier)
- **Emergent AI**: Check dashboard for support

### Emergency Issues:
- Database down → Check MongoDB Atlas status page
- Payments failing → Check Razorpay status
- Video calls not working → Check Agora.io status
- Server down → Check your hosting provider

---

## 🔒 Security Best Practices

### DO:
✅ Use strong, unique passwords for each service  
✅ Enable 2FA wherever available  
✅ Rotate secrets regularly (every 90 days)  
✅ Use password manager to store credentials  
✅ Limit access to credentials (need-to-know basis)  
✅ Monitor API usage for unusual activity  
✅ Set up billing alerts  

### DON'T:
❌ Never commit `.env` files to Git  
❌ Never share credentials via email/Slack  
❌ Never use same password for multiple services  
❌ Never share API keys publicly  
❌ Never hardcode credentials in code  
❌ Never use test keys in production  

---

## 📚 Additional Resources

### Documentation Links:
- MongoDB Atlas: https://docs.atlas.mongodb.com/
- Cloudinary API: https://cloudinary.com/documentation/image_upload_api_reference
- Razorpay API: https://razorpay.com/docs/api/
- Firebase Cloud Messaging: https://firebase.google.com/docs/cloud-messaging
- Agora.io Guides: https://docs.agora.io/en/

### Video Tutorials:
- MongoDB Atlas Setup: https://youtu.be/rPqRyYJmx2g
- Cloudinary Integration: https://youtu.be/3ORsUGVNKRk
- Razorpay Integration: https://youtu.be/NN4Y9KjkHR0

---

**Last Updated**: [Today's Date]  
**Next Review**: [90 days from now]

---

**⚠️ IMPORTANT**: Keep this document secure and confidential. Never share publicly or commit to version control.
