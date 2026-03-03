import json

from bson import ObjectId
from pymongo import MongoClient

# ====== CONFIG ======
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "furniture-e-commerce"
COLLECTION_NAME = "product"
DATA_FILE = "products.json"

# ====== CONNECT ======
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

# ====== LOAD DATA ======
with open(DATA_FILE, "r", encoding="utf-8") as f:
    products = json.load(f)

documents = []

for p in products:
    doc = {
        "product_name": p["product_name"],
        "brand": ObjectId(p["brand"]) if p.get("brand") else None,
        "description": p.get("description"),
        "tags": [ObjectId(t) for t in p.get("tags", [])],
        "discount_percent": p.get("discount_percent", 0),
        "is_assembly": p.get("is_assembly", False),
        "product_component": p.get("product_component"),
        "warranty": p.get("warranty"),
        "important_functions": p.get("important_functions", []),
        "categories": [ObjectId(c) for c in p.get("categories", [])],
    }

    documents.append(doc)

# ====== INSERT ======
if documents:
    result = collection.insert_many(documents)
    print(f"✅ Inserted {len(result.inserted_ids)} products")
else:
    print("⚠️ No data to insert")
