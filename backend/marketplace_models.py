"""
Marketplace Models for E-commerce functionality
Includes: Products, Cart, Orders, Delivery Integration
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
import uuid


class Product(BaseModel):
    """Product model for marketplace"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sellerId: str
    sellerName: str = ""
    name: str
    description: str = ""
    price: float
    comparePrice: Optional[float] = None  # Original price for discount display
    category: str = "General"
    subCategory: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    stock: int = 0
    sku: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    specifications: dict = Field(default_factory=dict)  # {"Color": "Blue", "Size": "M"}
    weight: Optional[float] = None  # in kg for shipping
    dimensions: Optional[dict] = None  # {"length": 10, "width": 5, "height": 3} in cm
    status: str = "active"  # active, draft, out_of_stock
    rating: float = 0.0
    reviewCount: int = 0
    views: int = 0
    sales: int = 0
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ProductCreate(BaseModel):
    name: str
    description: str = ""
    price: float
    comparePrice: Optional[float] = None
    category: str = "General"
    subCategory: Optional[str] = None
    images: List[str] = []
    stock: int = 0
    sku: Optional[str] = None
    tags: List[str] = []
    specifications: dict = {}
    weight: Optional[float] = None
    dimensions: Optional[dict] = None


class CartItem(BaseModel):
    """Cart item model"""
    productId: str
    quantity: int = 1
    price: float
    productName: str = ""
    productImage: str = ""


class Cart(BaseModel):
    """Shopping cart model"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    items: List[CartItem] = Field(default_factory=list)
    total: float = 0.0
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ShippingAddress(BaseModel):
    """Shipping address"""
    name: str
    phone: str
    addressLine1: str
    addressLine2: Optional[str] = None
    city: str
    state: str
    pincode: str
    country: str = "India"
    isDefault: bool = False


class OrderItem(BaseModel):
    """Order item"""
    productId: str
    productName: str
    productImage: str
    quantity: int
    price: float
    total: float
    sellerId: str


class DeliveryInfo(BaseModel):
    """Delivery tracking information"""
    partner: str = "shiprocket"  # shiprocket or delhivery
    trackingId: Optional[str] = None
    awb: Optional[str] = None  # Air Waybill number
    courierName: Optional[str] = None
    estimatedDelivery: Optional[str] = None
    currentStatus: str = "pending"
    statusHistory: List[dict] = Field(default_factory=list)
    # statusHistory format: [{"status": "picked", "timestamp": "...", "location": "..."}]


class Order(BaseModel):
    """Order model"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    orderNumber: str = Field(default_factory=lambda: f"ORD{uuid.uuid4().hex[:8].upper()}")
    userId: str
    items: List[OrderItem] = Field(default_factory=list)
    subtotal: float = 0.0
    shippingCost: float = 0.0
    tax: float = 0.0
    discount: float = 0.0
    total: float = 0.0
    shippingAddress: Optional[ShippingAddress] = None
    billingAddress: Optional[ShippingAddress] = None
    paymentMethod: str = "wallet"  # wallet, razorpay, cod
    paymentStatus: str = "pending"  # pending, paid, failed, refunded
    paymentId: Optional[str] = None
    orderStatus: str = "placed"  # placed, confirmed, processing, shipped, delivered, cancelled, returned
    deliveryInfo: Optional[DeliveryInfo] = None
    notes: Optional[str] = None
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class OrderCreate(BaseModel):
    items: List[CartItem]
    shippingAddress: ShippingAddress
    billingAddress: Optional[ShippingAddress] = None
    paymentMethod: str = "wallet"
    notes: Optional[str] = None


class ProductReview(BaseModel):
    """Product review model"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    productId: str
    userId: str
    userName: str = ""
    userAvatar: str = ""
    rating: int = 5  # 1-5
    title: str = ""
    review: str = ""
    images: List[str] = Field(default_factory=list)
    helpful: int = 0
    verified: bool = False  # Verified purchase
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ReviewCreate(BaseModel):
    rating: int
    title: str = ""
    review: str = ""
    images: List[str] = []
