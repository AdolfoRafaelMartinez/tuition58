import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import { getAustinWeatherForecast } from "./examples/weather.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT) || process.argv[3] || 8080;

app.use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs');

app.get('/', async (req, res) => {
  const weather = await getAustinWeatherForecast();
  res.render('index', { weather: weather.data });
});

app.get('/api', (req, res) => {
  res.json({"msg": "Hello world"});
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
