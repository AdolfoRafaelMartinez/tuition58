document.getElementById('kalshi-order-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const orderParams = {};
    formData.forEach((value, key) => {
        if (value) {
           if(key === 'count' || key === 'yes_price') {
                orderParams[key] = parseInt(key === 'yes_price' ? value : value, 10);
            } else {
                orderParams[key] = value;
            }
        }
    });

    const responseContainer = document.getElementById('order-response');

    try {
        const response = await fetch('/api/kalshi/order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderParams)
        });

        const result = await response.json();

        if (response.ok) {
            responseContainer.innerHTML = `<p>Order placed successfully!</p><pre>${JSON.stringify(result, null, 2)}</pre>`;
        } else {
            responseContainer.innerHTML = `<p>Error placing order:</p><pre>${JSON.stringify(result, null, 2)}</pre>`;
        }
    } catch (error) {
        console.error('Error placing order:', error);
        responseContainer.innerHTML = `<p>An unexpected error occurred. Please check the console for details.</p>`;
    }
});