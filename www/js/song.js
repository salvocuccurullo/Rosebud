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
    rosebud_uid = "",
    swipe_left_target = "index.html", // eslint-disable-line no-unused-vars
    swipe_right_target = "carusi.html", // eslint-disable-line no-unused-vars
    DEBUG = false,
    device_app_path = "",
    sort_type = "update_ts",
    sort_order = -1,
    current_covers = "",
    curr_file_size = 0,
    curr_cover_id = "",
    current_page = 1,
//    append_mode = false,
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
            $("#cache_info").html("Covers cached " + covers_storage.covers.length + " element(s) --- last update " + fancyDate(covers_storage_ts));
        }
    }
}

/*
*   UPLOAD COMMENT
*/

function sendCommentSuccess(data) { // eslint-disable-line no-unused-vars
}

function sendCommentFailure(err) { // eslint-disable-line no-unused-vars
}

function send_comment() { // eslint-disable-line no-unused-vars

    if (DEBUG) { console.info("Send comment called..."); }

    $("#kanazzi").val(kanazzi);

    var username = icarusi_user,
        the_form = $("#comment_form"),
        formData = new FormData(comment_form[0]),
        data = {
          "username": icarusi_user,
          "search": search,
          "method": "POST",
          "url": "/savecovercomment",
          "cB": generic_json_request_new,
          "successCb": sendCommentSuccess,
          "failureCb": sendCommentFailure
        };
    encrypt_and_execute(getX(), "kanazzi", data);

}

function setComments(id) { // eslint-disable-line no-unused-vars

  console.info("Retrieving comments of album with id " + id);

  if (id !== 0) {
      var item = $.grep(current_covers.covers, function (element, index) { // eslint-disable-line no-unused-vars
          return (element.id === id);
      }),
      comments_count = 0,
      content,
      header_content,
      upd_human_date;

      if (DEBUG) {
          console.info("==========================");
          console.info(JSON.stringify(item));
          console.info("==========================");
      }

      if (item.length > 0) {
        item = item[0];
      } else {
        return false;
      }

      /*    TO BE RESTORED FOR LET TO REVIEW AN ALBUM FROM COMMENTS PAGE
      if (item.length > 0) {

        // NEW
        $(':mobile-pagecontainer').pagecontainer('change', '#comments_page');

        item = item[0];
        //alert(item.id);
        $("#idx").val(item.id);
        $("#username2x").val(icarusi_user);

        if (item.reviews !== undefined && item.reviews !== null && item.reviews[icarusi_user] !== undefined && item.reviews[icarusi_user] !== null) {
          $("#votex").val(item.reviews[icarusi_user].vote).slider("refresh");
          $("#reviewx").val(item.reviews[icarusi_user].review);
        } else {
          $("#votex").val(5).slider("refresh");
          $("#reviewx").val("");
        }

      } else {
        return false;
      }
      */

    $(':mobile-pagecontainer').pagecontainer('change', '#comments_page');

    if (DEBUG) { console.info("Rosebud App============> " + item.name + " ** " + item.author + " ** "); }

    if (item.type === "local") {
      content = '<img style="padding:10px; width:400px" id="album_p" src="' + device_app_path + "www/images/covers/" + item.location + '" onerror="set_fallback_image()"/>';
    } else {
      content = '<img style="padding:10px; width:85%" id="album_p" src="' + item.location + '" onerror="set_fallback_image()"/>';
    }
    $("#album_data").html(content);

    if (item.spotifyAlbumUrl !== "" && item.spotifyAlbumUrl !== undefined) {
      $("#spoti_img").attr("onclick", "play_song('" + item.spotifyAlbumUrl + "')");
      $("#spoti_img").attr("src", 'images/icons/spoti-icon.png');
    } else {
      $("#spoti_img").attr("onclick", "");
      $("#spoti_img").attr("src", "play_song('" + item.spotifyAlbumUrl + "')");
    }

    $("#edit-button").attr("onclick", "edit_cover('" + item.id + "')");

    $("#top_title_comments").html(item.name + "<br/>" + item.author + " (" + item.year + ")");

    if (DEBUG) { console.info("Rosebud App============> " + JSON.stringify(item.reviews)); }

    $('#album_comments').empty();

    $.each(item.reviews, function (index, value) { // eslint-disable-line no-unused-vars

        upd_human_date = fancyDate(new Date(Date.parse(value.updated)));

        content = '<li style="white-space:normal;">';
        if (value.review !== "") {
            comments_count += 1;
        }

        content += '<b>' + value.username + '</b> <span style="color:red; float:right">' + value.vote + '</span>';
        content += '<br/><p style="white-space:normal; font-style:italic; font-size:12px">' + value.review + '</p>';
        content += '<span style="color:#C60419; font-style:italic; font-size:10px; float:right">' + upd_human_date + '</span>';
        content += '</li>';
        $('#album_comments').append(content);
    });

    header_content = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
    header_content += '<span style="color:yellow">' + comments_count + ' comment(s) / ' + Object.keys(item.reviews).length + ' vote(s)</span></li>';
    $('#album_comments').prepend(header_content);
    $('#album_comments').listview('refresh');

  }
}

function setCovers(covers) {

    $('#covers-list').empty();

    setCacheInfo();

    if (covers.length === 0) {
        if (DEBUG) { console.info("Rosebud App============> No covers found on remote server."); }
    }

    var covers_header = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
    covers_header += 'Found/Latest <span style="color:yellow">' + covers.length + '</span> of <span style="color:yellow">' + current_covers.total + '</span> covers';
    covers_header += '</li>';
    $('#covers-list').append(covers_header);

    if (covers.length === 0) {
        $('#covers-list').append('<li style="white-space:normal;">No covers available</li>');
    }

    $.each(covers, function (index, value) {

        var cover_location = '',
            cover_content,
            icon_name,
            upd_human_date,
            comments_count = 0;

        /*
        if (value.spotifyUrl !== "") {
          icon_name = "spoti";
        } else {
          icon_name = "hand";
        }
        */

        if (value.type === undefined || value.type === "local") {
            cover_location = device_app_path + "www/images/covers/" + value.location;
        } else {
            cover_location = value.location;
        }

        cover_content = '<li style="background: url(' + cover_location + ') no-repeat center left ; padding: 10px 10px 10px 65px; background-size: 48px 48px; background-position: 5px 5px; background-color:white; white-space:normal;" >';
        //cover_content = '<li style="background: url(images/icons/' + icon_name + '-icon.png) no-repeat center left; padding: 10px 10px 10px 35px; background-size: 32px 32px; background-color:white; white-space:normal;">';
        //cover_content += ' class="clickable" album_id="' + value.id + '" cover_loc="' + cover_location + '">';

        /*
        if (value.type === "remote" && value.id !== undefined && value.id !== "") {
            cover_content += '<button class="ui-btn ui-icon-edit ui-btn-icon-notext ui-corner-all ui-mini ui-btn-inline" id="btn_edit_cover" style="float:right" onclick="edit_cover(\'' + value.id + '\')"></button>';
        }
        */

        /*
        cover_content += '<button class="ui-btn ui-icon-edit ui-btn-icon-notext ui-corner-all ui-mini ui-btn-inline" id="btn_edit_cover" style="float:right" onclick="edit_cover(\'' + value.id + '\')"></button>';
        */

        /*
        if (value.spotifyAlbumUrl !== "" && value.spotifyAlbumUrl !== undefined) {
            cover_content += '<button class="ui-btn ui-btn-icon-notext ui-corner-all ui-mini ui-btn-inline ui-icon-myicon" style="float:right" onclick="window.open(\'' + value.spotifyAlbumUrl + '\', \'_system\')"></button>';
        }
        */

        /*
        if (value.reviews !== null) {
          comments_count = Object.keys(value.reviews).length;
          cover_content += '<button class="ui-btn ui-corner-all ui-mini ui-btn-inline" style="float:right; color:#8B0000; border-radius: 50%" id="btn_edit_cover" onclick="setComments(\'' + value.id +  '\')">' + comments_count + '</button>';
        }
        */

        cover_content += '<button style="float:right; border: none; padding:0; background:none" onclick="tracks_me(\'' + value.spotifyUrl + '\')">';
        cover_content += '<img src="images/icons/cd-on.png" style="width:24px; height:24px"/></button>';

        //cover_content += '<button class="ui-btn ui-icon-camera ui-btn-icon-notext ui-corner-all ui-mini ui-btn-inline" id="btn_show_cover" style="float:right" onclick="poster(\'' + cover_location + '\')"></button>';

        cover_content += '<div class="clickable" album_id="' + value.id + '" cover_loc="' + cover_location + '">' + value.name + '<br/>';
        if (value.year !== 0 && value.year !== "") {
            cover_content += '<span style="color:#000099; font-style:italic; font-size:11px;">' + value.author + ' (' + value.year + ')</span>';
        } else {
            cover_content += '<span style="color:#000099; font-style:italic; font-size:11px;">' + value.author + '</span>';
        }

        if (value.update_ts !== undefined && sort_type === "update_ts") {
            upd_human_date = fancyDate(new Date(Date.parse(value.update_ts)));
            cover_content += '<br/><span style="color:#C60419; font-style:italic; font-size:10px;">' + upd_human_date + '</span>';
        }

        cover_content += "</div>";
        cover_content += '</li>';

        $('#covers-list').append(cover_content);
    });
    $('#covers-list').listview('refresh');
}

function play_song(url) { // eslint-disable-line no-unused-vars
  window.open(url, '_system');
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
            if (song.spotify !== undefined) {
              song_header += '<button class="ui-btn ui-icon-audio ui-btn-icon-notext ui-corner-all ui-mini ui-btn-inline ui-btn-b" style="float:right" onclick="play_song(\'' + song.spotify + '\')"></button>';
            }
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

    var covers;

    if (current_covers === undefined || current_covers === "") {
      current_covers = JSON.parse(storage.getItem("covers_storage"));
    }

    if (current_covers === undefined || current_covers === "") {
      return false;
    }

    //console.info(current_covers);

    if (DEBUG) { console.info("Sort type current: " + sort_type + " --- Sort type passe: " + s_type); }

    if (sort_type !== s_type) {
        sort_order = 1;
    } else {
        sort_order *= -1;
    }

    if (DEBUG) { console.info("Sort type: " + sort_type + " --- Sort order: " + sort_order); }

    sort_type = s_type;
    $("#cover_search").val("");

    if (sort_type === "avg_vote") {
        current_covers.covers.sort(function (a, b) {
            if (parseFloat(a[sort_type]) > parseFloat(b[sort_type])) {
                return (sort_order * -1);
            }
            if (parseFloat(a[sort_type]) < parseFloat(b[sort_type])) {
                return sort_order;
            }
            return 0;
        });
    } else {
        current_covers.covers.sort(function (a, b) {
            if (a[sort_type] > b[sort_type]) {
                return (sort_order * -1);
            }
            if (a[sort_type] < b[sort_type]) {
                return sort_order;
            }
            return 0;
        });
    }
    setCovers(current_covers.covers);
}

/*
* GET COVERS
*/

function getCoversSuccess(data) { // eslint-disable-line no-unused-vars
    var response = JSON.parse(data);
    storage.setItem("covers_storage", JSON.stringify(response.payload));      // SAVE ON LOCALSTORAGE
    storage.setItem("covers_ts", new Date().getTime());
    setCacheInfo();
    //current_covers = response.payload.covers;
    current_covers = response.payload;

    if (response.payload.hasMore) {
      $("#album_list_footer").show();
    }

    sort_type = "";
    sort_covers("update_ts");

}

function getCoversFailure(err) { // eslint-disable-line no-unused-vars
    if (DEBUG) { console.error("Rosebud App============> " + err.responseText); }
}

function get_covers(limit) { // eslint-disable-line no-unused-vars

  if (icarusi_user === undefined || icarusi_user === "" || icarusi_user === null) {
      alert("You must be logged in for accessing covers!!");
      return false;
  }

  if (DEBUG) { console.info("Rosebud App============> Starting covers retrieving..."); }

  $("#album_list_footer").hide();

  if (limit === 15) {
    current_page = 1;
  }

  $("#cover_search_online").val("");

  var data = {
      "username": icarusi_user,
      "limit": limit,
      "method": "POST",
      "url": "/getcovers2",
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
    $("#spoty_url").val("");
    //$("#tracks-button").attr("src", "images/icons/cd-off.png");
    $("#title").val("");
    $("#author").val("");
    $("#year").val("");
    $("#pic").val("");
    $("spoty_url").val("");
    $("#spoti_img_url").val("");
    $("#spotify_api_url").val("");
    $("#spotify_album_url").val("");
    $("#spoty_url").val("");
    $("#upload_result").html("");
    $("#spoty_search").val("");
    $('#tracks-list').empty();
    $('#search-list').empty();
    $("#vote").val(5).slider("refresh");
    $("#review").val('');
    $("#pic").removeAttr('disabled');

    if (spotify_url_received !== undefined) {
      $("#spoty_url").val(spotify_url_received);
    }

    if (id !== 0) {
        var result = $.grep(current_covers.covers, function (element, index) { // eslint-disable-line no-unused-vars
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

        if (result.reviews !== undefined && result.reviews !== null && result.reviews[icarusi_user] !== undefined && result.reviews[icarusi_user] !== null) {
          $("#vote").val(result.reviews[icarusi_user].vote).slider("refresh");
          $("#review").val(result.reviews[icarusi_user].review);
        }

        $("#spotify_api_url").val(result.spotifyUrl);
        $("#spotify_album_url").val(result.spotifyAlbumUrl);
        $("#spoty_url").val(result.spotifyUrl);
        if (result.location !== "") {
          if (result.type === "local") {
            $("#cover_img").attr("src", device_app_path + "www/images/covers/" + result.location);
            $("#pic").attr('disabled', 'disabled');
          } else {
            $("#cover_img").attr("src", result.location);
          }
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
                    alert("Error: " + response.message);
                    return false;
                }
            } catch (err) {
                console.info("JSON parsing of upload cover response failed.");
                if (DEBUG) { console.info(JSON.stringify(response)); }
            }

            if (DEBUG) { console.info("Reloading covers..."); }
            get_covers(15);

            $("#title").val("");
            $("#author").val("");
            $("#year").val("");
            $("#pic").val("");
            $("#spoty_url").val("");
            storage.setItem("spotify_url_received", "");

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

function setTracks(tracks, tracks_list_obj) {

    $('#' + tracks_list_obj).empty();

    if (tracks.items.length === 0) {
        if (DEBUG) { console.info("Rosebud App============> No tracks found on Spotify."); }
        return false;
    }

    var tracks_header = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
    tracks_header += 'Found <span style="color:yellow">' + tracks.items.length + '</span> tracks';
    tracks_header += '</li>';
    $('#' + tracks_list_obj).append(tracks_header);

    if (tracks.items.length === 0) {
        $('#' + tracks_list_obj).append('<li style="white-space:normal;">No covers available</li>');
    }

    $.each(tracks.items, function (index, value) {
        var track_content = '<li style="white-space:normal">';
        track_content += value.name;
        track_content += '</li>';
        $('#' + tracks_list_obj).append(track_content);
    });
    $('#' + tracks_list_obj).listview('refresh');
    //$('#tracks_list_panel').trigger('updatelayout');

    $("#cover_page").trigger("updatelayout");
    $("#tracks_list_panel").panel("open");
}


function tracks_me(spotifyUrl){

  if (spotifyUrl !== "") {
    get_spotify({
        "action": "tracks-only",
        "url": spotifyUrl
      });
  }

}

function setSpotifySong(data) {
    data = JSON.parse(data);
    if (DEBUG) { console.info("Rosebud App============> " + data.images[0].url); }
    $("#id").val("0");
    $("#cover_img").attr("src", data.images[0].url);
    $("#spoti_img_url").val(data.images[0].url);
    $("#author").val(data.artists[0].name);
    $("#title").val(data.name);
    $("#year").val(data.release_date.split("-")[0]);
    $("#spotify_api_url").val(data.href);
    $("#spotify_album_url").val(data.external_urls.spotify);
    setTracks(data.tracks, "tracks-list");
    $("#cover_img").show();
}

function setSpotifyTracks(data) {
    data = JSON.parse(data);
    setTracks(data.tracks, "tracks-list");
}

function setSpotifyTracksNew() {
    data = JSON.parse(storage.getItem('album_data'));
    setTracks(data.tracks, "tracks-list");
}

function saveAlbumData(data){
  storage.setItem("album_data", JSON.stringify(data));
}

function spotyFailure(err) {
  if (DEBUG) { console.error("Rosebud App============> " + err.responseText); }
  alert(JSON.parse(err.responseText).message);
}

function get_spotify(fn_data) {
    if (DEBUG) { console.info("Rosebud App============> " + JSON.stringify(fn_data)); }

    var data,
        successCB = setSpotifyTracks,
        spoty_url;

    if (fn_data.url === "" || fn_data.url === undefined) {
       spoty_url = $("#spoty_url").val();
    } else {
      spoty_url = fn_data.url;
    }

    if (spoty_url === "") {
      alert("Spotify Url is blank!");
      return false;
    }


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
    if (DEBUG) { console.info("Rosebud App============> " + JSON.stringify(data)); }
    encrypt_and_execute(getX(), "kanazzi", data);
}

function set_album(url) {  // eslint-disable-line no-unused-vars
  $("#spoty_url").val(url);
  get_spotify({
      'action':'all'
  });
}

function spotySearchSuccess(data) {

  $('#search-list').empty();

  if (data.payload.length === 0) {
      if (DEBUG) { console.info("Rosebud App============> No tracks found on Spotify."); }
      return false;
  }

  var tracks_header = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
  tracks_header += 'Found <span style="color:yellow">' + data.payload.length + '</span> items';
  tracks_header += '</li>';
  $('#search-list').append(tracks_header);

  if (data.payload.length === 0) {
      $('#search-list').append('<li style="white-space:normal;">No results</li>');
  }

  $.each(data.payload, function (index, value) {
      var album_item = '<li style="white-space:normal">';
      album_item += value.name + "<br/>";
      album_item += value.author + " (" + value.year + ")";
      album_item += '<button class="ui-btn ui-icon-arrow-r ui-btn-icon-notext ui-corner-all ui-mini ui-btn-inline" style="float:right" onclick="set_album(\'' + value.url + '\')"></button>';
      album_item += '</li>';
      $('#search-list').append(album_item);
  });
  $('#search-list').listview('refresh');

}

function search_spotify(fn_data) {
    if (DEBUG) { console.info("Rosebud App============> " + JSON.stringify(fn_data)); }

    var data,
        //successCB = setSpotifySong,
        spoty_search;

    spoty_search = $("#spoty_search").val();

    if (spoty_search === "") {
      alert("Spotify Search is blank!");
      return false;
    } else if (spoty_search.lenght < 5) {
      alert("Spotify Search minimum size is 5 characters!");
      return false;
    }

    data = {
      "username": icarusi_user,
      "query": spoty_search,
      "search_type": 'track',
      "method": "POST",
      "url": "/spotifysearch",
      "cB": generic_json_request_new,
      "successCb": spotySearchSuccess,
      "failureCb": spotyFailure
    };
    if (DEBUG) { console.info("Rosebud App============> " + JSON.stringify(data)); }
    encrypt_and_execute(getX(), "kanazzi", data);
}

/*
 * SHOW ME MORE
 */

function show_me_more() {

    $("#album_list_footer").hide();

    //var search = $("#cover_search_online").val().trim();
    var search = $("#cover_search_online").val();
    current_page += 1;

    if (search.trim() === "" || search.trim().length < 3) {
      //append_mode = true;   // not used
      get_covers(15 * current_page);
    } else {
      // SEARCH CASE
      var data = {
        "username": icarusi_user,
        "rosebud_uid": rosebud_uid,
        "search": search,
        "limit": 15 * current_page,
        "method": "POST",
        "url": "/localsearch2",
        "cB": generic_json_request_new,
        "successCb": getCoversSuccess,
        "failureCb": getCoversFailure
      };
      encrypt_and_execute(getX(), "kanazzi", data);
  }
}


  /*
  * CORDOVA ON DEVICE onDeviceReady
  */

function onDeviceReady() { // eslint-disable-line no-unused-vars

    icarusi_user = storage.getItem("icarusi_user");
    rosebud_uid = storage.getItem("rosebud_uid");
    covers_storage = storage.getItem("covers_storage");
    device_app_path = cordova.file.applicationDirectory;
    var spotify_url_received = get_ls("spotify_url_received");
    if (spotify_url_received !== undefined) {
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
        be_selector = get_ls("be-selector");

    if (be_selector !== "") {
      BE_URL = be_selector;
    }

    $("#poster_pic").attr("src", "images/loading.gif");
    $("#connection").html("");
    $("#random_song_message").html("");

    cordova.getAppVersion.getVersionNumber().then(function (version) {
        $('#version').html(" " + version);
        storage.setItem("app_version", version);
    });

    if (networkState === Connection.NONE) {
        $("#connection").html("No network... Pantalica mode...");
    }

    if (power_user.includes(icarusi_user)) {
        $("#sabba_info").html(BE_URL);
    }

    if (networkState === Connection.NONE) {
        $("#connection").html("No network... Pantalica mode...");

        $("#random_song_message").html("No Random Song available<br/>on Pantalica mode! ;)");

        if (icarusi_user !== "" && covers_storage !== "" && covers_storage !== undefined && covers_storage !== null) {
            console.info("Rosebud App============> NO NETWORK -> Cached Covers loading");
            sort_covers("update_ts");
        }

    } else {

        encryptText2(getX(), "get_song");
        get_covers(15);

        /* Disabling cache in case of connection */
        /*
        if (old_ts !== "" && old_ts !== null && old_ts !== undefined) {

            new_ts = new Date().getTime();
            diff = new_ts - old_ts;
            diff_sec = diff / 1000;

            if (icarusi_user !== "" && diff_sec < 86400 && covers_storage !== "" && covers_storage !== undefined && covers_storage !== null) {
                if (DEBUG) { console.info("Rosebud App============> CACHE AVAILABLE AND NOT EXPIRED -> Cached Covers loading"); }
                sort_covers("update_ts");
            } else {
                get_covers(15);
            }
        } else {
            get_covers(15);
        }
        */
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

    /*
    * LOCAL SEARCH
    */

    $('#cover_search').on('change', function () {
        var search = $("#cover_search").val();
        if (search.length === 0) {
            sort_covers(sort_type);
            return false;
        }
    });

    $("#cover_search").bind("input", function () {
        var search = $("#cover_search").val(),
            result = current_covers.covers;

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

    /*
    * REMOTE SEARCH
    */

    /*
    $('#cover_search_online').on('change', function () {
        var search = $("#cover_search_online").val();
    });
    */

    $("#cover_search_online").bind("input", function () {
        var search = $("#cover_search_online").val(),
            result;

        if (search.trim() === "" || search.trim().length < 3) {
          return false;
        }

        if (networkState === Connection.NONE) {

          result = $.grep(result, function (element, index) { // eslint-disable-line no-unused-vars
              return (
                  (element.year.toString() === search) ||
                  (element.name.toUpperCase().indexOf(search.toUpperCase()) >= 0) ||
                  (element.author.toUpperCase().indexOf(search.toUpperCase()) >= 0)
              );
          });
          setCovers(result);

        } else {

          current_page = 1;
          $("#album_list_footer").hide();   // Hide more button TO BE FIXED

          var data = {
            "username": icarusi_user,
            "search": search,
            "method": "POST",
            "url": "/localsearch2",
            "cB": generic_json_request_new,
            "successCb": getCoversSuccess,
            "failureCb": getCoversFailure
          };
          encrypt_and_execute(getX(), "kanazzi", data);
      }
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

    $(document).on("click", "#send_comment_btn", function () {
        encryptText2(getX(), "send_comment");
    });

    $(document).on("click", "#btn_show_more_album", function () {
        show_me_more();
    });

    $(document).on("click", ".clickable", function () {
      //edit_cover($(this).attr('album_id'));
      //poster($(this).attr('cover_loc'));
      setComments($(this).attr('album_id'));
    });

    $(document).on("click", "#spoty_btn", function () {
        get_spotify({
            'action':'all'
        });
    });

    $(document).on("click", "#spoty_btn_search", function () {
        search_spotify({
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
