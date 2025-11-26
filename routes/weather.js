// server.js
require("dotenv").config(); // 載入 .env 設定
const express = require("express");
const cors = require("cors"); // 引入 cors 中介軟體
const weatherRoutes = require("./routes/weather");

const app = express();
const PORT = process.env.PORT || 3000;

// === 中介軟體設定 ===

// 啟用 CORS，允許前端跨域請求
// 在開發生產環境時，建議設定 origin 為您的前端網址，例如：
// app.use(cors({ origin: 'https://your-frontend-url.zeabur.app' }));
app.use(cors());

// 解析 JSON 請求格式
app.use(express.json());

// === 路由設定 ===
// 將天氣相關的路由掛載到 /api/weather 路徑下
app.use("/api/weather", weatherRoutes);

// 基礎根路徑測試
app.get("/", (req, res) => {
  res.send("原神天氣 API Server 正常運作中！(請使用 /api/weather/:cityId)");
});

// === 啟動伺服器 ===
app.listen(PORT, () => {
  console.log(`伺服器已在 http://localhost:${PORT} 上啟動`);
  console.log(`天氣 API 端點: http://localhost:${PORT}/api/weather/kaohsiung`);
});