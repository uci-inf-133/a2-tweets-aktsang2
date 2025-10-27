"use strict";
class Tweet {
    text;
    time;
    constructor(tweet_text, tweet_time) {
        this.text = tweet_text;
        this.time = new Date(tweet_time);
    }
    // --- Existing getters ---
    get source() {
        if (this.text.startsWith("Just completed") || this.text.startsWith("Just posted")) {
            return "completed_event";
        }
        else if (this.text.includes("right now") || this.text.startsWith("Watch my live")) {
            return "live_event";
        }
        else if (this.text.includes("Achievement") || this.text.includes("achievement")) {
            return "achievement";
        }
        else {
            return "miscellaneous";
        }
    }
    get written() {
        return this.text.includes("-") || this.text.includes(":");
    }
    get writtenText() {
        if (!this.written)
            return "";
        let writtenText = "";
        if (this.text.includes("-")) {
            writtenText = this.text.split("-")[1].trim();
        }
        else if (this.text.includes(":")) {
            writtenText = this.text.split(":")[1].trim();
        }
        return writtenText.replace(/https?:\/\/[^\s]+/g, "").trim();
    }
    get activityType() {
        if (this.source !== "completed_event")
            return "unknown";
        const text = this.text.toLowerCase();
        if (text.includes("run") || text.includes("ran"))
            return "run";
        if (text.includes("walk") || text.includes("walked"))
            return "walk";
        if (text.includes("bike") || text.includes("ride") || text.includes("cycle"))
            return "bike";
        if (text.includes("hike"))
            return "hike";
        if (text.includes("swim"))
            return "swim";
        if (text.includes("workout") || text.includes("fitness"))
            return "workout";
        return "other";
    }
    get distance() {
        if (this.source !== "completed_event")
            return 0;
        const distanceRegex = /(\d+\.?\d*)\s*(km|mi|miles?)/i;
        const match = this.text.match(distanceRegex);
        if (!match)
            return 0;
        let distance = parseFloat(match[1]);
        if (match[2].toLowerCase().startsWith("km")) {
            distance = distance * 0.621371; // convert km to miles
        }
        return parseFloat(distance.toFixed(2));
    }
    // --- New method for table rows ---
    getHTMLTableRow(rowNumber) {
        const tr = document.createElement("tr");
        const addCell = (content, isHTML = false, className = "") => {
            const td = document.createElement("td");
            if (isHTML)
                td.innerHTML = content;
            else
                td.textContent = content;
            if (className)
                td.className = className;
            tr.appendChild(td);
        };
        addCell(rowNumber.toString());
        const linkedText = this.text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
        addCell(linkedText, true);
        addCell(this.time.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }));
        addCell(this.source);
        addCell(this.written ? this.writtenText : "No written content", false, "text-break");
        addCell(this.activityType);
        addCell(this.distance > 0 ? this.distance.toFixed(2) : "N/A");
        const activityLink = this.extractActivityLink();
        const linkHTML = activityLink
            ? `<a href="${activityLink}" target="_blank" rel="noopener noreferrer">View Activity</a>`
            : "No Link";
        addCell(linkHTML, true);
        return tr;
    }
    extractActivityLink() {
        const urlRegex = /https?:\/\/[^\s]+/g;
        const matches = this.text.match(urlRegex);
        return matches ? matches[0] : "";
    }
}
