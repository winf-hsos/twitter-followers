var Twitter = require('twitter');
var fs = require('fs');
var columns = ["screen_name"];
var csv = require("csv-to-array");
var moment = require('moment');

var client = new Twitter({
    consumer_key: '',
    consumer_secret: '',
    access_token_key: '',
    access_token_secret: ''
});

var outputDir = 'timelines';

// Index for screenNames-Array
var i = 0;

var tweetsPerReuqest = 200;

// Max reuests per user
var maxReuestsPerUser = 100;

var requestNo = 1;
var max_id = -1;
var currentCount = -1;
var tweetYear = -1;

// Get only Tweets as far back as...
var maxTweetYear = 2016;


// All screen names from file
var screenNames;

csv({
    file: "users.csv",
    columns: columns
}, function (err, array) {
    if (err)
        console.error(err);

    screenNames = array;
    readTimelines();
});

function readTimelines() {

    var params = { screen_name: screenNames[i].screen_name, count: tweetsPerReuqest }

    if (max_id > -1)
        params.max_id = max_id;

    client.get('statuses/user_timeline', params, function (error, tweets, response) {

        if (!error) {

            console.log(tweets.length);
            currentCount = tweets.length;

            // Es gibt Accounts ohne Tweets
            if (tweets.length > 0) {
                max_id = tweets[tweets.length - 1].id;
                //console.log(max_id);

                var tweetDate = tweets[tweets.length - 1].created_at;
                tweetYear = moment(tweetDate, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en').year();

                //console.log(tweetYear);

                var tweets2String = JSON.stringify(tweets);
                fs.writeFile(outputDir + '/' + screenNames[i].screen_name + "_" + requestNo + '.json', tweets2String, 'utf8', finishedWriting);
            }
            else {
                continueWithNext();
            }
        }
        else {
            var errorObj = error[0];

            if (typeof errorObj !== "undefined") {
                if (errorObj.code == 88) {
                    console.log("Limit reached! Scheduling next try for in ca. 15 minutes...");
                    setTimeout(readTimelines, 1001 * 60 * 15);
                }
                else if (errorObj.code == 34) {
                    console.log("Problem with user >" + screenNames[i].screen_name + "<, moving on.");
                    continueWithNext();
                }
                else {
                    console.error("New error: " + errorObj.code + " | " + errorObj.message);
                }
            }
            else {
                // If "undefined", is likely a protected account
                console.error(">" + screenNames[i].screen_name + "< seems to be protected. Moving on to next!");
                continueWithNext();
            }
        }
    });
}

function finishedWriting(err, data) {
    if (err) {
        console.log(err);
        process.exit(0);
    }
    else {
        console.log("Done writing file >" + screenNames[i].screen_name + "_" + requestNo + ".json<");

        if (requestNo < maxReuestsPerUser && currentCount >= (tweetsPerReuqest - 1) && tweetYear >= maxTweetYear) {

            requestNo++;
            readTimelines();
        }
        else
            continueWithNext();
    }
}


function continueWithNext() {
    i++;
    requestNo = 1;
    max_id = -1;
    currentCount = -1;
    tweetYear = -1;

    if (i < screenNames.length) {
        console.log("Next screen name: " + screenNames[i].screen_name);
        readTimelines();
    }
    else {
        console.log("No more screen names! I'm done!");
    }

}