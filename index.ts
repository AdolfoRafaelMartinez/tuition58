import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import { getAustinWeatherForecast } from "./examples/weather.js";
import { getKalshiBalance } from "./services/kalshiService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

debugger;

const app = express();
const port = parseInt(process.env.PORT) || process.argv[3] || 8080;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public/')));

app.get('/', async (req, res) => {
  const weather = await getAustinWeatherForecast();
  const kalshi = await getKalshiBalance();
  res.render('index', { weather: weather.data, kalshi: kalshi.data });
});

app.get('/api', (req, res) => {
  res.json({"msg": "Hello world"});
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
