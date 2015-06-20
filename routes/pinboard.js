var express = require('express');
var router = express.Router();

router.get('/timeSeries/:startDate/:endDate/:numTopTags/:cumulative/:daysPerInterval', function(req, res, next) {

	//res.sendFile('/Users/gr4yscale/code/pinboard-stats/cachedTimeSeriesResponse.json');

  var startDate = new Date(req.params.startDate);
  var endDate = new Date(req.params.endDate);
  var numTopTags = parseInt(req.params.numTopTags);
  var cumulative = (req.params.cumulative === 'true');
  var daysPerInterval = parseInt(req.params.daysPerInterval);

  var pinboard_service = req.app.get("pinboard_service");
  var currently_fetched_posts = pinboard_service.posts;
  var filteredPosts = pinboard_service.postsForDateRange(currently_fetched_posts, startDate, endDate);
  var timeSeries = pinboard_service.timeSeriesPacked(filteredPosts, startDate, endDate, numTopTags, cumulative, daysPerInterval);

  res.json(timeSeries);
});

module.exports = router;
