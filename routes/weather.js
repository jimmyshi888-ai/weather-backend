// 檔案：routes/weather.js
// 這裡負責設定路由路徑

const express = require('express');
const router = express.Router();
// 引入 Controller (注意路徑是往上一層找 controllers 資料夾)
const weatherController = require('../controllers/weatherController');

// === 路由設定 ===

// 定義 GET 請求，路徑使用動態參數 :cityId
// 例如：前端請求 /api/weather/taipei 時，cityId 就會是 "taipei"
router.get('/:cityId', weatherController.getWeatherByCity);

// 匯出 router
module.exports = router;