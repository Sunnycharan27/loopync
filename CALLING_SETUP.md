# 📞 Audio/Video Calling Setup - Agora.io Integration

## Current Status

Your app uses **Agora.io** for real-time audio and video calling. The integration is already implemented but requires valid API credentials to work.

---

## 🔑 Required API Keys

To enable calling functionality, you need **2 credentials** from Agora.io:

### 1. **AGORA_APP_ID**
- **Purpose**: Identifies your Agora project
- **Format**: 32-character hexadecimal string
- **Example**: `9d727260580f40d2ae8c131dbfd8ba08`

### 2. **AGORA_APP_CERTIFICATE** 
- **Purpose**: Used to generate secure tokens for calls
- **Format**: 32-character hexadecimal string
- **Example**: `59fd8e967f754664b3aa994c9b356e12`

---

## 📋 How to Get Agora API Keys

### Step 1: Create Agora Account
1. Go to: https://console.agora.io/
2. Sign up for a free account
3. Verify your email

### Step 2: Create a Project
1. Click "Projects" in the left sidebar
2. Click "Create" button
3. Enter project name: **"Loopync Calls"**
4. Choose: **"Secured mode: APP ID + Token"**
5. Click "Submit"

### Step 3: Get Your Credentials
1. In your project dashboard, you'll see:
   - **App ID**: Copy this value
   - Click "Edit" → Enable **Primary Certificate**
   - **Primary Certificate**: Copy this value

### Step 4: Free Tier Limits
Agora free tier includes:
- ✅ **10,000 free minutes/month**
- ✅ Up to 10,000 concurrent users
- ✅ Unlimited channels
- ✅ HD video quality
- ✅ Audio calls
- ✅ Video calls
- ✅ Screen sharing

**This is more than enough for testing and initial users!**

---

## 🔧 Current Implementation

### Backend (`/app/backend/.env`)
```bash
# Current values (need to be replaced with YOUR keys)
AGORA_APP_ID=9d727260580f40d2ae8c131dbfd8ba08
AGORA_APP_CERTIFICATE=59fd8e967f754664b3aa994c9b356e12
```

### Frontend (`/app/frontend/.env`)
```bash
# Current value (need to be replaced with YOUR key)
REACT_APP_AGORA_APP_ID=9d727260580f40d2ae8c131dbfd8ba08
```

---

## ✅ What's Already Implemented

### 1. **Call Initiation**
- ✅ Start audio/video call from messenger
- ✅ Call any friend in your network
- ✅ Choose between audio or video call

### 2. **Incoming Calls**
- ✅ Receive call notifications
- ✅ Accept or reject calls
- ✅ Ringing sound/UI

### 3. **Call Features**
- ✅ Video streaming (camera)
- ✅ Audio streaming (microphone)
- ✅ Toggle video on/off
- ✅ Toggle audio on/off (mute)
- ✅ Fullscreen mode
- ✅ Call duration timer
- ✅ End call

### 4. **Backend API**
- ✅ `/api/calls/initiate` - Start a call
- ✅ `/api/calls/accept` - Accept incoming call
- ✅ `/api/calls/reject` - Reject incoming call
- ✅ `/api/calls/end` - End active call
- ✅ `/api/agora/token` - Generate secure tokens

### 5. **Real-Time Communication**
- ✅ WebSocket for call signaling
- ✅ Agora RTC for media streams
- ✅ Token-based security

---

## 🎯 What You Need to Do

### Option 1: Use Your Own Agora Keys (Recommended)

**Step 1**: Get your keys from Agora console (see instructions above)

**Step 2**: Provide me with:
```
AGORA_APP_ID=your_app_id_here
AGORA_APP_CERTIFICATE=your_certificate_here
```

**Step 3**: I'll update the environment files and restart services

---

### Option 2: Use Test Keys (Limited)

The current keys in the system might be:
- ❌ Expired or revoked
- ❌ Belong to a test project
- ❌ Have usage limits

---

## 🚀 After You Provide Keys

Once you provide valid Agora keys, I will:

1. ✅ Update backend `.env` file
2. ✅ Update frontend `.env` file  
3. ✅ Restart all services
4. ✅ Test audio call functionality
5. ✅ Test video call functionality
6. ✅ Test incoming/outgoing calls
7. ✅ Verify WebSocket signaling
8. ✅ Confirm token generation

---

## 📱 How Calling Works (Current Flow)

### Outgoing Call Flow:
```
1. User A clicks "Call" on User B's chat
2. Frontend sends request to backend: POST /api/calls/initiate
3. Backend:
   - Generates Agora token
   - Creates call record in database
   - Sends WebSocket notification to User B
4. User B receives incoming call notification
5. If User B accepts:
   - Both join Agora channel with tokens
   - Audio/video streams established
   - Call connected!
```

### Incoming Call Flow:
```
1. User B receives WebSocket notification
2. IncomingCallModal appears with ringtone
3. User B clicks "Accept"
4. Frontend requests Agora token
5. Joins Agora channel
6. Call connected!
```

---

## 🔍 Components Involved

### Frontend:
- **AgoraCallModal.js** - Main call interface
- **IncomingCallModal.js** - Incoming call UI
- **CallManager.js** - Call state management
- **MessengerNew.js** - Call initiation

### Backend:
- **server.py** - Call endpoints
- **WebSocket** - Real-time signaling

### Dependencies:
- **agora-rtc-sdk-ng** (Frontend) ✅ Installed
- **agora_token_builder** (Backend) ✅ Installed

---

## 📊 Testing Checklist

After updating keys, I'll verify:

- [ ] Audio calls between 2 users
- [ ] Video calls between 2 users
- [ ] Incoming call notifications
- [ ] Accept/reject calls
- [ ] Mute/unmute audio
- [ ] Enable/disable video
- [ ] Call duration tracking
- [ ] End call functionality
- [ ] Multiple simultaneous calls
- [ ] WebSocket reconnection

---

## 🎉 Ready to Proceed

**Please provide your Agora API keys and I'll:**
1. Configure the system
2. Test thoroughly
3. Ensure calling works perfectly
4. Document any issues found

**Format to provide keys:**
```
AGORA_APP_ID=your_32_char_app_id
AGORA_APP_CERTIFICATE=your_32_char_certificate
```

---

## 💡 Alternative: Remove Agora and Use Different Service

If you prefer a different calling service, I can integrate:
- ✅ **Twilio** (Video calls)
- ✅ **Daily.co** (Video calls)
- ✅ **100ms** (Video calls)
- ✅ **Jitsi** (Open source)
- ✅ **WebRTC** (Direct peer-to-peer)

Just let me know your preference and provide the necessary API keys!

---

## 📞 Current Key Status

**Current keys in system:**
- AGORA_APP_ID: `9d727260580f40d2ae8c131dbfd8ba08`
- AGORA_APP_CERTIFICATE: `59fd8e967f754664b3aa994c9b356e12`

**Status**: ⚠️ Need verification (may be expired/invalid)

**Next Step**: Please provide your own Agora keys to activate calling! 🚀
