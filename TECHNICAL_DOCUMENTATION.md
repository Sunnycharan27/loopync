# Loopync Superapp - Technical Documentation

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Core Features](#core-features)
5. [API Documentation](#api-documentation)
6. [Database Schema](#database-schema)
7. [Authentication & Security](#authentication--security)
8. [Real-Time Communication](#real-time-communication)
9. [Media Storage & Management](#media-storage--management)
10. [Deployment Architecture](#deployment-architecture)
11. [Development Workflow](#development-workflow)

---

## Executive Summary

**Loopync** is a comprehensive social superapp that integrates social networking, real-time communication, e-commerce, event management, and fintech capabilities into a unified platform. Built with modern web technologies, it provides users with a seamless experience for social interactions, content sharing, and community engagement.

### Key Statistics
- **Architecture**: Microservices-based with RESTful APIs
- **Real-time Capabilities**: WebSocket-based using Socket.IO
- **Database**: MongoDB (NoSQL)
- **Media Storage**: Hybrid (MongoDB + Disk Storage)
- **Max File Size**: 150MB
- **Concurrent Users**: Designed for 100k+ users

---

## Technology Stack

### Frontend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.x | UI framework |
| **React Router** | 6.x | Client-side routing |
| **Axios** | 1.x | HTTP client |
| **Socket.IO Client** | 4.x | Real-time communication |
| **Lucide React** | Latest | Icon library |
| **Tailwind CSS** | 3.x | Utility-first CSS framework |
| **Sonner** | Latest | Toast notifications |
| **QRCode.react** | Latest | QR code generation |

### Backend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.11 | Programming language |
| **FastAPI** | 0.100+ | Web framework |
| **Uvicorn** | Latest | ASGI server |
| **Motor** | 3.x | Async MongoDB driver |
| **PyJWT** | 2.x | JWT authentication |
| **Passlib** | 1.7.x | Password hashing (bcrypt) |
| **Python-Multipart** | Latest | File upload handling |
| **Python-SocketIO** | 5.x | WebSocket server |

### Database & Storage
| Component | Technology | Purpose |
|-----------|------------|---------|
| **Primary Database** | MongoDB | Document-based storage |
| **Media Storage** | Hybrid (MongoDB + Disk) | File storage system |
| **Session Management** | JWT Tokens | Stateless authentication |

### Infrastructure
| Component | Technology | Purpose |
|-----------|------------|---------|
| **Container Platform** | Kubernetes | Container orchestration |
| **Process Manager** | Supervisor | Service management |
| **Web Server** | Uvicorn (ASGI) | Application server |
| **Dev Server** | React Dev Server | Frontend development |

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │   Mobile     │  │   Desktop    │      │
│  │   (React)    │  │   Browser    │  │   Browser    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Kubernetes     │
                    │  Ingress        │
                    │  (Port Mapping) │
                    └────────┬────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                      │
     ┌────▼─────┐                         ┌─────▼────┐
     │ Frontend │                         │ Backend  │
     │ (Port    │◄────────────────────────┤ (Port    │
     │  3000)   │    WebSocket + REST     │  8001)   │
     └──────────┘                         └─────┬────┘
                                                 │
                                          ┌──────▼──────┐
                                          │   MongoDB   │
                                          │   Database  │
                                          └─────────────┘
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Components                                          │   │
│  │  • Pages (Home, Profile, Messenger, etc.)          │   │
│  │  • UI Components (Modals, Cards, Forms)            │   │
│  │  • Layout Components (Header, BottomNav)           │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Context & State Management                          │   │
│  │  • AuthContext (User authentication)                │   │
│  │  • ThemeContext (App theming)                       │   │
│  │  • WebSocketContext (Real-time connections)        │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Services                                            │   │
│  │  • API Client (Axios)                               │   │
│  │  • WebSocket Client (Socket.IO)                    │   │
│  │  • Media Utilities                                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  API Routes (RESTful)                               │   │
│  │  • Authentication (/api/auth/*)                     │   │
│  │  • Users (/api/users/*)                            │   │
│  │  • Posts (/api/posts/*)                            │   │
│  │  • Reels (/api/reels/*)                            │   │
│  │  • Messaging (/api/messages/*)                     │   │
│  │  • Calls (/api/calls/*)                            │   │
│  │  • Media (/api/upload, /api/media/*)              │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  WebSocket Events (Socket.IO)                       │   │
│  │  • Real-time messaging                              │   │
│  │  • Call signaling (WebRTC)                         │   │
│  │  • Notifications                                     │   │
│  │  • Presence updates                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Services                                            │   │
│  │  • Auth Service (JWT, password hashing)            │   │
│  │  • Messenger Service (message handling)            │   │
│  │  • Media Service (file storage)                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (MongoDB)                        │
│  Collections:                                                │
│  • users, posts, reels, vibe_capsules                       │
│  • messages, friends, notifications                         │
│  • tribes, events, venues, tickets                          │
│  • marketplace_items, transactions                          │
│  • rooms, media_files                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Features

### 1. Authentication & User Management

**Technology**: JWT-based authentication with bcrypt password hashing

**Endpoints**:
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

**Features**:
- Secure password hashing using bcrypt
- JWT token-based stateless authentication
- Token expiry and refresh mechanism
- Email-based password recovery
- Persistent sessions

**Security**:
- Passwords hashed with bcrypt (cost factor: 12)
- JWT tokens signed with HS256 algorithm
- Token expiry: 24 hours (configurable)
- HTTPS enforcement in production

### 2. Social Networking

#### Posts System
**Technology**: MongoDB document storage with media references

**Features**:
- Text posts with optional media (images/videos)
- Like and comment functionality
- Share to friends
- Privacy controls (public/private/friends-only)
- Feed algorithm (chronological + engagement)

**Endpoints**:
- `POST /api/posts` - Create post
- `GET /api/posts` - Get feed
- `GET /api/posts/{postId}` - Get single post
- `DELETE /api/posts/{postId}` - Delete post
- `POST /api/posts/{postId}/like` - Like/unlike post
- `POST /api/posts/{postId}/comment` - Add comment

#### Reels (Short Videos)
**Technology**: Video storage with streaming capabilities

**Features**:
- Short-form video content (up to 150MB)
- Vertical video format
- Swipe navigation
- Like, comment, share
- Music/audio integration

**Endpoints**:
- `POST /api/reels` - Create reel
- `GET /api/reels` - Get reels feed
- `DELETE /api/reels/{reelId}` - Delete reel

#### Vibe Capsules (Stories)
**Technology**: Time-limited content with auto-expiry

**Features**:
- 24-hour temporary content
- Image and video support
- View tracking
- Sequential viewing experience

**Endpoints**:
- `POST /api/vibe-capsules` - Create story
- `GET /api/vibe-capsules/{userId}` - Get user's stories
- `GET /api/vibe-capsules` - Get all active stories

### 3. Real-Time Messaging

**Technology**: Socket.IO for WebSocket communication

**Features**:
- 1-on-1 text messaging
- Image and media sharing
- Read receipts
- Typing indicators
- Online presence
- Message history
- Push notifications

**Socket Events**:
```javascript
// Client → Server
socket.emit('join_room', { userId, friendId })
socket.emit('send_message', { from, to, text, mediaUrl })
socket.emit('typing', { from, to, isTyping })
socket.emit('mark_read', { messageId })

// Server → Client
socket.on('new_message', (message) => {...})
socket.on('user_online', (userId) => {...})
socket.on('user_offline', (userId) => {...})
socket.on('typing_indicator', (data) => {...})
socket.on('message_read', (messageId) => {...})
```

**REST Endpoints**:
- `GET /api/messages/{userId}` - Get message history
- `POST /api/messages` - Send message (fallback)
- `GET /api/messages/conversations` - Get conversation list

### 4. Audio/Video Calling

**Technology**: WebRTC for peer-to-peer communication

**Architecture**:
```
Caller                    Signaling Server              Callee
  │                             │                          │
  ├──── initiate_call ─────────►│                          │
  │                             ├──── incoming_call ───────►│
  │                             │                          │
  │◄──── call_accepted ─────────┤◄──── accept_call ────────┤
  │                             │                          │
  ├──── webrtc_offer ──────────►│──── webrtc_offer ───────►│
  │◄──── webrtc_answer ─────────┤◄──── webrtc_answer ──────┤
  │                             │                          │
  ├──── ICE candidates ────────►│──── ICE candidates ─────►│
  │◄──── ICE candidates ────────┤◄──── ICE candidates ─────┤
  │                             │                          │
  │◄═════════ P2P Media Stream ══════════════════════════►│
```

**Features**:
- 1-on-1 audio calls
- 1-on-1 video calls
- Mute/unmute controls
- Camera on/off
- Call history
- Call quality indicators

**WebSocket Events**:
- `initiate_call` - Start call
- `incoming_call` - Receive call notification
- `accept_call` - Accept incoming call
- `reject_call` - Reject call
- `webrtc_offer` - WebRTC offer exchange
- `webrtc_answer` - WebRTC answer exchange
- `webrtc_candidate` - ICE candidate exchange
- `end_call` - Terminate call

### 5. Vibe Rooms (Audio Rooms)

**Technology**: Web Audio API with role-based permissions

**Features**:
- Live audio conversations (Clubhouse-style)
- Role-based permissions (host, moderator, speaker, audience)
- Raise hand to speak
- Mute/unmute controls
- Room categories and discovery
- User management (invite to stage, remove)

**Roles**:
- **Host**: Full control, can manage all aspects
- **Moderator**: Can manage speakers, moderate content
- **Speaker**: Can speak in the room
- **Audience**: Listen-only mode

**Endpoints**:
- `POST /api/rooms` - Create room
- `GET /api/rooms` - List active rooms
- `GET /api/rooms/{roomId}` - Get room details
- `POST /api/rooms/{roomId}/join` - Join room
- `POST /api/rooms/{roomId}/leave` - Leave room
- `PATCH /api/rooms/{roomId}/role` - Update user role

### 6. Friend Management

**Technology**: Graph-based relationships in MongoDB

**Features**:
- Send/accept/reject friend requests
- Friend list management
- Mutual friends display
- Friend suggestions
- Block/unblock users

**Endpoints**:
- `POST /api/friends/request` - Send friend request
- `POST /api/friends/accept` - Accept request
- `POST /api/friends/reject` - Reject request
- `GET /api/friends/{userId}` - Get friend list
- `DELETE /api/friends/{friendId}` - Remove friend
- `POST /api/friends/block` - Block user

### 7. Profile Management

**Features**:
- Profile picture upload/selection from media
- Cover photo
- Bio and personal information
- Location and website
- Vibe score and tier system
- Streak counter
- Activity statistics

**Profile Update**:
- `PATCH /api/users/{userId}/profile` - Update profile
  - Supported fields: `name`, `handle`, `bio`, `avatar`, `coverPhoto`, `location`, `website`

**Profile Picture**:
- Two-tab modal: Upload New | Your Media
- Upload new images directly (150MB max)
- Select from existing posts/reels/stories
- Instant preview and update

### 8. Media Upload & Storage

**Technology**: Hybrid storage system

**Storage Strategy**:
```
File Size < 15MB  →  MongoDB (Base64 encoded)
File Size ≥ 15MB  →  Disk Storage + MongoDB metadata
```

**Supported Formats**:
- **Images**: JPG, JPEG, PNG, GIF, WebP
- **Videos**: MP4, QuickTime, AVI, WebM, MPEG

**Upload Endpoint**:
```
POST /api/upload
Content-Type: multipart/form-data

Response:
{
  "url": "/api/media/{file_id}",
  "filename": "{file_id}.{ext}",
  "content_type": "image/png",
  "size": 1048576,
  "storage_type": "mongodb" | "disk"
}
```

**Media Retrieval**:
```
GET /api/media/{file_id}

Response: Binary file with appropriate Content-Type header
```

**Features**:
- Automatic file type validation
- Size limit enforcement (150MB)
- Unique file ID generation (UUID)
- Content-Type detection
- Efficient streaming for large files

### 9. Notifications System

**Features**:
- Real-time push notifications
- In-app notification center
- Notification types:
  - Friend requests
  - Post likes/comments
  - New messages
  - Call notifications
  - System alerts

**Endpoints**:
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications/{id}/read` - Mark as read
- `DELETE /api/notifications/{id}` - Delete notification

### 10. Marketplace

**Features**:
- Product listings
- Buy/sell functionality
- Product categories
- Search and filters
- User ratings

**Endpoints**:
- `POST /api/marketplace/items` - Create listing
- `GET /api/marketplace/items` - Browse items
- `GET /api/marketplace/items/{itemId}` - Item details

### 11. Events & Venues

**Features**:
- Event creation and management
- Venue registration
- Ticket booking
- QR code generation
- Check-in system
- Event discovery

**Endpoints**:
- `POST /api/events` - Create event
- `GET /api/events` - List events
- `POST /api/events/{eventId}/book` - Book ticket
- `GET /api/venues` - List venues

### 12. LoopPay (Payment Integration)

**Features**:
- Digital wallet
- Loop credits system
- Transaction history
- Top-up functionality
- Payment for events/marketplace

**Endpoints**:
- `GET /api/looppay/balance` - Get balance
- `POST /api/looppay/topup` - Add funds
- `POST /api/looppay/transfer` - Send money
- `GET /api/looppay/transactions` - Transaction history

---

## API Documentation

### Base URL
```
Production: https://{domain}/api
Development: http://localhost:8001/api
```

### Authentication
All authenticated endpoints require JWT token in header:
```
Authorization: Bearer {jwt_token}
```

### Common Response Formats

**Success Response**:
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error message",
  "detail": "Detailed error information",
  "status_code": 400
}
```

### Rate Limiting
- Public endpoints: 100 requests/minute
- Authenticated endpoints: 1000 requests/minute
- Upload endpoints: 50 requests/minute

### Pagination
List endpoints support pagination:
```
GET /api/posts?page=1&limit=20

Response:
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## Database Schema

### Users Collection
```javascript
{
  id: "uuid-v4",
  email: "user@example.com",
  password: "bcrypt_hashed_password",
  name: "John Doe",
  handle: "@johndoe",
  avatar: "/api/media/avatar-id",
  coverPhoto: "/api/media/cover-id",
  bio: "User biography",
  location: "San Francisco, CA",
  website: "https://example.com",
  vibeScore: 850,
  tier: "Gold",
  streak: 15,
  createdAt: "2024-01-01T00:00:00Z",
  lastActive: "2024-11-09T18:00:00Z",
  isOnline: true,
  settings: {
    privacy: "friends",
    notifications: true,
    darkMode: true
  }
}
```

### Posts Collection
```javascript
{
  id: "uuid-v4",
  authorId: "user-uuid",
  text: "Post content",
  mediaUrl: "/api/media/media-id",
  mediaType: "image" | "video",
  likes: ["user-id-1", "user-id-2"],
  comments: [
    {
      id: "comment-uuid",
      userId: "user-uuid",
      text: "Comment text",
      createdAt: "ISO-timestamp"
    }
  ],
  shares: 10,
  visibility: "public" | "friends" | "private",
  createdAt: "ISO-timestamp",
  updatedAt: "ISO-timestamp"
}
```

### Messages Collection
```javascript
{
  id: "uuid-v4",
  from: "user-uuid",
  to: "user-uuid",
  text: "Message content",
  mediaUrl: "/api/media/media-id",
  read: false,
  readAt: "ISO-timestamp" | null,
  createdAt: "ISO-timestamp"
}
```

### Friends Collection
```javascript
{
  id: "uuid-v4",
  userId: "user-uuid",
  friendId: "user-uuid",
  status: "pending" | "accepted" | "rejected" | "blocked",
  requestedBy: "user-uuid",
  createdAt: "ISO-timestamp",
  acceptedAt: "ISO-timestamp" | null
}
```

### Reels Collection
```javascript
{
  id: "uuid-v4",
  authorId: "user-uuid",
  videoUrl: "/api/media/video-id",
  caption: "Reel caption",
  music: {
    name: "Song Name",
    artist: "Artist Name",
    url: "/api/media/audio-id"
  },
  likes: ["user-id-1", "user-id-2"],
  comments: [{...}],
  views: 1500,
  createdAt: "ISO-timestamp"
}
```

### Vibe Capsules Collection
```javascript
{
  id: "uuid-v4",
  userId: "user-uuid",
  mediaUrl: "/api/media/media-id",
  mediaType: "image" | "video",
  duration: 24, // hours
  views: ["user-id-1", "user-id-2"],
  expiresAt: "ISO-timestamp",
  createdAt: "ISO-timestamp"
}
```

### Rooms Collection
```javascript
{
  id: "uuid-v4",
  name: "Room Name",
  description: "Room description",
  hostId: "user-uuid",
  category: "Music" | "Tech" | "Business" | etc.,
  participants: [
    {
      userId: "user-uuid",
      role: "host" | "moderator" | "speaker" | "audience",
      joinedAt: "ISO-timestamp"
    }
  ],
  isActive: true,
  maxParticipants: 100,
  createdAt: "ISO-timestamp"
}
```

### Media Files Collection
```javascript
{
  id: "uuid-v4",
  filename: "original-filename.ext",
  content_type: "image/png",
  file_extension: "png",
  file_data: "base64-encoded-data", // for MongoDB storage
  disk_path: "/path/to/file", // for disk storage
  file_size: 1048576,
  storage_type: "mongodb" | "disk",
  uploaded_at: "ISO-timestamp"
}
```

### Database Indexes
```javascript
// Users
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ handle: 1 }, { unique: true })
db.users.createIndex({ id: 1 }, { unique: true })

// Posts
db.posts.createIndex({ authorId: 1, createdAt: -1 })
db.posts.createIndex({ id: 1 }, { unique: true })

// Messages
db.messages.createIndex({ from: 1, to: 1, createdAt: -1 })
db.messages.createIndex({ id: 1 }, { unique: true })

// Friends
db.friends.createIndex({ userId: 1, friendId: 1 }, { unique: true })

// Media Files
db.media_files.createIndex({ id: 1 }, { unique: true })
```

---

## Authentication & Security

### JWT Token Structure
```javascript
{
  "sub": "user-uuid", // Subject (user ID)
  "email": "user@example.com",
  "exp": 1699564800, // Expiration timestamp
  "iat": 1699478400 // Issued at timestamp
}
```

### Password Security
- Algorithm: bcrypt
- Cost factor: 12 rounds
- Salt: Automatically generated per password
- Minimum length: 8 characters
- Recommended: Mix of uppercase, lowercase, numbers, symbols

### API Security
- HTTPS enforcement in production
- CORS configured for allowed origins
- Rate limiting on all endpoints
- Input validation using Pydantic models
- SQL injection prevention (NoSQL database)
- XSS protection through content sanitization

### Environment Variables
```bash
# Backend (.env)
JWT_SECRET=your-secret-key-here
MONGO_URL=mongodb://localhost:27017/loopync
FRONTEND_URL=https://your-domain.com

# Frontend (.env)
REACT_APP_BACKEND_URL=https://api.your-domain.com
```

---

## Real-Time Communication

### WebSocket Connection
```javascript
// Client-side connection
import io from 'socket.io-client';

const socket = io(process.env.REACT_APP_BACKEND_URL, {
  auth: {
    token: localStorage.getItem('token')
  },
  transports: ['websocket', 'polling']
});
```

### Event Handlers

**Server-side (FastAPI)**:
```python
@sio.event
async def connect(sid, environ, auth):
    """Handle client connection"""
    token = auth.get('token')
    # Verify token and associate with user
    
@sio.event
async def send_message(sid, data):
    """Handle message sending"""
    # Process and broadcast message
    await sio.emit('new_message', message_data, room=recipient_sid)
```

**Client-side (React)**:
```javascript
useEffect(() => {
  socket.on('new_message', (message) => {
    setMessages(prev => [...prev, message]);
  });
  
  socket.on('user_online', (userId) => {
    updateUserStatus(userId, 'online');
  });
  
  return () => {
    socket.off('new_message');
    socket.off('user_online');
  };
}, []);
```

---

## Media Storage & Management

### Upload Flow
```
┌─────────┐
│ Client  │
└────┬────┘
     │ 1. Select file
     ├──────────────────────────────┐
     │ 2. POST /api/upload          │
     ▼                              ▼
┌─────────────┐           ┌──────────────┐
│  Frontend   │           │   Backend    │
│  Validation │           │              │
│  - Type     │           │ 3. Validate  │
│  - Size     │           │    file      │
└─────────────┘           └──────┬───────┘
                                 │
                     ┌───────────┴───────────┐
                     │ 4. Size check         │
                     └───────────┬───────────┘
                                 │
                ┌────────────────┴────────────────┐
                │                                  │
        Size < 15MB                         Size ≥ 15MB
                │                                  │
        ┌───────▼────────┐              ┌─────────▼────────┐
        │ Store in       │              │ Store on         │
        │ MongoDB        │              │ Disk             │
        │ (Base64)       │              │ + Metadata in DB │
        └───────┬────────┘              └─────────┬────────┘
                │                                  │
                └──────────────┬───────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │ 5. Return URL       │
                    │ /api/media/{id}     │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ 6. Client receives  │
                    │    URL and displays │
                    └─────────────────────┘
```

### Retrieval Flow
```
Client requests: GET /api/media/{file_id}
                      │
                      ▼
          ┌───────────────────────┐
          │ Backend looks up      │
          │ file in MongoDB       │
          └───────┬───────────────┘
                  │
       ┌──────────┴──────────┐
       │                     │
  MongoDB Storage       Disk Storage
       │                     │
  ┌────▼─────┐         ┌────▼─────┐
  │ Decode   │         │ Read     │
  │ Base64   │         │ File     │
  └────┬─────┘         └────┬─────┘
       │                     │
       └──────────┬──────────┘
                  │
          ┌───────▼───────────┐
          │ Stream to client  │
          │ with Content-Type │
          └───────────────────┘
```

---

## Deployment Architecture

### Kubernetes Configuration

```yaml
# Service Ports
Frontend: 3000 (internal)
Backend: 8001 (internal)

# Ingress Rules
/ → Frontend (3000)
/api/* → Backend (8001)
```

### Process Management (Supervisor)

```ini
[program:backend]
command=uvicorn server:sio_asgi_app --host 0.0.0.0 --port 8001
directory=/app/backend
autostart=true
autorestart=true
stdout_logfile=/var/log/supervisor/backend.out.log
stderr_logfile=/var/log/supervisor/backend.err.log

[program:frontend]
command=yarn start
directory=/app/frontend
autostart=true
autorestart=true
stdout_logfile=/var/log/supervisor/frontend.out.log
stderr_logfile=/var/log/supervisor/frontend.err.log
```

### Environment Configuration

**Development**:
```
Backend: http://localhost:8001
Frontend: http://localhost:3000
MongoDB: mongodb://localhost:27017
```

**Production**:
```
Backend: https://api.domain.com
Frontend: https://domain.com
MongoDB: mongodb://prod-server:27017
```

---

## Development Workflow

### Setup Instructions

1. **Clone Repository**
```bash
git clone <repository-url>
cd loopync-app
```

2. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
```

3. **Frontend Setup**
```bash
cd frontend
yarn install
cp .env.example .env
# Edit .env with your configuration
```

4. **Database Setup**
```bash
# Start MongoDB
mongod --dbpath /path/to/data

# Import sample data (optional)
python import_database.py
```

5. **Start Development Servers**
```bash
# Terminal 1 - Backend
cd backend
uvicorn server:sio_asgi_app --reload --host 0.0.0.0 --port 8001

# Terminal 2 - Frontend
cd frontend
yarn start
```

### Code Structure Guidelines

**Frontend**:
```
src/
├── components/       # Reusable UI components
├── pages/           # Page components (routes)
├── context/         # React Context providers
├── hooks/           # Custom React hooks
├── services/        # API service functions
├── utils/           # Utility functions
└── App.js          # Main app component
```

**Backend**:
```
backend/
├── server.py        # Main FastAPI application
├── auth_service.py  # Authentication logic
├── messenger_service.py  # Messaging logic
├── requirements.txt # Python dependencies
└── .env            # Environment variables
```

### Testing

**Backend Testing**:
```bash
# Run tests
pytest

# Test specific endpoint
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Frontend Testing**:
```bash
# Run tests
yarn test

# E2E tests with Playwright
yarn test:e2e
```

### Deployment Commands

**Using Supervisor**:
```bash
# Restart services
sudo supervisorctl restart all
sudo supervisorctl restart backend
sudo supervisorctl restart frontend

# Check status
sudo supervisorctl status

# View logs
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/frontend.out.log
```

---

## API Endpoint Reference

### Authentication APIs

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/signup` | POST | Register new user | No |
| `/api/auth/login` | POST | User login | No |
| `/api/auth/logout` | POST | User logout | Yes |
| `/api/auth/forgot-password` | POST | Request password reset | No |
| `/api/auth/reset-password` | POST | Reset password | No |

### User APIs

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/users/{userId}` | GET | Get user profile | Yes |
| `/api/users/{userId}/profile` | PATCH | Update profile | Yes |
| `/api/users/search` | GET | Search users | Yes |

### Post APIs

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/posts` | GET | Get feed | Yes |
| `/api/posts` | POST | Create post | Yes |
| `/api/posts/{postId}` | GET | Get single post | Yes |
| `/api/posts/{postId}` | DELETE | Delete post | Yes |
| `/api/posts/{postId}/like` | POST | Like/unlike post | Yes |
| `/api/posts/{postId}/comment` | POST | Add comment | Yes |

### Reel APIs

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/reels` | GET | Get reels feed | Yes |
| `/api/reels` | POST | Create reel | Yes |
| `/api/reels/{reelId}` | DELETE | Delete reel | Yes |

### Messaging APIs

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/messages/{userId}` | GET | Get messages | Yes |
| `/api/messages` | POST | Send message | Yes |
| `/api/messages/conversations` | GET | Get conversations | Yes |

### Call APIs

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/calls/initiate` | POST | Start call | Yes |
| `/api/calls/{callId}/end` | POST | End call | Yes |

### Media APIs

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/upload` | POST | Upload file | Yes |
| `/api/media/{fileId}` | GET | Get media file | No |

### Friend APIs

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/friends/request` | POST | Send friend request | Yes |
| `/api/friends/accept` | POST | Accept request | Yes |
| `/api/friends/reject` | POST | Reject request | Yes |
| `/api/friends/{userId}` | GET | Get friends list | Yes |

### Room APIs

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/rooms` | GET | List rooms | Yes |
| `/api/rooms` | POST | Create room | Yes |
| `/api/rooms/{roomId}` | GET | Get room details | Yes |
| `/api/rooms/{roomId}/join` | POST | Join room | Yes |
| `/api/rooms/{roomId}/leave` | POST | Leave room | Yes |

---

## Performance Optimization

### Frontend Optimizations
- Code splitting with React.lazy()
- Image lazy loading
- Memoization with useMemo and useCallback
- Virtual scrolling for long lists
- Service Worker for offline support
- CDN for static assets

### Backend Optimizations
- Async/await for non-blocking I/O
- Database indexing on frequently queried fields
- Connection pooling for MongoDB
- Caching with Redis (future enhancement)
- Pagination for large datasets
- Gzip compression for API responses

### Database Optimizations
- Compound indexes for complex queries
- Projection to limit returned fields
- Aggregation pipeline for analytics
- TTL indexes for temporary data (stories)

---

## Monitoring & Logging

### Application Logs
```bash
# Backend logs
/var/log/supervisor/backend.out.log
/var/log/supervisor/backend.err.log

# Frontend logs
/var/log/supervisor/frontend.out.log
/var/log/supervisor/frontend.err.log
```

### Log Levels
- **INFO**: General application flow
- **WARNING**: Non-critical issues
- **ERROR**: Error conditions
- **DEBUG**: Detailed diagnostic information

### Metrics to Monitor
- API response times
- Database query performance
- WebSocket connection count
- Active user sessions
- File upload success rate
- Storage usage (MongoDB + disk)

---

## Future Enhancements

### Planned Features
1. **Push Notifications** - Browser and mobile push notifications
2. **Advanced Search** - Elasticsearch integration
3. **Content Moderation** - AI-powered content filtering
4. **Analytics Dashboard** - User engagement metrics
5. **Mobile Apps** - Native iOS and Android applications
6. **Video Streaming** - Live streaming capabilities
7. **Payment Gateway** - Stripe/PayPal integration
8. **AI Recommendations** - ML-based content suggestions

### Scalability Roadmap
1. **Horizontal Scaling** - Load balancing across multiple servers
2. **Database Sharding** - Distribute data across clusters
3. **CDN Integration** - CloudFlare or AWS CloudFront
4. **Microservices** - Split monolith into services
5. **Message Queue** - RabbitMQ or Apache Kafka
6. **Caching Layer** - Redis for frequently accessed data

---

## Troubleshooting Guide

### Common Issues

**Backend won't start**:
```bash
# Check logs
tail -f /var/log/supervisor/backend.err.log

# Verify dependencies
pip install -r requirements.txt

# Check MongoDB connection
mongosh --eval "db.adminCommand('ping')"
```

**Frontend compilation errors**:
```bash
# Clear cache
rm -rf node_modules
yarn install

# Check environment variables
cat .env
```

**WebSocket connection fails**:
- Verify backend is running on correct port
- Check CORS configuration
- Ensure firewall allows WebSocket connections
- Verify JWT token is being sent

**Media upload fails**:
- Check file size (max 150MB)
- Verify file type is supported
- Check disk space availability
- Review upload endpoint logs

---

## Glossary

| Term | Definition |
|------|------------|
| **JWT** | JSON Web Token - Stateless authentication token |
| **WebRTC** | Web Real-Time Communication - P2P communication protocol |
| **Socket.IO** | Library for real-time bidirectional communication |
| **ASGI** | Asynchronous Server Gateway Interface |
| **bcrypt** | Password hashing algorithm |
| **Vibe Capsule** | Time-limited story content (24 hours) |
| **Reel** | Short-form vertical video content |
| **Loop Credits** | In-app virtual currency |
| **Tier** | User rank based on engagement (Bronze, Silver, Gold, Platinum) |

---

## Contact & Support

For technical support or questions:
- **Email**: support@loopync.com
- **Documentation**: https://docs.loopync.com
- **API Status**: https://status.loopync.com

---

**Document Version**: 1.0  
**Last Updated**: November 9, 2024  
**Maintained By**: Loopync Development Team
