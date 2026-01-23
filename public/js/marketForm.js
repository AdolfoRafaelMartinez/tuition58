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
                    const letterPart = market.ticker.match(/-\D/)[0];
                    const bin_or_tail = letterPart.includes("B") ? "bin" : "tail";
                    const value = Number(market.ticker.match(/\d+\.?\d$/));
                    html += `<li><strong>${market.ticker}:</strong> ${bin_lower} a ${bin_or_tail}, $${market.yes_sub_title}</li>`;
                }
                html += '</ul>';

                marketResult.innerHTML = html;
            } catch (error) {
                marketResult.innerHTML = `<p>Error: ${error.message}</p>`;
            }
        });
    }
});
