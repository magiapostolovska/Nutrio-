const jwt = require("jsonwebtoken");
require("dotenv").config();

const db = require("../db/models");

const JWT_SECRET = process.env.JWT_SECRET;

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ message: "No token provided, access denied!" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.Users.findByPk(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = {
      userId: user.UserId,
      email: user.Email,
      fullName: user.FullName,
      isAdmin: !!user.IsAdmin,
      hasPaid: !!user.HasPaid,
    };

    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token, access denied" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Access denied: Admin only" });
  }
  next();
}

function requirePaid(req, res, next) {
  if (!req.user?.hasPaid) {
    return res.status(403).json({ message: "Premium required" });
  }
  next();
}

function requireAdminOrPaid(req, res, next) {
  if (req.user?.isAdmin || req.user?.hasPaid) return next();
  return res.status(403).json({ message: "Premium required" });
}

module.exports = {
  authenticateToken,
  requireAdmin,
  requirePaid,
  requireAdminOrPaid,
};