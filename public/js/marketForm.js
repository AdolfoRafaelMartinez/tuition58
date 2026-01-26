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
                    html += `<li>`;
                    html += `<div class="market-info"><strong>${market.ticker}:</strong> ${market.yes_sub_title}, lower: ${market.lower}, upper: ${market.upper}, ask: ${market.yes_ask}</div>`;

                    html += `<div class="market-actions">`;
                    if(temp_max >= market.lower && temp_max <= market.upper) {
                        html += `<span class="buy-recommendation">buy this</span>`;
                    } else if (
                        ((temp_max + 1) >= market.lower && (temp_max + 1) <= market.upper) ||
                        ((temp_max - 1) >= market.lower && (temp_max - 1) <= market.upper)
                    ) {
                        html += `<span style="color: red;">AND THIS</span>`;
                    }
                    html += `<button class="buy-button" data-ticker="${market.ticker}" data-ask="${market.yes_ask}">Buy</button>`;
                    html += `</div>`;

                    html += `</li>`;
                }
                html += '</ul>';

                marketResult.innerHTML = html;

                const buyButtons = marketResult.querySelectorAll('.buy-button');
                buyButtons.forEach(button => {
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        const ticker = e.target.dataset.ticker;
                        const ask = e.target.dataset.ask;

                        document.getElementById('ticker').value = ticker;
                        document.getElementById('action').value = 'buy';
                        document.getElementById('side').value = 'yes';
                        document.getElementById('yes_price').value = ask;
                        document.getElementById('count').value = 1;
                    });
                });

            } catch (error) {
                marketResult.innerHTML = `<p>Error: ${error.message}</p>`;
            }
        });
    }
});
