document.addEventListener('DOMContentLoaded', () => {
    const marketForm = document.getElementById('market-form');
    const marketResult = document.getElementById('market-result');

    if (marketForm) {
        marketForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const eventTicker = document.getElementById('event-ticker').value;

            try {
                const weatherResponse = await fetch('/api/forecast');
                const weatherData = await weatherResponse.json();
                const temp_max = parseFloat(weatherData.temperature);

                const response = await fetch(`/api/kalshi/markets/${eventTicker}`);
                const data = await response.json();

                if (data.error) {
                    marketResult.innerHTML = `<p>Error: ${data.error}</p>`;
                    return;
                }

                let html = '<ul>';
                for (const market of data.markets) {
                    html += `<li><strong>${market.ticker}:</strong> ${market.yes_sub_title}, lower: ${market.lower}, upper: ${market.upper}, ask: ${market.ask}`;
                    if(temp_max >= market.lower && temp_max <= market.upper) {
                        html += ` <span class="buy-recommendation">buy this</span>`;
                    }
                    html += `</li>`;
                }
                html += '</ul>';

                marketResult.innerHTML = html;
            } catch (error) {
                marketResult.innerHTML = `<p>Error: ${error.message}</p>`;
            }
        });
    }
});
