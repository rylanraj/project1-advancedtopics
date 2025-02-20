const axios = require("axios");

async function authenticateToken(req, res) {
    const token = req.query.token;
    const user_id = req.query.id;
    const auth_service_url = "http://172.22.9.33:5001";

    if (!token) {
        // Redirect user to login page
        return res.redirect("http://172.22.9.33:5001/login");
    }

    try {
        const response = await axios.get(auth_service_url+"/protected", {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (response.status === 200) {
            // Save a cookie
            res.cookie("user", { id: user_id, token: token }, { maxAge: 900000, httpOnly: true });
            return res.redirect("/");
        }
    } catch (error) {
        console.log(error);
        res.status(403).json({ error: "Forbidden" });
    }
}

module.exports = authenticateToken;