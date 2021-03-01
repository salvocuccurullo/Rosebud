/*global $, cordova, device, window, document, storage_keys, get_ls, alert, generic_json_request_new, encrypt_and_execute, getX*/
/*global idTokenSuccess, idTokenFailure, navigator, Connection, BE_URL, BE_LIST, PullToRefresh, getServerVersion, show_image*/
/*global swipeleftHandler, swipeRightHandler, power_user, get_ls_bool, get_ls_bool_default, json_request, refreshIdToken */
/*global listDir, googleAuthSuccess, googleAuthFailure, submit */
/*eslint no-console: ["error", { allow: ["info","warn", "error", "debug"] }] */
/*eslint no-global-assign: "error"*/
/*globals BE_URL:true*/

"use strict";

var DEBUG = false,
    icarusi_user = "",
    rosebud_uid = "",
    storage = window.localStorage,
//    kanazzi,
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
       data = {"username": icarusi_user,
               "rosebud_uid": rosebud_uid,
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

function idTokenSuccess(data) {
    try {
        alert("Status: " + data.result + "\n\n" + data.message);
    } catch (err) {
        alert(err);
    }
}

function idTokenFailure(data) {
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
  var cover = JSON.parse(data);

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
    "cB": generic_json_request_new,
    "successCb": randomCoverSuccessCB,
    "failureCb": randomCoverFailureCB
  };
  if (DEBUG) { console.info("Rosebud App============> " + JSON.stringify(data)); }
  encrypt_and_execute(getX(), "kanazzi", data);

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

  console.info("Rosebud App UID============> " + rosebud_uid);

  var data = {
    "username": icarusi_user,
    "rosebud_uid": rosebud_uid,
    "method": "POST",
    "url": "/commit",
    "cB": generic_json_request_new,
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
    var covers = JSON.parse(data);

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

/*
function get_remote_covers_stats() { // eslint-disable-line no-unused-vars

    if (!icarusi_user) {
        return false;
    }

    var id_token = storage.getItem("firebase_id_token"),
        data = {
                "username": icarusi_user,
                "firebase_id_token": id_token,
                "method": "POST",
                "url": "/getcoversstats2",
                "successCb": coverStatsSuccess,
                "failureCb": coverStatsFailure
            };

    json_request(data);
}
*/

function get_remote_covers_stats_legacy() { // eslint-disable-line no-unused-vars

    if (!icarusi_user) {
        return false;
    }

    var data = {
      "username": icarusi_user,
      "method": "POST",
      "url": "/getcoversstats",
      "cB": generic_json_request_new,
      "successCb": coverStatsSuccess,
      "failureCb": coverStatsFailure
    };
    if (DEBUG) { console.info("Rosebud App============> " + JSON.stringify(data)); }
    encrypt_and_execute(getX(), "kanazzi", data);

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

function refresh_power_users() {
  var isPowerUser = get_ls_bool_default("poweruser", false);
  if (isPowerUser && !power_user.includes(icarusi_user)) {
    power_user.push(icarusi_user);
  }

}

/*
 * DO SOMETHING AFTER THE SUCCESSFUL LOGIN
 */

function show_post_login_features() {

    get_remote_covers_stats_legacy();
    refresh_power_users();

    if (power_user.includes(icarusi_user)) {
        $("#urls").show();
        $("#be_url").html(BE_URL);
        $("#media_url").html(base_url_poster);    // eslint-disable-line no-undef
        $("#debug_session").show();
        $("#refresh_token").show();
        $("#be_selector").show();
        $("#mdn_selector").show();
    }

    getServerVersion();
    get_server_revision();
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
      "username": icarusi_user,
      "rosebud_uid": rosebud_uid,
      "app_version": app_version,
      "method": "POST",
      "url": "/getconfigs2",
      "cB": generic_json_request_new,
      "successCb": set_be_list,
      "failureCb": configsFailure
    };
    if (DEBUG) { console.info("Rosebud App============> Configs: " + JSON.stringify(data)); }
    encrypt_and_execute(getX(), "kanazzi", data);

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
        mdn_selector = get_ls("mdn-selector");

    if (be_selector !== "") {
      BE_URL = be_selector;
    }

    if (mdn_selector !== "") {
      base_url_poster = mdn_selector; // eslint-disable-line no-undef
    }

    get_configurations();

    /*
    $(document).on("click", "#loginGoogle", function () {
        authenticateWithGoogle(googleAuthSuccess, googleAuthFailure, {});
    });
    */

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
                    "username": icarusi_user,
                    "firebase_id_token": id_token,
                    "rosebud_uid": rosebud_uid,
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
    window.FirebasePlugin.onNotificationOpen(function (notification) {
        console.info("======= FCM NOTIFICATION OPEN EVENT ======> " + JSON.stringify(notification));
    }, function (error) {
        console.error("======= FCM NOTIFICATION OPEN EVENT ERROR ======> " + error);
    });


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

     $('#mdn-selector').on('change', function () {
         var val = $("#mdn-selector :selected").val();
         if (DEBUG) { console.info("Rosebud App============> MDN Selector : " + val); }
         if (val !== "") {
           storage.setItem("mdn-selector", val);
         } else {
           //the default from shared.js
           storage.setItem("mdn-selector", base_url_poster);  // eslint-disable-line no-undef
         }
     });

    /*
    $('#lazy-load').on('change', function () {
        var val = $('#lazy-load').prop("checked");
        if (DEBUG) { console.info("Rosebud App============> Lazy Movie Search : " + val); }
        storage.setItem("lazy-load", val);
    });
    */

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

                data = {"username": icarusi_user,
                        "action": "DELETE",
                        "firebase_id_token": id_token,
                        "method": "POST",
                        "url": "/geolocation2",
                        "cB": generic_json_request_new,
                        "successCb": idTokenSuccess,
                        "failureCb": idTokenFailure
                        };
                encrypt_and_execute(getX(), "kanazzi", data);
            } else {
                alert("Thanks for sharing your location!\n\nPlease open 'Geo Friends' page for sharing your gps coords");
            }
        }
    });

    $('#check-session').on('change', function () {
        var id_token = storage.getItem("firebase_id_token"),
            data;

        if (DEBUG) { console.info("Rosebud App============> Flip check session (" + icarusi_user + ")"); }
        if (icarusi_user !== "" && icarusi_user !== undefined) {
            if (id_token === undefined) {
                id_token = "";
            }
            data = {"username": icarusi_user,
                    "firebase_id_token": id_token,
                    "method": "POST",
                    "url": "/testSession",
                    "successCb": idTokenSuccess,
                    "failureCb": idTokenFailure
                };
            json_request(data);
        }
    });

    $('#refresh-token').on('change', function () {

        refreshIdToken();

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
    if (DEBUG) { console.info("Rosebud App============> Lazy Movie Search : " + lazy_load); }

    /*
    if (lazy_load !== "" && lazy_load !== null) {
        $('#lazy-load').prop("checked", lazy_load);
    } else {
        storage.setItem("lazy-load", true);
    }
    */

    if (save_imgs !== "" && save_imgs !== null) {
        $('#flip-save-images').prop("checked", save_imgs);
    } else {
        storage.setItem("flip-save-images", false);
    }

    /*
    if (dld_imgs !== "" && dld_imgs !== null) {
        $('#flip-dld-images').prop("checked", dld_imgs);
    } else {

    }
    */

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
    show_post_login_features();     // User can be already logged in from previous session

}   // CORDOVA
