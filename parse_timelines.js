//var fs = require('fs');
const fs = require('graceful-fs');
var columns = ["screen_name"];
var csv = require("csv-to-array");
var sleep = require('system-sleep');
var moment = require('moment');
var URL = require('url').URL;

var recordCounter = 0;
var fileCounter = 1;

var outputFile = 'parsed/twitter_timelines.json'

// Delete the old file (if exists)
if (fs.existsSync(outputFile)) {
    fs.unlinkSync(outputFile);
}

var screenNames = [];
var maxScreeNames = 10;

var counter = 1;
var total = -1;

var path = './timelines';
fs.readdir(path, function (err, items) {

    var tempArray = [];

    for (var i = 0; i < items.length; i++) {
        tempArray.push(getUserNameFromFile(items[i]));
    }

    // Remove duplicates
    screenNames = tempArray.filter(function (elem, pos) {
        return tempArray.indexOf(elem) == pos;
    })

    total = screenNames.length;
    console.log("Found " + total + " files!");
    //console.dir(screenNames);

    parseData();
});

function getUserNameFromFile(filename) {
    var splitFn = filename.split("_");
    var twitterName = splitFn.slice(0, -1).join('_');
    return twitterName;
}

var tweetsArr = [];
var json = [];

function parseData() {

    screenNames.forEach((user) => {
        tweetsArr.length = 0;

        var c = 1;

        do {

            try {
                json = JSON.parse(fs.readFileSync('./timelines/' + user + '_' + c + '.json', 'utf8'));
            }
            catch (err) {
                // No more files
                //console.dir(err);
                json = [];
            }

            console.log("Found >" + json.length + "< tweets for >" + user + "<");

            if (json.length > 0) {

                json.forEach((t) => {

                    let tweetObj = {};

                    tweetObj.user_timeline = user;
                    //tweetObj.created_at = t.created_at;

                    var tweetDateFormatted = moment(t.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en').format();
                    tweetObj.created_at = tweetDateFormatted;

                    tweetObj.id = t.id
                    tweetObj.text = t.text;
                    tweetObj.retweet_count = t.retweet_count || 0;
                    tweetObj.favorite_count = t.favorite_count || 0;
                    tweetObj.is_quote_status = t.is_quote_status;

                    // Infos about retweets
                    tweetObj.is_retweet = typeof t.retweeted_status !== "undefined" ? true : false;
                    tweetObj.retweeted_status_id = typeof t.retweeted_status !== "undefined" ? t.retweeted_status.id : null;
                    tweetObj.retweeted_user = typeof t.retweeted_status !== "undefined" ? t.retweeted_status.user.screen_name : null;

                    tweetObj.lang = t.lang;
                    tweetObj.in_reply_to_screen_name = t.in_reply_to_screen_name;
                    tweetObj.in_reply_to_status_id = t.in_reply_to_status_id;

                    // Hashtags                
                    tweetObj.hashtags = parseHashtags(t.entities.hashtags);
                    tweetObj.urls = parseUrls(t.entities.urls);
                    tweetObj.photos = parsePhotos(t.entities.media);
                    tweetObj.user_mentions = parseMentions(t.entities.user_mentions);

                    tweetsArr.push(tweetObj);
                })

                c++;
            }

        } while (json.length > 0)

        counter++;
        writeToFile();
        console.log("Done with >" + user + "< (" + counter + "/" + total + ") and >" + recordCounter + "< records in sum.");

        if (counter >= maxScreeNames) {
            console.log("Reached maximum of >" + maxScreeNames + "<.");
            process.exit(0);

        }


    })
}

function parseHashtags(hashtagsObj) {
    let hashtags = [];
    if (typeof hashtagsObj == "undefined")
        return hashtags;

    hashtagsObj.forEach((h) => {
        hashtags.push(h.text);
    });

    return hashtags;
}

function parseUrls(urlsObj) {
    let urls = [];
    if (typeof urlsObj == "undefined")
        return urls;

    urlsObj.forEach((u) => {

        let thisUrl = new URL(u.expanded_url);

        // Get host
        let host = thisUrl.hostname;

        // Get clean URL
        let cleanUrl = thisUrl.protocol + "//" + thisUrl.hostname + thisUrl.pathname

        urls.push({
            expanded_url: u.expanded_url,
            host: host,
            clean_url: cleanUrl
        });
    });

    return urls;
}

function parsePhotos(mediaObj) {
    let photos = [];
    if (typeof mediaObj == "undefined")
        return photos;

    mediaObj.forEach((m) => {

        if (m.type == "photo") {
            photos.push(m.media_url_https);
        }
    });

    return photos;
}

function parseMentions(mentionsObj) {
    let user_mentions = [];
    if (typeof mentionsObj == "undefined")
        return user_mentions;

    mentionsObj.forEach((m) => {
        user_mentions.push(m.screen_name);

    });
    return user_mentions;
}



function writeToFile() {

    for (var i = 0; i < tweetsArr.length; i++) {

        var userStr = JSON.stringify(tweetsArr[i]);
        fs.appendFileSync(outputFile, userStr + '\n', 'utf8');
        recordCounter++;
    }

}


