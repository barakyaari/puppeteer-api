const express = require('express');
const puppeteerRoutes = require('./routes/puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/puppeteer', puppeteerRoutes);

app.get('/', (req, res) => res.send('Puppeteer API is running.'));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
