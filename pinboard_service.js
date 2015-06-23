var _ = require('lodash');
var request = require('request');
var fs = require('fs');
var moment = require('moment');

var PinboardService = function() {
	this.posts = [];
	this.tags = [];
	this.startDate = new Date(0);
	this.endDate = new Date();
}

PinboardService.prototype = {

	fetchData: function() {
		// fetch data locally during dev; hit pinboard API later
		//this.posts = JSON.parse(fs.readFileSync('./posts.json', 'utf8'));
		
		 var _this = this;
		 var token = process.env.PINBOARD_OAUTH_TOKEN;
		 request('https://api.pinboard.in/v1/posts/all?auth_token=gr4yscale:' + token + '&format=json', function (error, response, body) {
		 	if (!error && response.statusCode == 200) {
		 		_this.posts = JSON.parse(body);
		 	}
		 });
	},

	tagsForPosts: function(posts) {

		// super messy - I'm building a hashmap to ensure uniqueness, then iterating on the keys to build a proper collection so that lodash is happy
		// I'll have to fix this later...

		var tagsHashmap = []; // shouldn't this be {} ? Check later.

		_.forEach(posts, function(post) {
			_.forEach(post.tags.split(' '), function(tag) {

				if (!(tag in tagsHashmap)) {
					tagsHashmap[tag] = {'tag': tag, 'count' : 1, 'start_date' : new Date()}
				} else {
					var postDate = new Date(post.time);
					var tagEarliestStartDate = tagsHashmap[tag]['start_date'];

					tagsHashmap[tag]['tag'] = tag;
					tagsHashmap[tag]['count'] += 1;
					tagsHashmap[tag]['start_date'] = (postDate < tagEarliestStartDate) ? postDate : tagEarliestStartDate;
				}
			});
		});

		var tags = [];
		for (var tag in tagsHashmap) {
			tags.push(tagsHashmap[tag]);
		}

		return _.sortBy(tags, 'count').reverse();;
	},

	// return a 2-dimensional array of tags + cumulative tag counts for an array of posts
	sortedTagCountsForPosts: function(posts) {

		var tagsMap = {};

		_.forEach(posts, function(post) {
			_.forEach(post.tags.split(' '), function(tag) {
				if (!(tag in tagsMap)) {
					tagsMap[tag] = 1;
				} else {
					tagsMap[tag] += 1;
				}
			});
		});

		var tagsArray = [];
		for (var key in tagsMap) tagsArray.push([key, tagsMap[key]]);

		var sortedTags = tagsArray.sort(function(a, b) {
			a = a[1];
			b = b[1];
			return a > b ? -1 : (a < b ? 1 : 0);
		});

		return sortedTags;
	},

	postsForDateRange: function(posts, startDate, endDate) {

		return _.chain(posts)
			.filter(function(post) {
				var postDate = new Date(post.time);
				return postDate > startDate && postDate < endDate;
			})
			.sortBy('time')
			.value();
	},
 

	timeSeriesPacked: function(posts, startDate, endDate, numTags, cumulative, daysPerInterval) {

		// find out all tags for entire date range
		// sort them by total cumulative count (what it ends up being on the end date)

		var sortedTagCounts = this.sortedTagCountsForPosts(posts).slice(0, numTags + 1);

		var sortedTags = [];

		for (var i = 0; i < sortedTagCounts.length; i++) {
			sortedTags.push(sortedTagCounts[i][0]);
		}

		// use moment.js to calculate number of days between dates, taking daylight savings into account
		var start = moment(startDate);
		var end = moment(endDate);

		var daysBetweenStartAndEnd = end.diff(start, "days");

		var timeSeries = {};

		for (var i = 0; i < daysBetweenStartAndEnd + 1; i = i + daysPerInterval) {

			var cumulativeTagCountArray = new Array(sortedTags.length);
			for (var j = 0; j < cumulativeTagCountArray.length; j++) {
				cumulativeTagCountArray[j] = 0;
			}

      var currentDate = moment(startDate).add(i, 'days');
      var postsForDateRange;

      if (cumulative === true) {
        postsForDateRange = this.postsForDateRange(posts, startDate, currentDate);
      } else {
        postsForDateRange = this.postsForDateRange(posts, currentDate, moment(currentDate).add(daysPerInterval, 'days'));
      }

			_.forEach(postsForDateRange, function(post) {
				_.forEach(post.tags.split(' '), function(tag) {
					var tagIndex = sortedTags.indexOf(tag); // if not found, don't add tag (it was blacklisted)
					cumulativeTagCountArray[tagIndex]++;
				});
			});

			timeSeries[i] = cumulativeTagCountArray;
		}

		return { "tags" : sortedTags, "timeSeries" : timeSeries, "sampleCount" : daysBetweenStartAndEnd, "daysPerInterval" : daysPerInterval};
	},


	displayAndWriteJSONToFile: function(obj, fileName) {

		// , null, '\t' (to make pretty)
		console.log(JSON.stringify(obj));

		fs.writeFile(fileName, JSON.stringify(obj), function(err) {
		    if(err) {
		      console.log(err);
		    } else {
		      console.log("JSON saved to " + fileName);
		    }
		}); 
	}

};

module.exports = PinboardService;
