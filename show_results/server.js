require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const path = require("path");
const app = express();

const cookieParser = require("cookie-parser");
app.use(cookieParser());  // Add this middleware

//app.use(express.json());
app.use(express.static(path.join(__dirname, "views")));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo_db:27017/data_analytics';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth_service:5001/protected';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// {'max': 50.0, 'min': 1.0, 'avg': 13.25, 'timestamp': '2025-02-24 04:25:41'} This is the format of the data in the database

const AnalyticsSchema = new mongoose.Schema({
    max: Number,
    min: Number,
    avg: Number,
    timestamp: String
});
const Analytics = mongoose.model('Analytics', AnalyticsSchema);

async function verifyToken(req) {
    let token = req.cookies.token || req.cookies.access_token_cookie;  // Read from both cookies
    if (!token && req.headers.authorization) {
        token = req.headers.authorization.split(' ')[1];  // Fallback to Authorization header
    }

    console.log("Token received:", token); // LOGGING

    if (!token) {
        console.log("No token received.");
        return null;
    }

    try {
        const response = await axios.get(AUTH_SERVICE_URL, { headers: { Authorization: `Bearer ${token}` } });
        console.log("Token verification success:", response.data);
        return response.data;
    } catch (error) {
        console.log("Token verification failed:", error.message);
        return null;
    }
}



app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get('/results', async (req, res) => {
    const verified = await verifyToken(req);
    if (!verified) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    // Fetch the latest analytics data from the database
    const url = process.env.ANALYTICS_SERVICE_URL || 'http://analytics_service:5003/compute_analytics';

    // Send a GET request to the analytics service
    try {
        const response = await axios.get(url);
        console.log(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

    try {
        // Console.log all of the data in the database
        const analyticsData = await Analytics.find();
        console.log(analyticsData);
        const latestAnalytics = await Analytics.findOne().sort({ timestamp: -1 });
        if (!latestAnalytics) {
            return res.status(404).json({ error: "No analytics data available" });
        }

        res.json({
            max: latestAnalytics.max,
            min: latestAnalytics.min,
            avg: latestAnalytics.avg,
            timestamp: latestAnalytics.timestamp
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => console.log(`Show Results Service running on port ${PORT}`));