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
                    let html = '<div class="market-rows-container">';
                    const forecast_temp = data.forecast_temp;

                    for (const market of data.markets) {
                        html += `<div class="market-row" data-ticker="${market.ticker}" data-ask="${market.yes_ask}">`;
                        html += `<span>${market.ticker}</span>`;
                        html += `<span>${market.lower} to ${market.upper}</span>`;
                        html += `<span>${market.yes_ask}</span>`;
                        html += `<span>${market.yes_bid}</span>`;
                        html += `<span>${market.status}</span>`;

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

                        html += `</div>`;
                    }
                    html += '</div>';

                    marketResult.innerHTML = html;

                    const container = document.querySelector('.container');
                    const balance = parseInt(container.dataset.balance, 10);

                    const primaryRec = marketResult.querySelector('.buy-recommendation');
                    if (primaryRec) {
                        const marketRow = primaryRec.closest('.market-row');
                        if (marketRow) {
                            const yesAsk = parseInt(marketRow.dataset.ask, 10);
                            const count = (balance && yesAsk) ? Math.floor((balance / 3) / yesAsk) : 1;
                            document.getElementById('ticker').value = marketRow.dataset.ticker;
                            document.getElementById('action').value = 'buy';
                            document.getElementById('side').value = 'yes';
                            document.getElementById('yes_price').value = yesAsk;
                            document.getElementById('count').value = count;
                        }
                    }

                    const secondaryRec = marketResult.querySelector('.secondary-recommendation');
                    if (secondaryRec) {
                        const marketRow = secondaryRec.closest('.market-row');
                        if (marketRow) {
                            const yesAsk = parseInt(marketRow.dataset.ask, 10);
                            const count = (balance && yesAsk) ? Math.floor((balance / 3) / yesAsk) : 1;
                            document.getElementById('ticker-2').value = marketRow.dataset.ticker;
                            document.getElementById('action-2').value = 'buy';
                            document.getElementById('side-2').value = 'yes';
                            document.getElementById('yes_price-2').value = yesAsk;
                            document.getElementById('count-2').value = count;
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