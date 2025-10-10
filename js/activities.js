function parseTweets(runkeeper_tweets) {
    //Do not proceed if no tweets loaded
    if(runkeeper_tweets === undefined) {
        window.alert('No tweets returned');
        return;
    }

    tweet_array = runkeeper_tweets.map(function(tweet) {
        return new Tweet(tweet.text, tweet.created_at);
    });

    // Filter to only completed events for activity analysis
    const completedEvents = tweet_array.filter(tweet => tweet.source === 'completed_event');
    
    // Update number of activities
    const activityTypes = new Set();
    completedEvents.forEach(tweet => {
        if (tweet.activityType && tweet.activityType !== 'unknown') {
            activityTypes.add(tweet.activityType);
        }
    });
    document.getElementById('numberActivities').innerText = activityTypes.size;

    // Count activities by type
    const activityCounts = {};
    completedEvents.forEach(tweet => {
        const activity = tweet.activityType;
        if (activity && activity !== 'unknown') {
            activityCounts[activity] = (activityCounts[activity] || 0) + 1;
        }
    });

    // Find top 3 most common activities
    const topActivities = Object.keys(activityCounts)
        .sort((a, b) => activityCounts[b] - activityCounts[a])
        .slice(0, 3);

    // Update DOM with top activities
    if (topActivities.length >= 1) {
        document.getElementById('firstMost').innerText = topActivities[0];
    }
    if (topActivities.length >= 2) {
        document.getElementById('secondMost').innerText = topActivities[1];
    }
    if (topActivities.length >= 3) {
        document.getElementById('thirdMost').innerText = topActivities[2];
    }

    // Create activity count visualization
    const activityData = Object.keys(activityCounts).map(activity => {
        return {
            activity: activity,
            count: activityCounts[activity]
        };
    });

    activity_vis_spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": "Number of tweets for each activity type",
        "data": {
            "values": activityData
        },
        "mark": "bar",
        "encoding": {
            "x": {
                "field": "activity", 
                "type": "nominal", 
                "title": "Activity Type",
                "sort": "-y"
            },
            "y": {
                "field": "count", 
                "type": "quantitative", 
                "title": "Number of Tweets"
            },
            "color": {
                "field": "activity",
                "type": "nominal",
                "legend": null
            }
        }
    };
    vegaEmbed('#activityVis', activity_vis_spec, {actions:false});

    // Analyze distances for top 3 activities
    analyzeActivityDistances(completedEvents, topActivities);
}

function analyzeActivityDistances(completedEvents, topActivities) {
    // Calculate average distances for each activity
    const activityAverages = {};
    topActivities.forEach(activity => {
        const activityEvents = completedEvents.filter(tweet => 
            tweet.activityType === activity && tweet.distance > 0
        );
        const totalDistance = activityEvents.reduce((sum, tweet) => sum + tweet.distance, 0);
        activityAverages[activity] = activityEvents.length > 0 ? 
            totalDistance / activityEvents.length : 0;
    });

    // Find longest and shortest activities
    const sortedByDistance = Object.keys(activityAverages)
        .sort((a, b) => activityAverages[b] - activityAverages[a]);
    
    if (sortedByDistance.length >= 1) {
        document.getElementById('longestActivityType').innerText = sortedByDistance[0];
    }
    if (sortedByDistance.length >= 1) {
        document.getElementById('shortestActivityType').innerText = 
            sortedByDistance[sortedByDistance.length - 1];
    }

    // Prepare data for distance visualization
    const distanceData = [];
    completedEvents.forEach(tweet => {
        if (topActivities.includes(tweet.activityType) && tweet.distance > 0) {
            const dayOfWeek = tweet.time.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
            
            distanceData.push({
                activity: tweet.activityType,
                day: dayOfWeek,
                dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
                distance: tweet.distance,
                isWeekend: isWeekend
            });
        }
    });

    // Calculate weekend vs weekday averages
    const weekendDistances = distanceData.filter(d => d.isWeekend).map(d => d.distance);
    const weekdayDistances = distanceData.filter(d => !d.isWeekend).map(d => d.distance);
    
    const avgWeekend = weekendDistances.length > 0 ? 
        weekendDistances.reduce((a, b) => a + b) / weekendDistances.length : 0;
    const avgWeekday = weekdayDistances.length > 0 ? 
        weekdayDistances.reduce((a, b) => a + b) / weekdayDistances.length : 0;

    document.getElementById('weekdayOrWeekendLonger').innerText = 
        avgWeekend > avgWeekday ? 'weekends' : 'weekdays';

    // Create individual points visualization
    const individualSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": "Distances of top activities by day of week",
        "data": {
            "values": distanceData
        },
        "mark": "point",
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
                "title": "Distance (miles)"
            },
            "color": {
                "field": "activity", 
                "type": "nominal", 
                "title": "Activity Type"
            },
            "tooltip": [
                {"field": "activity", "type": "nominal", "title": "Activity"},
                {"field": "dayName", "type": "ordinal", "title": "Day"},
                {"field": "distance", "type": "quantitative", "title": "Distance", "format": ".2f"}
            ]
        }
    };

    // Create aggregated (mean) visualization
    const aggregatedSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": "Average distances of top activities by day of week",
        "data": {
            "values": distanceData
        },
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
            "color": {
                "field": "activity", 
                "type": "nominal", 
                "title": "Activity Type"
            },
            "xOffset": {"field": "activity", "type": "nominal"},
            "tooltip": [
                {"field": "activity", "type": "nominal", "title": "Activity"},
                {"field": "dayName", "type": "ordinal", "title": "Day"},
                {"field": "distance", "type": "quantitative", "title": "Avg Distance", "aggregate": "mean", "format": ".2f"}
            ]
        }
    };

    // Embed the individual points visualization by default
    vegaEmbed('#distanceVis', individualSpec, {actions:false});
    
    // Set up button to toggle between views
    document.getElementById('aggregate').addEventListener('click', function() {
        const button = this;
        if (button.textContent === 'Show means') {
            vegaEmbed('#distanceVis', aggregatedSpec, {actions:false});
            button.textContent = 'Show individual points';
        } else {
            vegaEmbed('#distanceVis', individualSpec, {actions:false});
            button.textContent = 'Show means';
        }
    });
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
    loadSavedRunkeeperTweets().then(parseTweets);
});
