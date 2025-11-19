"""
Seed Mock Data for Loopync Superapp
Creates realistic products and videos for testing
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone
import uuid

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_loopync')

# Mock Products Data
MOCK_PRODUCTS = [
    {
        "name": "Sony WH-1000XM5 Wireless Headphones",
        "description": "Industry-leading noise cancellation, exceptional sound quality. 30-hour battery life, multipoint connection.",
        "price": 29999,
        "comparePrice": 34999,
        "category": "Electronics",
        "images": ["https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500"],
        "stock": 25,
        "rating": 4.8,
        "reviewCount": 324
    },
    {
        "name": "Apple AirPods Pro (2nd Gen)",
        "description": "Active Noise Cancellation, Adaptive Transparency, Personalized Spatial Audio. USB-C charging.",
        "price": 24900,
        "comparePrice": 27900,
        "category": "Electronics",
        "images": ["https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=500"],
        "stock": 50,
        "rating": 4.9,
        "reviewCount": 892
    },
    {
        "name": "Samsung Galaxy Watch 6",
        "description": "Advanced sleep coaching, personalized heart rate zones, body composition tracking. 40mm Bluetooth.",
        "price": 27999,
        "comparePrice": 31999,
        "category": "Electronics",
        "images": ["https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500"],
        "stock": 30,
        "rating": 4.6,
        "reviewCount": 156
    },
    {
        "name": "Nike Air Max 270 React",
        "description": "Men's running shoes with Max Air unit, React foam. Breathable mesh upper. Perfect for daily wear.",
        "price": 8999,
        "comparePrice": 12999,
        "category": "Fashion",
        "images": ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500"],
        "stock": 45,
        "rating": 4.7,
        "reviewCount": 523
    },
    {
        "name": "Levi's 501 Original Fit Jeans",
        "description": "The original blue jean since 1873. Button fly, straight leg, sits at waist. Classic American style.",
        "price": 3499,
        "comparePrice": 4999,
        "category": "Fashion",
        "images": ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=500"],
        "stock": 100,
        "rating": 4.5,
        "reviewCount": 1247
    },
    {
        "name": "Ray-Ban Aviator Classic",
        "description": "Iconic teardrop shape, gold frame, gradient lenses. 100% UV protection. Timeless style.",
        "price": 8499,
        "comparePrice": 10999,
        "category": "Fashion",
        "images": ["https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500"],
        "stock": 35,
        "rating": 4.8,
        "reviewCount": 445
    },
    {
        "name": "Instant Pot Duo 7-in-1",
        "description": "Pressure cooker, slow cooker, rice cooker, steamer, sauté, yogurt maker. 6 Quart capacity.",
        "price": 7999,
        "comparePrice": 9999,
        "category": "Home",
        "images": ["https://images.unsplash.com/photo-1585515320310-259814833e62?w=500"],
        "stock": 20,
        "rating": 4.7,
        "reviewCount": 2341
    },
    {
        "name": "Dyson V11 Cordless Vacuum",
        "description": "Intelligent cleaning with LCD screen, 60 minutes run time, advanced filtration. Transforms to handheld.",
        "price": 39999,
        "comparePrice": 44999,
        "category": "Home",
        "images": ["https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500"],
        "stock": 15,
        "rating": 4.9,
        "reviewCount": 678
    },
    {
        "name": "Kindle Paperwhite (16 GB)",
        "description": "Waterproof e-reader, 6.8\" display, adjustable warm light, weeks of battery life. Access to millions of books.",
        "price": 13999,
        "comparePrice": 15999,
        "category": "Books",
        "images": ["https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=500"],
        "stock": 40,
        "rating": 4.8,
        "reviewCount": 3456
    },
    {
        "name": "Atomic Habits by James Clear",
        "description": "Tiny Changes, Remarkable Results. #1 New York Times bestseller. Transform your habits, transform your life.",
        "price": 499,
        "comparePrice": 799,
        "category": "Books",
        "images": ["https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500"],
        "stock": 200,
        "rating": 4.9,
        "reviewCount": 12458
    },
    {
        "name": "Wilson Evolution Basketball",
        "description": "Official size and weight. Cushion Core Technology, moisture-wicking cover. Indoor game ball.",
        "price": 4999,
        "comparePrice": 6499,
        "category": "Sports",
        "images": ["https://images.unsplash.com/photo-1519861531473-9200262188bf?w=500"],
        "stock": 55,
        "rating": 4.8,
        "reviewCount": 2341
    },
    {
        "name": "Yoga Mat Premium 6mm",
        "description": "Non-slip surface, extra thick cushioning, eco-friendly TPE material. Includes carrying strap.",
        "price": 1999,
        "comparePrice": 2999,
        "category": "Sports",
        "images": ["https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500"],
        "stock": 80,
        "rating": 4.6,
        "reviewCount": 892
    },
    {
        "name": "Fenty Beauty Pro Filt'r Foundation",
        "description": "Soft matte, long-wear foundation. 50 shades, buildable coverage. Oil-free, transfer-resistant.",
        "price": 2999,
        "comparePrice": 3499,
        "category": "Beauty",
        "images": ["https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500"],
        "stock": 120,
        "rating": 4.7,
        "reviewCount": 5678
    },
    {
        "name": "The Ordinary Niacinamide 10% + Zinc 1%",
        "description": "High-strength vitamin and mineral formula. Reduces blemishes, balances oil production. Vegan, cruelty-free.",
        "price": 599,
        "comparePrice": 899,
        "category": "Beauty",
        "images": ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500"],
        "stock": 250,
        "rating": 4.9,
        "reviewCount": 8934
    },
    {
        "name": "LEGO Star Wars Millennium Falcon",
        "description": "7541 pieces, detailed interior, rotating gun turrets. Includes 8 minifigures. For ages 16+.",
        "price": 64999,
        "comparePrice": 74999,
        "category": "Toys",
        "images": ["https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500"],
        "stock": 8,
        "rating": 5.0,
        "reviewCount": 445
    },
    {
        "name": "PlayStation 5 Console",
        "description": "Ultra-high speed SSD, ray tracing, 4K gaming. Includes DualSense wireless controller. Digital Edition.",
        "price": 44990,
        "comparePrice": 49990,
        "category": "Electronics",
        "images": ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500"],
        "stock": 12,
        "rating": 4.9,
        "reviewCount": 2341
    },
    {
        "name": "MacBook Air M2",
        "description": "13.6\" Liquid Retina display, M2 chip, 8GB RAM, 256GB SSD. All-day battery life. Midnight color.",
        "price": 114900,
        "comparePrice": 119900,
        "category": "Electronics",
        "images": ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500"],
        "stock": 18,
        "rating": 4.9,
        "reviewCount": 1234
    },
    {
        "name": "Minimalist Leather Wallet",
        "description": "Genuine leather, RFID blocking, holds 8-12 cards. Slim design fits in front pocket. Handcrafted.",
        "price": 1499,
        "comparePrice": 2499,
        "category": "Fashion",
        "images": ["https://images.unsplash.com/photo-1627123424574-724758594e93?w=500"],
        "stock": 95,
        "rating": 4.6,
        "reviewCount": 567
    }
]

# Mock Videos Data
MOCK_VIDEOS = [
    {
        "title": "iPhone 15 Pro Review: Is It Worth The Upgrade?",
        "description": "Complete review of the iPhone 15 Pro covering design, performance, cameras, battery life, and whether you should upgrade.",
        "category": "Tech",
        "thumbnailUrl": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500",
        "videoUrl": "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "duration": 845,
        "views": 125000,
        "likes": 8500,
        "commentCount": 432
    },
    {
        "title": "10 Minute Morning Yoga Flow",
        "description": "Start your day right with this energizing yoga sequence. Perfect for beginners. All you need is a mat!",
        "category": "Sports",
        "thumbnailUrl": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500",
        "videoUrl": "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        "duration": 615,
        "views": 89000,
        "likes": 6200,
        "commentCount": 245
    },
    {
        "title": "How To Make Perfect Pasta Carbonara",
        "description": "Authentic Italian carbonara recipe. Simple ingredients, restaurant-quality results. No cream needed!",
        "category": "Lifestyle",
        "thumbnailUrl": "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500",
        "videoUrl": "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "duration": 425,
        "views": 234000,
        "likes": 15600,
        "commentCount": 892
    },
    {
        "title": "Learning JavaScript in 2024 - Complete Roadmap",
        "description": "Everything you need to know to master JavaScript. From basics to advanced concepts, frameworks, and getting hired.",
        "category": "Education",
        "thumbnailUrl": "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=500",
        "videoUrl": "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        "duration": 1845,
        "views": 456000,
        "likes": 34500,
        "commentCount": 1234
    },
    {
        "title": "Epic Gaming Montage - Best Moments 2024",
        "description": "Insane plays, clutch moments, and epic wins from this year. Featuring Valorant, Apex, and Fortnite.",
        "category": "Gaming",
        "thumbnailUrl": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=500",
        "videoUrl": "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        "duration": 325,
        "views": 678000,
        "likes": 45600,
        "commentCount": 2341
    },
    {
        "title": "My Morning Routine for Success",
        "description": "How I structure my mornings to be productive and happy. Wake up at 5 AM, exercise, meditation, and planning.",
        "category": "Lifestyle",
        "thumbnailUrl": "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=500",
        "videoUrl": "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        "duration": 735,
        "views": 345000,
        "likes": 23400,
        "commentCount": 1567
    },
    {
        "title": "Bitcoin & Crypto Market Update",
        "description": "Latest news, price analysis, and what to expect. Technical analysis of BTC, ETH, and top altcoins.",
        "category": "News",
        "thumbnailUrl": "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=500",
        "videoUrl": "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        "duration": 925,
        "views": 567000,
        "likes": 38900,
        "commentCount": 3456
    },
    {
        "title": "Top 10 Travel Destinations 2024",
        "description": "Incredible places you MUST visit this year. Hidden gems, popular spots, budget tips. Let's explore!",
        "category": "Entertainment",
        "thumbnailUrl": "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500",
        "videoUrl": "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        "duration": 1125,
        "views": 892000,
        "likes": 67800,
        "commentCount": 4532
    },
    {
        "title": "Full Body Home Workout - No Equipment",
        "description": "30-minute intense workout you can do anywhere. Build muscle, burn fat, get strong. Follow along!",
        "category": "Sports",
        "thumbnailUrl": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500",
        "videoUrl": "https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
        "duration": 1845,
        "views": 234000,
        "likes": 18900,
        "commentCount": 892
    },
    {
        "title": "Building My Dream Setup - Room Tour 2024",
        "description": "Complete tech setup tour. PC build, peripherals, desk setup, cable management tips. Links in description!",
        "category": "Tech",
        "thumbnailUrl": "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=500",
        "videoUrl": "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        "duration": 965,
        "views": 445000,
        "likes": 34500,
        "commentCount": 2134
    },
    {
        "title": "Learn Python in 1 Hour - Crash Course",
        "description": "Complete Python basics for absolute beginners. Variables, loops, functions, and first project. Let's code!",
        "category": "Education",
        "thumbnailUrl": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500",
        "videoUrl": "https://storage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
        "duration": 3645,
        "views": 1234000,
        "likes": 89000,
        "commentCount": 5678
    },
    {
        "title": "Unboxing Latest Sneaker Drop",
        "description": "Finally got my hands on these! Unboxing, on-feet review, styling tips. Worth the hype?",
        "category": "Lifestyle",
        "thumbnailUrl": "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=500",
        "videoUrl": "https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
        "duration": 485,
        "views": 167000,
        "likes": 12300,
        "commentCount": 678
    }
]

async def seed_database():
    """Seed database with mock data"""
    print("🌱 Starting database seeding...")
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        # Get demo user
        demo_user = await db.users.find_one({"email": "demo@loopync.com"}, {"_id": 0})
        if not demo_user:
            print("❌ Demo user not found. Please login first.")
            return
        
        user_id = demo_user["id"]
        print(f"✅ Found demo user: {demo_user['name']}")
        
        # Clear existing mock data
        await db.products.delete_many({"sellerId": user_id})
        await db.videos.delete_many({"userId": user_id})
        await db.channels.delete_many({"userId": user_id})
        print("🗑️  Cleared old mock data")
        
        # Create channel for videos
        channel = {
            "id": str(uuid.uuid4()),
            "userId": user_id,
            "handle": "@loopync",
            "name": "Loopync Channel",
            "description": "Official Loopync content - Tech, lifestyle, tutorials, and more!",
            "avatar": demo_user.get("avatar", ""),
            "banner": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200",
            "subscribers": 45600,
            "totalViews": 5678000,
            "totalVideos": 0,
            "verified": True,
            "category": "Entertainment",
            "socialLinks": {},
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        await db.channels.insert_one(channel)
        print(f"📺 Created channel: {channel['name']}")
        
        # Insert mock products
        products_inserted = 0
        for product_data in MOCK_PRODUCTS:
            product = {
                "id": str(uuid.uuid4()),
                "sellerId": user_id,
                "sellerName": demo_user.get("name", "Demo Seller"),
                **product_data,
                "tags": [],
                "specifications": {},
                "weight": 1.0,
                "dimensions": {"length": 10, "width": 10, "height": 10},
                "status": "active",
                "sku": f"SKU{uuid.uuid4().hex[:8].upper()}",
                "sales": 0,
                "views": 0,
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "updatedAt": datetime.now(timezone.utc).isoformat()
            }
            await db.products.insert_one(product)
            products_inserted += 1
        
        print(f"🛍️  Inserted {products_inserted} products")
        
        # Insert mock videos
        videos_inserted = 0
        for video_data in MOCK_VIDEOS:
            video = {
                "id": str(uuid.uuid4()),
                "channelId": channel["id"],
                "userId": user_id,
                **video_data,
                "tags": [],
                "visibility": "public",
                "likedBy": [],
                "dislikedBy": [],
                "dislikes": 0,
                "status": "published",
                "isPremium": False,
                "price": None,
                "quality": ["720p", "480p", "360p"],
                "uploadedAt": datetime.now(timezone.utc).isoformat(),
                "publishedAt": datetime.now(timezone.utc).isoformat()
            }
            await db.videos.insert_one(video)
            videos_inserted += 1
        
        # Update channel video count
        await db.channels.update_one(
            {"id": channel["id"]},
            {"$set": {"totalVideos": videos_inserted}}
        )
        
        print(f"📹 Inserted {videos_inserted} videos")
        
        print("\n✅ Database seeding completed successfully!")
        print(f"   - Products: {products_inserted}")
        print(f"   - Videos: {videos_inserted}")
        print(f"   - Channel: 1")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
