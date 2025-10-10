function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets loaded
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}

	tweet_array = runkeeper_tweets.map(function(tweet) {
		return new Tweet(tweet.text, tweet.created_at);
	});
	
	// Update total number of tweets
	document.getElementById('numberTweets').innerText = tweet_array.length;

	// Helper function to safely update DOM elements
	function updateElement(id, value) {
		const element = document.getElementById(id);
		if (element) {
			element.innerText = value;
		} else {
			console.warn(`Element with id '${id}' not found`);
		}
	}

	// Update first and last dates
	if (tweet_array.length > 0) {
		const sortedTweets = [...tweet_array].sort((a, b) => a.time - b.time);
		updateElement('firstDate', sortedTweets[0].time.toLocaleDateString());
		updateElement('lastDate', sortedTweets[sortedTweets.length - 1].time.toLocaleDateString());
	} else {
		updateElement('firstDate', 'N/A');
		updateElement('lastDate', 'N/A');
	}

	// Update completed events statistics
	const completedEvents = tweet_array.filter(tweet => tweet.source === 'completed_event');
	updateElement('numberCompleted', completedEvents.length);
	
	const completedPercentage = tweet_array.length > 0 ? 
		((completedEvents.length / tweet_array.length) * 100).toFixed(2) + '%' : '0%';
	updateElement('completedPercentage', completedPercentage);

	// Update written tweets statistics
	const writtenTweets = tweet_array.filter(tweet => tweet.written);
	updateElement('numberWritten', writtenTweets.length);
	
	const writtenPercentage = tweet_array.length > 0 ? 
		((writtenTweets.length / tweet_array.length) * 100).toFixed(2) + '%' : '0%';
	updateElement('writtenPercentage', writtenPercentage);
}
