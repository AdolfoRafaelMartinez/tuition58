import fetch from "node-fetch";

interface WeatherResponse {
    properties: {
        periods: any[];
    };
}

async function getAustinWeatherForecast() {
  const gridId = 'EWX';
  const gridX = 95;
  const gridY = 113;

  try {
    const response = await fetch(`https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}/forecast`);
    if (!response.ok) {
      return { data: null, error: "Could not fetch weather data" };
    }
    const weather = await response.json() as WeatherResponse;
    const today = weather.properties.periods[0];
    return { data: today, error: null };
  } catch (error) {
    return { data: null, error: "Could not fetch weather data" };
  }
}

export { getAustinWeatherForecast };
