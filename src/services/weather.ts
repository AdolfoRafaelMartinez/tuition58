import fetch from 'node-fetch';

interface Forecast {
    name: string;
    temperature: number;
    temperatureUnit: string;
    shortForecast: string;
    detailedForecast: string;
}

interface WeatherResult {
    data: Forecast | null;
    error: string | null;
}

export async function getAustinWeatherForecast(): Promise<WeatherResult> {
    try {
        const response = await fetch('https://api.weather.gov/gridpoints/EWX/156,91/forecast');
        if (!response.ok) {
            return { data: null, error: `Failed to fetch weather data. Status: ${response.status}` };
        }

        const data: any = await response.json();
        const forecast = data.properties.periods.find(element => element.isDaytime);

        return {
            data: {
                name: forecast.name,
                temperature: forecast.temperature,
                temperatureUnit: forecast.temperatureUnit,
                shortForecast: forecast.shortForecast,
                detailedForecast: forecast.detailedForecast,
            },
            error: null,
        };
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return { data: null, error: 'Failed to fetch weather data.' };
    }
}