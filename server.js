require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { testConnection } = require("./src/db/index.js");
const db = require("./src/db/models");
const app = express();
const PORT = process.env.PORT;

const userRoutes = require("./src/routes/userRoutes");
const authRoutes = require("./src/routes/authRoutes");
const recipesRoutes = require("./src/routes/recipesRoutes");
const favoritesRoutes = require("./src/routes/favoritesRoutes");
const membershipRoutes = require("./src/routes/membershipRoutes");
const mealPlanRoutes = require("./src/routes/mealPlanRoutes");
const progressRoutes = require("./src/routes/progressRoutes");
const shoppingRoutes = require("./src/routes/shoppingRoutes");


app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }));
app.use(express.json());


app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use("/user", userRoutes);
app.use("/auth", authRoutes);
app.use("/recipes", recipesRoutes);
app.use("/favorites", favoritesRoutes);
app.use("/membership", membershipRoutes);
app.use("/mealplan", mealPlanRoutes);
app.use("/progress", progressRoutes);
app.use("/shopping", shoppingRoutes);


app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});


app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});


async function startServer() {
  await testConnection(); 
  app.listen(PORT, () => {
    console.log(`Nutrio API running on port ${PORT}`);
  });
}

startServer();
