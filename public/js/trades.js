document.addEventListener('DOMContentLoaded', () => {
    const tradesResult = document.getElementById('trades-result');

    async function fetchTrades() {
        const ticker = 'KXHIGHAUS-26FEB22-B64.5'; // Hardcoded for now

        try {
            // https://api.elections.kalshi.com/trade-api/v2/markets/trades?limit=100&ticker=KXHIGHAUS-26FEB22-B62.5
            const response = await fetch(`https://api.elections.kalshi.com/trade-api/v2/markets/trades?limit=100&ticker=${ticker}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.trades && data.trades.length > 0) {
                let html = '<table class="market-table"><thead><tr><th>Price</th><th>Count</th><th>Taker Side</th><th>Created At</th></tr></thead><tbody>';
                data.trades.forEach(trade => {
                    let createdAt = 'N/A';
                    if (trade.created_time) {
                        createdAt = new Date(parseInt(trade.created_time.substring(0, 13))).toLocaleString();
                    }
                    html += `<tr>`;
                    html += `<td>${trade.price}</td>`;
                    html += `<td>${trade.count}</td>`;
                    html += `<td>${trade.taker_side}</td>`;
                    html += `<td>${createdAt}</td>`;
                    html += `</tr>`;
                });
                html += '</tbody></table>';
                tradesResult.innerHTML = html;
            } else {
                tradesResult.innerHTML = '<p>No trades found for this market.</p>';
            }
        } catch (error) {
            console.error('Error fetching trades:', error);
            tradesResult.innerHTML = `<p>Error fetching trades: ${error.message}</p>`;
        }
    }

    fetchTrades();
});