document.addEventListener('DOMContentLoaded', () => {
    const tradesResult = document.getElementById('trades-result');

    async function fetchTrades() {
        const ticker = 'KXHIGHAUS-26FEB22-B64.5'; // Hardcoded for now

        try {
            // Use the new server-side proxy endpoint
            const response = await fetch(`/api/kalshi/trades/${ticker}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.trades && data.trades.length > 0) {
                let html = '<table><thead><tr><th>Price</th><th>Count</th><th>Taker Side</th><th>Created At</th></tr></thead><tbody>';
                data.trades.forEach(trade => {
                    html += `<tr>`;
                    html += `<td>${trade.price}</td>`;
                    html += `<td>${trade.count}</td>`;
                    html += `<td>${trade.taker_side}</td>`;
                    html += `<td>${new Date(trade.created_at).toLocaleString()}</td>`;
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