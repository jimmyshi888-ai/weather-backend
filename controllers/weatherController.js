const axios = require("axios");

// CWA API 設定
const CWA_API_BASE_URL = "https://opendata.cwa.gov.tw/api";
const CWA_API_KEY = process.env.CWA_API_KEY;

// === 修改點 1: 建立城市代碼與中文名稱的對照表 ===
// key 是前端網址傳來的代號，value 是 CWA API 需要的中文名稱
const CITY_MAP = {
  kaohsiung: "高雄市",
  taipei: "臺北市",
  tainan: "臺南市",
  yilan: "宜蘭縣",
  taichung: "臺中市", // 順便把台中也加進來
};

/**
 * 取得指定城市的天氣預報
 * @route GET /api/weather/:cityId
 * @param req.params.cityId - 城市代碼 (例如: kaohsiung, taipei)
 */
// === 修改點 2: 將函式名稱改為通用的 getWeatherByCity ===
const getWeatherByCity = async (req, res) => {
  try {
    // 檢查是否有設定 API Key
    if (!CWA_API_KEY) {
      return res.status(500).json({
        error: "伺服器設定錯誤",
        message: "請在 .env 檔案中設定 CWA_API_KEY",
      });
    }

    // === 修改點 3: 接收路由參數並查找對應的中文城市名稱 ===
    // 假設您的路由設定是 router.get('/:cityId', weatherController.getWeatherByCity);
    const cityId = req.params.cityId;
    const chineseLocationName = CITY_MAP[cityId];

    // 如果找不到對應的城市，回傳 400 錯誤
    if (!chineseLocationName) {
      return res.status(400).json({
        success: false,
        error: "無效的請求",
        message: `不支援或錯誤的城市代碼: ${cityId}。請使用: ${Object.keys(
          CITY_MAP
        ).join(", ")}`,
      });
    }

    // 呼叫 CWA API - 一般天氣預報（36小時）
    const response = await axios.get(
      `${CWA_API_BASE_URL}/v1/rest/datastore/F-C0032-001`,
      {
        params: {
          Authorization: CWA_API_KEY,
          // === 修改點 4: 使用動態取得的中文城市名稱 ===
          locationName: chineseLocationName,
        },
      }
    );

    // 取得城市的天氣資料
    const locationData = response.data.records.location[0];

    if (!locationData) {
      return res.status(404).json({
        success: false,
        error: "查無資料",
        // === 修改點 5: 錯誤訊息也使用動態名稱 ===
        message: `無法取得 ${chineseLocationName} 的天氣資料`,
      });
    }

    // --- 以下資料整理邏輯保持不變 ---
    const weatherData = {
      city: locationData.locationName,
      updateTime: response.data.records.datasetDescription,
      forecasts: [],
    };

    const weatherElements = locationData.weatherElement;
    const timeCount = weatherElements[0].time.length;

    for (let i = 0; i < timeCount; i++) {
      const forecast = {
        startTime: weatherElements[0].time[i].startTime,
        endTime: weatherElements[0].time[i].endTime,
        weather: "",
        rain: "",
        minTemp: "",
        maxTemp: "",
        comfort: "",
        windSpeed: "",
      };

      weatherElements.forEach((element) => {
        const value = element.time[i].parameter;
        switch (element.elementName) {
          case "Wx":
            forecast.weather = value.parameterName;
            break;
          case "PoP":
            forecast.rain = value.parameterName + "%";
            break;
          case "MinT":
            forecast.minTemp = value.parameterName + "°C";
            break;
          case "MaxT":
            forecast.maxTemp = value.parameterName + "°C";
            break;
          case "CI":
            forecast.comfort = value.parameterName;
            break;
          case "WS":
            forecast.windSpeed = value.parameterName;
            break;
        }
      });

      weatherData.forecasts.push(forecast);
    }

    res.json({
      success: true,
      data: weatherData,
    });
  } catch (error) {
    console.error("取得天氣資料失敗:", error.message);

    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: "CWA API 錯誤",
        message: error.response.data.message || "無法取得天氣資料",
      });
    }

    res.status(500).json({
      success: false,
      error: "伺服器錯誤",
      message: "無法取得天氣資料，請稍後再試",
    });
  }
};

module.exports = {
  // === 修改點 6: 匯出新的函式名稱 ===
  getWeatherByCity,
};