let writtenTweets = [];

function parseTweets(runkeeper_tweets) {
    if (runkeeper_tweets === undefined) {
        window.alert('No tweets returned');
        return;
    }

    writtenTweets = runkeeper_tweets
        .map(tweet => new Tweet(tweet.text, tweet.created_at))
        .filter(tweet => tweet.written);

    updateSearchInfo('');
    updateTweetTable('');
}

function addEventHandlerForSearch() {
    const searchBox = document.getElementById('textFilter');
    
    if (!searchBox) return;

    searchBox.addEventListener('input', function(event) {
        const searchText = event.target.value.trim();
        updateSearchInfo(searchText);
        updateTweetTable(searchText);
    });
}

function updateSearchInfo(searchText) {
    const searchCountElement = document.getElementById('searchCount');
    const searchTextElement = document.getElementById('searchText');
    
    if (!searchCountElement || !searchTextElement) return;

    const filteredCount = searchText ? 
        writtenTweets.filter(tweet => tweet.matchesSearch(searchText)).length : 
        writtenTweets.length;

    searchCountElement.textContent = filteredCount;
    searchTextElement.textContent = searchText ? `"${searchText}"` : 'all tweets';
}

function updateTweetTable(searchText) {
    const table = document.getElementById('tweetTable');
    if (!table) return;

    // Clear table body
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }

    // Filter tweets
    const filteredTweets = writtenTweets.filter(tweet => 
        !searchText || tweet.matchesSearch(searchText)
    );

    if (filteredTweets.length === 0) {
        const row = table.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 5;
        cell.textContent = searchText ? 
            `No written tweets found matching "${searchText}"` : 
            'No written tweets available';
        cell.className = 'text-center text-muted';
    } else {
        filteredTweets.forEach((tweet, index) => {
            addTweetRow(table, tweet, index + 1);
        });
    }
}

function addTweetRow(table, tweet, rowNumber) {
    const row = table.insertRow();
    
    const cells = [
        rowNumber.toString(),
        makeLinksClickable(tweet.text),
        tweet.time.toLocaleDateString(),
        tweet.source === 'completed_event' ? tweet.activityType : 'N/A',
        tweet.writtenText || 'No written content'
    ];

    cells.forEach((content, index) => {
        const cell = row.insertCell();
        if (index === 1) { // Tweet text cell with links
            cell.innerHTML = content;
        } else {
            cell.textContent = content;
        }
        if (index === 4) { // Written text cell
            cell.className = 'text-break';
        }
    });
}

function makeLinksClickable(text) {
    return text.replace(
        /(https?:\/\/[^\s]+)/g, 
        '<a href="$1" target="_blank">$1</a>'
    );
}

// Add search matching to Tweet class
Tweet.prototype.matchesSearch = function(searchText) {
    const lowerSearch = searchText.toLowerCase();
    return this.text.toLowerCase().includes(lowerSearch) || 
           (this.writtenText && this.writtenText.toLowerCase().includes(lowerSearch));
};

document.addEventListener('DOMContentLoaded', function (event) {
    addEventHandlerForSearch();
    loadSavedRunkeeperTweets().then(parseTweets);
});
