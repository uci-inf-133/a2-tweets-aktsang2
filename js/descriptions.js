let writtenTweets = []; // Global variable to store filtered tweets.

function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets are loaded.
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}

	// Filter to just the written tweets.
	writtenTweets = runkeeper_tweets
		.map(function(tweet) {
			return new Tweet(tweet.text, tweet.created_at);
		})
		.filter(function(tweet) {
			return tweet.written; // Only keep tweets that have written text.
		});

	console.log(`Found ${writtenTweets.length} written tweets out of ${runkeeper_tweets.length} total tweets`);
}

function addEventHandlerForSearch() {
	// Search the written tweets as text is entered into the search box, and add them to the table.
	const searchBox = document.getElementById('textFilter');
	const tweetTable = document.getElementById('tweetTable');
	
	if (!searchBox || !tweetTable) {
		console.error('Required DOM elements not found');
		return;
	}
	
	searchBox.addEventListener('input', function(event) {
		const searchText = event.target.value.toLowerCase().trim();
		
		// Clear previous results.
		while (tweetTable.rows.length > 1) {
			tweetTable.deleteRow(1);
		}
		
		// Filter tweets based on search text.
		const filteredTweets = writtenTweets.filter(function(tweet) {
			return tweet.text.toLowerCase().includes(searchText) || 
				   tweet.writtenText.toLowerCase().includes(searchText);
		});
		
		// Add matching tweets to the table.
		filteredTweets.forEach(function(tweet) {
			const row = tweetTable.insertRow();
			
			// Tweet text cell.
			const tweetCell = row.insertCell();
			tweetCell.textContent = tweet.text;
			
			// Date cell.
			const dateCell = row.insertCell();
			dateCell.textContent = tweet.time.toLocaleDateString();
			
			// Written text cell.
			const writtenCell = row.insertCell();
			writtenCell.textContent = tweet.writtenText;
		});
		
		console.log(`Found ${filteredTweets.length} tweets matching "${searchText}"`);
	});
}
