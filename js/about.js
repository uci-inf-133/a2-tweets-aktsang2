function parseTweets(runkeeper_tweets) {
    if (runkeeper_tweets === undefined) {
        window.alert('No tweets returned');
        return;
    }

    const tweet_array = runkeeper_tweets.map(function(tweet) {
        return new Tweet(tweet.text, tweet.created_at);
    });

    // Update total number of tweets
    document.getElementById('numberTweets').innerText = tweet_array.length;

    // Calculate date range
    updateTweetDates(tweet_array);

    // Count and display tweet categories
    updateTweetCategories(tweet_array);

    // Calculate and display written tweets statistics
    updateWrittenTweets(tweet_array);
}

function updateTweetDates(tweet_array) {
    if (tweet_array.length === 0) return;

    const sortedTweets = [...tweet_array].sort((a, b) => a.time - b.time);
    const firstDate = sortedTweets[0].time;
    const lastDate = sortedTweets[sortedTweets.length - 1].time;

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('firstDate').innerText = firstDate.toLocaleDateString('en-US', options);
    document.getElementById('lastDate').innerText = lastDate.toLocaleDateString('en-US', options);
}

function updateTweetCategories(tweet_array) {
    const categoryCounts = {
        'completed_event': 0,
        'live_event': 0,
        'achievement': 0,
        'miscellaneous': 0
    };

    tweet_array.forEach(tweet => {
        const category = tweet.source;
        categoryCounts[category]++;
    });

    const totalTweets = tweet_array.length;
    
    // Update each category
    ['completedEvents', 'liveEvents', 'achievements', 'miscellaneous'].forEach(category => {
        const key = category.replace('Events', '_event').replace('achievements', 'achievement');
        const count = categoryCounts[key];
        const percentage = totalTweets > 0 ? ((count / totalTweets) * 100).toFixed(2) : '0.00';
        
        // Update count elements
        document.querySelectorAll(`.${category}:not(.${category}Pct)`).forEach(el => {
            el.innerText = count;
        });
        
        // Update percentage elements
        document.querySelectorAll(`.${category}Pct`).forEach(el => {
            el.innerText = percentage + '%';
        });
    });
}

function updateWrittenTweets(tweet_array) {
    const completedEvents = tweet_array.filter(tweet => tweet.source === 'completed_event');
    const writtenCompletedEvents = completedEvents.filter(tweet => tweet.written);
    
    const completedCount = completedEvents.length;
    const writtenCount = writtenCompletedEvents.length;
    const writtenPercentage = completedCount > 0 ? 
        ((writtenCount / completedCount) * 100).toFixed(2) : '0.00';

    // Update completed events count in the last paragraph
    document.querySelectorAll('.completedEvents:not(.completedEventsPct)').forEach(el => {
        el.innerText = completedCount;
    });
    
    document.querySelector('.written').innerText = writtenCount;
    document.querySelector('.writtenPct').innerText = writtenPercentage + '%';
}

document.addEventListener('DOMContentLoaded', function (event) {
    loadSavedRunkeeperTweets().then(parseTweets);
});
