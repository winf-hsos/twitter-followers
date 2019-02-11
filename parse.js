var fs = require('fs');
var columns = ["screen_name"];
var csv = require("csv-to-array");


var outputFile = 'parsed/twitterusers.json'
// Delete the old file (if exists)

if (fs.existsSync(outputFile)) {
    fs.unlinkSync(outputFile);
}

var screenNames;

csv({
    file: "users.csv",
    columns: columns
}, function (err, array) {
    if (err)
        console.error(err);

    screenNames = array;
    parseData();
});

var userArr = [];

function parseData() {

    screenNames.forEach((user) => {
        userArr = [];

        var c = 1;

        do {
            var json = {};
            try {
                json = require('./output/' + user.screen_name + '_' + c + '.json');
            }
            catch (err) {
                // No more files
            }

            var users = json.users;
            if (users) {

                users.forEach((u) => {

                    var userObj = {};
                    //console.log(u.screen_name + ": " + u.followers_count + " | " + u.location);

                    userObj.follower_of = user.screen_name;
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

        console.log("Done with >" + user.screen_name + "<");
        writeToFile();

    })
}

function writeToFile() {

    for (var i = 0; i < userArr.length; i++) {

        var userStr = JSON.stringify(userArr[i]);
        fs.appendFileSync(outputFile, userStr + '\n', 'utf8');
    }
}


