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

        const dateRegex = /CLIMATE REPORT\D*\d{1,3}\s\D*\d{1,2}\s\d{4}/;
        const date_match = text.match(dateRegex);
        if (!date_match) {
            return { maxTempTime: null, error: 'Could not get date and time.' };
        }
        const maxTempTime = date_match[0].split(/\s+/);
        const maxTempRegex = /MAXIMUM\s*\d{1,2}\s*\d{1,2}:\d{1,2}\s\D{2}/;
        const temp_match = text.match(maxTempRegex);
        if (!temp_match) {
            return { maxTemp: null, error: 'Could not parse max temperature from weather data.' };
        }
        const maxTemp = temp_match[0].split(/\s+/);
        return {
            maxTempTime: split[2] + " " + split[3],
            maxTemp: split[1],
            error: null
        };
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return { maxTemp: null, maxTempTime: null, error: 'Failed to fetch weather data.' };
    }
}
