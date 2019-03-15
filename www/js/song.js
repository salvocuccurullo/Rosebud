/*global $, document, window, DEBUG, BE_URL, alert */
/*global loading, get_ls_bool, fancyDate, PhotoViewer, device, FormData, encryptText2, getX, power_user */
/*global device, Connection, storage, navigator, cordova, swipeleftHandler, swipeRightHandler, generic_json_request_new */
/*global encrypt_and_execute, get_ls */
/*eslint no-global-assign: "error"*/
/*globals kanazzi:true*/
/*exported kanazzi */
/*eslint no-console: ["error", { allow: ["info","warn", "error"] }] */
/*eslint no-global-assign: "error"*/
/*globals BE_URL:true*/

"use strict";

var storage = window.localStorage,
    icarusi_user = "",
    kanazzi,
    swipe_left_target = "index.html", // eslint-disable-line no-unused-vars
    swipe_right_target = "carusi.html", // eslint-disable-line no-unused-vars
    DEBUG = false,
    device_app_path = "",
    sort_type = "created",
    sort_order = -1,
    current_covers = "",
    curr_file_size = 0,
    curr_cover_id = "",
    covers_storage = [];

document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);

function setCacheInfo() {

    var show_info = get_ls_bool("show-extra-info"),
        covers_storage = "",
        covers_storage_ts = "";

    if (show_info) {

        covers_storage = JSON.parse(storage.getItem("covers_storage"));
        covers_storage_ts = storage.getItem("covers_ts");

        if (covers_storage !== "" && covers_storage !== undefined && covers_storage !== null) {
            $("#cache_info").html("Covers cached " + covers_storage.length + " element(s) --- last update " + fancyDate(covers_storage_ts));
        }
    }
}

function setCovers(covers) {

    $('#covers-list').empty();

    setCacheInfo();

    if (covers.length === 0) {
        if (DEBUG) { console.info("Rosebud App============> No covers found on remote server."); }
    }

    var covers_header = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
    covers_header += 'Found <span style="color:yellow">' + covers.length + '</span> covers';
    covers_header += '</li>';
    $('#covers-list').append(covers_header);

    if (covers.length === 0) {
        $('#covers-list').append('<li style="white-space:normal;">No covers available</li>');
    }

    $.each(covers, function (index, value) {

        var cover_content = '<li style="white-space:normal">',
            cover_location = '';

        if (value.type === undefined || value.type === "local") {
            cover_location = device_app_path + "www/images/covers/" + value.location;
        } else {
            cover_location = value.location;
        }

        if (value.type === "remote" && value.id !== undefined && value.id !== "") {
            cover_content += '<button class="ui-btn ui-icon-edit ui-btn-icon-notext ui-corner-all ui-mini ui-btn-inline" id="btn_edit_cover" style="float:right" onclick="edit_cover(\'' + value.id + '\')"></button>';
        }

        cover_content += '<button class="ui-btn ui-icon-camera ui-btn-icon-notext ui-corner-all ui-mini ui-btn-inline" id="btn_show_cover" style="float:right" onclick="poster(\'' + cover_location + '\')"></button>';
        cover_content += value.name + '<br/>';
        if (value.year !== 0 && value.year !== "") {
            cover_content += '<span style="color:#000099; font-style:italic; font-size:11px;">' + value.author + ' (' + value.year + ')</span>';
        } else {
            cover_content += '<span style="color:#000099; font-style:italic; font-size:11px;">' + value.author + '</span>';
        }

        if (value.created !== undefined && sort_type === "created") {
            cover_content += '<br/><span style="color:#C60419; font-style:italic; font-size:10px;">' + value.created + '</span>';
        }

        cover_content += '</li>';
        $('#covers-list').append(cover_content);
    });
    $('#covers-list').listview('refresh');
}


function get_song() { // eslint-disable-line no-unused-vars

    $("#lyrics-list").empty();

    loading(true, "Loading random song...");

    $.ajax({
        url: BE_URL + "/randomSong",
        method: "POST",
        data: {
            username : icarusi_user,
            kanazzi : kanazzi
        },
        dataType: "json"
    })
        .done(function (data) {

            if (data.message === "song not found" || data.message === "not valid id") {
                $('#lyrics-list').append('<li style="white-space:normal;">Song not found ;(</li>');
                return;
            }

            //if (DEBUG) { console.info("Retrieved song data:" + JSON.stringify(data)); }
            var song = data.message,
                song_header = '';

            if (DEBUG) { console.info("Retrieved song data:" + song.title + " - " + song.author); }

            song_header = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
            song_header += '<button class="ui-btn ui-icon-refresh ui-btn-icon-notext ui-corner-all ui-mini ui-btn-inline ui-btn-b" style="float:right" onclick="get_song()"></button>';
            song_header += '<span style="color:yellow">' + song.title + '</span><br/>' + song.author + '</li>';
            $('#lyrics-list').append(song_header);

            if (song.lyrics.length === 0) {
                $('#lyrics-list').append('<li style="white-space:normal;">No lyrics available for this song</li>');
            }

            $.each(song.lyrics, function (index, value) {
                $('#lyrics-list').append('<li style="white-space:normal;">' + value.text + '</li>');
            });

            $('#lyrics-list').listview('refresh');

        })
        .fail(function () {
            console.info("Error while retrieving random song");
            $("#song_content").html("Error during song loading... i Kani Anassiri!!!");
        })
        .always(function () {
            loading(false, "");
        });
}

function sort_covers(s_type) {

    if (DEBUG) { console.info("Sort type current: " + sort_type + " --- Sort type passe: " + s_type); }

    if (sort_type !== s_type) {
        sort_order = 1;
    } else {
        sort_order *= -1;
    }

    if (DEBUG) { console.info("Sort type: " + sort_type + " --- Sort order: " + sort_order); }

    sort_type = s_type;
    $("#cover_search").val("");
    var covers = storage.getItem("covers_storage");     // GET FROM LOCALSTORAGE

    if (covers !== "" && covers !== undefined && covers !== null) {
        covers = JSON.parse(covers);
        current_covers = covers;
        if (sort_type === "avg_vote") {
            covers.sort(function (a, b) {
                if (parseFloat(a[sort_type]) > parseFloat(b[sort_type])) {
                    return (sort_order * -1);
                }
                if (parseFloat(a[sort_type]) < parseFloat(b[sort_type])) {
                    return sort_order;
                }
                return 0;
            });
        } else {
            covers.sort(function (a, b) {
                if (a[sort_type] > b[sort_type]) {
                    return (sort_order * -1);
                }
                if (a[sort_type] < b[sort_type]) {
                    return sort_order;
                }
                return 0;
            });
        }
        setCovers(covers);
    }
}

/*
* GET COVERS
*/

function getCoversSuccess(data) { // eslint-disable-line no-unused-vars
    var covers = JSON.parse(data);
    storage.setItem("covers_storage", JSON.stringify(covers));      // SAVE ON LOCALSTORAGE
    storage.setItem("covers_ts", new Date().getTime());
    setCacheInfo();
    current_covers = covers;
    sort_type = "";
    sort_covers("created");
}

function getCoversFailure(err) { // eslint-disable-line no-unused-vars
    if (DEBUG) { console.error("Rosebud App============> " + err.responseText); }
}

function get_covers() { // eslint-disable-line no-unused-vars

  if (icarusi_user === undefined || icarusi_user === "" || icarusi_user === null) {
      alert("You must be logged in for accessing covers!!");
      return false;
  }

  if (DEBUG) { console.info("Rosebud App============> Starting covers retrieving..."); }

  var data = {
    "username": icarusi_user,
    "method": "POST",
    "url": "/getcovers",
    "cB": generic_json_request_new,
    "successCb": getCoversSuccess,
    "failureCb": getCoversFailure
  };
  encrypt_and_execute(getX(), "kanazzi", data);
}

/*
* EDIT Cover, NEW Cover and Show Cover
*/

function edit_cover(id) { // eslint-disable-line no-unused-vars

    var spotify_url_received = get_ls("spotify_url_received");

    $(':mobile-pagecontainer').pagecontainer('change', '#cover_page');

    $("#cover_img").show();
    $("#cover_img").attr("src", "");
    if (id === 0) {
        $("#cover_img").hide();
    }
    $("#title").val("");
    $("#author").val("");
    $("#year").val("");
    $("#pic").val("");
    $("spoty_url").val("");
    $("#spoti_img_url").val("");
    $("#spotify_api_url").val("");
    $("#spoty_url").val("");
    $("#upload_result").html("");
    $('#tracks-list').empty();

    if (spotify_url_received != undefined) {
      $("#spoty_url").val(spotify_url_received);
    }

    if (id !== 0) {
        var result = $.grep(current_covers, function (element, index) { // eslint-disable-line no-unused-vars
            return (element.id === id);
        });

        if (DEBUG) {
            console.info("==========================");
            console.info(JSON.stringify(result));
            console.info("==========================");
        }

        result = result[0];
        $("#id").val(result.id);
        $("#title").val(result.name);
        $("#author").val(result.author);
        $("#year").val(result.year);
        $("#spotify_api_url").val(result.spotifyUrl);
        if (result.location !== "") {
            $("#cover_img").attr("src", result.location);
        }
        if (result.spotifyUrl !== "") {
          get_spotify({
              "action": "tracks-only",
              "url": result.spotifyUrl
            });
        }
        if (DEBUG) { console.info("cover img src: " + $("#cover_img").attr("src")); }
        curr_cover_id = result.id;
    } else {
        $("#id").val("");
    }
}

function new_cover() { // eslint-disable-line no-unused-vars
    edit_cover(0);
}

function poster(img_name) { // eslint-disable-line no-unused-vars

    if (DEBUG) { console.info("Show poster called on " + img_name); }

    var android_version = device.version.split(".");

    if (parseInt(android_version[0], 10) < 5) {
        loading(true, "Loading cover..");
        $("#popupPhotoPortrait").popup('open');
        $("#poster_pic").attr("src", img_name);
    } else {
        PhotoViewer.show(img_name, "");
    }
}

/*
*   UPLOAD COVER
*/

function uploadCover() { // eslint-disable-line no-unused-vars

    if (DEBUG) { console.info("UPLOAD COVER CALLED..."); }

    $("#username2").val(icarusi_user);
    $("#kanazzi").val(kanazzi);

    var username = icarusi_user,
        title = $("#title").val(),
        author = $("#author").val(),
        year = $("#year").val(),
        the_form = $("#cover_form"),
        formData = new FormData(the_form[0]);

    if (username === "" || username === undefined || username === null) {
        alert("You must be logged in for saving a cover");
        return false;
    }

    if (title === "" || title === undefined || title === null || author === "" || author === undefined || author === null) {
        alert("Title and author cannot be blank!! Title: " + title + " - Author: " + author);
        return false;
    }

    if (curr_file_size !== undefined && curr_file_size > 512000) {
        alert("File size exceeded! Max 500KB");
        return false;
    }

    if ($("#spoti_img_url").val() !== "") {
      if (DEBUG) { console.info("Uploading a new cover using spotify data: " + $("#spoti_img_url").val()); }
    } else if ($("#pic").val() === "" && curr_cover_id === "") {
        alert("File/Spotify Image cannot be empty!");
        return false;
    }

    if (year !== "" && (isNaN(parseInt(year, 10)) || parseInt(year, 10) < 0)) {
        alert("Year value not valid: " + year);
        return false;
    }

    loading(true, "Submitting album cover...");

    $.ajax({
        url: BE_URL + "/uploadcover",
        method: "POST",
        data: formData,
        cache: false,
        contentType: false,
        processData: false
    })
        .done(function (response) {
            try {
                //response = JSON.parse(response);
                if (DEBUG) {
                    console.info("Upload Cover -> Result: " + response.result);
                    console.info("Upload Cover -> Message: " + response.message);
                }

                if (response.result === "failure") {
                    alert("Error" + response.message);
                    return false;
                }
            } catch (err) {
                console.info("JSON parsing of upload cover response failed.");
                if (DEBUG) { console.info(JSON.stringify(response)); }
            }

            if (DEBUG) { console.info("Reloading covers..."); }
            get_covers();

            $("#title").val("");
            $("#author").val("");
            $("#year").val("");
            $("#pic").val("");

            $("#upload_result").html('<span style="font-weight:bold; color:green">Success!</span>');
            $(':mobile-pagecontainer').pagecontainer('change', '#song_page');
        })
        .fail(function (err) {
            alert("Server error! " + err.responseText);
        })
        .always(function () {
            loading(false, "");
        });
}

function no_image() { // eslint-disable-line no-unused-vars
    $("#cover_img").attr("src", device_app_path + "www/images/no-image-available.jpg");
}


/*
* SPOTIFY FUNCTIONS
*/

function setTracks(tracks) {

    $('#tracks-list').empty();

    if (tracks.items.length === 0) {
        if (DEBUG) { console.info("Rosebud App============> No tracks found on Spotify."); }
    }

    var tracks_header = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
    tracks_header += 'Found <span style="color:yellow">' + tracks.items.length + '</span> tracks';
    tracks_header += '</li>';
    $('#tracks-list').append(tracks_header);

    if (tracks.items.length === 0) {
        $('#tracks-list').append('<li style="white-space:normal;">No covers available</li>');
    }

    $.each(tracks.items, function (index, value) {
        var track_content = '<li style="white-space:normal">';
        track_content += value.name;
        track_content += '</li>';
        $('#tracks-list').append(track_content);
    });
    $('#tracks-list').listview('refresh');
}


function setSpotifySong(data) {
    data = JSON.parse(data);
    if (DEBUG) { console.info("Rosebud App============> " + data.images[0].url); }
    $("#cover_img").attr("src", data.images[0].url);
    $("#spoti_img_url").val(data.images[0].url);
    $("#author").val(data.artists[0].name);
    $("#title").val(data.name);
    $("#year").val(data.release_date.split("-")[0]);
    $("#spotify_api_url").val(data.href);
    setTracks(data.tracks);
    $("#cover_img").show();
}

function setSpotifyTracks(data) {
    data = JSON.parse(data);
    setTracks(data.tracks);
}

function spotyFailure(err) {
  if (DEBUG) { console.error("Rosebud App============> " + err.responseText); }
}

function get_spotify(fn_data) {
    console.info("Rosebud App============> " + JSON.stringify(fn_data));

    var data,
        successCB = setSpotifySong,
        spoty_url = $("#spoty_url").val();

    if (fn_data.action === 'tracks-only') {
      successCB = setSpotifyTracks;
      spoty_url = fn_data.url;
    }

    data = {
      "username": icarusi_user,
      "album_url": spoty_url,
      "method": "POST",
      "url": "/spotify",
      "cB": generic_json_request_new,
      "successCb": successCB,
      "failureCb": spotyFailure
    };
    console.info("Rosebud App============> " + JSON.stringify(data));
    encrypt_and_execute(getX(), "kanazzi", data);
}

  /*
  * CORDOVA ON DEVICE onDeviceReady
  */


function onDeviceReady() { // eslint-disable-line no-unused-vars

    icarusi_user = storage.getItem("icarusi_user");
    covers_storage = storage.getItem("covers_storage");
    device_app_path = cordova.file.applicationDirectory;
    var spotify_url_received = get_ls("spotify_url_received");
    if (spotify_url_received != undefined) {
      $("#spoty_url").val(spotify_url_received);
    }


    window.plugins.intent.setNewIntentHandler(function (intent) {
        console.info(JSON.stringify(intent));
        //if (intent !== undefined) {
           storage.setItem("spotify_url_received", intent.clipItems[0].text);
        //}
    });

    var networkState = navigator.connection.type,
        old_ts  = parseInt(storage.getItem("covers_ts"), 10),
        new_ts,
        diff,
        diff_sec,
        be_selector = get_ls("be-selector"),
        spotify_url_received = get_ls("spotify_url_received");

    //$("#shared_spotify_url").html(spotify_url_received);

    if (be_selector !== "") {
      BE_URL = be_selector;
    }

    $("#poster_pic").attr("src", "images/loading.gif");
    $("#connection").html("");
    $("#random_song_message").html("");

    if (networkState === Connection.NONE) {
        $("#connection").html("No network... Pantalica mode...");
    }

    if (icarusi_user === power_user) {
        $("#sabba_info").html(BE_URL);
    }

    if (networkState === Connection.NONE) {
        $("#connection").html("No network... Pantalica mode...");

        $("#random_song_message").html("No Random Song available<br/>on Pantalica mode! ;)");

        if (icarusi_user !== "" && covers_storage !== "" && covers_storage !== undefined && covers_storage !== null) {
            console.info("Rosebud App============> NO NETWORK -> Cached Covers loading");
            sort_covers("created");
        }

    } else {

        encryptText2(getX(), "get_song");

        if (old_ts !== "" && old_ts !== null && old_ts !== undefined) {

            new_ts = new Date().getTime();
            diff = new_ts - old_ts;
            diff_sec = diff / 1000;

            if (icarusi_user !== "" && diff_sec < 86400 && covers_storage !== "" && covers_storage !== undefined && covers_storage !== null) {
                if (DEBUG) { console.info("Rosebud App============> CACHE AVAILABLE AND NOT EXPIRED -> Cached Covers loading"); }
                sort_covers("created");
            } else {
                get_covers();
            }
        } else {
            get_covers();
        }
    }

    /*
    PullToRefresh.init({
        mainElement: '#lyrics-list',
        onRefresh: function () {
            get_song();
        },
        distThreshold : 20,
        instructionsReleaseToRefresh: "I kani anassiri!",
    });
    */

    // SWIPE RUDIMENTALE
    $("#song_page").on("swipeleft", swipeleftHandler);
    $("#song_page").on("swiperight", swipeRightHandler);
    // FINE SWIPE RUDIMENTALE

    $('#cover_search').on('change', function () {
        var search = $("#cover_search").val();
        if (search.length === 0) {
            sort_covers(sort_type);
            return false;
        }
    });

    $("#cover_search").bind("input", function () {
        var search = $("#cover_search").val(),
            result = current_covers;

        if (search.length === 0) {
            sort_order = -1;
            sort_covers(sort_type);
            return false;
        }

        if (search.length < 4) {
            return false;
        }

        result = $.grep(result, function (element, index) { // eslint-disable-line no-unused-vars
            return (
                (element.year.toString() === search) ||
                (element.name.toUpperCase().indexOf(search.toUpperCase()) >= 0) ||
                (element.author.toUpperCase().indexOf(search.toUpperCase()) >= 0)
            );
        });
        setCovers(result);
    });


    $("#popupPhotoPortrait").bind({
        popupafterclose: function (event, ui) { // eslint-disable-line no-unused-vars
            if (DEBUG) { console.info("Rosebud App============> Closing popupPhotoPortrait Popup"); }
            $("#poster_pic").attr("src", "images/loading.gif");
        }
    });

    $(document).on("click", "#send_album_btn", function () {
        encryptText2(getX(), "uploadCover");
    });



    $(document).on("click", "#spoty_btn", function () {
        get_spotify({
            'action':'all'
        });
    });

    $('#pic').bind('change', function () {

        var size = this.files[0].size,
            sizekb = this.files[0].size / 1024;
        curr_file_size = size;

        if (size <= 512000) {
            $("#upload_result").html('<span style="color:green">File size (' +  sizekb.toFixed(2) + " KB) OK !</span>");
        } else {
            $("#upload_result").html('<span style="color:red">File size (' +  sizekb.toFixed(2) + " KB) not OK! Max 500 KB! </span>");
        }
    });

} // CORDOVA
