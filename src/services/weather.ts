
import fetch from 'node-fetch';
import { Forecast, WeatherResult } from '../models/weather.js';

export async function getAustinWeatherForecast(): Promise<WeatherResult> {
    try {
        const response = await fetch('https://api.weather.gov/gridpoints/EWX/156,91/forecast');
        if (!response.ok) {
            return { data: null, error: `Failed to fetch weather data. Status: ${response.status}` };
        }

        const data: any = await response.json();
        const forecast = data.properties.periods.find(element => element.isDaytime);

        if (!forecast) {
            return { data: null, error: 'Could not find daytime forecast.' };
        }

        return {
            data: {
                name: forecast.name,
                temperature: forecast.temperature,
                temperatureUnit: forecast.temperatureUnit,
                startTime: forecast.startTime,
                endTime: forecast.endTime,
            },
            error: null,
        };
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return { data: null, error: 'Failed to fetch weather data.' };
    }
}
