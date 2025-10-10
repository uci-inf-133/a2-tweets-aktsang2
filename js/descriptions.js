let writtenTweets = [];
let currentFilteredTweets = [];

function parseTweets(runkeeper_tweets) {
    if (runkeeper_tweets === undefined) {
        window.alert('No tweets returned');
        return;
    }

    writtenTweets = runkeeper_tweets
        .map(tweet => new Tweet(tweet.text, tweet.created_at))
        .filter(tweet => tweet.written);

    console.log(`Found ${writtenTweets.length} written tweets`);
    
    // Initialize sentiment summary
    updateSentimentSummary(writtenTweets);
    
    // Initialize table with all written tweets
    updateTweetTable('');
}

function addEventHandlerForSearch() {
    const searchBox = document.getElementById('textFilter');
    
    if (!searchBox) {
        console.error('Search box element not found');
        return;
    }

    searchBox.addEventListener('input', function(event) {
        const searchText = event.target.value.trim();
        updateSearchInfo(searchText);
        updateTweetTable(searchText);
    });

    updateSearchInfo('');
}

function updateSearchInfo(searchText) {
    const searchCountElement = document.getElementById('searchCount');
    const searchTextElement = document.getElementById('searchText');
    
    if (searchCountElement && searchTextElement) {
        const filteredTweets = searchText ? 
            writtenTweets.filter(tweet => tweet.matchesSearch(searchText)) : 
            writtenTweets;
            
        searchCountElement.textContent = filteredTweets.length;
        searchTextElement.textContent = searchText ? `"${searchText}"` : 'all tweets';
        
        // Update sentiment summary for current results
        updateSentimentSummary(filteredTweets);
    }
}

function updateSentimentSummary(tweets) {
    const sentimentCounts = {
        positive: 0,
        neutral: 0,
        negative: 0
    };

    tweets.forEach(tweet => {
        sentimentCounts[tweet.sentiment]++;
    });

    document.getElementById('positiveCount').textContent = sentimentCounts.positive;
    document.getElementById('neutralCount').textContent = sentimentCounts.neutral;
    document.getElementById('negativeCount').textContent = sentimentCounts.negative;
}

function updateTweetTable(searchText) {
    const tweetTable = document.getElementById('tweetTable');
    
    if (!tweetTable) {
        console.error('Tweet table element not found');
        return;
    }

    // Clear the table body (keep header)
    clearTableBody(tweetTable);

    // Filter tweets based on search text
    currentFilteredTweets = searchText ? 
        writtenTweets.filter(tweet => tweet.matchesSearch(searchText)) : 
        writtenTweets;

    // Add matching tweets to the table
    if (currentFilteredTweets.length === 0) {
        addNoResultsRow(tweetTable, searchText);
    } else {
        addTweetsToTable(tweetTable, currentFilteredTweets);
    }
}

function clearTableBody(table) {
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }
}

function addNoResultsRow(table, searchText) {
    const row = table.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 7;
    cell.textContent = searchText ? 
        `No written tweets found matching "${searchText}"` : 
        'No written tweets available';
    cell.className = 'text-center text-muted p-4';
}

function addTweetsToTable(table, tweets) {
    tweets.forEach((tweet, index) => {
        const row = table.insertRow();
        
        // Apply sentiment-based background color
        if (tweet.sentiment === 'positive') {
            row.classList.add('table-success');
        } else if (tweet.sentiment === 'negative') {
            row.classList.add('table-danger');
        }

        // Row number
        const numCell = row.insertCell();
        numCell.textContent = index + 1;
        numCell.className = 'text-center';

        // Tweet text with clickable links
        const tweetCell = row.insertCell();
        tweetCell.innerHTML = makeLinksClickable(tweet.text);
        tweetCell.className = 'text-break';

        // Date
        const dateCell = row.insertCell();
        dateCell.textContent = tweet.time.toLocaleDateString();

        // Source type
        const typeCell = row.insertCell();
        typeCell.textContent = tweet.source.replace('_', ' ');

        // Written text
        const writtenCell = row.insertCell();
        writtenCell.textContent = tweet.writtenText || '—';
        writtenCell.className = 'text-break';

        // Sentiment with visual indicators
        const sentimentCell = row.insertCell();
        if (tweet.written) {
            sentimentCell.innerHTML = `
                <div class="text-center">
                    <div class="h5 mb-1">${tweet.sentimentIcon}</div>
                    <div class="small ${tweet.sentimentColorClass}">
                        ${tweet.sentiment}<br>
                        <small>${tweet.sentimentScore.toFixed(2)}</small>
                    </div>
                </div>
            `;
        } else {
            sentimentCell.innerHTML = '<span class="text-muted">N/A</span>';
        }

        // Activity link
        const linkCell = row.insertCell();
        linkCell.className = 'text-center';
        const activityLink = tweet.extractActivityLink();
        if (activityLink) {
            linkCell.innerHTML = `<a href="${activityLink}" target="_blank" class="btn btn-sm btn-outline-primary">View Activity</a>`;
        } else {
            linkCell.innerHTML = '<span class="text-muted">No link</span>';
        }
    });
}

function makeLinksClickable(text) {
    return text.replace(
        /(https?:\/\/[^\s]+)/g, 
        '<a href="$1" target="_blank" class="text-primary text-break">$1</a>'
    );
}

// Enhanced search matching in Tweet class
Tweet.prototype.matchesSearch = function(searchText) {
    if (!searchText) return true;
    
    const lowerSearch = searchText.toLowerCase();
    
    // Search in multiple fields including sentiment
    return this.text.toLowerCase().includes(lowerSearch) || 
           (this.writtenText && this.writtenText.toLowerCase().includes(lowerSearch)) ||
           this.sentiment.toLowerCase().includes(lowerSearch) ||
           this.source.toLowerCase().includes(lowerSearch);
};

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
    addEventHandlerForSearch();
    loadSavedRunkeeperTweets().then(parseTweets);
});
