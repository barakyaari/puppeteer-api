const express = require('express');
const puppeteerController = require('../controllers/puppeteerController');

const router = express.Router();

router.post('/scrape', puppeteerController.scrape);

module.exports = router;
