#!/usr/bin/env node

/*      file: hooks/after_prepare/add_platform_class.js     */



var filestocopy = [
    {
        "res/native/android/res/drawable-mdpi/ic_stat_carusi_run.png":
        "platforms/android/app/src/main/res/drawable-mdpi/ic_stat_carusi_run.png"
    },
    {
        "res/native/android/res/drawable-hdpi/ic_stat_carusi_run.png":
        "platforms/android/app/src/main/res/drawable-hdpi/ic_stat_carusi_run.png"
    },
    {
        "res/native/android/res/drawable-xhdpi/ic_stat_carusi_run.png":
        "platforms/android/app/src/main/res/drawable-xhdpi/ic_stat_carusi_run.png"
    },
    {
        "res/native/android/res/drawable-xxhdpi/ic_stat_carusi_run.png":
        "platforms/android/app/src/main/res/drawable-xxhdpi/ic_stat_carusi_run.png"
    },
    {
        "res/native/android/res/drawable-xxxhdpi/ic_stat_carusi_run.png":
        "platforms/android/app/src/main/res/drawable-xxxhdpi/ic_stat_carusi_run.png"
    }
];


var fs = require('fs');
var path = require('path');

// no need to configure below
//var rootdir = process.argv[2];
var rootdir = "."; 

console.log("");
console.log("~~~~ Start Copying Notification Status Icons");
filestocopy.forEach(function (obj) {
    Object.keys(obj).forEach(function (key) {
        var val = obj[key];
        var srcfile = path.join(rootdir, key);
        var destfile = path.join(rootdir, val);
        console.log("copying: " + srcfile);
        console.log("     to: " + destfile);
        var destdir = path.dirname(destfile);
        if (fs.existsSync(srcfile) && fs.existsSync(destdir)) {
            fs.createReadStream(srcfile).pipe(
                fs.createWriteStream(destfile));
        }
    });
});

console.log("~~~~ End Copying Notification Status Icons");
console.log("");
