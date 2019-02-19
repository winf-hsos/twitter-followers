//var fs = require('fs');
const fs = require('graceful-fs');
var columns = ["screen_name"];
var csv = require("csv-to-array");
var sleep = require('system-sleep');

var recordCounter = 0;
var fileCounter = 1;

var outputFile = 'parsed/twitterusers.json'
// Delete the old file (if exists)

if (fs.existsSync(outputFile)) {
    fs.unlinkSync(outputFile);
}

var screenNames = [];

var counter = 1;
var total = -1;

var path = './output';
fs.readdir(path, function (err, items) {

    var tempArray = [];

    for (var i = 0; i < items.length; i++) {
        //console.log(getUserNameFromFile(items[i]) + " --> " + items[i]);
        tempArray.push(getUserNameFromFile(items[i]));
    }

    // Remove duplicates
    screenNames = tempArray.filter(function (elem, pos) {
        return tempArray.indexOf(elem) == pos;
    })

    total = screenNames.length;
    console.log("Found " + total + " files!");

    parseData();
});

function getUserNameFromFile(filename) {
    var splitFn = filename.split("_");

    var twitterName = splitFn.slice(0, -1).join('_');
    return twitterName;
}

var userArr = [];
var json = {};

function parseData() {

    screenNames.forEach((user) => {
        //global.gc();
        userArr.length = 0;
        var c = 1;

        do {

            try {
                //json = require('./output/' + user + '_' + c + '.json');
                json = JSON.parse(fs.readFileSync('./output/' + user + '_' + c + '.json', 'utf8'));
            }
            catch (err) {
                // No more files
                //console.dir(err);
                json = {};
            }

            if (json.users) {

                json.users.forEach((u) => {

                    let userObj = {};
                    //console.log(u.screen_name + ": " + u.followers_count + " | " + u.location);

                    userObj.follower_of = user;
                    userObj.screen_name = u.screen_name;
                    userObj.followers_count = u.followers_count;
                    userObj.friends_count = u.friends_count;
                    userObj.statuses_count = u.statuses_count;
                    userObj.description = u.description;
                    userObj.lang = u.lang;

                    userArr.push(userObj);
                })

                c++;
            }

        } while (json.users)

        counter++;
        writeToFile();
        console.log("Done with >" + user + "< (" + counter + "/" + total + ") and >" + recordCounter + "< records in sum.");

    })
}

function writeToFile() {

    for (var i = 0; i < userArr.length; i++) {

        var userStr = JSON.stringify(userArr[i]);
        fs.appendFileSync(outputFile, userStr + '\n', 'utf8');

        recordCounter++;

        /*
        if (recordCounter % 50000 == 0) {
            fileCounter++;
            outputFile = 'parsed/twitterusers_' + fileCounter + '.json'

            if (fs.existsSync(outputFile)) {
                fs.unlinkSync(outputFile);
            }
        }
        */

    }
    //sleep(1);
}


