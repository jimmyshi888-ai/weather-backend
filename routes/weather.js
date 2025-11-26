const express = require('express');
const router = express.Router();
// 引入 Controller
const weatherController = require('../controllers/weatherController');

// === 修改點 1 & 2 ===
// 舊的寫法 (會報錯): router.get('/kaohsiung', weatherController.getKaohsiungWeather);

// 新的正確寫法：
// 1. 使用 '/:cityId' 來接收動態的城市代碼 (例如 kaohsiung, taipei)
// 2. 使用新的函式名稱 weatherController.getWeatherByCity
router.get('/:cityId', weatherController.getWeatherByCity);

module.exports = router;