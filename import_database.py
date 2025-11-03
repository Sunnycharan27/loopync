#!/usr/bin/env python3
"""
Database Import Script for Loopync
This imports all collections from JSON files to MongoDB
"""
import os
import json
from pymongo import MongoClient
from bson import json_util
import glob

def import_database(import_dir='/app/database_export'):
    """Import entire database from JSON files"""
    
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = MongoClient(mongo_url)
    db = client['test_database']
    
    print("="*60)
    print("IMPORTING DATABASE")
    print("="*60)
    
    # Check if export directory exists
    if not os.path.exists(import_dir):
        print(f"❌ Export directory not found: {import_dir}")
        return
    
    # Read manifest
    manifest_file = f"{import_dir}/manifest.json"
    if os.path.exists(manifest_file):
        with open(manifest_file, 'r') as f:
            manifest = json.load(f)
        print(f"\n📋 Manifest loaded:")
        print(f"   Export date: {manifest['export_date']}")
        print(f"   Collections: {manifest['total_collections']}")
        print(f"   Documents: {manifest['total_documents']}")
    
    # Import each collection
    json_files = glob.glob(f"{import_dir}/*.json")
    imported_collections = []
    total_imported = 0
    
    for json_file in json_files:
        if 'manifest.json' in json_file:
            continue
        
        collection_name = os.path.basename(json_file).replace('.json', '')
        
        print(f"\n📥 Importing {collection_name}...")
        
        with open(json_file, 'r') as f:
            documents = json.load(f, object_hook=json_util.object_hook)
        
        if documents:
            # Clear existing data
            db[collection_name].delete_many({})
            
            # Insert documents
            result = db[collection_name].insert_many(documents)
            count = len(result.inserted_ids)
            
            print(f"   ✅ Imported {count} documents")
            imported_collections.append(collection_name)
            total_imported += count
    
    print("\n" + "="*60)
    print(f"✅ Import complete!")
    print(f"   Collections: {len(imported_collections)}")
    print(f"   Documents: {total_imported}")
    print("="*60)

if __name__ == "__main__":
    import_database()
