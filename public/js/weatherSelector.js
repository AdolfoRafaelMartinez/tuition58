document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('location-select');
    const forecastName = document.getElementById('forecast-name');
    const forecastTemp = document.getElementById('forecast-temp');
    const forecastUnit = document.getElementById('forecast-unit');
    const forecastDate = document.getElementById('forecast-date');
    const forecastUnavailable = document.getElementById('forecast-unavailable');
    const eventTickerInput = document.getElementById('event-ticker');
    const currentTemp = document.getElementById('current-temp');
    const currentUnavailable = document.getElementById('current-unavailable');

    function readLocationFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const loc = params.get('location');
        return loc ? loc.toLowerCase() : null;
    }

    function generateTickerFromDate(date, locationPrefix = 'KXHIGHAUS') {
        const year = date.getFullYear().toString().slice(-2);
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const month = months[date.getMonth()];
        const day = String(date.getDate()).padStart(2, '0');
        const dateString = `${year}${month}${day}`;
        return `${locationPrefix}-${dateString}`;
    }

    async function fetchAndUpdate(location) {
        try {
            const resp = await fetch(`/api/forecast?location=${encodeURIComponent(location)}`);
            if (!resp.ok) {
                throw new Error('Failed to fetch forecast');
            }
            const data = await resp.json();
            if (!data) {
                if (forecastUnavailable) forecastUnavailable.textContent = 'Weather data not available.';
                return;
            }
            if (forecastUnavailable) forecastUnavailable.remove();
            if (forecastName) forecastName.textContent = data.name || '';
            if (forecastTemp) forecastTemp.textContent = data.temperature != null ? data.temperature : '';
            if (forecastUnit) forecastUnit.textContent = data.temperatureUnit || '';
            if (forecastDate && data.startTime) forecastDate.textContent = new Date(data.startTime).toDateString();

            // update event ticker based on new forecast date
            if (eventTickerInput && data.startTime) {
                const forecastDateObj = new Date(data.startTime);
                const prefix = location === 'centralpark' ? 'KXHIGHNY' : (location === 'seattle' ? 'KXHIGHTSEA' : 'KXHIGHAUS');
                eventTickerInput.value = generateTickerFromDate(forecastDateObj, prefix);

                // Optionally trigger market fetch if that function exists
                if (window.fetchAndDisplayMarkets) window.fetchAndDisplayMarkets();
            }

            // fetch current temperature
            const currentResp = await fetch(`/api/current?location=${encodeURIComponent(location)}`);
            if (currentResp.ok) {
                const currentData = await currentResp.json();
                if (currentData.temperature != null) {
                    if (currentUnavailable) currentUnavailable.style.display = 'none';
                    if (currentTemp) {
                        currentTemp.style.display = 'inline';
                        currentTemp.textContent = ((currentData.temperature * 9/5) + 32).toFixed(2);
                    }
                } else {
                    if (currentTemp) currentTemp.style.display = 'none';
                    if (currentUnavailable) currentUnavailable.style.display = 'block';
                }
            } else {
                console.error('Failed to fetch current temperature');
            }
        } catch (err) {
            console.error('Error fetching forecast:', err);
        }
    }

    // initialize select from URL param if present
    const initialLoc = readLocationFromUrl();
    if (initialLoc && select) {
        for (const opt of select.options) {
            if (opt.value === initialLoc) {
                opt.selected = true;
                break;
            }
        }
        // set immediate fallback ticker using today's date and proper prefix
        if (eventTickerInput) {
            const prefix = initialLoc === 'centralpark' ? 'KXHIGHNY' : (initialLoc === 'seattle' ? 'KXHIGHTSEA' : 'KXHIGHAUS');
            eventTickerInput.value = generateTickerFromDate(new Date(), prefix);
            // trigger market update immediately
            if (typeof window.fetchAndDisplayMarkets === 'function') {
                window.fetchAndDisplayMarkets();
            } else {
                const form = document.getElementById('market-form');
                if (form && typeof form.requestSubmit === 'function') form.requestSubmit();
            }
        }
        fetchAndUpdate(initialLoc);
    }

    if (select) {
        select.addEventListener('change', (e) => {
            const v = e.target.value;
            // update URL without reloading
            const url = new URL(window.location.href);
            url.searchParams.set('location', v);
            window.history.replaceState({}, '', url.toString());
            // Immediately update ticker with fallback using today's date and appropriate prefix
            if (eventTickerInput) {
                const prefix = v === 'centralpark' ? 'KXHIGHNY' : (v === 'seattle' ? 'KXHIGHTSEA' : 'KXHIGHAUS');
                eventTickerInput.value = generateTickerFromDate(new Date(), prefix);
                // submit the market form (or call the fetch function) so the market table updates now
                if (typeof window.fetchAndDisplayMarkets === 'function') {
                    window.fetchAndDisplayMarkets();
                } else {
                    const form = document.getElementById('market-form');
                    if (form && typeof form.requestSubmit === 'function') form.requestSubmit();
                    else if (form) form.dispatchEvent(new Event('submit', { cancelable: true }));
                }
            }
            fetchAndUpdate(v);
        });
    }
});
