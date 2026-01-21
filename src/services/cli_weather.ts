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
        const maxTempRegex = /MAXIMUM TEMPERATURE\.*\s+(\d+)\s+AT\s+(.*)/;
        const match = text.match(maxTempRegex);

        if (match && match.length >= 3) {
            return {
                maxTemp: match[1],
                maxTempTime: match[2],
                error: null,
            };
        } else {
            return { maxTemp: null, maxTempTime: null, error: 'Could not parse max temperature from weather data.' };
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return { maxTemp: null, maxTempTime: null, error: 'Failed to fetch weather data.' };
    }
}
