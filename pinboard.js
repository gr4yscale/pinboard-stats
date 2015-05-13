var request = require('request');
var _ = require('lodash');
var fs = require('fs');

var Pinboard = function() {
	this.posts = [];
	this.tags = [];
	this.startDate = new Date(0);
	this.endDate = new Date();
}

Pinboard.prototype = {

	fetchData: function() {
		// fetch data locally during dev; hit pinboard API later
		this.posts = JSON.parse(fs.readFileSync('./posts.json', 'utf8'));

		// request('https://api.pinboard.in/v1/posts/all?auth_token=gr4yscale:[redacted]&format=json', function (error, response, body) {
		// 	if (!error && response.statusCode == 200) {
		// 		this.posts = JSON.parse(body);
		// 		console.log(this.posts[0]);
		// 	}
		// });
	},

	tagsForPosts: function(posts) {

		// super messy - I'm building a hashmap to ensure uniqueness, then iterating on the keys to build a proper collection so that lodash is happy
		// I'll have to fix this later...

		var tagsHashmap = [];

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

	postsForDateRange: function(posts, startDate, endDate) {
		return _.chain(posts)
			.filter(function(post) {
				var postDate = new Date(post.time);
				return postDate > startDate && postDate < endDate;
			})
			.sortBy('time')
			.value();
	},

	// time series endpoint

};

module.exports = Pinboard;