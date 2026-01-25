document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('order-form');
    const orderResult = document.getElementById('order-result');

    if (orderForm) {
        orderForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const ticker = document.getElementById('ticker').value;
            const action = document.getElementById('action').value;
            const side = document.getElementById('side').value;
            const yes_price = document.getElementById('yes_price').value;
            const count = document.getElementById('count').value;

            try {
                const response = await fetch('/api/kalshi/order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ticker, action, side, yes_price: parseInt(yes_price), count: parseInt(count) }),
                });

                const result = await response.json();

                if (response.ok) {
                    orderResult.innerHTML = `<p>Order placed successfully!</p><pre>${JSON.stringify(result, null, 2)}</pre>`;
                    orderResult.classList.add('glow-animation');
                    orderResult.addEventListener('animationend', () => {
                        orderResult.classList.remove('glow-animation');
                    }, { once: true });
                } else {
                    orderResult.innerHTML = `<p>Error placing order:</p><pre>${JSON.stringify(result, null, 2)}</pre>`;
                }
            } catch (error) {
                orderResult.innerHTML = `<p>Error: ${error.message}</p>`;
            }
        });
    }
});
