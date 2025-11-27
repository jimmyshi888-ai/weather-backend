// controllers/weatherController.js
const axios = require("axios");

// CWA API 設定
const CWA_API_BASE_URL = "https://opendata.cwa.gov.tw/api";
const CWA_API_KEY = process.env.CWA_API_KEY;

// === 城市代碼與中文名稱對照表 ===
const CITY_MAP = {
  kaohsiung: "高雄市",
  taipei: "臺北市",
  tainan: "臺南市",
  yilan: "宜蘭縣",
  taichung: "臺中市",
  newtaipei: "新北市",
  taoyuan: "桃園市",
  hsinchu: "新竹市",
  hsinchucounty: "新竹縣",
  miaoli: "苗栗縣",
  changhua: "彰化縣",
};

/**
 * 取得指定城市的天氣預報
 * @route GET /api/weather/:cityId
 */
const getWeatherByCity = async (req, res) => {
  try {
    // 檢查 API Key 設定
    if (!CWA_API_KEY) {
      console.error("錯誤：未設定 CWA_API_KEY");
      return res.status(500).json({
        success: false,
        error: "伺服器設定錯誤",
        message: "請聯繫管理員確認 API Key 設定",
      });
    }

    // 1. 從網址參數取得城市代號 (例如: taipei)
    const cityId = req.params.cityId;
    // 2. 轉換為中文名稱 (例如: 臺北市)
    const chineseLocationName = CITY_MAP[cityId];

    // 如果找不到對應的城市代號
    if (!chineseLocationName) {
      return res.status(400).json({
        success: false,
        error: "無效的請求",
        message: `不支援的城市代碼: ${cityId}。請確認輸入是否正確。`,
      });
    }

    // console.log(`正在查詢城市: ${chineseLocationName} (${cityId})...`);

    // 3. 呼叫 CWA API
    const response = await axios.get(
      `${CWA_API_BASE_URL}/v1/rest/datastore/F-C0032-001`,
      {
        params: {
          Authorization: CWA_API_KEY,
          locationName: chineseLocationName, // 使用動態中文名稱
        },
        timeout: 5000, // 設定 5 秒超時，避免卡住
      }
    );

    // 4. 檢查回傳資料
    const locationData = response.data?.records?.location?.[0];

    if (!locationData) {
      console.error(`CWA API 回傳格式異常或查無資料: ${chineseLocationName}`);
      return res.status(404).json({
        success: false,
        error: "查無資料",
        message: `無法從氣象局取得 ${chineseLocationName} 的資料，請稍後再試。`,
      });
    }

    // 5. 整理資料 (資料結構轉換)
    const weatherData = {
      city: locationData.locationName,
      updateTime: response.data.records.datasetDescription,
      forecasts: [],
    };

    const weatherElements = locationData.weatherElement;
    // 檢查是否有時間區段資料
    if (!weatherElements || !weatherElements[0]?.time) {
      throw new Error("氣象局資料結構異常，缺少時間區段");
    }

    const timeCount = weatherElements[0].time.length;

    for (let i = 0; i < timeCount; i++) {
      const forecast = {
        startTime: weatherElements[0].time[i].startTime,
        endTime: weatherElements[0].time[i].endTime,
        weather: "N/A",
        rain: "0%",
        minTemp: "N/A",
        maxTemp: "N/A",
        comfort: "N/A",
        windSpeed: "N/A",
      };

      weatherElements.forEach((element) => {
        const timeSlot = element.time[i];
        if (!timeSlot || !timeSlot.parameter) return;

        const value = timeSlot.parameter;
        switch (element.elementName) {
          case "Wx": forecast.weather = value.parameterName; break;
          case "PoP": forecast.rain = value.parameterName + "%"; break;
          case "MinT": forecast.minTemp = value.parameterName + "°C"; break;
          case "MaxT": forecast.maxTemp = value.parameterName + "°C"; break;
          case "CI": forecast.comfort = value.parameterName; break;
          case "WS": forecast.windSpeed = value.parameterName; break;
        }
      });

      weatherData.forecasts.push(forecast);
    }

    // 6. 成功回傳
    // console.log(`成功取得 ${chineseLocationName} 資料`);
    res.json({
      success: true,
      data: weatherData,
    });

  } catch (error) {
    console.error("取得天氣資料失敗:", error.message);

    // Axios 請求錯誤處理
    if (error.response) {
      // 氣象局 API 回傳錯誤狀態碼 (例如 401 Unauthorized, 500 Error)
      console.error("CWA API 回應錯誤:", error.response.status, error.response.data);
      return res.status(error.response.status || 502).json({
        success: false,
        error: "外部 API 錯誤",
        message: "無法連接至中央氣象署服務",
      });
    } else if (error.code === 'ECONNABORTED') {
       // 請求超時
       return res.status(504).json({
        success: false,
        error: "請求超時",
        message: "連接氣象局逾時，請稍後再試",
      });
    }

    // 其他伺服器內部錯誤
    res.status(500).json({
      success: false,
      error: "伺服器內部錯誤",
      message: "處理請求時發生未預期的錯誤",
    });
  }
};

module.exports = {
  getWeatherByCity,
};