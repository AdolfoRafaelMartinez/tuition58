
import fetch from 'node-fetch';

export async function get_current(): Promise<{ temperature: number | null; error: string | null; }> {
    try {
        const response = await fetch('https://api.weather.gov/stations/KAUS/observations/latest');
        if (!response.ok) {
            return { temperature: null, error: `Failed to fetch weather data. Status: ${response.status}` };
        }
        const data: any = await response.json();
        const temperature = data.properties.temperature.value;
        return {
            temperature: temperature,
            error: null
        };
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return { temperature: null, error: 'Failed to fetch weather data.' };
    }
}
