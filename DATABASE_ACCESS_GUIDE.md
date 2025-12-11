# LoopSync Database Access & Scalability Guide
## Version 1.0 | December 2025

---

## 📊 DATABASE OVERVIEW

### Connection Details
- **Database Type**: MongoDB 7.0.26
- **Connection URL**: `mongodb://localhost:27017`
- **Database Name**: `test_database`
- **Total Collections**: 33
- **Current Documents**: ~1,000

---

## 🔐 DATABASE ACCESS

### MongoDB Connection String
```
mongodb://localhost:27017/test_database
```

### For Production Deployment
When deployed on Emergent platform, use environment variable:
```python
import os
MONGO_URL = os.environ.get('MONGO_URL')
```

### Using MongoDB Compass (GUI Tool)
1. Download MongoDB Compass from: https://www.mongodb.com/products/compass
2. Connect using: `mongodb://localhost:27017`
3. Select database: `test_database`

### Using MongoDB Shell
```bash
mongosh "mongodb://localhost:27017/test_database"
```

---

## 📁 COLLECTION STRUCTURE

### Core Collections

| Collection | Purpose | Indexed Fields |
|------------|---------|----------------|
| `users` | User accounts | email, handle, id, createdAt, isVerified |
| `posts` | User posts | authorId, createdAt, likes |
| `reels` | Short videos (VibeZone) | authorId, createdAt, views |
| `comments` | Post/Reel comments | postId, authorId, createdAt |
| `messages` | Direct messages | threadId, senderId, createdAt |
| `dm_messages` | DM messages | threadId, createdAt |
| `dm_threads` | DM conversation threads | participants |
| `notifications` | User notifications | userId, createdAt, read |

### Social Features

| Collection | Purpose |
|------------|---------|
| `friend_requests` | Friend request management |
| `friendships` | Confirmed friendships |
| `tribes` | Community groups |
| `vibe_rooms` | Live audio rooms |
| `room_messages` | Vibe room chat messages |

### User Data

| Collection | Purpose |
|------------|---------|
| `user_settings` | User preferences |
| `user_interests` | User interests/hobbies |
| `user_analytics` | Usage analytics |
| `user_consents` | Privacy consents |
| `taste_dna` | Music/content preferences |
| `trust_circles` | Close friends circles |

### Content & Media

| Collection | Purpose |
|------------|---------|
| `media_files` | Uploaded files metadata |
| `vibe_capsules` | Time capsule content |
| `bookmarks` | Saved posts/reels |

### Business & Verification

| Collection | Purpose |
|------------|---------|
| `verification_requests` | Verification applications |
| `creators` | Creator profiles |
| `pages` | Business pages |
| `venues` | Location data |
| `events` | Event listings |
| `event_tickets` | Ticket purchases |

### Financial

| Collection | Purpose |
|------------|---------|
| `loop_credits` | Virtual currency |
| `wallet_transactions` | Payment history |
| `orders` | Purchase orders |

---

## 📈 SCALABILITY ANALYSIS FOR 100K USERS

### Current Capacity Assessment

✅ **MongoDB is CAPABLE of handling 100K+ users**

MongoDB is designed for horizontal scalability and can easily handle millions of documents.

### Estimated Data for 100K Users

| Data Type | Per User | 100K Users Total |
|-----------|----------|------------------|
| User Profile | ~2 KB | ~200 MB |
| Posts (avg 50/user) | ~1 KB each | ~5 GB |
| Reels (avg 10/user) | ~2 KB each | ~2 GB |
| Messages (avg 500/user) | ~0.5 KB each | ~25 GB |
| Media Metadata | ~1 KB each | ~10 GB |
| **Total Estimated** | | **~42 GB** |

### Storage Recommendations

| User Scale | Recommended Storage | MongoDB Config |
|------------|---------------------|----------------|
| 10K users | 10 GB | Standalone |
| 50K users | 25 GB | Standalone |
| 100K users | 50 GB | Standalone/Replica Set |
| 500K+ users | 200+ GB | Sharded Cluster |

### Performance Optimizations Applied ✅

1. **Compound Indexes** - For common query patterns
2. **Single Field Indexes** - For frequently filtered fields
3. **Text Indexes** - For search functionality
4. **TTL Indexes** - For auto-expiring data (notifications, sessions)

---

## 🚀 PRODUCTION READINESS CHECKLIST

### ✅ Completed
- [x] All collections created
- [x] Indexes optimized for read/write performance
- [x] User authentication (JWT)
- [x] Email uniqueness enforced
- [x] Handle uniqueness enforced
- [x] Real-time WebSocket connections
- [x] File upload handling
- [x] Error logging

### 📋 Recommended for 100K Users

1. **Enable MongoDB Replica Set**
   - Provides high availability
   - Automatic failover
   - Read scaling

2. **Add Redis Cache**
   - Cache frequently accessed data
   - Session storage
   - Rate limiting

3. **CDN for Media**
   - Offload media serving
   - Faster content delivery

4. **Database Monitoring**
   - MongoDB Atlas monitoring
   - or Prometheus + Grafana

---

## 🔧 COMMON DATABASE OPERATIONS

### View All Users
```javascript
db.users.find({}, {email: 1, name: 1, handle: 1})
```

### Count Users
```javascript
db.users.countDocuments({})
```

### Find User by Email
```javascript
db.users.findOne({email: "user@example.com"})
```

### Get All Posts by User
```javascript
db.posts.find({authorId: "user-id-here"}).sort({createdAt: -1})
```

### Get Pending Verification Requests
```javascript
db.verification_requests.find({status: "pending"})
```

### Update User Role
```javascript
db.users.updateOne(
  {email: "admin@example.com"},
  {$set: {role: "super_admin", isAdmin: true}}
)
```

### Delete Test Data
```javascript
db.posts.deleteMany({content: /test/i})
db.vibe_rooms.deleteMany({})
```

---

## 📱 API ENDPOINTS FOR DATA ACCESS

### Base URL
```
https://your-app.preview.emergentagent.com/api
```

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/users` | GET | List all users |
| `/users/{id}` | GET | Get user by ID |
| `/posts` | GET | List all posts |
| `/posts` | POST | Create new post |
| `/reels` | GET | List all reels |
| `/tribes` | GET | List all tribes |
| `/admin/verification/requests` | GET | Get verification requests (admin) |

---

## 🛡️ SECURITY NOTES

1. **Never expose MongoDB directly to internet**
2. **Use environment variables for connection strings**
3. **Enable authentication in production**
4. **Regular backups recommended**
5. **Use SSL/TLS for connections**

---

## 📞 SUPPORT

For database issues or scaling questions:
- Check MongoDB documentation: https://docs.mongodb.com
- Emergent platform support for deployment issues

---

**Document Generated**: December 11, 2025
**Platform**: LoopSync Social Media App
**Database**: MongoDB 7.0.26
