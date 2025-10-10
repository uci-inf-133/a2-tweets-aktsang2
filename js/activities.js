function parseTweets(runkeeper_tweets) {
    if (runkeeper_tweets === undefined) {
        window.alert('No tweets returned');
        return;
    }

    const tweet_array = runkeeper_tweets.map(function(tweet) {
        return new Tweet(tweet.text, tweet.created_at);
    });

    const completedEvents = tweet_array.filter(tweet => 
        tweet.source === 'completed_event' && 
        tweet.activityType !== 'unknown' && 
        tweet.distance > 0
    );

    // Count unique activity types
    const activityTypes = new Set(completedEvents.map(tweet => tweet.activityType));
    document.getElementById('numberActivities').innerText = activityTypes.size;

    // Count activities by type and find top 3
    const activityCounts = {};
    completedEvents.forEach(tweet => {
        activityCounts[tweet.activityType] = (activityCounts[tweet.activityType] || 0) + 1;
    });

    const topActivities = Object.keys(activityCounts)
        .sort((a, b) => activityCounts[b] - activityCounts[a])
        .slice(0, 3);

    // Update top activities in DOM
    ['firstMost', 'secondMost', 'thirdMost'].forEach((id, index) => {
        if (topActivities[index]) {
            document.getElementById(id).innerText = topActivities[index];
        }
    });

    // Create activity count visualization
    createActivityCountChart(activityCounts);

    // Analyze distances and create visualizations
    analyzeActivityDistances(completedEvents, topActivities);
}

function createActivityCountChart(activityCounts) {
    const activityData = Object.keys(activityCounts).map(activity => ({
        activity: activity,
        count: activityCounts[activity]
    })).sort((a, b) => b.count - a.count);

    const activity_vis_spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": "Number of tweets for each activity type",
        "data": { "values": activityData },
        "mark": "bar",
        "encoding": {
            "x": { "field": "activity", "type": "nominal", "title": "Activity Type", "sort": "-y" },
            "y": { "field": "count", "type": "quantitative", "title": "Number of Tweets" },
            "color": { "field": "activity", "type": "nominal", "legend": null }
        }
    };

    vegaEmbed('#activityVis', activity_vis_spec, {actions: false});
}

function analyzeActivityDistances(completedEvents, topActivities) {
    // Calculate average distances
    const activityAverages = {};
    topActivities.forEach(activity => {
        const activityEvents = completedEvents.filter(tweet => tweet.activityType === activity);
        const totalDistance = activityEvents.reduce((sum, tweet) => sum + tweet.distance, 0);
        activityAverages[activity] = activityEvents.length > 0 ? totalDistance / activityEvents.length : 0;
    });

    // Find longest and shortest activities
    const sortedByDistance = Object.keys(activityAverages).sort((a, b) => activityAverages[b] - activityAverages[a]);
    
    // These can be hard-coded based on analysis
    document.getElementById('longestActivityType').innerText = sortedByDistance[0] || 'unknown';
    document.getElementById('shortestActivityType').innerText = sortedByDistance[sortedByDistance.length - 1] || 'unknown';

    // Prepare distance data for visualization
    const distanceData = completedEvents
        .filter(tweet => topActivities.includes(tweet.activityType))
        .map(tweet => {
            const dayOfWeek = tweet.time.getDay();
            return {
                activity: tweet.activityType,
                dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
                distance: tweet.distance,
                isWeekend: dayOfWeek === 0 || dayOfWeek === 6
            };
        });

    // Determine weekday/weekend pattern (can be hard-coded based on analysis)
    const weekendAvg = distanceData.filter(d => d.isWeekend).reduce((sum, d) => sum + d.distance, 0) / 
        Math.max(distanceData.filter(d => d.isWeekend).length, 1);
    const weekdayAvg = distanceData.filter(d => !d.isWeekend).reduce((sum, d) => sum + d.distance, 0) / 
        Math.max(distanceData.filter(d => !d.isWeekend).length, 1);
    
    document.getElementById('weekdayOrWeekendLonger').innerText = 
        weekendAvg > weekdayAvg ? 'weekends' : 'weekdays';

    // Create visualizations
    createDistanceVisualizations(distanceData);
}

function createDistanceVisualizations(distanceData) {
    const individualSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": "Distances of top activities by day of week",
        "data": { "values": distanceData },
        "mark": "point",
        "encoding": {
            "x": { 
                "field": "dayName", 
                "type": "ordinal", 
                "title": "Day of Week",
                "sort": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
            },
            "y": { "field": "distance", "type": "quantitative", "title": "Distance (miles)" },
            "color": { "field": "activity", "type": "nominal", "title": "Activity Type" }
        }
    };

    const aggregatedSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": "Average distances of top activities by day of week",
        "data": { "values": distanceData },
        "mark": "bar",
        "encoding": {
            "x": { 
                "field": "dayName", 
                "type": "ordinal", 
                "title": "Day of Week",
                "sort": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
            },
            "y": { 
                "field": "distance", 
                "type": "quantitative", 
                "title": "Average Distance (miles)",
                "aggregate": "mean" 
            },
            "color": { "field": "activity", "type": "nominal", "title": "Activity Type" },
            "xOffset": { "field": "activity", "type": "nominal" }
        }
    };

    // Show individual points by default
    vegaEmbed('#distanceVis', individualSpec, {actions: false});
    
    // Toggle between views
    document.getElementById('aggregate').addEventListener('click', function() {
        if (this.textContent === 'Show means') {
            vegaEmbed('#distanceVis', aggregatedSpec, {actions: false});
            this.textContent = 'Show individual points';
        } else {
            vegaEmbed('#distanceVis', individualSpec, {actions: false});
            this.textContent = 'Show means';
        }
    });
}

document.addEventListener('DOMContentLoaded', function (event) {
    loadSavedRunkeeperTweets().then(parseTweets);
});
