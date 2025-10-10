function parseTweets(runkeeper_tweets) {
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

    // Calculate date range
    const dates = tweet_array.map(tweet => tweet.time).sort((a, b) => a - b);
    if (dates.length > 0) {
        const firstDate = dates[0];
        const lastDate = dates[dates.length - 1];
        document.getElementById('firstDate').innerText = firstDate.toLocaleDateString();
        document.getElementById('lastDate').innerText = lastDate.toLocaleDateString();
    }

    // Count tweets by source type
    const sourceCounts = {
        'completed_event': 0,
        'live_event': 0,
        'achievement': 0,
        'miscellaneous': 0
    };

    tweet_array.forEach(tweet => {
        const source = tweet.source;
        if (sourceCounts.hasOwnProperty(source)) {
            sourceCounts[source]++;
        } else {
            sourceCounts['miscellaneous']++;
        }
    });

    // Update source type statistics
    updateSourceStats('completedEvents', sourceCounts['completed_event'], tweet_array.length);
    updateSourceStats('liveEvents', sourceCounts['live_event'], tweet_array.length);
    updateSourceStats('achievements', sourceCounts['achievement'], tweet_array.length);
    updateSourceStats('miscellaneous', sourceCounts['miscellaneous'], tweet_array.length);

    // Calculate written tweets statistics for completed events
    const completedEvents = tweet_array.filter(tweet => tweet.source === 'completed_event');
    const writtenCompletedEvents = completedEvents.filter(tweet => tweet.written);
    
    // Update written tweets statistics
    document.querySelector('.completedEvents').innerText = completedEvents.length;
    document.querySelector('.written').innerText = writtenCompletedEvents.length;
    
    const writtenPercentage = completedEvents.length > 0 ? 
        ((writtenCompletedEvents.length / completedEvents.length) * 100).toFixed(2) : 0;
    document.querySelector('.writtenPct').innerText = writtenPercentage + '%';

    // Log summary for verification
    console.log('Tweet Analysis Summary:');
    console.log(`Total tweets: ${tweet_array.length}`);
    console.log(`Completed events: ${sourceCounts['completed_event']}`);
    console.log(`Live events: ${sourceCounts['live_event']}`);
    console.log(`Achievements: ${sourceCounts['achievement']}`);
    console.log(`Miscellaneous: ${sourceCounts['miscellaneous']}`);
    console.log(`Written completed events: ${writtenCompletedEvents.length} (${writtenPercentage}%)`);
}

// Helper function to update source type statistics
function updateSourceStats(className, count, total) {
    const elements = document.getElementsByClassName(className);
    const percentage = total > 0 ? ((count / total) * 100).toFixed(2) : 0;
    
    // Update count elements
    for (let element of elements) {
        if (element.classList.contains(className) && !element.classList.contains(className + 'Pct')) {
            element.innerText = count;
        }
    }
    
    // Update percentage elements
    const pctElements = document.getElementsByClassName(className + 'Pct');
    for (let element of pctElements) {
        element.innerText = percentage + '%';
    }
}

// Alternative implementation with more explicit element selection
function updateSourceStatsAlternative() {
    // This is an alternative approach if the above doesn't work with your HTML structure
    const sources = ['completedEvents', 'liveEvents', 'achievements', 'miscellaneous'];
    
    sources.forEach(source => {
        const count = sourceCounts[source.replace('Events', '_event').replace('achievements', 'achievement')];
        const percentage = ((count / tweet_array.length) * 100).toFixed(2);
        
        // Update count
        const countElements = document.querySelectorAll(`.${source}`);
        countElements.forEach(el => {
            if (!el.className.includes('Pct')) {
                el.innerText = count;
            }
        });
        
        // Update percentage
        const pctElements = document.querySelectorAll(`.${source}Pct`);
        pctElements.forEach(el => {
            el.innerText = percentage + '%';
        });
    });
}

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
    loadSavedRunkeeperTweets().then(parseTweets);
});
