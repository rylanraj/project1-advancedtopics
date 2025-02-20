from flask import Flask, jsonify
import os
import time
import pymysql
import pymongo

app = Flask(__name__)

# Load environment variables
MYSQL_HOST = os.getenv("MYSQL_HOST", "mysql_db")
MYSQL_USER = os.getenv("MYSQL_USER", "user")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "password")
MYSQL_DB = os.getenv("MYSQL_DB", "data_collection")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://mongo_db:27017/")

# Connect to MySQL
def get_mysql_connection():
    return pymysql.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DB,
        cursorclass=pymysql.cursors.DictCursor
    )

# Connect to MongoDB
mongo_client = pymongo.MongoClient(MONGO_URI)
mongo_db = mongo_client["data_analytics"]
analytics_collection = mongo_db["analytics"]

# Fetch and process data
def compute_analytics():
    try:
        conn = get_mysql_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM temperatures WHERE user_id = %s", (1))
            results = cursor.fetchall()
            conn.close()

        if not results:
            return {"message": "No temperature data available"}, 404

        values = [row["value"] for row in results]
        analytics_data = {
            "max": max(values),
            "min": min(values),
            "avg": sum(values) / len(values),
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }

        analytics_collection.insert_one(analytics_data)
        return analytics_data, 200

    except Exception as e:
        print(e)
        return {"error": str(e)}, 500

@app.route('/compute_analytics', methods=['GET'])
def compute_analytics_endpoint():
    return jsonify(compute_analytics())

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003)