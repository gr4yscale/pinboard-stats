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

	updateTags: function() {
		_.forEach(this.posts, function(post) {
			_.forEach(post.tags.split(' '), function(tag) {

				if (!(tag in this.tags)) {
					this.tags[tag] = {"count" : 1, "start_date" : new Date()}
				} else {
					var theTag = this.tags[tag];
					var postDate = new Date(post.time);
					var tagEarliestStartDate = theTag['start_date'];

					theTag['count'] += 1;
					theTag['start_date'] = (postDate < tagEarliestStartDate) ? postDate : tagEarliestStartDate;
				}
			}, this);
		}, this);

		console.log(this.tags);
	}

};

module.exports = Pinboard;