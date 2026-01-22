import fetch from 'node-fetch';

interface CliWeatherResult {
    maxTemp: string | null;
    maxTempTime: string | null;
    error: string | null;
}

export async function getAustinCliWeather(): Promise<CliWeatherResult> {
    try {
        const response = await fetch('https://forecast.weather.gov/product.php?site=EWX&product=CLI&issuedby=AUS');
        if (!response.ok) {
            return { maxTemp: null, maxTempTime: null, error: `Failed to fetch weather data. Status: ${response.status}` };
        }

        const text = await response.text();
        const maxTempRegex = /MAXIMUM\s*\d{1,2}\s*\d{1,2}:\d{1,2}\s\D{2}/;
        const match = text.match(maxTempRegex);
        if (!match) {
            return { maxTemp: null, maxTempTime: null, error: 'Could not parse max temperature from weather data.' };
        }
        const split = match[0].split(/\s+/);
        return {
            maxTemp: split[1],
            maxTempTime: split[2] + " " + split[3],
            error: null
        };
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return { maxTemp: null, maxTempTime: null, error: 'Failed to fetch weather data.' };
    }
}
