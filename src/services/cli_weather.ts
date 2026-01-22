import fetch from 'node-fetch';

interface CliWeatherResult {
    when_max: string | null;
    temp_max: string | null;
    error: string | null;
}

export async function getAustinCliWeather(): Promise<CliWeatherResult> {
    try {
        const response = await fetch('https://forecast.weather.gov/product.php?site=EWX&product=CLI&issuedby=AUS');
        if (!response.ok) {
            return {when_max: "", temp_max: "", error: `Failed to fetch weather data. Status: ${response.status}` };
        }
        const text = await response.text();
        const when_regex = /CLIMATE REPORT\D*\d{1,3}\D*\d*\s\d*/;
        const when_match = text.match(when_regex)[0].split("\n")[2];
        if (!when_match) {
            return {when_max: "", temp_max: "", error: 'Could not get date and time.' };
        }
        const temp_max_regex = /MAXIMUM\s*\d{1,2}\s*\d{1,2}:\d{1,2}\s\D{2}/;
        const temp_max_match= text.match(temp_max_regex)[0].split(/\s+/).join(" ");
        if (!temp_max_match) {
            return {when_max: "", temp_max: "", error: 'Could not parse max temperature from weather data.' };
        }
        return {
            when_max: when_match,
            temp_max: temp_max_match,
            error: null
        };
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return { when_max: "", temp_max: "", error: 'Failed to fetch weather data.' };
    }
}
