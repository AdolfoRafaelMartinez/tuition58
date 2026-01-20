document.addEventListener('DOMContentLoaded', () => {
    const marketForm = document.getElementById('market-form');
    const marketResult = document.getElementById('market-result');

    if (marketForm) {
        marketForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const eventTicker = document.getElementById('event-ticker').value;

            try {
                const response = await fetch(`/api/kalshi/markets?event_ticker=${eventTicker}`);
                const markets = await response.json();

                if (markets.error) {
                    marketResult.innerHTML = `<p>Error: ${markets.error}</p>`;
                    return;
                }

                let html = '<ul>';
                for (const market of markets) {
                    html += `<li><strong>${market.ticker}:</strong> ${market.title} (Yes: ${market.yes_price}¢, No: ${market.no_price}¢)</li>`;
                }
                html += '</ul>';

                marketResult.innerHTML = html;
            } catch (error) {
                marketResult.innerHTML = `<p>Error: ${error.message}</p>`;
            }
        });
    }
});
