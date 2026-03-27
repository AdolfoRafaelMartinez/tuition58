import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import { getKalshiBalance, placeKalshiOrder, getKalshiMarkets, getKalshiPositions, getKalshiLimits, generateRecommendations } from "./services/kalshi.js";

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

app.post('/api/kalshi/recommendations', (req, res) => {
    const { markets, marketPriceHistory } = req.body;
    if (!markets || !marketPriceHistory) {
        return res.status(400).json({ error: 'Missing markets or marketPriceHistory data' });
    }
    const recommendations = generateRecommendations(markets, marketPriceHistory);
    res.json({ recommendations });
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

app.get('/api/kalshi/markets/:event_ticker', async (req, res) => {
    const event_ticker = req.params.event_ticker;
    const marketResult = await getKalshiMarkets(event_ticker);

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