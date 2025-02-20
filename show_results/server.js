require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo_db:27017/data_analytics';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth_service:5001/protected';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const TemperatureSchema = new mongoose.Schema({
    value: Number,
    timestamp: { type: Date, default: Date.now }
});
const Temperature = mongoose.model('Temperature', TemperatureSchema);

async function verifyToken(token) {
    try {
        const response = await axios.get(AUTH_SERVICE_URL, { headers: { Authorization: `Bearer ${token}` } });
        return response.data;
    } catch (error) {
        return null;
    }
}

app.get('/results', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const verified = await verifyToken(token);
    if (!verified) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    try {
        const temperatures = await Temperature.find();
        if (temperatures.length === 0) {
            return res.status(404).json({ error: "No data available" });
        }

        const values = temperatures.map(t => t.value);
        const max = Math.max(...values);
        const min = Math.min(...values);
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

        res.json({ max, min, avg });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => console.log(`Show Results Service running on port ${PORT}`));

