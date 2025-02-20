from flask import Flask, request, jsonify, render_template, redirect
from flask_jwt_extended import create_access_token, jwt_required, JWTManager
import pymysql
import os
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure JWT
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "supersecretkey")
jwt = JWTManager(app)

# MySQL connection
db = pymysql.connect(
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_NAME"),
    cursorclass=pymysql.cursors.DictCursor
)

@app.route("/register", methods=["POST", "GET"])
def register():
    if request.method == "GET":
        return render_template("register.html")
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    try:
        with db.cursor() as cursor:
            cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (username, password))
            db.commit()
        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/login", methods=["POST", "GET"])
def login():
    if request.method == "GET":
        return render_template("login.html")

    if request.is_json:
        data = request.json
    else:
        data = request.form
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    with db.cursor() as cursor:
        cursor.execute("SELECT * FROM users WHERE username = %s AND password = %s", (username, password))
        user = cursor.fetchone()
        print(user)

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    access_token = create_access_token(identity=username)
    # Redirect to the enter_data service on port 5002, using the access token as an authorization header
    return redirect(f"http://172.22.9.33/:5002/?id={user['id']}&token={access_token}")


@app.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    return jsonify({"message": "Access granted"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)

