# Media Storage System - MongoDB-Based Persistent Storage

## Overview
This application uses **MongoDB-based media storage** to ensure all uploaded media (images, videos) persist across deployments. All media files are stored as base64-encoded strings in MongoDB, eliminating dependency on ephemeral local file storage.

## Architecture

### How It Works
1. **Upload**: When a user uploads media, it's converted to base64 and stored in MongoDB
2. **Storage**: Media stored in `media_files` collection with metadata
3. **Serving**: Media served via `/api/media/{file_id}` endpoint
4. **URLs**: All media URLs are **relative paths** (e.g., `/api/media/{id}`)

### Why Relative URLs?
- **Deployment Flexibility**: Works on any domain without URL updates
- **No Hardcoding**: No need to update database when changing domains
- **Future-Proof**: Compatible with all deployment environments

## Key Components

### 1. Backend Upload Endpoint (`/api/upload`)
```python
# Located in: backend/server.py
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Converts file to base64
    # Stores in MongoDB media_files collection
    # Returns RELATIVE URL: /api/media/{file_id}
```

### 2. Backend Serve Endpoint (`/api/media/{file_id}`)
```python
# Located in: backend/server.py
@api_router.get("/media/{file_id}")
async def serve_media_file(file_id: str):
    # Retrieves file from MongoDB
    # Decodes base64
    # Serves with proper content-type
```

### 3. Frontend Media Utils
```javascript
// Located in: frontend/src/utils/mediaUtils.js
export const getMediaUrl = (mediaUrl) => {
    // Converts relative URLs to absolute
    // Prepends REACT_APP_BACKEND_URL
    // Returns full URL for browser
}
```

## Database Schema

### media_files Collection
```json
{
  "id": "uuid-v4",
  "filename": "original_filename.ext",
  "content_type": "image/png",
  "file_extension": "png",
  "file_data": "base64_encoded_string",
  "file_size": 12345,
  "uploaded_at": "2025-11-03T06:00:00Z"
}
```

### posts Collection (media field)
```json
{
  "id": "post-uuid",
  "text": "Post content",
  "media": "/api/media/file-uuid",  // Relative URL
  ...
}
```

### reels Collection (videoUrl field)
```json
{
  "id": "reel-uuid",
  "videoUrl": "/api/media/file-uuid",  // Relative URL
  ...
}
```

### vibe_capsules Collection (mediaUrl field)
```json
{
  "id": "capsule-uuid",
  "mediaUrl": "/api/media/file-uuid",  // Relative URL
  ...
}
```

## File Size Limits

- **Maximum file size**: 15MB
- **Reason**: MongoDB document limit is 16MB (leaving 1MB for metadata)
- **For larger files**: Consider implementing GridFS or cloud storage (Cloudinary)

## Deployment Process

### When Deploying to New Domain:

1. **No database updates needed** ✅
   - All URLs are relative paths
   - Automatically work on new domain

2. **Update environment variables**:
   ```bash
   # frontend/.env
   REACT_APP_BACKEND_URL=https://your-new-domain.com
   
   # backend/.env
   FRONTEND_URL=https://your-new-domain.com
   ```

3. **Media automatically works** ✅
   - Relative URLs resolve to new domain
   - MongoDB data persists
   - No migration needed

## Migration Scripts

### Migrate Existing Files to MongoDB
```bash
# Run this script to migrate files from /app/backend/uploads/ to MongoDB
python3 /tmp/migrate_media.py
```

### Convert Absolute URLs to Relative
```bash
# Run this to fix any absolute URLs in database
python3 /tmp/fix_urls_relative.py
```

## Testing

### Test Upload
```bash
curl -X POST https://your-domain.com/api/upload \
  -F "file=@test.png"
  
# Returns: {"url": "/api/media/uuid", ...}
```

### Test Serving
```bash
curl https://your-domain.com/api/media/uuid

# Returns: Binary image/video data with proper content-type
```

### Test Frontend
```javascript
// Media URLs are automatically converted
const fullUrl = getMediaUrl("/api/media/uuid");
// Returns: "https://your-domain.com/api/media/uuid"
```

## Troubleshooting

### Media Not Displaying After Deployment?

1. **Check environment variables**:
   ```bash
   # Verify REACT_APP_BACKEND_URL is set correctly
   echo $REACT_APP_BACKEND_URL
   ```

2. **Check database URLs**:
   ```javascript
   // Should be relative paths like "/api/media/uuid"
   // NOT absolute like "https://old-domain.com/api/media/uuid"
   ```

3. **Run URL fix script**:
   ```bash
   python3 /tmp/fix_urls_relative.py
   ```

### Files Too Large?

For files >15MB, options:
1. Implement MongoDB GridFS
2. Use Cloudinary cloud storage
3. Compress files before upload

## Advantages

✅ **Persistent**: Survives all deployments
✅ **Portable**: Works on any domain
✅ **Simple**: No external dependencies
✅ **Fast**: Cached responses (1-year cache headers)
✅ **Reliable**: MongoDB replication ensures availability

## Limitations

⚠️ **File Size**: 15MB maximum per file
⚠️ **Performance**: Large files can impact MongoDB performance
⚠️ **Bandwidth**: All media served through backend (consider CDN for production)

## Future Enhancements

- [ ] Implement MongoDB GridFS for files >15MB
- [ ] Add image compression/optimization
- [ ] Add Cloudinary as optional storage backend
- [ ] Implement CDN caching layer
- [ ] Add video transcoding support

---

**Last Updated**: November 3, 2025
**Version**: 1.0.0
