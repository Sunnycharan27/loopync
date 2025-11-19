"""
Marketplace & Video Streaming API Routes
Complete implementation for E-commerce and YouTube-like platform
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Query
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import os

from marketplace_models import (
    Product, ProductCreate, Cart, CartItem, Order, OrderCreate,
    ProductReview, ReviewCreate, ShippingAddress, DeliveryInfo, OrderItem
)
from video_models import (
    Channel, ChannelCreate, Video, VideoCreate, VideoComment, CommentCreate,
    Subscription, Playlist, PlaylistCreate, LiveStream, LiveStreamCreate,
    LiveStreamChat, WatchHistory
)
from delivery_service import delivery_service

# This router will be included in main server.py
# Database will be injected via dependency
marketplace_video_router = APIRouter()

# Database will be set by server.py
db = None

def get_db():
    """Dependency to get database instance"""
    return db


# ========================================
# MARKETPLACE ROUTES
# ========================================

@marketplace_video_router.get("/products")
async def get_products(
    db: AsyncIOMotorDatabase,
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: str = "createdAt",
    limit: int = 50,
    skip: int = 0
):
    """Get products with filters"""
    query = {"status": "active"}
    
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price
    
    sort_order = -1 if sort_by == "createdAt" else 1
    products = await db.products.find(query, {"_id": 0}).sort(sort_by, sort_order).skip(skip).limit(limit).to_list(limit)
    
    return products


@marketplace_video_router.post("/products")
async def create_product(product: ProductCreate, sellerId: str, db: AsyncIOMotorDatabase):
    """Create a new product"""
    # Get seller info
    seller = await db.users.find_one({"id": sellerId}, {"_id": 0})
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    
    product_obj = Product(
        sellerId=sellerId,
        sellerName=seller.get("name", ""),
        **product.model_dump()
    )
    
    await db.products.insert_one(product_obj.model_dump())
    return product_obj


@marketplace_video_router.get("/products/{productId}")
async def get_product(productId: str, db: AsyncIOMotorDatabase):
    """Get product details"""
    product = await db.products.find_one({"id": productId}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Increment view count
    await db.products.update_one({"id": productId}, {"$inc": {"views": 1}})
    
    # Get reviews
    reviews = await db.product_reviews.find({"productId": productId}, {"_id": 0}).sort("createdAt", -1).limit(10).to_list(10)
    product["reviews"] = reviews
    
    return product


@marketplace_video_router.put("/products/{productId}")
async def update_product(productId: str, updates: dict, sellerId: str, db: AsyncIOMotorDatabase):
    """Update product"""
    product = await db.products.find_one({"id": productId}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product["sellerId"] != sellerId:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    updates["updatedAt"] = datetime.now(timezone.utc).isoformat()
    await db.products.update_one({"id": productId}, {"$set": updates})
    return {"success": True}


@marketplace_video_router.get("/cart/{userId}")
async def get_cart(userId: str, db: AsyncIOMotorDatabase):
    """Get user's cart"""
    cart = await db.carts.find_one({"userId": userId}, {"_id": 0})
    if not cart:
        return {"userId": userId, "items": [], "total": 0}
    return cart


@marketplace_video_router.post("/cart/{userId}/add")
async def add_to_cart(userId: str, item: CartItem, db: AsyncIOMotorDatabase):
    """Add item to cart"""
    # Get product details
    product = await db.products.find_one({"id": item.productId}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check stock
    if product["stock"] < item.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    # Update cart
    cart = await db.carts.find_one({"userId": userId}, {"_id": 0})
    
    if not cart:
        cart = {
            "id": str(uuid.uuid4()),
            "userId": userId,
            "items": [],
            "total": 0,
            "updatedAt": datetime.now(timezone.utc).isoformat()
        }
    
    # Check if item already in cart
    existing_item = None
    for i, cart_item in enumerate(cart["items"]):
        if cart_item["productId"] == item.productId:
            existing_item = i
            break
    
    if existing_item is not None:
        cart["items"][existing_item]["quantity"] += item.quantity
    else:
        cart["items"].append({
            "productId": item.productId,
            "quantity": item.quantity,
            "price": product["price"],
            "productName": product["name"],
            "productImage": product["images"][0] if product["images"] else ""
        })
    
    # Calculate total
    cart["total"] = sum(item["price"] * item["quantity"] for item in cart["items"])
    cart["updatedAt"] = datetime.now(timezone.utc).isoformat()
    
    await db.carts.update_one(
        {"userId": userId},
        {"$set": cart},
        upsert=True
    )
    
    return cart


@marketplace_video_router.delete("/cart/{userId}/remove/{productId}")
async def remove_from_cart(userId: str, productId: str, db: AsyncIOMotorDatabase):
    """Remove item from cart"""
    result = await db.carts.update_one(
        {"userId": userId},
        {"$pull": {"items": {"productId": productId}}}
    )
    
    # Recalculate total
    cart = await db.carts.find_one({"userId": userId}, {"_id": 0})
    if cart:
        cart["total"] = sum(item["price"] * item["quantity"] for item in cart["items"])
        await db.carts.update_one({"userId": userId}, {"$set": {"total": cart["total"]}})
    
    return {"success": True}


@marketplace_video_router.post("/orders")
async def create_order(order_data: OrderCreate, userId: str, db: AsyncIOMotorDatabase):
    """Create order and initiate delivery"""
    # Get user
    user = await db.users.find_one({"id": userId}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate totals
    subtotal = sum(item.price * item.quantity for item in order_data.items)
    
    # Get shipping rate (mock)
    shipping_rate = delivery_service.get_shipping_rate(
        partner="shiprocket",
        pickup_pincode="110001",  # Default seller pincode
        delivery_pincode=order_data.shippingAddress.pincode,
        weight=1.0,  # Default weight
        dimensions={"length": 10, "width": 10, "height": 10},
        payment_method=order_data.paymentMethod
    )
    
    shipping_cost = shipping_rate["total"]
    tax = subtotal * 0.18  # 18% GST
    total = subtotal + shipping_cost + tax
    
    # Check wallet balance if payment method is wallet
    if order_data.paymentMethod == "wallet":
        if user.get("walletBalance", 0) < total:
            raise HTTPException(status_code=400, detail="Insufficient wallet balance")
    
    # Create order items
    order_items = []
    for item in order_data.items:
        product = await db.products.find_one({"id": item.productId}, {"_id": 0})
        order_items.append(OrderItem(
            productId=item.productId,
            productName=product["name"],
            productImage=product["images"][0] if product["images"] else "",
            quantity=item.quantity,
            price=item.price,
            total=item.price * item.quantity,
            sellerId=product["sellerId"]
        ))
    
    # Create order
    order = Order(
        userId=userId,
        items=order_items,
        subtotal=subtotal,
        shippingCost=shipping_cost,
        tax=tax,
        total=total,
        shippingAddress=order_data.shippingAddress,
        billingAddress=order_data.billingAddress or order_data.shippingAddress,
        paymentMethod=order_data.paymentMethod,
        paymentStatus="paid" if order_data.paymentMethod == "wallet" else "pending",
        orderStatus="placed",
        notes=order_data.notes
    )
    
    # Deduct from wallet
    if order_data.paymentMethod == "wallet":
        await db.users.update_one(
            {"id": userId},
            {"$inc": {"walletBalance": -total}}
        )
        order.paymentStatus = "paid"
    
    # Create shipment
    try:
        shipment = await delivery_service.create_shipment(
            partner="shiprocket",
            order_id=order.orderNumber,
            items=[{"name": item.productName, "quantity": item.quantity} for item in order_items],
            pickup_address={"location_name": "Default Store"},  # Use seller's address in production
            delivery_address=order_data.shippingAddress.model_dump(),
            weight=1.0,
            dimensions={"length": 10, "width": 10, "height": 10},
            payment_method="prepaid" if order_data.paymentMethod != "cod" else "cod"
        )
        
        order.deliveryInfo = DeliveryInfo(
            partner="shiprocket",
            trackingId=shipment["tracking_id"],
            awb=shipment["awb"],
            courierName=shipment["courier_name"],
            estimatedDelivery=shipment["estimated_delivery"],
            currentStatus="pickup_scheduled"
        )
        order.orderStatus = "confirmed"
        
    except Exception as e:
        print(f"Shipment creation failed: {e}")
        # Order still created, but shipment failed
    
    # Save order
    await db.orders.insert_one(order.model_dump())
    
    # Clear cart
    await db.carts.delete_one({"userId": userId})
    
    # Update product stock and sales
    for item in order_items:
        await db.products.update_one(
            {"id": item.productId},
            {
                "$inc": {"stock": -item.quantity, "sales": item.quantity}
            }
        )
    
    return order


@marketplace_video_router.get("/orders/{userId}")
async def get_user_orders(userId: str, db: AsyncIOMotorDatabase, limit: int = 50):
    """Get user's orders"""
    orders = await db.orders.find({"userId": userId}, {"_id": 0}).sort("createdAt", -1).limit(limit).to_list(limit)
    return orders


@marketplace_video_router.get("/orders/track/{orderId}")
async def track_order(orderId: str, db: AsyncIOMotorDatabase):
    """Track order delivery"""
    order = await db.orders.find_one({"id": orderId}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.get("deliveryInfo") and order["deliveryInfo"].get("awb"):
        tracking = await delivery_service.track_shipment(
            partner=order["deliveryInfo"]["partner"],
            awb=order["deliveryInfo"]["awb"]
        )
        order["deliveryInfo"]["statusHistory"] = tracking.get("status_history", [])
        order["deliveryInfo"]["currentStatus"] = tracking.get("current_status", "unknown")
        
        # Update in database
        await db.orders.update_one(
            {"id": orderId"},
            {"$set": {"deliveryInfo": order["deliveryInfo"]}}
        )
    
    return order


@marketplace_video_router.post("/products/{productId}/reviews")
async def add_review(productId: str, review: ReviewCreate, userId: str, db: AsyncIOMotorDatabase):
    """Add product review"""
    # Check if user purchased this product
    order = await db.orders.find_one({
        "userId": userId,
        "items.productId": productId,
        "orderStatus": "delivered"
    }, {"_id": 0})
    
    verified = order is not None
    
    # Get user info
    user = await db.users.find_one({"id": userId}, {"_id": 0})
    
    review_obj = ProductReview(
        productId=productId,
        userId=userId,
        userName=user.get("name", ""),
        userAvatar=user.get("avatar", ""),
        verified=verified,
        **review.model_dump()
    )
    
    await db.product_reviews.insert_one(review_obj.model_dump())
    
    # Update product rating
    all_reviews = await db.product_reviews.find({"productId": productId}, {"_id": 0}).to_list(None)
    avg_rating = sum(r["rating"] for r in all_reviews) / len(all_reviews)
    
    await db.products.update_one(
        {"id": productId},
        {"$set": {"rating": round(avg_rating, 1), "reviewCount": len(all_reviews)}}
    )
    
    return review_obj


# ========================================
# VIDEO STREAMING ROUTES
# ========================================

@marketplace_video_router.post("/channels")
async def create_channel(channel: ChannelCreate, userId: str, db: AsyncIOMotorDatabase):
    """Create a creator channel"""
    # Check if user already has a channel
    existing = await db.channels.find_one({"userId": userId}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Channel already exists")
    
    # Check if handle is available
    handle_exists = await db.channels.find_one({"handle": channel.handle}, {"_id": 0})
    if handle_exists:
        raise HTTPException(status_code=400, detail="Handle already taken")
    
    # Get user info
    user = await db.users.find_one({"id": userId}, {"_id": 0})
    
    channel_obj = Channel(
        userId=userId,
        avatar=user.get("avatar", ""),
        **channel.model_dump()
    )
    
    await db.channels.insert_one(channel_obj.model_dump())
    return channel_obj


@marketplace_video_router.get("/channels/{channelId}")
async def get_channel(channelId: str, db: AsyncIOMotorDatabase):
    """Get channel details"""
    channel = await db.channels.find_one({"id": channelId}, {"_id": 0})
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    # Get channel videos
    videos = await db.videos.find({"channelId": channelId, "status": "published"}, {"_id": 0}).sort("publishedAt", -1).limit(20).to_list(20)
    channel["videos"] = videos
    
    return channel


@marketplace_video_router.post("/videos")
async def upload_video(video: VideoCreate, userId: str, db: AsyncIOMotorDatabase):
    """Upload a video"""
    # Get user's channel
    channel = await db.channels.find_one({"userId": userId}, {"_id": 0})
    if not channel:
        raise HTTPException(status_code=404, detail="Create a channel first")
    
    video_obj = Video(
        channelId=channel["id"],
        userId=userId,
        publishedAt=datetime.now(timezone.utc).isoformat() if video.visibility == "public" else None,
        **video.model_dump()
    )
    
    await db.videos.insert_one(video_obj.model_dump())
    
    # Update channel stats
    await db.channels.update_one(
        {"id": channel["id"]},
        {"$inc": {"totalVideos": 1}}
    )
    
    return video_obj


@marketplace_video_router.get("/videos")
async def get_videos(
    db: AsyncIOMotorDatabase,
    category: Optional[str] = None,
    search: Optional[str] = None,
    channelId: Optional[str] = None,
    sort_by: str = "publishedAt",
    limit: int = 50,
    skip: int = 0
):
    """Get videos feed"""
    query = {"status": "published", "visibility": "public"}
    
    if category:
        query["category"] = category
    if channelId:
        query["channelId"] = channelId
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    videos = await db.videos.find(query, {"_id": 0}).sort(sort_by, -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with channel info
    for video in videos:
        channel = await db.channels.find_one({"id": video["channelId"]}, {"_id": 0})
        video["channel"] = channel
    
    return videos


@marketplace_video_router.get("/videos/{videoId}")
async def get_video(videoId: str, userId: Optional[str] = None, db: AsyncIOMotorDatabase):
    """Get video details"""
    video = await db.videos.find_one({"id": videoId}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Increment view count
    await db.videos.update_one({"id": videoId}, {"$inc": {"views": 1}})
    
    # Get channel info
    channel = await db.channels.find_one({"id": video["channelId"]}, {"_id": 0})
    video["channel"] = channel
    
    # Check if user liked
    if userId:
        video["isLiked"] = userId in video.get("likedBy", [])
        
        # Add to watch history
        watch_history = WatchHistory(
            userId=userId,
            videoId=videoId,
            channelId=video["channelId"]
        )
        await db.watch_history.insert_one(watch_history.model_dump())
    
    # Get comments
    comments = await db.video_comments.find({"videoId": videoId, "replyTo": None}, {"_id": 0}).sort("createdAt", -1).limit(20).to_list(20)
    video["comments"] = comments
    
    return video


@marketplace_video_router.post("/videos/{videoId}/like")
async def like_video(videoId: str, userId: str, db: AsyncIOMotorDatabase):
    """Like a video"""
    video = await db.videos.find_one({"id": videoId}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    liked_by = video.get("likedBy", [])
    
    if userId in liked_by:
        # Unlike
        await db.videos.update_one(
            {"id": videoId},
            {
                "$pull": {"likedBy": userId},
                "$inc": {"likes": -1}
            }
        )
        return {"liked": False}
    else:
        # Like
        await db.videos.update_one(
            {"id": videoId},
            {
                "$addToSet": {"likedBy": userId},
                "$inc": {"likes": 1},
                "$pull": {"dislikedBy": userId}  # Remove from dislike if present
            }
        )
        return {"liked": True}


@marketplace_video_router.post("/videos/{videoId}/comments")
async def add_comment(videoId: str, comment: CommentCreate, userId: str, db: AsyncIOMotorDatabase):
    """Add comment to video"""
    user = await db.users.find_one({"id": userId}, {"_id": 0})
    
    comment_obj = VideoComment(
        videoId=videoId,
        userId=userId,
        userName=user.get("name", ""),
        userAvatar=user.get("avatar", ""),
        **comment.model_dump()
    )
    
    await db.video_comments.insert_one(comment_obj.model_dump())
    
    # Update comment count
    await db.videos.update_one({"id": videoId}, {"$inc": {"commentCount": 1}})
    
    return comment_obj


@marketplace_video_router.post("/channels/{channelId}/subscribe")
async def subscribe_channel(channelId: str, userId: str, db: AsyncIOMotorDatabase):
    """Subscribe to a channel"""
    existing = await db.subscriptions.find_one({"userId": userId, "channelId": channelId}, {"_id": 0})
    
    if existing:
        # Unsubscribe
        await db.subscriptions.delete_one({"userId": userId, "channelId": channelId})
        await db.channels.update_one({"id": channelId}, {"$inc": {"subscribers": -1}})
        return {"subscribed": False}
    else:
        # Subscribe
        sub = Subscription(userId=userId, channelId=channelId)
        await db.subscriptions.insert_one(sub.model_dump())
        await db.channels.update_one({"id": channelId}, {"$inc": {"subscribers": 1}})
        return {"subscribed": True}


@marketplace_video_router.get("/subscriptions/{userId}")
async def get_subscriptions(userId: str, db: AsyncIOMotorDatabase):
    """Get user's subscriptions"""
    subs = await db.subscriptions.find({"userId": userId}, {"_id": 0}).to_list(None)
    
    channels = []
    for sub in subs:
        channel = await db.channels.find_one({"id": sub["channelId"]}, {"_id": 0})
        if channel:
            channels.append(channel)
    
    return channels


# ========================================
# LIVE STREAMING ROUTES
# ========================================

@marketplace_video_router.post("/livestreams")
async def create_livestream(stream: LiveStreamCreate, userId: str, db: AsyncIOMotorDatabase):
    """Create a live stream"""
    import os
    
    # Get user's channel
    channel = await db.channels.find_one({"userId": userId}, {"_id": 0})
    if not channel:
        raise HTTPException(status_code=404, detail="Create a channel first")
    
    # Create Agora channel for streaming
    agora_channel = f"livestream_{str(uuid.uuid4())[:8]}"
    agora_app_id = os.environ.get('AGORA_APP_ID', '')
    
    stream_obj = LiveStream(
        channelId=channel["id"],
        userId=userId,
        agoraChannel=agora_channel,
        agoraAppId=agora_app_id,
        **stream.model_dump()
    )
    
    await db.livestreams.insert_one(stream_obj.model_dump())
    return stream_obj


@marketplace_video_router.post("/livestreams/{streamId}/start")
async def start_livestream(streamId: str, userId: str, db: AsyncIOMotorDatabase):
    """Start a live stream"""
    stream = await db.livestreams.find_one({"id": streamId}, {"_id": 0})
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    if stream["userId"] != userId:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.livestreams.update_one(
        {"id": streamId},
        {
            "$set": {
                "status": "live",
                "startedAt": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"success": True, "agoraChannel": stream["agoraChannel"]}


@marketplace_video_router.get("/livestreams")
async def get_livestreams(db: AsyncIOMotorDatabase, status: str = "live"):
    """Get live streams"""
    streams = await db.livestreams.find({"status": status}, {"_id": 0}).sort("startedAt", -1).limit(50).to_list(50)
    
    # Enrich with channel info
    for stream in streams:
        channel = await db.channels.find_one({"id": stream["channelId"]}, {"_id": 0})
        stream["channel"] = channel
    
    return streams
