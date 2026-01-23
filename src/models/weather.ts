
export interface Forecast {
    name: string;
    temperature: number;
    temperatureUnit: string;
    startTime: string;
    endTime: string;
}

export interface WeatherResult {
    data: Forecast | null;
    error: string | null;
}
