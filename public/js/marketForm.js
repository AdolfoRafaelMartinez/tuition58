document.addEventListener('DOMContentLoaded', () => {
    const marketForm = document.getElementById('market-form');
    const marketResult = document.getElementById('market-result');

    if (marketForm) {
        marketForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const eventTicker = document.getElementById('event-ticker').value;

            try {
                const response = await fetch(`/api/kalshi/markets/${eventTicker}`);
                const data = await response.json();

                if (data.error) {
                    marketResult.innerHTML = `<p>Error: ${data.error}</p>`;
                    return;
                }

                let html = '<ul>';
                for (const market of data.markets) {
                    const numericPart = market.ticker.match(/\d+/);
                    html += `<li><strong>${market.ticker}:</strong> ${numericPart ? numericPart[2] : ''}</li>`;
                }
                html += '</ul>';

                marketResult.innerHTML = html;
            } catch (error) {
                marketResult.innerHTML = `<p>Error: ${error.message}</p>`;
            }
        });
    }
});
