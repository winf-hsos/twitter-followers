var Twitter = require('twitter');
var fs = require('fs');
var columns = ["screen_name"];
var csv = require("csv-to-array");

var client = new Twitter({
    consumer_key: '',
    consumer_secret: '',
    access_token_key: '',
    access_token_secret: ''
});


var outputDir = 'output';

// Index for screenNames-Array
var i = 0;

// Index for file numbering for one screen name
var c = 1;

// Where to resume after interrupted
var nextCursor = -1;

// All screen names from file
var screenNames;

csv({
    file: "users.csv",
    columns: columns
}, function (err, array) {
    if (err)
        console.error(err);

    screenNames = array;
    readFollowers();
});

function readFollowers() {

    var params = { screen_name: screenNames[i].screen_name, cursor: nextCursor, count: 200 };

    client.get('followers/list', params, function (error, tweets, response) {

        if (!error) {

            nextCursor = tweets.next_cursor;
            var tweets2String = JSON.stringify(tweets);

            fs.writeFile(outputDir + '/' + screenNames[i].screen_name + '_' + c + '.json', tweets2String, 'utf8', finishedWriting);
            c++;
        }
        else {
            var errorObj = error[0];

            if (typeof errorObj !== "undefined") {
                if (errorObj.code == 88) {
                    console.log("Limit reached! Scheduling next try for in ca. 15 minutes...");
                    console.log("Next cursor: " + nextCursor);
                    setTimeout(readFollowers, 1001 * 60 * 15);
                }
                else {
                    console.error("New error: " + errorObj.code + " | " + errorObj.message);
                }
            }
            else {
                // If "undefined", is likely a protected account
                console.error(">" + screenNames[i].screen_name + "< seems to be proteced. Moving on to next!");
                continueWithNext();
            }
        }
    });
}

function finishedWriting(err, data) {
    if (err)
        console.log(err);
    else {
        console.log("Done writing file >" + screenNames[i].screen_name + "_" + (c - 1) + ".json<");
        //console.log("Next Cursor: " + nextCursor);

        if (nextCursor !== 0) {
            readFollowers();
        }
        else {
            continueWithNext();

        }
    }
}

function continueWithNext() {
    i++;
    c = 1;
    nextCursor = -1;

    if (i < screenNames.length) {
        console.log("Next screen name: " + screenNames[i].screen_name);
        readFollowers();
    }
    else {
        console.log("No more screen names! I'm done!");
    }

}