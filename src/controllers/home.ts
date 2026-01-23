
import { Request, Response } from 'express';
import { getAustinWeatherForecast } from '../services/weather.js';
import { getAustinCliWeather } from '../services/cli_weather.js';
import { getKalshiBalance } from '../services/kalshi.js';

export const getHome = async (req: Request, res: Response) => {
  try {
    const weather = await getAustinWeatherForecast();
    const cliWeather = await getAustinCliWeather();
    const kalshi = await getKalshiBalance();
    res.render('index', { weather: weather.data, cliWeather: cliWeather, kalshi: kalshi.data });
  } catch (error) {
    console.error('Error in getHome controller:', error);
    res.status(500).send('Error fetching data for the home page.');
  }
};
