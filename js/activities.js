function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets are loaded.
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}
	
	tweet_array = runkeeper_tweets.map(function(tweet) {
		return new Tweet(tweet.text, tweet.created_at);
	});

	// Count tweets by activity type.
	const activityCounts = {};
	tweet_array.forEach(tweet => {
		const activity = tweet.activityType;
		activityCounts[activity] = (activityCounts[activity] || 0) + 1;
	});

	// Convert to array for visualization.
	const activityData = Object.keys(activityCounts).map(activity => {
		return {
			activity: activity,
			count: activityCounts[activity]
		};
	});

	activity_vis_spec = {
	  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
	  "description": "A graph of the number of Tweets containing each type of activity.",
	  "data": {
	    "values": activityData
	  },
	  "mark": "bar",
	  "encoding": {
	    "x": {"field": "activity", "type": "nominal", "title": "Activity Type"},
	    "y": {"field": "count", "type": "quantitative", "title": "Number of Tweets"}
	  }
	};
	vegaEmbed('#activityVis', activity_vis_spec, {actions:false});

	// Find top 3 most tweeted activities.
	const topActivities = Object.keys(activityCounts)
		.sort((a, b) => activityCounts[b] - activityCounts[a])
		.slice(0, 3);

	// Prepare data for day of week visualization.
	const dayData = [];
	tweet_array.forEach(tweet => {
		if (topActivities.includes(tweet.activityType)) {
			dayData.push({
				activity: tweet.activityType,
				day: tweet.time.getDay(), // 0 = Sunday, 1 = Monday, etc.
				dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][tweet.time.getDay()],
				distance: tweet.distance || 0
			});
		}
	});

	// Create visualization for top activities by day of week.
	day_vis_spec = {
	  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
	  "description": "Top 3 activities by day of week",
	  "data": {
	    "values": dayData
	  },
	  "mark": "bar",
	  "encoding": {
	    "x": {"field": "dayName", "type": "ordinal", "title": "Day of Week", "sort": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]},
	    "y": {"field": "distance", "type": "quantitative", "title": "Distance (miles)", "aggregate": "mean"},
	    "color": {"field": "activity", "type": "nominal", "title": "Activity Type"},
	    "xOffset": {"field": "activity", "type": "nominal"}
	  }
	};
	vegaEmbed('#dayVis', day_vis_spec, {actions:false});

	// Analysis for questions about activity length.
	console.log("Analysis of activity lengths by day:");
	topActivities.forEach(activity => {
		const activityTweets = tweet_array.filter(t => t.activityType === activity);
		const avgDistance = activityTweets.reduce((sum, tweet) => sum + (tweet.distance || 0), 0) / activityTweets.length;
		console.log(`${activity}: Average distance = ${avgDistance.toFixed(2)} miles`);
		
		// Check if activity tends to be longer on specific days.
		const dayDistances = {};
		activityTweets.forEach(tweet => {
			const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][tweet.time.getDay()];
			if (!dayDistances[dayName]) {
				dayDistances[dayName] = { total: 0, count: 0 };
			}
			dayDistances[dayName].total += tweet.distance || 0;
			dayDistances[dayName].count += 1;
		});
		
		Object.keys(dayDistances).forEach(day => {
			const avg = dayDistances[day].total / dayDistances[day].count;
			console.log(`  ${day}: ${avg.toFixed(2)} miles`);
		});
	});
}
