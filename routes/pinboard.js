var express = require('express');
var router = express.Router();

router.get('/timeSeries', function(req, res, next) {
	// temp mock data source; implement mongodb fetching next
	res.sendFile('/Users/gr4yscale/code/pinboard-stats/theJSON.json');
});

module.exports = router;