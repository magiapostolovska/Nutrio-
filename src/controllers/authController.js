require("dotenv").config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const authRepository = require("../repositories/authRepository");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "7d";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

function signAccessToken(user) {
  return jwt.sign(
    { userId: user.UserId, email: user.Email, isAdmin: !!user.IsAdmin },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
}

function generateRecoveryCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function sha256(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

async function register(req, res) {
  try {
    const { fullName, email, password, dateOfBirth, sex } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "fullName, email, password, date of birth are required" });
    }

    const existingUser = await authRepository.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "An account for this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await authRepository.createUser({
      FullName: fullName,
      Email: email,
      Sex:sex,
      DateOfBirth: dateOfBirth,
      Password: hashedPassword,
      IsAdmin: false,
      HasPaid: false,
    });

    const accessToken = signAccessToken(newUser);

    return res.status(201).json({
      message: "User created successfully",
      userId: newUser.UserId,
      accessToken,
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Failed to create user", error: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await authRepository.findUserByEmail(email);
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const ok = await bcrypt.compare(password, user.Password);
    if (!ok) return res.status(401).json({ message: "Invalid email or password" });
    

    const accessToken = signAccessToken(user);

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        userId: user.UserId,
        fullName: user.FullName,
        email: user.Email,
        hasPaid: !!user.HasPaid,
        isAdmin: !!user.IsAdmin,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await authRepository.findUserByEmail(email);
    if (!user) return res.status(404).json({ message: "User not found" });

    await authRepository.deleteAllResetTokens(user.UserId);

    const recoveryCode = generateRecoveryCode();
    const tokenHash = sha256(recoveryCode);

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); 

    await authRepository.createPasswordResetToken(user.UserId, tokenHash, expiresAt);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.Email,
      subject: "Nutrio Password Recovery Code",
      text: `Your password recovery code is: ${recoveryCode}`,
    });

    return res.status(200).json({ message: "Recovery code sent" });
  }  catch (error) {
  console.error("FORGOT PASSWORD ERROR:", error);
  return res.status(500).json({
    message: "Error sending recovery code",
    error: error?.message || error?.toString?.() || JSON.stringify(error),
  });
}
}

async function changePassword(req, res) {
  try {
    const { email, recoveryCode, newPassword } = req.body;

    if (!email || !recoveryCode || !newPassword) {
      return res.status(400).json({ message: "email, recoveryCode, newPassword required" });
    }

    const user = await authRepository.findUserByEmail(email);
    if (!user) return res.status(404).json({ message: "User not found" });

    const tokenHash = sha256(recoveryCode);

    const tokenRow = await authRepository.findValidPasswordResetToken(user.UserId, tokenHash);
    if (!tokenRow) return res.status(400).json({ message: "Invalid recovery code" });

    if (new Date() > new Date(tokenRow.ExpiresAt)) {
      return res.status(400).json({ message: "Recovery code expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await authRepository.updateUserPassword(user.UserId, hashedPassword);

    await authRepository.markResetTokenUsed(tokenRow.TokenId);

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to change password", error: error.message });
  }
}
async function verifyResetCode(req, res) {
  try {
    const { email, recoveryCode } = req.body;

    if (!email || !recoveryCode) {
      return res.status(400).json({ message: "email and recoveryCode required" });
    }

    const user = await authRepository.findUserByEmail(email);
    if (!user) return res.status(404).json({ message: "User not found" });

    const tokenHash = sha256(recoveryCode);

    const tokenRow = await authRepository.findValidPasswordResetToken(
      user.UserId,
      tokenHash
    );

    if (!tokenRow) {
      return res.status(400).json({ message: "Invalid recovery code" });
    }

    if (new Date() > new Date(tokenRow.ExpiresAt)) {
      return res.status(400).json({ message: "Recovery code expired" });
    }

    return res.status(200).json({ message: "Code verified" });
  } catch (error) {
    res.status(500).json({ message: "Failed to verify code", error: error.message });
  }
}

module.exports = { register, login, forgotPassword, changePassword, verifyResetCode };