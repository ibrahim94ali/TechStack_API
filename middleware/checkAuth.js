const jwt = require("jsonwebtoken");

module.exports = (req, _, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const { userId } = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = userId;
        return next();
    } catch (error) {
        req.userId = null;
        return next();
    }
}