class Tweet {
	private text:string;
	time:Date;

	constructor(tweet_text:string, tweet_time:string) {
        this.text = tweet_text;
		this.time = new Date(tweet_time);
	}

	//returns either 'live_event', 'achievement', 'completed_event', or 'miscellaneous'.
    get source():string {
        if (this.text.startsWith("Just completed") || this.text.startsWith("Just posted")) {
            return "completed_event";
        } else if (this.text.includes("right now") || this.text.startsWith("Watch my live")) {
            return "live_event";
        } else if (this.text.includes("Achievement") || this.text.includes("achievement")) {
            return "achievement";
        } else {
            return "miscellaneous";
        }
    }

    //returns a boolean, whether the text includes any content written by the person tweeting.
    get written():boolean {
        // Written content typically appears after a hyphen or colon.
        return this.text.includes("-") || this.text.includes(":");
    }

    get writtenText():string {
        if(!this.written) {
            return "";
        }
        
        // Extract text after hyphen or colon.
        let writtenText = "";
        if (this.text.includes("-")) {
            writtenText = this.text.split("-")[1].trim();
        } else if (this.text.includes(":")) {
            writtenText = this.text.split(":")[1].trim();
        }
        
        // Remove any URLs from the written text.
        writtenText = writtenText.replace(/https?:\/\/[^\s]+/g, "").trim();
        
        return writtenText;
    }

    get activityType():string {
        if (this.source != 'completed_event') {
            return "unknown";
        }
        
        const text = this.text.toLowerCase();
        if (text.includes('run') || text.includes('ran')) {
            return "run";
        } else if (text.includes('walk') || text.includes('walked')) {
            return "walk";
        } else if (text.includes('bike') || text.includes('cycled') || text.includes('ride')) {
            return "bike";
        } else if (text.includes('hike') || text.includes('hiked')) {
            return "hike";
        } else if (text.includes('swim') || text.includes('swam')) {
            return "swim";
        } else if (text.includes('workout') || text.includes('fitness')) {
            return "workout";
        } else {
            return "other";
        }
    }

    get distance():number {
        if(this.source != 'completed_event') {
            return 0;
        }
        
        // Look for distance patterns like "5.2 km", "3.1 mi", "10 km", etc..
        const distanceRegex = /(\d+\.?\d*)\s*(km|mi|miles?)/gi;
        const matches = this.text.match(distanceRegex);
        
        if (!matches) {
            return 0;
        }
        
        // Take the first distance found.
        const distanceMatch = matches[0];
        const numberMatch = distanceMatch.match(/(\d+\.?\d*)/);
        
        if (!numberMatch) {
            return 0;
        }
        
        let distance = parseFloat(numberMatch[0]);
        
        // Convert to miles if in km
        if (distanceMatch.toLowerCase().includes('km')) {
            distance = distance * 0.621371; // Convert km to miles.
        }
        
        return parseFloat(distance.toFixed(2));
    }

    getHTMLTableRow(rowNumber:number):string {
        const activityLink = this.extractActivityLink();
        const linkHTML = activityLink ? `<a href="${activityLink}" target="_blank">View Activity</a>` : "No Link";
        
        return `
            <tr>
                <td>${rowNumber}</td>
                <td>${this.text}</td>
                <td>${this.time.toLocaleDateString()}</td>
                <td>${this.source}</td>
                <td>${this.written ? this.writtenText : "No written content"}</td>
                <td>${this.activityType}</td>
                <td>${this.distance}</td>
                <td>${linkHTML}</td>
            </tr>
        `;
    }

    private extractActivityLink(): string {
        // Extract URL from tweet text.
        const urlRegex = /https?:\/\/[^\s]+/g;
        const matches = this.text.match(urlRegex);
        return matches ? matches[0] : "";
    }
}
