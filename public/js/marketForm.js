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
                    const forecast_temp = data.forecast_temp;

                    for (const market of data.markets) {
                        html += `<li data-ticker="${market.ticker}" data-ask="${market.yes_ask}">
                            <div class="market-info">
                                <p><strong>Ticker:</strong> ${market.ticker}</p>
                                <p><strong>Range:</strong> ${market.lower} to ${market.upper}</p>
                                <p><strong>Yes Ask:</strong> ${market.yes_ask}</p>
                                <p><strong>Yes Bid:</strong> ${market.yes_bid}</p>
                                <p><strong>Status:</strong> ${market.status}</p>
                            </div>
                        `;

                        html += `<div class="market-actions">`;
                        
                        if (forecast_temp !== undefined && !isNaN(forecast_temp)) {
                            if (forecast_temp >= market.lower && forecast_temp <= market.upper) {
                                html += `<span class="buy-recommendation">BUY THIS</span>`;
                            } else if (
                                ((forecast_temp + 1) >= market.lower && (forecast_temp + 1) <= market.upper) ||
                                ((forecast_temp - 1) >= market.lower && (forecast_temp - 1) <= market.upper)
                            ) {
                                html += `<span class="secondary-recommendation" style="color: red;">AND THIS</span>`;
                            }
                        }

                        html += `</div></li>`;
                    }
                    html += '</ul>';

                    marketResult.innerHTML = html;

                    const primaryRec = marketResult.querySelector('.buy-recommendation');
                    if (primaryRec) {
                        const marketLi = primaryRec.closest('li');
                        if (marketLi) {
                            document.getElementById('ticker').value = marketLi.dataset.ticker;
                            document.getElementById('action').value = 'buy';
                            document.getElementById('side').value = 'yes';
                            document.getElementById('yes_price').value = marketLi.dataset.ask;
                            document.getElementById('count').value = 1;
                        }
                    }

                    const secondaryRec = marketResult.querySelector('.secondary-recommendation');
                    if (secondaryRec) {
                        const marketLi = secondaryRec.closest('li');
                        if (marketLi) {
                            document.getElementById('ticker-2').value = marketLi.dataset.ticker;
                            document.getElementById('action-2').value = 'buy';
                            document.getElementById('side-2').value = 'yes';
                            document.getElementById('yes_price-2').value = marketLi.dataset.ask;
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