import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import { getKalshiBalance, placeKalshiOrder, getKalshiMarkets, getKalshiPositions, getKalshiLimits } from "./services/kalshi.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT) || process.argv[3] || 3000;

app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));

app.set('view engine', 'ejs');
app.use(express.json());

app.get('/', async (req, res) => {
    const kalshi = await getKalshiBalance();
    res.render('index', {
        kalshi: kalshi.data,
        generatedAt: new Date()
    });
});

app.post('/api/kalshi/order', async (req, res) => {
    const orderParams = req.body;
    const result = await placeKalshiOrder(orderParams);
    if (result.error) {
        res.status(500).json({ error: result.error });
    } else {
        res.json(result.data);
    }
});

app.post('/api/kalshi/place-orders', async (req, res) => {
    const { orders } = req.body;

    if (!orders || !Array.isArray(orders)) {
        return res.status(400).json({ error: 'Invalid orders format.' });
    }

    const results = [];
    for (const order of orders) {
        const result = await placeKalshiOrder(order);
        results.push(result);
    }

    const hasError = results.some(r => r.error);
    if (hasError) {
        res.status(500).json({ error: 'One or more orders failed to place.', results });
    } else {
        res.json({ success: true, results });
    }
});

app.post('/api/kalshi/markets/:event_ticker', async (req, res) => {
    const event_ticker = req.params.event_ticker;
    const marketPriceHistory = req.body.marketPriceHistory || {};
    const marketResult = await getKalshiMarkets(event_ticker, marketPriceHistory);

    if (marketResult.error) {
        return res.status(500).json({ error: marketResult.error });
    }

    // Combine the market data with the forecast temperature
    const responseData = {
        ...marketResult.data
    };

    res.json(responseData);
});

app.get('/api/kalshi/positions', async (req, res) => {
    const positions = await getKalshiPositions();
    if (positions.error) {
        res.status(500).json({ error: positions.error });
    } else {
        res.json(positions.data);
    }
});

app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
});