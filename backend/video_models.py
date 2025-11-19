"""
Video Streaming Models (YouTube-like functionality)
Includes: Videos, Channels, Subscriptions, Live Streams
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
import uuid


class Channel(BaseModel):
    """Creator channel model"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    handle: str  # @username
    name: str
    description: str = ""
    avatar: str = ""
    banner: str = ""
    subscribers: int = 0
    totalViews: int = 0
    totalVideos: int = 0
    verified: bool = False
    category: str = "General"  # Education, Entertainment, Music, Gaming, etc.
    socialLinks: dict = Field(default_factory=dict)
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ChannelCreate(BaseModel):
    handle: str
    name: str
    description: str = ""
    category: str = "General"


class Video(BaseModel):
    """Video model"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    channelId: str
    userId: str
    title: str
    description: str = ""
    videoUrl: str
    thumbnailUrl: str = ""
    duration: int = 0  # in seconds
    category: str = "General"
    tags: List[str] = Field(default_factory=list)
    visibility: str = "public"  # public, unlisted, private
    views: int = 0
    likes: int = 0
    dislikes: int = 0
    commentCount: int = 0
    likedBy: List[str] = Field(default_factory=list)
    dislikedBy: List[str] = Field(default_factory=list)
    status: str = "published"  # draft, processing, published, blocked
    isPremium: bool = False
    price: Optional[float] = None  # For paid content
    quality: List[str] = Field(default_factory=lambda: ["720p", "480p", "360p"])
    uploadedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    publishedAt: Optional[str] = None


class VideoCreate(BaseModel):
    title: str
    description: str = ""
    videoUrl: str
    thumbnailUrl: str = ""
    duration: int = 0
    category: str = "General"
    tags: List[str] = []
    visibility: str = "public"
    isPremium: bool = False
    price: Optional[float] = None


class VideoComment(BaseModel):
    """Video comment model"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    videoId: str
    userId: str
    userName: str = ""
    userAvatar: str = ""
    text: str
    likes: int = 0
    likedBy: List[str] = Field(default_factory=list)
    replyTo: Optional[str] = None  # Parent comment ID
    replies: int = 0
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CommentCreate(BaseModel):
    text: str
    replyTo: Optional[str] = None


class Subscription(BaseModel):
    """Channel subscription model"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str  # Subscriber
    channelId: str  # Channel being subscribed to
    notificationsEnabled: bool = True
    subscribedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Playlist(BaseModel):
    """Video playlist model"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    title: str
    description: str = ""
    videoIds: List[str] = Field(default_factory=list)
    thumbnailUrl: str = ""
    visibility: str = "public"  # public, unlisted, private
    videoCount: int = 0
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class PlaylistCreate(BaseModel):
    title: str
    description: str = ""
    visibility: str = "public"


class LiveStream(BaseModel):
    """Live stream model"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    channelId: str
    userId: str
    title: str
    description: str = ""
    thumbnailUrl: str = ""
    category: str = "General"
    tags: List[str] = Field(default_factory=list)
    status: str = "scheduled"  # scheduled, live, ended
    agoraChannel: str = ""  # For live streaming via Agora
    agoraAppId: str = ""
    viewerCount: int = 0
    peakViewers: int = 0
    currentViewers: List[str] = Field(default_factory=list)  # User IDs currently watching
    likes: int = 0
    scheduledFor: Optional[str] = None
    startedAt: Optional[str] = None
    endedAt: Optional[str] = None
    recordingUrl: Optional[str] = None  # URL of recorded stream after it ends
    chatEnabled: bool = True
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class LiveStreamCreate(BaseModel):
    title: str
    description: str = ""
    thumbnailUrl: str = ""
    category: str = "General"
    tags: List[str] = []
    scheduledFor: Optional[str] = None
    chatEnabled: bool = True


class LiveStreamChat(BaseModel):
    """Live stream chat message"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    streamId: str
    userId: str
    userName: str = ""
    userAvatar: str = ""
    message: str
    type: str = "text"  # text, emoji, super_chat
    amount: Optional[float] = None  # For super chat
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class WatchHistory(BaseModel):
    """User's video watch history"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    videoId: str
    channelId: str
    watchedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    watchDuration: int = 0  # Seconds watched
    completed: bool = False
