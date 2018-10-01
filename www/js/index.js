/*global $, cordova, device, window, document, storage_keys, firebase, firebase_config, get_ls, loading, alert, generic_json_request_new, encrypt_and_execute, getX*/
/*global geolocationSuccess, geolocationFailure, encryptText2, navigator, Connection, BE_URL, PullToRefresh*/
/*global swipeleftHandler, swipeRightHandler, power_user, get_ls_bool */
/*global listDir*/
/*eslint no-console: ["error", { allow: ["info","warn", "error"] }] */

"use strict";

var DEBUG = true,
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

function tokenFailure(data) { // eslint-disable-line no-unused-vars
    loading(true, "Token verification error. Refreshing...");
    cordova.plugins.firebase.auth.getIdToken()
        .then(function (idToken) {
            loading(false, "");
            // send token to server
            console.info("_______________________________");
            console.info("Sending new token to server...");
            console.info(idToken);
            console.info("_______________________________");
            if (icarusi_user !== "") {
                storage.setItem("firebase_id_token", idToken);
                data = {"username": icarusi_user,
                        "token": idToken,
                        "method": "POST",
                        "url": "/setFBToken",
                        "app_version": appVersion,
                        "cB": generic_json_request_new,
                        "successCb": geolocationSuccess,
                        "failureCb": geolocationFailure
                        };
                encrypt_and_execute(getX(), "kanazzi", data);
            }
        })
        .catch(function (error) {
            if (DEBUG) { console.info("Firebase idToken failure" + error); }
            loading(true, "Token expired or not valid. Trying automatic login...");
            cordova.plugins.firebase.auth.signInWithEmailAndPassword(storage.getItem("fb_user"), storage.getItem("fb_pass"))
                .then(function (userInfo) {
                    loading(false, "");
                    if (DEBUG) { console.info(JSON.stringify(userInfo)); }
                    storage.setItem("firebase_uid", userInfo.uid);
                })
                .catch(function (error) {
                    loading(false, "");
                    alert("Automatic login failed! Please enter your credentials again." + error);
                    $("#popupLoginFireBase").popup("open");
                });
        });
}

function tokenSuccess(data) { // eslint-disable-line no-unused-vars
    console.info("Firebase token on server is valid. " + JSON.stringify(data));
    storage.setItem("firebase_id_token", data.payload.firebase_id_token);
}

function geolocationSuccess(data) {
    try {
        alert("Status: " + data.result + "\n\n" + data.message);
    } catch (err) {
        alert(err);
    }
}

function geolocationFailure(error) {
    alert(error);
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


function get_remote_covers_stats() { // eslint-disable-line no-unused-vars

    $.ajax({
        url: BE_URL + "/getcoversstats",
        method: "POST",
        data: {
            username : icarusi_user,
            kanazzi : kanazzi
        },
        dataType: "json"
    })
        .done(function (data) {
            if (DEBUG) { console.info("Covers statistics: " + data); }
            var covers = JSON.parse(data);

            if (covers.payload.remote_covers === 0) {
                if (DEBUG) { console.info("iCarusi App============> No remote covers found on server."); }
            }

            $("#remote_covers").html(covers.payload.remote_covers);
            if (covers.payload.remote_covers > 0) {
                storage.setItem("remote_covers_count", covers.payload.remote_covers);
            }
        })
        .fail(function (err) {
            if (DEBUG) { console.info("iCarusi App============> Error during remote covers retrieving"); }
            if (DEBUG) { console.info("iCarusi App============> " + err.responseText); }
        })
        .always(function () {
            if (DEBUG) { console.info("iCarusi App============> Get remote cover stats done."); }
        });
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

    $.mobile.loading("show");

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
            $.mobile.loading("hide");
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
    var provider,
        enable_notif = get_ls_bool("enable-notifications"),
        save_imgs = get_ls_bool("flip-save-images"),
        dld_imgs = get_ls_bool("flip-dld-images"),
        extra_info = get_ls_bool("show-extra-info"),
        enable_geoloc = get_ls_bool("enable-geoloc"),
        networkState = navigator.connection.type;

    /*
     * FIREBASE AUTH WITH GOOGLE
     */

    firebase.initializeApp(firebase_config);

    provider = new firebase.auth.GoogleAuthProvider();

    $(document).on("click", "#loginGoogle", function () {
        firebase.auth().signInWithRedirect(provider).then(function () {
            return firebase.auth().getRedirectResult();
        })
            .then(function (result) {

                // This gives you a Google Access Token.
                var token = result.credential.idToken,      // You can use it to access the Google API.
                    user = result.user;                     // The signed-in user info.

                if (DEBUG) {
                    console.info("========== GOOGLE LOGIN ===================");
                    console.info(" * * CREDENTIALS * * ");
                    console.info(JSON.stringify(result.credential));
                    console.info(" * * USER * * ");
                    console.info(JSON.stringify(user));
                    console.info("===========================================");
                }

                storage.setItem("firebase_id_token", token);
                $("#logged").html('Logged in as <span style="color:green">' + user.displayName + '</span> (Google)');
                $("#cover_img").attr("src", user.photoURL);
                storage.setItem("google_photo_url", user.photoURL);

            })
            .catch(function (error) {
                // Handle Errors here.
                var errorCode = error.code,
                    errorMessage = error.message;

                console.info("========== GOOGLE LOGIN ERROR ===================");
                console.info(errorCode);
                console.info(errorMessage);
                console.info("===========================================");
            });
    });


    /*
     * FIREBASE AUTHENTICATION
     */

    /*

    $(document).on("click", "#login_button_fireb", function() {
        loading(true, "Logging in with Google Firebase...");
        cordova.plugins.firebase.auth.signInWithEmailAndPassword($("#username_fireb").val(), $("#password_fireb").val() )
        .then(function (userInfo) {
            console.info(JSON.stringify(userInfo));
            storage.setItem("firebase_uid", userInfo.uid);
            loading(false, "");
            storage.setItem("fb_user", $("#username_fireb").val());
            storage.setItem("fb_pass", $("#password_fireb").val());
            alert("Login Successful!");
            $("#popupLoginFireBase").popup("close");
        })
        .catch(function (error) {
            loading(false, "");
            alert("Login failed! " + error);
        });
    });
    */

    $(document).on("click", "#register_button_fireb", function () {
        loading(true, "Registering a new user\non Google Firebase...");
        cordova.plugins.firebase.auth.createUserWithEmailAndPassword($("#username_fireb").val(), $("#password_fireb").val())
            .then(function (userInfo) {

                console.info(JSON.stringify(userInfo));
                /*
                storage.setItem("firebase_uid", userInfo.uid);

                storage.setItem("fb_user", $("#username_fireb").val());
                storage.setItem("fb_pass", $("#password_fireb").val());
                */
                loading(false, "");
                /*
                cordova.plugins.firebase.auth.sendEmailVerification()
                    .then(function (data) {
                        alert("Email verification succeded! " + data);
                    })
                    .catch(function (error) {
                        alert("Email verification failed! " + error);
                    });
                */
                alert("User creation Successful! Email verification sent...");
                $("#popupLoginFireBase").popup("close");
            })
            .catch(function (error) {
                loading(false, "");
                alert("User creation failed! " + error);
            });
    });

    /*
     * FIREBASE MESSAGING: ON STARTUP THE FCM TOKEN IS RETRIEVED FROM GOOGLE
     * IF SUCCESS: IT WILL BE SAVED ON BOTH LOCALSTORAGE AND SERVER SIDE
     */
    if (icarusi_user !== "") {
        window.FirebasePlugin.getToken(function (token) {
            // save this server-side and use it to push notifications to this device
            if (DEBUG) { console.info("==========> FIREBASE MESSAGING TOKEN ========> " + token); }
            storage.setItem("firebase_token", token);

            var data = {
                    "username": icarusi_user,
                    "token": token,
                    "method": "POST",
                    "url": "/setFBToken",
                    "app_version": appVersion,
                    "cB": generic_json_request_new
                };
            encrypt_and_execute(getX(), "kanazzi", data);

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
                        "successCb": geolocationSuccess,
                        "failureCb": geolocationFailure
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
                    "action": "DELETE",
                    "firebase_id_token": id_token,
                    "method": "POST",
                    "url": "/testSession",
                    "cB": generic_json_request_new,
                    "successCb": geolocationSuccess,
                    "failureCb": geolocationFailure
                };
            encrypt_and_execute(getX(), "kanazzi", data);
        }
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

    $(document).on("click", "#send_album_btn", function () {
        encryptText2(getX(), "uploadCover");
    });

    /*
     *      INIT
     */

    if (DEBUG) { console.info("iCarusi App============> Downloaded images switch STORAGE : " + dld_imgs); }
    if (DEBUG) { console.info("iCarusi App============> Save Downloaded images switch STORAGE : " + save_imgs); }
    if (DEBUG) { console.info("iCarusi App============> Show Extra info switch STORAGE : " + extra_info); }
    if (DEBUG) { console.info("iCarusi App============> Enable Push Notification STORAGE : " + enable_notif); }
    if (DEBUG) { console.info("iCarusi App============> Enable Geo Location : " + enable_geoloc); }

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
