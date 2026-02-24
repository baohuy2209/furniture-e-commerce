from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["furniture-e-commerce"]
collection = db["productcategories"]  # mongoose auto lowercase

categories = [
    {"name": "Sofas", "type": "product_type"},
    {"name": "Chairs", "type": "product_type"},
    {"name": "Tables", "type": "product_type"},
    {"name": "Storage", "type": "product_type"},
    {"name": "Beds", "type": "product_type"},
    {"name": "Outdoor", "type": "product_type"},
    {"name": "Lamps", "type": "product_type"},
    {"name": "Rugs", "type": "product_type"},
    {"name": "Accessories", "type": "product_type"},
    {"name": "Living Room", "type": "room_type"},
    {"name": "Bedroom", "type": "room_type"},
    {"name": "Dining Room", "type": "room_type"},
    {"name": "Bathroom", "type": "room_type"},
    {"name": "Outdoor Space", "type": "room_type"},
]

collection.delete_many({"name": {"$in": [c["name"] for c in categories]}})
collection.insert_many(categories)

print("✅ Categories imported")
