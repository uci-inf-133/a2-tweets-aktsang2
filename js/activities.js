ffunction parseTweets(runkeeper_tweets) {
    if (runkeeper_tweets === undefined) {
        window.alert('No tweets returned');
        return;
    }

    const tweet_array = runkeeper_tweets.map(function(tweet) {
        return new Tweet(tweet.text, tweet.created_at);
    });

    // Filter to only completed events for activity analysis
    const completedEvents = tweet_array.filter(tweet => 
        tweet.source === 'completed_event' && 
        tweet.activityType !== 'unknown' && 
        tweet.distance > 0
    );

    // Count unique activity types
    const activityTypes = new Set();
    completedEvents.forEach(tweet => {
        activityTypes.add(tweet.activityType);
    });
    document.getElementById('numberActivities').innerText = activityTypes.size;

    // Count activities by type
    const activityCounts = {};
    completedEvents.forEach(tweet => {
        const activity = tweet.activityType;
        activityCounts[activity] = (activityCounts[activity] || 0) + 1;
    });

    // Find top 3 most common activities
    const topActivities = Object.keys(activityCounts)
        .sort((a, b) => activityCounts[b] - activityCounts[a])
        .slice(0, 3);

    // Update DOM with top activities
    updateTopActivities(topActivities);

    // Create activity count visualization
    createActivityCountChart(activityCounts);

    // Analyze distances and create distance visualizations
    analyzeActivityDistances(completedEvents, topActivities);
}

function updateTopActivities(topActivities) {
    if (topActivities.length >= 1) {
        document.getElementById('firstMost').innerText = topActivities[0];
    }
    if (topActivities.length >= 2) {
        document.getElementById('secondMost').innerText = topActivities[1];
    }
    if (topActivities.length >= 3) {
        document.getElementById('thirdMost').innerText = topActivities[2];
    }
}

function createActivityCountChart(activityCounts) {
    // Convert activity counts to array for visualization
    const activityData = Object.keys(activityCounts).map(activity => {
        return {
            activity: activity,
            count: activityCounts[activity]
        };
    });

    // Sort by count for better visualization
    activityData.sort((a, b) => b.count - a.count);

    const activity_vis_spec = {
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
                "sort": "-y"  // Sort by count descending
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
            },
            "tooltip": [
                {"field": "activity", "type": "nominal", "title": "Activity"},
                {"field": "count", "type": "quantitative", "title": "Count"}
            ]
        }
    };

    vegaEmbed('#activityVis', activity_vis_spec, {actions: false});
}

function analyzeActivityDistances(completedEvents, topActivities) {
    // Calculate average distances for each activity
    const activityAverages = {};
    const activityData = {};
    
    topActivities.forEach(activity => {
        const activityEvents = completedEvents.filter(tweet => 
            tweet.activityType === activity
        );
        
        const totalDistance = activityEvents.reduce((sum, tweet) => sum + tweet.distance, 0);
        activityAverages[activity] = activityEvents.length > 0 ? 
            totalDistance / activityEvents.length : 0;
            
        activityData[activity] = activityEvents;
    });

    // Find longest and shortest activities
    updateLongestShortestActivities(activityAverages);

    // Prepare data for distance visualization
    const distanceData = prepareDistanceData(completedEvents, topActivities);

    // Analyze weekend vs weekday patterns
    analyzeWeekdayWeekendPatterns(distanceData);

    // Create distance visualizations
    createDistanceVisualizations(distanceData);
}

function updateLongestShortestActivities(activityAverages) {
    const sortedActivities = Object.keys(activityAverages)
        .sort((a, b) => activityAverages[b] - activityAverages[a]);
    
    if (sortedActivities.length >= 1) {
        document.getElementById('longestActivityType').innerText = sortedActivities[0];
    }
    if (sortedActivities.length >= 1) {
        document.getElementById('shortestActivityType').innerText = 
            sortedActivities[sortedActivities.length - 1];
    }
}

function prepareDistanceData(completedEvents, topActivities) {
    const distanceData = [];
    
    completedEvents.forEach(tweet => {
        if (topActivities.includes(tweet.activityType)) {
            const dayOfWeek = tweet.time.getDay();
            const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            
            distanceData.push({
                activity: tweet.activityType,
                day: dayOfWeek,
                dayName: dayName,
                distance: tweet.distance,
                isWeekend: isWeekend,
                date: tweet.time.toISOString().split('T')[0]
            });
        }
    });
    
    return distanceData;
}

function analyzeWeekdayWeekendPatterns(distanceData) {
    if (distanceData.length === 0) return;
    
    const weekendData = distanceData.filter(d => d.isWeekend);
    const weekdayData = distanceData.filter(d => !d.isWeekend);
    
    const avgWeekend = weekendData.length > 0 ? 
        weekendData.reduce((sum, d) => sum + d.distance, 0) / weekendData.length : 0;
        
    const avgWeekday = weekdayData.length > 0 ? 
        weekdayData.reduce((sum, d) => sum + d.distance, 0) / weekdayData.length : 0;
    
    document.getElementById('weekdayOrWeekendLonger').innerText = 
        avgWeekend > avgWeekday ? 'weekends' : 'weekdays';
}

function createDistanceVisualizations(distanceData) {
    if (distanceData.length === 0) return;
    
    // Individual points specification
    const individualSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": "Distances of top activities by day of week (individual points)",
        "width": 600,
        "height": 400,
        "data": {
            "values": distanceData
        },
        "mark": {
            "type": "point",
            "opacity": 0.6,
            "size": 50
        },
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

    // Aggregated (mean) specification
    const aggregatedSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": "Average distances of top activities by day of week",
        "width": 600,
        "height": 400,
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
            "xOffset": {
                "field": "activity", 
                "type": "nominal"
            },
            "tooltip": [
                {"field": "activity", "type": "nominal", "title": "Activity"},
                {"field": "dayName", "type": "ordinal", "title": "Day"},
                {"field": "distance", "type": "quantitative", "title": "Avg Distance", "aggregate": "mean", "format": ".2f"}
            ]
        }
    };

    // Embed the individual points visualization by default
    vegaEmbed('#distanceVis', individualSpec, {actions: false});
    
    // Set up button to toggle between views
    const aggregateButton = document.getElementById('aggregate');
    if (aggregateButton) {
        aggregateButton.addEventListener('click', function() {
            const currentView = this.textContent;
            
            if (currentView === 'Show means') {
                vegaEmbed('#distanceVis', aggregatedSpec, {actions: false});
                this.textContent = 'Show individual points';
            } else {
                vegaEmbed('#distanceVis', individualSpec, {actions: false});
                this.textContent = 'Show means';
            }
        });
    }
}

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
    loadSavedRunkeeperTweets().then(parseTweets);
});
