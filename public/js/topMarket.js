document.addEventListener('DOMContentLoaded', () => {
    // This function fetches and displays data for the top market.
    async function fetchAndDisplayTopMarket() {
        const eventTickerInput = document.getElementById('event-ticker');
        const eventTicker = eventTickerInput.value;
        const topMarketResult = document.getElementById('top-market-result');

        if (!eventTicker) {
            topMarketResult.innerHTML = '<p>Please enter an event ticker to see the top market.</p>';
            return;
        }

        topMarketResult.innerHTML = '<p>Loading top market trades...</p>'; // Provide feedback

        try {
            const response = await fetch(`/api/kalshi/markets/${eventTicker}/top`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch top market data.');
            }

            const data = await response.json();
            
            // The endpoint returns trades directly in an object with a 'trades' array
            if (data.trades && data.trades.length > 0) {
                let html = '<table>';
                html += '<thead><tr><th>Time</th><th>Price (¢)</th><th>Volume</th></tr></thead>';
                html += '<tbody>';
                data.trades.forEach(trade => {
                    html += `<tr>
                        <td>${new Date(trade.created_at).toLocaleTimeString()}</td>
                        <td>${trade.yes_price}</td>
                        <td>${trade.count}</td>
                    </tr>`;
                });
                html += '</tbody></table>';
                topMarketResult.innerHTML = html;
            } else {
                topMarketResult.innerHTML = '<p>No recent trades found for the top market.</p>';
            }

        } catch (error) {
            console.error('Error fetching top market:', error);
            topMarketResult.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    }

    // Check if the original function from marketForm.js exists before wrapping it.
    if (window.fetchAndDisplayMarkets) {
        const originalFetchAndDisplayMarkets = window.fetchAndDisplayMarkets;

        // Create the new wrapped function.
        window.fetchAndDisplayMarkets = async function() {
            // First, call the original function to populate markets and positions.
            await originalFetchAndDisplayMarkets();

            // After the original function is complete, fetch the top market data.
            await fetchAndDisplayTopMarket();
        };
    } else {
        console.error('Error: fetchAndDisplayMarkets function not found. Top market data will not be loaded.');
    }
});