/*global $, cordova, device, window, document, storage_keys, get_ls, loading, alert, generic_json_request_new, encrypt_and_execute, getX*/
/*global idTokenSuccess, idTokenFailure, encryptText2, navigator, Connection, BE_URL, PullToRefresh*/
/*global swipeleftHandler, swipeRightHandler, power_user, get_ls_bool, get_ls_bool_default, authenticateWithGoogle, json_request, refreshIdToken */
/*global listDir*/
/*eslint no-console: ["error", { allow: ["info","warn", "error"] }] */

"use strict";

var DEBUG = false,
    icarusi_user = "",
    storage = window.localStorage,
    kanazzi,
    swipe_left_target = "movies.html", // eslint-disable-line no-unused-vars
    swipe_right_target = "song.html", // eslint-disable-line no-unused-vars
    appVersion;

document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);

/*
 *
 * CALLBACKS
 *
 */

function error_fall_back() {
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

function iCaruiLoginSuccess(data) {

    var g_photo = storage.getItem("google_photo_url"),
        g_name = storage.getItem("google_display_name");

    $("#logged").html('Logged in as <span style="color:green">' + g_name + '</span> (Google)');
    $("#cover_img").attr("src", g_photo);
    storage.setItem("icarusi_user", data.payload.username);

}

function iCaruiLoginFailure(data) {
    alert(data.message);
}

function googleAuthSuccess() {

    var id_token = storage.getItem("firebase_id_token"),
    email = storage.getItem("google_email"),
    app_version = storage.getItem("app_version"),
    data = {
            "username": icarusi_user,
            "firebase_id_token": id_token,
            "email": email,
            "app_vesion": app_version,
            "method": "POST",
            "url": "/login2",
            "successCb": iCaruiLoginSuccess,
            "failureCb": iCaruiLoginFailure
        };

    json_request(data);

}

function googleAuthFailure() {
    alert("Error google auth!");
}

/*
 *      SET IMAGE
 */

function set_remote_image() {
    var remote_url = storage.getItem("remote_cover_url");
    if (remote_url !== "" && remote_url !== undefined) {
        $("#cover_img").attr("src", remote_url);
    } else {
        $("#cover_img").attr("src", "images/covers/01.jpg");
    }
}

function setImage(tot_imgs) {

    var networkState = navigator.connection.type,
        dld_imgs = get_ls_bool("flip-dld-images"),
        remote_url = storage.getItem("remote_cover_url"),
        remote_covers_count = storage.getItem("remote_covers_count"),
        id_img = 0,
        image = "";

    if (DEBUG) { console.info("iCarusi App============> Remote covers count: " + remote_covers_count); }

    if (networkState !== Connection.NONE && remote_url !== "" && dld_imgs !== "" && dld_imgs && remote_covers_count !== undefined && remote_covers_count > 0) {
        if (DEBUG) { console.info("iCarusi App============> Considering remote images..."); }
        id_img = Math.floor((Math.random() * (parseInt(tot_imgs, 10) + parseInt(remote_covers_count, 10))) + 1);     // Consider also the remote images
    } else {
        if (DEBUG) { console.info("iCarusi App============> Considering ony local images..."); }
        id_img = Math.floor((Math.random() * tot_imgs) + 1);                           // Consider only local images
    }

    if (DEBUG) { console.info("iCarusi App============> Image id selected: " + id_img); }

    if (id_img < 10) {
        image = "0" + id_img + ".jpg";
    } else {
        image = id_img + ".jpg";
    }

    if (id_img > 24) {
        $("#cover_img").attr("images/covers/loading_spinner.gif");
        encryptText2(getX(), 'get_remote_random_cover_2');
        return false;
    }

    image = "images/covers/" + image;
    if (DEBUG) { console.info("iCarusi App============> Cover image seleted: " + image); }
    $("#cover_img").attr("src", image);

}

function set_fallback_image() { // eslint-disable-line no-unused-vars

    $("#cover_img").attr("src", "images/covers/01.jpg");

}

/*
 *      COVERS FUNCTIONS
 */

function get_remote_random_cover_2() { // eslint-disable-line no-unused-vars

    $.ajax({
        url: BE_URL + "/getrandomcover",
        method: "POST",
        data: {
            username: icarusi_user,
            kanazzi: kanazzi
        },
        dataType: "json"
    })
        .done(function (data) {
            if (DEBUG) { console.info(data); }
            var cover = JSON.parse(data);

            if (cover !== undefined) {
                if (DEBUG) { console.info("iCarusi App============> Fetched remote random cover data: " + cover.name); }
                storage.setItem("remote_cover_url", cover.location);
                set_remote_image();
            }
        })
        .fail(function (err) {
            if (DEBUG) { console.info("iCarusi App============> Error during remote covers retrieving"); }
            if (DEBUG) { console.info("iCarusi App============> " + err.responseText); }
        })
        .always(function () {
            if (DEBUG) { console.info("iCarusi App============> Random Cover 2 get done."); }
        });
}


function coverStatsSuccess(data) {
    if (DEBUG) { console.info("Covers statistics: " + data); }
    var covers = JSON.parse(data);

    if (covers.payload.remote_covers === 0) {
        if (DEBUG) { console.info("iCarusi App============> No remote covers found on server."); }
    }

    $("#remote_covers").html(covers.payload.remote_covers);
    if (covers.payload.remote_covers > 0) {
        storage.setItem("remote_covers_count", covers.payload.remote_covers);
    }
}

function coverStatsFailure(err) {
    if (DEBUG) {
        console.info("iCarusi App============> Error during remote covers retrieving");
        console.info("iCarusi App============> " + JSON.stringify(err));
    }

    if (err.status === 401) {
        authenticateWithGoogle(get_remote_covers_stats, error_fall_back, {});
    }
}

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
        if (DEBUG) { console.info("iCarusi App============> Cached covers count: " + covers_count_cache); }
        $("#hardcoded_images").html(covers_count_cache);
        setImage(covers_count_cache);
        return false;
    }

    function dir_success(entries) {
        if (DEBUG) { console.info("iCarusi App============> Success!"); }
        setImage(entries.length);
        if (DEBUG) { console.info("iCarusi App============> Found " + entries.length + " cover images."); }
        storage.setItem("covers_count", entries.length);
        storage.setItem("covers_count_ts", new Date().getTime());
        $("#hardcoded_images").html(entries.length);
    }

    function dir_error(err) {
        if (DEBUG) { console.info("iCarusi App============> DIR ERROR"); }
        if (DEBUG) { console.info(err); }
    }

    function fs_success(fileSystem) {
        if (DEBUG) { console.info("iCarusi App============> FS SUCCESSFUL"); }
        var reader = fileSystem.createReader();
        if (DEBUG) { console.info("iCarusi App============> CREATE READER SUCCESSFUL"); }
        if (DEBUG) { console.info("iCarusi App============> Starting to reading the directory..."); }
        //$("#cover_img").attr("src", "images/spinner_01.gif");
        reader.readEntries(dir_success, dir_error);
    }

    function fs_error(err) {
        if (DEBUG) { console.info("iCarusi App============> FS ERROR"); }
        if (DEBUG) { console.info(err); }
    }

    window.resolveLocalFileSystemURL(path, fs_success, fs_error);

}


/*
 * DO SOMETHING AFTER THE SUCCESSFUL LOGIN
 */

function show_post_login_features() {

    encryptText2(getX(), 'get_remote_covers_stats');

    if (icarusi_user === power_user) {
        $("#sabba_info").html(BE_URL);
        $("#debug_session").show();
        $("#refresh_token").show();
    }
}

/*
 * SUBMIT
 */

function submit() { // eslint-disable-line no-unused-vars

    var u = $("#username").val(),
        p = kanazzi;

    if (u === "" || p === "") {
        alert("Username and/or Passowrd cannot be empty!");
        return false;
    }

    loading(true, "Logging in...");

    $.ajax({
        url: BE_URL + "/login",
        method: "POST",
        dataType: "json",
        data: {
            username: u,
            password: p,
        },
    })
        .done(function (response) {
            if (DEBUG) {
                console.info("========> iCarusi : login completed ");
                console.info("========> iCarusi : Result... ");
            }
            if (response.result === "success" && response.payload.logged === "yes") {
                if (DEBUG) { console.info("========> iCarusi : Login successful"); }
                if (DEBUG) { console.info("========> iCarusi : " + response.payload.username); }
                if (DEBUG) { console.info("========> iCarusi : " + response.payload.message); }
                storage.setItem("icarusi_user", response.payload.username);
                icarusi_user = response.payload.username;
                $("#logged").html('Logged in as <span style="color:green">' + storage.getItem("icarusi_user") + '</span>');
                $("#popupLogin").popup("close");
                $("#login_message").html(response.payload.message);
                $("#popupLoginResult").popup("open");
                show_post_login_features();
            } else {
                console.info("========> iCarusi : Login unsuccessful");
            }
        })
        .fail(function (err) {
            alert(err.responseJSON.payload.message);
            console.info("========> iCarusi : error during login");
        })
        .always(function () {
            loading(false, "Logging in...");
        });
}

/*
 * ON DEVICE READY
 */

// CORDOVA
function onDeviceReady() {  // eslint-disable-line no-unused-vars

    console.info("========> iCarusi started. Running on Android " + device.version);

    if (DEBUG) { console.info("Localstorage status START ==============="); }
    if (DEBUG) { console.info(JSON.stringify(storage_keys)); }
    if (DEBUG) { console.info(JSON.stringify(get_ls("show-extra-info"))); }
    if (DEBUG) { console.info("Localstorage status END ==============="); }

    icarusi_user = storage.getItem("icarusi_user");
    if (!icarusi_user) {
        if (DEBUG) { console.info("====Username is not set: " + icarusi_user + ". Setting it to blank value."); }
        icarusi_user = "";
    }
    var enable_notif = get_ls_bool("enable-notifications"),
        save_imgs = get_ls_bool("flip-save-images"),
        dld_imgs = get_ls_bool("flip-dld-images"),
        extra_info = get_ls_bool("show-extra-info"),
        enable_geoloc = get_ls_bool("enable-geoloc"),
        lazy_load = get_ls_bool_default("lazy-load", true),
        networkState = navigator.connection.type;


    $(document).on("click", "#loginGoogle", function () {
        authenticateWithGoogle(googleAuthSuccess, googleAuthFailure, {});
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

    if (icarusi_user !== "") {
        window.FirebasePlugin.getToken(function (token) {
            // save this server-side and use it to push notifications to this device
            if (DEBUG) { console.info("==========> FIREBASE MESSAGING TOKEN ========> " + token); }
            storage.setItem("firebase_token", token);

            var id_token = storage.getItem("firebase_id_token"),
                data = {
                    "username": icarusi_user,
                    "firebase_id_token": id_token,
                    "token": token,
                    "method": "POST",
                    "url": "/setFBToken2",
                    "app_version": appVersion,
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

    window.FirebasePlugin.onNotificationOpen(function (notification) {
        console.info("======= FCM NOTIFICATION OPEN EVENT ======> " + JSON.stringify(notification));
    }, function (error) {
        console.error("======= FCM NOTIFICATION OPEN EVENT ERROR ======> " + error);
    });

    /*
     * FIREBASE MESSAGING: IF THE "ENABLE PUSH NOTIFICATION" IS ON THEN SUBSCRIBE TO FCM TOPIC "iCarusiNotification"
    */

    if (enable_notif !== "" && enable_notif !== undefined && enable_notif) {
        if (DEBUG) { console.info("iCarusi App============> Enabling Push notification : " + enable_notif); }
        window.FirebasePlugin.subscribe("iCarusiNotifications");
    } else {
        if (DEBUG) { console.info("iCarusi App============> Disabling Push notification : " + enable_notif); }
        window.FirebasePlugin.unsubscribe("iCarusiNotifications");
    }


    /*
     *  BINDINGS
     */

    $('#lazy-load').on('change', function () {
        var val = $('#lazy-load').prop("checked");
        if (DEBUG) { console.info("iCarusi App============> Lazy Movie Search : " + val); }
        storage.setItem("lazy-load", val);
    });

    $('#flip-dld-images').on('change', function () {
        var val = $('#flip-dld-images').prop("checked");
        if (DEBUG) { console.info("iCarusi App============> Flip Downloaded images : " + val); }
        storage.setItem("flip-dld-images", val);
    });

    $('#flip-save-images').on('change', function () {
        var val = $('#flip-save-images').prop("checked");
        if (DEBUG) { console.info("iCarusi App============> Flip Save images : " + val); }
        storage.setItem("flip-save-images", val);
    });

    $('#show-extra-info').on('change', function () {
        var val = $('#show-extra-info').prop("checked");
        if (DEBUG) { console.info("iCarusi App============> Flip Show extra info : " + val); }
        storage.setItem("show-extra-info", val);
    });

    $('#enable-geoloc').on('change', function () {

        var val = $('#enable-geoloc').prop("checked"),
            id_token = storage.getItem("firebase_id_token"),
            data;

        if (DEBUG) { console.info("iCarusi App============> Flip enable geolocation : " + val); }
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
                alert("Thanks for sharing your location!\n\nPlease open 'iCarusi' page for sharing your gps coords");
            }
        }
    });

    $('#check-session').on('change', function () {
        var id_token = storage.getItem("firebase_id_token"),
            data;

        if (DEBUG) { console.info("iCarusi App============> Flip check session (" + icarusi_user + ")"); }
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
        if (DEBUG) { console.info("iCarusi App============> Flip Enable Notifications : " + val); }
        if (val) {
            window.FirebasePlugin.subscribe("iCarusiNotifications");
        } else {
            window.FirebasePlugin.unsubscribe("iCarusiNotifications");
        }

        if (DEBUG) { console.info("iCarusi App============> Push notification Status: " + val); }

        storage.setItem("enable-notifications", val);
    });


    $(document).on("click", "#login_button", function () {
        encryptText2($("#password").val(), "submit");
    });

    /*
     *      INIT
     */

    if (DEBUG) { console.info("iCarusi App============> Downloaded images switch STORAGE : " + dld_imgs); }
    if (DEBUG) { console.info("iCarusi App============> Save Downloaded images switch STORAGE : " + save_imgs); }
    if (DEBUG) { console.info("iCarusi App============> Show Extra info switch STORAGE : " + extra_info); }
    if (DEBUG) { console.info("iCarusi App============> Enable Push Notification STORAGE : " + enable_notif); }
    if (DEBUG) { console.info("iCarusi App============> Enable Geo Location : " + enable_geoloc); }
    if (DEBUG) { console.info("iCarusi App============> Lazy Movie Search : " + lazy_load); }

    if (lazy_load !== "" && lazy_load !== null) {
        $('#lazy-load').prop("checked", lazy_load);
    } else {
        storage.setItem("lazy-load", true);
    }

    if (save_imgs !== "" && save_imgs !== null) {
        $('#flip-save-images').prop("checked", save_imgs);
    } else {
        storage.setItem("flip-save-images", false);
    }

    if (dld_imgs !== "" && dld_imgs !== null) {
        $('#flip-dld-images').prop("checked", dld_imgs);
    } else {
        storage.setItem("flip-dld-images", false);
    }

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
        appVersion = version;
        $('#version').html("Release " + version);
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
        instructionsReleaseToRefresh: "Manadittu !",
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
