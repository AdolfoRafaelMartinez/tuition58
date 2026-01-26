document.addEventListener('DOMContentLoaded', () => {
    const marketForm = document.getElementById('market-form');
    const marketResult = document.getElementById('market-result');
    const eventTickerInput = document.getElementById('event-ticker');

    if (marketForm) {
        marketForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const event_ticker = eventTickerInput.value;

            try {
                const response = await fetch(`/api/kalshi/markets/${event_ticker}`);
                const data = await response.json();

                if (response.ok) {
                    let html = '<ul>';
                    const temp_max = data.temp_max;

                    for (const market of data.markets) {
                        html += `<li>
                            <p><strong>Ticker:</strong> ${market.ticker}</p>
                            <p><strong>Range:</strong> ${market.lower} to ${market.upper}</p>
                            <p><strong>Yes Ask:</strong> ${market.yes_ask}</p>
                            <p><strong>Yes Bid:</strong> ${market.yes_bid}</p>
                        `;

                        html += `<div class="market-actions">`;
                        if(temp_max >= market.lower && temp_max <= market.upper) {
                            html += `<span class="buy-recommendation">BUY THIS</span>`;
                        } else if (
                            ((temp_max + 1) >= market.lower && (temp_max + 1) <= market.upper) ||
                            ((temp_max - 1) >= market.lower && (temp_max - 1) <= market.upper)
                        ) {
                            html += `<span class="secondary-recommendation">AND THIS</span>`;
                        }
                        html += `<button class="buy-button" data-ticker="${market.ticker}" data-ask="${market.yes_ask}">Buy</button>`;
                        html += `</div>`;

                        html += `</li>`;
                    }
                    html += '</ul>';

                    marketResult.innerHTML = html;

                    // Auto-fill the first order form
                    const primaryRec = marketResult.querySelector('.buy-recommendation');
                    if (primaryRec) {
                        const buyButton = primaryRec.closest('.market-actions').querySelector('.buy-button');
                        if (buyButton) {
                            document.getElementById('ticker').value = buyButton.dataset.ticker;
                            document.getElementById('action').value = 'buy';
                            document.getElementById('side').value = 'yes';
                            document.getElementById('yes_price').value = buyButton.dataset.ask;
                            document.getElementById('count').value = 1;
                        }
                    }

                    // Auto-fill the second order form
                    const secondaryRec = marketResult.querySelector('.secondary-recommendation');
                    if (secondaryRec) {
                        const buyButton = secondaryRec.closest('.market-actions').querySelector('.buy-button');
                        if (buyButton) {
                            document.getElementById('ticker-2').value = buyButton.dataset.ticker;
                            document.getElementById('action-2').value = 'buy';
                            document.getElementById('side-2').value = 'yes';
                            document.getElementById('yes_price-2').value = buyButton.dataset.ask;
                            document.getElementById('count-2').value = 1;
                        }
                    }

                } else {
                    marketResult.innerHTML = `<p>Error: ${data.error}</p>`;
                }
            } catch (error) {
                marketResult.innerHTML = `<p>Error: ${error.message}</p>`;
            }
        });
    }
});
