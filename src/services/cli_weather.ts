
import fetch from 'node-fetch';
import { CliWeatherResult } from '../models/cli_weather.js';

export async function getClimateReport(): Promise<CliWeatherResult> {
    try {
        const response = await fetch('https://forecast.weather.gov/product.php?site=EWX&product=CLI&issuedby=AUS');
        if (!response.ok) {
            return {report_when: "", observation_when: "", observation_max: "", error: `Failed to fetch weather data. Status: ${response.status}` };
        }
        const text = await response.text();
        const report_when = text.match(/\d+ (AM|PM).*/)[0];
        if (!report_when) {
            return {report_when: "", observation_when: "", observation_max: "", error: 'Could not get report_when.' };
        }
        const observation_when = text.match(/MAXIMUM\s+\d*\s*.{7,8}/)[0].replace(/\s+/g, ' ').split(" ").slice(2,4).join(" ")
        if (!observation_when) {
            return {report_when: "", observation_when: "", observation_max: "", error: 'Could not get observation_when.' };
        }
        const observation_max = text.match(/MAXIMUM\s+\d*\s*.{7,8}/)[0].replace(/\s+/g, ' ').split(" ")[1];
        if (!observation_max) {
            return {report_when: "", observation_when: "", observation_max: "", error: 'Could not get temp_max_match.' };
        }
        return {
            report_when: report_when,
            observation_when: observation_when,
            observation_max: observation_max,
            error: null
        };
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return { report_when: "", observation_when: "", observation_max: "", error: 'Failed to fetch weather data.' };
    }
}
