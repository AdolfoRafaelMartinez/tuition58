document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/kalshi/limits')
        .then(response => response.json())
        .then(data => {
            const limitsResult = document.getElementById('limits-result');
            if (data.usage_tier) {
                const limitsHtml = `
                            <p><strong>tier:</strong> ${data.usage_tier}</p>
                            <p><strong>reads/second limit:</strong> ${data.read_limit}</p>
                            <p><strong>writes/second limit:</strong> ${data.write_limit}</p>
                        `;
                limitsResult.innerHTML = limitsHtml;
            } else {
                limitsResult.innerHTML = '<p>Account limit data not available.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching account limits:', error);
            const limitsResult = document.getElementById('limits-result');
            limitsResult.innerHTML = '<p>Error fetching account limit data.</p>';
    });
});