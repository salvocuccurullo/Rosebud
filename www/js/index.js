/*global $, cordova, device, window, document, storage_keys, get_ls, alert, generic_json_request_new*/
/*global navigator, Connection, BE_URL, BE_LIST, PullToRefresh, getServerVersion, show_image*/
/*global swipeleftHandler, swipeRightHandler, get_ls_bool, get_ls_bool_default, json_request, second_collection */
/*global listDir, googleAuthSuccess, googleAuthFailure, submit, refreshToken */
/*eslint no-console: ["error", { allow: ["info","warn", "error", "debug"] }] */
/*eslint no-global-assign: "error"*/
/*globals BE_URL:true*/

"use strict";

var DEBUG = false,
    icarusi_user = "",
    rosebud_uid = "",
    storage = window.localStorage,
    swipe_left_target = "movies.html", // eslint-disable-line no-unused-vars
    swipe_right_target = "song.html"; // eslint-disable-line no-unused-vars

document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);

/*
 *
 * CALLBACKS
 *
 */

function getServerVersion() {

    function versionSuccess(data) {
       $("#django_version").html(data.payload.django);
       $("#mongo_version").html(data.payload.mongo);
    }

    function versionFailure(err) {
      $("#django_version").html("N/A");
      $("#mongo_version").html("N/A");
       if (DEBUG) { console.info("Rosebud App============> " + err.responseText); }
    }

    var id_token = storage.getItem("firebase_id_token"),
       data;

    if (icarusi_user !== "" && icarusi_user !== undefined) {
       if (id_token === undefined) {
           id_token = "";
       }
       data = {
               "method": "POST",
               "url": "/version",
               "successCb": versionSuccess,
               "failureCb": versionFailure
           };
       json_request(data);
    }
}


function error_fall_back() { // eslint-disable-line no-unused-vars
    alert("HAMMUORT!");
}

function geoLocationSuccess(data) {
    try {
        alert("Status: " + data.payload.result + "\n\n" + data.payload.message);
    } catch (err) {
        alert(err);
    }
}

function geoLocationFailure(data) {
    try {
        alert("Status: " + data.responseJSON.result + "\n\nMessage: " + data.responseJSON.message);
    } catch (err) {
        alert(err);
    }
}


/*
 *      SET IMAGE
 */

function show_image(cover_type) {
    var remote_url = storage.getItem("remote_cover_url");

    if (cover_type === "remote" && remote_url !== "" && remote_url !== undefined) {
        $("#cover_img").attr("src", remote_url);
    } else if (cover_type === "local") {
        $("#cover_img").attr("src", "images/covers/" + remote_url);
    } else {
        $("#cover_img").attr("src", "images/no-image-available.jpg");
    }
}

function setImage(tot_imgs) {

    var networkState = navigator.connection.type,
        dld_imgs = get_ls_bool("flip-dld-images"),
        remote_url = storage.getItem("remote_cover_url"),
        remote_covers_count = storage.getItem("remote_covers_count"),
        id_img = 0,
        image = "";

    if (DEBUG) { console.info("Rosebud App============> Remote covers count: " + remote_covers_count); }

    $("#spoty_button_img").attr('src', 'images/icons/spoti-icon-gray.png');
    storage.setItem("random_cover_spotify_url", "");

    if (networkState !== Connection.NONE && remote_url !== "" && dld_imgs !== "" && dld_imgs && remote_covers_count !== undefined && remote_covers_count > 0) {
        if (DEBUG) { console.info("Rosebud App============> Considering remote images..."); }
        $("#cover_img").attr("images/covers/loading_spinner.gif");
        get_remote_random_cover();
        return false;
    }

    if (DEBUG) { console.info("Rosebud App============> Considering ony local images..."); }
    id_img = Math.floor((Math.random() * tot_imgs) + 1);                           // Consider only local images - No spotify links
    if (DEBUG) { console.info("Rosebud App============> Image id selected: " + id_img); }

    if (id_img < 10) {
        image = "0" + id_img + ".jpg";
    } else {
        image = id_img + ".jpg";
    }

    image = "images/covers/" + image;
    if (DEBUG) { console.info("Rosebud App============> Cover image seleted: " + image); }
    $("#cover_img").attr("src", image);

}

function set_fallback_image() { // eslint-disable-line no-unused-vars

    $("#cover_img").attr("src", "images/no-image-available.jpg");
    $("#spoty_button_img").attr('src', 'images/icons/spoti-icon-gray.png');
    storage.setItem("random_cover_spotify_url", "");

}

/*
 * RANDOM ALBUM
 */

function randomCoverSuccessCB(data) {

  if (DEBUG) { console.debug(data); }
  var cover = data.payload;

  if (cover !== undefined) {
      if (DEBUG) { console.debug("Rosebud App============> Fetched remote random cover data: " + cover.name); }
      storage.setItem("remote_cover_url", cover.location);
      storage.setItem("random_cover_spotify_url", cover.spotifyAlbumUrl);
      if (cover.spotifyAlbumUrl !== "" && cover.spotifyAlbumUrl !== undefined) {

        // FINESSE
        if (cover.spotifyAlbumUrl.toUpperCase().indexOf("YOUTUBE") >= 0) {
          $("#spoty_button_img").attr('src', 'images/icons/youtube-icon.png');
        } else {
          $("#spoty_button_img").attr('src', 'images/icons/spoti-icon.png');
        }
      }
      show_image(cover.type);
  }
}

function randomCoverFailureCB(err) {
  if (DEBUG) { console.info("Rosebud App============> Error during remote covers retrieving"); }
  if (DEBUG) { console.info("Rosebud App============> " + err.responseText); }
}

function get_remote_random_cover() { // eslint-disable-line no-unused-vars

  var data = {
    "username": icarusi_user,
    "method": "POST",
    "url": "/getrandomcover",
    "second_collection": get_ls_bool("second-collection", false),
    "successCb": randomCoverSuccessCB,
    "failureCb": randomCoverFailureCB
  };
  if (DEBUG) { console.info("Rosebud App============> " + JSON.stringify(data)); }
  json_request(data);

}

/*
*   SERVER REVISION
*/

function getServerRevisionSuccessCB(data) {

  if (DEBUG) { console.debug(data); }
  var revision = data.payload.revision;
  $("#rosebud_revision").html(revision.substring(0, 10));

}

function getServerRevisionFailureCB(err) {
  if (DEBUG) { console.info("Rosebud App============> Error during remote covers retrieving"); }
  if (DEBUG) { console.info("Rosebud App============> " + err.responseText); }
}

function get_server_revision() { // eslint-disable-line no-unused-vars

  var data = {
    "method": "POST",
    "url": "/commit",
    "successCb": getServerRevisionSuccessCB,
    "failureCb": getServerRevisionFailureCB
  };
  if (DEBUG) { console.info("Rosebud App============> " + JSON.stringify(data)); }
  json_request(data);

}

/*
 * ALBUMS STATS
 */

function coverStatsSuccess(data) {
    if (DEBUG) { console.info("Covers statistics: " + data); }
    var covers = data.payload;

    if (covers.payload.remote_covers === 0) {
        if (DEBUG) { console.info("Rosebud App============> No remote covers found on server."); }
    }

    $("#remote_covers").html(covers.payload.remote_covers);
    if (covers.payload.remote_covers > 0) {
        storage.setItem("remote_covers_count", covers.payload.remote_covers);
    }
}

function coverStatsFailure(err) {
    if (DEBUG) {
        console.info("Rosebud App============> Error during remote covers retrieving");
        console.info("Rosebud App============> " + JSON.stringify(err));
    }
    $("#remote_covers").html("N/A");

}


function get_remote_covers_stats() { // eslint-disable-line no-unused-vars

    if (!icarusi_user) {
        return false;
    }

    var data = {
      "second_collection": get_ls_bool("second-collection", false),
      "method": "POST",
      "url": "/getcoversstats",
      "successCb": coverStatsSuccess,
      "failureCb": coverStatsFailure
    };
    if (DEBUG) { console.info("Rosebud App============> " + JSON.stringify(data)); }
    json_request(data);

}

/*
 *      LOCAL COVERS
 */

function listDir(path) {

    var old_ts  = parseInt(storage.getItem("covers_count_ts"), 10),
        new_ts = new Date().getTime(),
        diff = new_ts - old_ts,
        diff_sec = diff / 1000,
        covers_count_cache = storage.getItem("covers_count");

    $("#cover_img").attr("src", "images/loading.gif");

    if (diff_sec < 86400 && covers_count_cache !== "" && covers_count_cache !== null && covers_count_cache !== undefined) {
        if (DEBUG) { console.info("Rosebud App============> Cached covers count: " + covers_count_cache); }
        $("#hardcoded_images").html(covers_count_cache);
        setImage(covers_count_cache);
        return false;
    }

    function dir_success(entries) {
        if (DEBUG) { console.info("Rosebud App============> Success!"); }
        setImage(entries.length);
        if (DEBUG) { console.info("Rosebud App============> Found " + entries.length + " cover images."); }
        storage.setItem("covers_count", entries.length);
        storage.setItem("covers_count_ts", new Date().getTime());
        $("#hardcoded_images").html(entries.length);
    }

    function dir_error(err) {
        if (DEBUG) { console.info("Rosebud App============> DIR ERROR"); }
        if (DEBUG) { console.info(err); }
    }

    function fs_success(fileSystem) {
        if (DEBUG) { console.info("Rosebud App============> FS SUCCESSFUL"); }
        var reader = fileSystem.createReader();
        if (DEBUG) { console.info("Rosebud App============> CREATE READER SUCCESSFUL"); }
        if (DEBUG) { console.info("Rosebud App============> Starting to reading the directory..."); }
        //$("#cover_img").attr("src", "images/spinner_01.gif");
        reader.readEntries(dir_success, dir_error);
    }

    function fs_error(err) {
        if (DEBUG) { console.info("Rosebud App============> FS ERROR"); }
        if (DEBUG) { console.info(err); }
    }

    window.resolveLocalFileSystemURL(path, fs_success, fs_error);

}


/*
 * DO SOMETHING AFTER THE SUCCESSFUL LOGIN
 */

function show_post_login_features() {

    get_remote_covers_stats();
    getServerVersion();
    get_server_revision();
    get_configurations();
    $("#info_user").html(icarusi_user);

}


/*
* BE Url
*/

function set_be_list(data) {
  if (DEBUG) { console.info("Rosebud App============> " + JSON.stringify(data)); }
  /*
  * FAILSAFE
  */

  $("#mdn-selector").append('<option value="' + base_url_poster_default + '">Default Failsafe PROD (hardcoded)</option>'); // eslint-disable-line no-undef

  $.each(data.payload, function (index, value) { // eslint-disable-line no-unused-vars

    if (value.config_type === "be_url") {
      $("#be-selector").append('<option value="' + value.value + '">' + value.name + '</option>');
    }

    if (value.config_type === "base_url_poster") { // eslint-disable-line no-undef
      $("#mdn-selector").append('<option value="' + value.value + '">' + value.name + '</option>');
    }
  });
}

function configsFailure(err) {
  if (DEBUG) { console.error("Rosebud App============> " + JSON.stringify(err)); }
  $.each(BE_LIST, function (index, value) { // eslint-disable-line no-unused-vars
    $("#be-selector").append('<option value="' + value.url + '">' + value.name + '</option>');
  });
}

function get_configurations() { // eslint-disable-line no-unused-vars

    var app_version = storage.getItem("app_version");

    if (!icarusi_user) {
        return false;
    }

    var data = {
      "app_version": app_version,
      "method": "POST",
      "url": "/getconfigs2",
      "successCb": set_be_list,
      "failureCb": configsFailure
    };
    if (DEBUG) { console.info("Rosebud App============> Configs: " + JSON.stringify(data)); }
    json_request(data);

}


/*
*   REFRESH TOKEN OVERRIDES
*/

function refreshTokenSuccessCB(data) {

  if (DEBUG) { console.debug(data); }
  show_post_login_features();

}

function refreshTokenFailureCB(err) {
  if (DEBUG) { console.info("Rosebud App============> Error during refresh token retrieving"); }
  if (DEBUG) { console.info("Rosebud App============> " + err.responseText); }
}


/*
 * ON DEVICE READY
 */

// CORDOVA
function onDeviceReady() {  // eslint-disable-line no-unused-vars

    console.info("========> Rosebud started. Running on Android " + device.version);

    /*
    * OPEN with
    */

    window.plugins.intent.setNewIntentHandler(function (intent) {
        console.info(JSON.stringify(intent));
        //if (intent !== undefined) {
           storage.setItem("spotify_url_received", intent.clipItems[0].text);
           //alert(intent.clipItems[0].text);
           //window.location.href="song.html#cover_page";
        //}
    });

    if (DEBUG) { console.info("Localstorage status START ==============="); }
    if (DEBUG) { console.info(JSON.stringify(storage_keys)); }
    if (DEBUG) { console.info(JSON.stringify(get_ls("show-extra-info"))); }
    if (DEBUG) { console.info(JSON.stringify(get_ls("be-selector"))); }
    if (DEBUG) { console.info("Localstorage status END ==============="); }

    icarusi_user = storage.getItem("icarusi_user");
    rosebud_uid = storage.getItem("rosebud_uid");

    
    
    if (!icarusi_user) {
        if (DEBUG) { console.info("====Username is not set: " + icarusi_user + ". Setting it to blank value."); }
        icarusi_user = "";
    }
    var enable_notif = get_ls_bool("enable-notifications"),
        save_imgs = get_ls_bool("flip-save-images"),
        dld_imgs = get_ls_bool("flip-dld-images", true),
        extra_info = get_ls_bool("show-extra-info"),
        enable_geoloc = get_ls_bool("enable-geoloc"),
        lazy_load = get_ls_bool_default("lazy-load", true),
        networkState = navigator.connection.type,
        be_selector = get_ls("be-selector"),
        mdn_selector = get_ls("mdn-selector"),
        second_collection = get_ls_bool("second-collection", false);

    if (be_selector !== "") {
      BE_URL = be_selector;
    }

    if (mdn_selector !== "") {
      base_url_poster = mdn_selector; // eslint-disable-line no-undef
    }

    $(document).on("click", "#spoty_album_go", function () {
        var spotifyAlbumUrl = storage.getItem("random_cover_spotify_url");
        if (spotifyAlbumUrl !== "" && spotifyAlbumUrl !== undefined) {
          window.open(spotifyAlbumUrl, '_system');
        }
    });


    /*
    firebase.auth().onIdTokenChanged(function(user) {
      if (user) {
        console.info(" * * ID TOKEN CHANGED * * ");
        console.info(JSON.stringify(user));
        storage.setItem("credential",user);
      }
    });
    */

    /*
     * FIREBASE MESSAGING: ON STARTUP THE FCM TOKEN IS RETRIEVED FROM GOOGLE
     * IF SUCCESS: IT WILL BE SAVED ON BOTH LOCALSTORAGE AND SERVER SIDE
     */

    // FIREBASE DISABLED
    if (icarusi_user !== "") {
        window.FirebasePlugin.getToken(function (token) {
            // save this server-side and use it to push notifications to this device
            if (DEBUG) { console.info("==========> FIREBASE MESSAGING TOKEN ========> " + token); }
            storage.setItem("firebase_token", token);

            var id_token = storage.getItem("firebase_id_token"),
                data = {
                    "firebase_id_token": id_token,
                    "token": token,
                    "method": "POST",
                    "url": "/setFBToken2",
                    "app_version": storage.getItem("app_version")
                };
            json_request(data);

        }, function (error) {
            console.error("==========> FIREBASE MESSAGING ERROR ========> " + error);
        });
    }


    /*
     * FIREBASE MESSAGING ON NOTIFICATION EVENT MANAGEMENT
     * CURRENTLY JUST PRINT SOMETHING ON CONSOLE
     */

     // FIREBASE DISABLED
     /*
    window.FirebasePlugin.onNotificationOpen(function (notification) {
        console.info("======= FCM NOTIFICATION OPEN EVENT ======> " + JSON.stringify(notification));
    }, function (error) {
        console.error("======= FCM NOTIFICATION OPEN EVENT ERROR ======> " + error);
    });
    */


    /*
     * FIREBASE MESSAGING: IF THE "ENABLE PUSH NOTIFICATION" IS ON THEN SUBSCRIBE TO FCM TOPIC "iCarusiNotification"
    */

         // FIREBASE DISABLED
    if (enable_notif !== "" && enable_notif !== undefined && enable_notif) {
        if (DEBUG) { console.info("Rosebud App============> Enabling Push notification : " + enable_notif); }
        window.FirebasePlugin.subscribe("iCarusiNotifications");
    } else {
        if (DEBUG) { console.info("Rosebud App============> Disabling Push notification : " + enable_notif); }
        window.FirebasePlugin.unsubscribe("iCarusiNotifications");
    }


    /*
     *  BINDINGS
     */

     $('#be-selector').on('change', function () {
         var val = $("#be-selector :selected").val();
         if (DEBUG) { console.info("Rosebud App============> BE Selector : " + val); }
         if (val !== "") {
           storage.setItem("be-selector", val);
         } else {
           storage.setItem("be-selector", BE_URL);  //the default from shared.js
         }
     });

    $('#flip-dld-images').on('change', function () {
        var val = $('#flip-dld-images').prop("checked");
        if (DEBUG) { console.info("Rosebud App============> Flip Downloaded images : " + val); }
        storage.setItem("flip-dld-images", val);
    });

    $('#flip-save-images').on('change', function () {
        var val = $('#flip-save-images').prop("checked");
        if (DEBUG) { console.info("Rosebud App============> Flip Save images : " + val); }
        storage.setItem("flip-save-images", val);
    });

    $('#show-extra-info').on('change', function () {
        var val = $('#show-extra-info').prop("checked");
        if (DEBUG) { console.info("Rosebud App============> Flip Show extra info : " + val); }
        storage.setItem("show-extra-info", val);
    });

    $('#second-collection').on('change', function () {
        var val = $('#second-collection').prop("checked");
        if (DEBUG) { console.info("Rosebud App============> Second Collection info : " + val); }
        storage.setItem("second-collection", val);
        get_remote_covers_stats();
    });

    $('#enable-geoloc').on('change', function () {

        var val = $('#enable-geoloc').prop("checked"),
            id_token = storage.getItem("firebase_id_token"),
            data;

        if (DEBUG) { console.info("Rosebud App============> Flip enable geolocation : " + val); }
        storage.setItem("enable-geoloc", val);
        if (icarusi_user !== "" && icarusi_user !== undefined) {
            if (!val) {
                if (id_token === undefined) {
                    id_token = "";
                }

                data = {
                        "action": "DELETE",
                        "firebase_id_token": id_token,
                        "method": "POST",
                        "url": "/geolocation2",
                        "successCb": geoLocationSuccess,
                        "failureCb": geoLocationFailure
                        };
                json_request(data);
            } /*else {
                alert("Thanks for sharing your location!\n\nPlease open 'Geo Friends' page for sharing your gps coords");
            }*/
        }
    });

    $('#enable-notifications').on('change', function () {
        var val = $('#enable-notifications').prop("checked");
        if (DEBUG) { console.info("Rosebud App============> Flip Enable Notifications : " + val); }
             // FIREBASE DISABLED
        if (val) {
            window.FirebasePlugin.subscribe("iCarusiNotifications");
        } else {
            window.FirebasePlugin.unsubscribe("iCarusiNotifications");
        }

        if (DEBUG) { console.info("Rosebud App============> Push notification Status: " + val); }

        storage.setItem("enable-notifications", val);
    });


    $(document).on("click", "#login_button", function () {
        submit();
    });

    /*
     *      INIT
     */


    if (DEBUG) { console.info("Rosebud App============> Downloaded images switch STORAGE : " + dld_imgs); }
    if (DEBUG) { console.info("Rosebud App============> Save Downloaded images switch STORAGE : " + save_imgs); }
    if (DEBUG) { console.info("Rosebud App============> Show Extra info switch STORAGE : " + extra_info); }
    if (DEBUG) { console.info("Rosebud App============> Enable Push Notification STORAGE : " + enable_notif); }
    if (DEBUG) { console.info("Rosebud App============> Enable Geo Location : " + enable_geoloc); }
    if (DEBUG) { console.info("Rosebud App============> Second collection : " + second_collection); }

    if (save_imgs !== "" && save_imgs !== null) {
        $('#flip-save-images').prop("checked", save_imgs);
    } else {
        storage.setItem("flip-save-images", false);
    }

    storage.setItem("flip-dld-images", true);

    if (extra_info !== "" && extra_info !== null) {
        $('#show-extra-info').prop("checked", extra_info);
    } else {
        storage.setItem("show-extra-info", false);
    }

    if (enable_notif !== "" && enable_notif !== null) {
        $('#enable-notifications').prop("checked", enable_notif);
    } else {
        storage.setItem("enable-notifications", false);
    }

    if (enable_geoloc !== "" && enable_geoloc !== null) {
        $('#enable-geoloc').prop("checked", enable_geoloc);
    } else {
        storage.setItem("enable-geoloc", false);
    }

    if (second_collection !== "" && second_collection !== null) {
        $('#second-collection').prop("checked", second_collection);
    } else {
        storage.setItem("second-collection", false);
    }

    $("#connection").html("");

    cordova.getAppVersion.getVersionNumber().then(function (version) {
        $('#version').html("Rel. " + version);
        $("#info_version").html(version);
        storage.setItem("app_version", version);
    });

    $("#info_user").html(icarusi_user);
    $("#info_network").html(networkState);

    if (networkState === Connection.NONE) {
        $("#connection").html("No network... Pantalica mode...");
    }

    if (icarusi_user !== "" && icarusi_user !== undefined) {
        $("#logged").html('Logged in as <span style="color:green">' + storage.getItem("icarusi_user") + '</span>');
    }
    PullToRefresh.init({
        mainElement: '#cover_img',
        onRefresh: function () {
            listDir(cordova.file.applicationDirectory + "www/images/covers/");
        },
        instructionsReleaseToRefresh: "Have fun!",
        distThreshold : 20,
    });

    /*
     * SWIPE RUDIMENTALE
     */

    $("#home_page").on("swipeleft", swipeleftHandler);
    $("#home_page").on("swiperight", swipeRightHandler);

    /*
     * INIT
     */

    listDir(cordova.file.applicationDirectory + "www/images/covers/");
    refreshToken();

}   // CORDOVA
