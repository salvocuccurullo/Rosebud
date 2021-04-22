/*global $, cordova, document, window, DEBUG, BE_URL, alert */
/*global loading, get_ls_bool, fancyDate, PhotoViewer, device, FormData */
/*global device, Connection, storage, navigator, swipeleftHandler, swipeRightHandler, send_comment */
/*global get_ls, json_request, refreshToken */
/*eslint no-global-assign: "error"*/
/*eslint no-console: ["error", { allow: ["info","warn", "error"] }] */
/*eslint no-global-assign: "error"*/
/*globals BE_URL:true*/

"use strict";

var storage = window.localStorage,
    icarusi_user = "",
    rosebud_uid = "",
    swipe_left_target = "index.html", // eslint-disable-line no-unused-vars
    swipe_right_target = "geofriends.html", // eslint-disable-line no-unused-vars
    DEBUG = false,
    device_app_path = "",
    sort_type = "update_ts",
    sort_order = -1,
    current_covers = "",
    curr_file_size = 0,
    curr_cover_id = "",
    current_page = 1,
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

function setComments(id) { // eslint-disable-line no-unused-vars

  if (id !== 0) {
      var item = $.grep(current_covers.covers, function (element, index) { // eslint-disable-line no-unused-vars
          return (element.id === id);
      }),
      comments_count = 0,
      content,
      header_content;
      //upd_human_date;

      if (DEBUG) {
          console.info("==========================");
          console.info("Retrieving comments of album with id " + id);
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

    $("#spoti_img").attr("onclick", "");
    $("#spoti_img").attr("src", "images/icons/spoti-icon-gray.png");
    $("#tracks-button-edit").attr("onclick", "");
    $("#tracks-button-edit").attr("src", "images/icons/cd-off.png");

    if (DEBUG) { console.info("Rosebud App============> " + item.name + " ** " + item.author + " ** "); }

    if (item.type === "local") {
      content = '<img style="padding:10px; width:85%" id="album_p" src="' + device_app_path + "www/images/covers/" + item.location + '" onerror="set_fallback_image()"/>';
    } else {
      content = '<img style="padding:10px; width:85%" id="album_p" src="' + item.location + '" onerror="set_fallback_image()"/>';
    }
    $("#album_data").html(content);

    if (item.spotifyAlbumUrl !== "" && item.spotifyAlbumUrl !== undefined) {
      $("#spoti_img").attr("onclick", "play_song('" + item.spotifyAlbumUrl + "')");

      if (item.spotifyAlbumUrl.includes("youtube")) {
        $("#spoti_img").attr("src", 'images/icons/youtube-icon.png');
      } else {
        $("#spoti_img").attr("src", 'images/icons/spoti-icon.png');
      }
    }

    $("#edit-button").attr("onclick", "edit_cover('" + item.id + "')");
    if (item.spotifyUrl !== "" && item.spotifyUrl !== undefined) {
      $("#tracks-button-edit").attr("onclick", "tracks_me('" + item.spotifyUrl + "', 'edit_page')");
      $("#tracks-button-edit").attr("src", "images/icons/cd-on.png");
    }

    $("#top_title_comments").html(item.name + "<br/>" + item.author + " (" + item.year + ")");
    $('#album_comments').empty();

    if (DEBUG) { console.info("Rosebud App============> " + JSON.stringify(item.reviews)); }

    var my_reviews = [];
    if (item.reviews !== null && item.reviews !== undefined) {
      my_reviews = item.reviews;
    }

    $.each(my_reviews, function (index, value) { // eslint-disable-line no-unused-vars

        var upd_human_date = fancyDate(new Date(Date.parse(value.updated)));

        content = '<li style="white-space:normal;">';
        if (value.review !== "") {
            comments_count += 1;
        }

        if (value.vote === -1) {
          content += '<b>' + value.username + '</b> <span style="color:red; float:right">no vote</span>';
        } else {
          content += '<b>' + value.username + '</b> <span style="color:red; float:right">' + value.vote + '</span>';
        }
        content += '<br/><p style="white-space:normal; font-style:italic; font-size:12px">' + value.review + '</p>';
        content += '<span style="color:#C60419; font-style:italic; font-size:10px; float:right">' + upd_human_date + '</span>';
        content += '</li>';
        $('#album_comments').append(content);
    });

    header_content = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
    header_content += '<span style="color:yellow">' + comments_count + ' comment(s) / ' + Object.keys(my_reviews).length + ' vote(s)</span></li>';
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
            cover_content;
            //upd_human_date;

        if (value.type === undefined || value.type === "local") {
            cover_location = device_app_path + "www/images/covers/" + value.location;
        } else {
            cover_location = (value.thumbnail === "" || value.thumbnail === null)   // eslint-disable-line no-ternary
                              ? value.location
                              : value.thumbnail;
        }

        cover_content = '<li style="background-image: url(' + cover_location + '), url(' + cordova.file.applicationDirectory + 'www/images/loading.gif);';
        cover_content += ' background-repeat: no-repeat; background-position: center left; padding: 10px 10px 10px 65px;';
        cover_content += ' background-size: 48px 48px; background-position: 5px 5px; background-color:white; white-space:normal;" >';

        if (value.spotifyUrl !== "" && value.spotifyUrl !== undefined) {
          cover_content += '<button style="float:right; border: none; padding:0; background:none" onclick="tracks_me(\'' + value.spotifyUrl + '\', \'albums_page\')">';
          cover_content += '<img src="images/icons/cd-on.png" style="width:24px; height:24px; margin-top:5px"/></button>';
        }

        cover_content += '<div class="clickable" album_id="' + value.id + '" cover_loc="' + cover_location + '">' + value.name + '<br/>';
        if (value.year !== 0 && value.year !== "") {
            cover_content += '<span style="color:#000099; font-style:italic; font-size:11px;">' + value.author + ' (' + value.year + ')</span>';
        } else {
            cover_content += '<span style="color:#000099; font-style:italic; font-size:11px;">' + value.author + '</span>';
        }
        /*
        if (value.update_ts !== undefined && sort_type === "update_ts") {
            upd_human_date = fancyDate(new Date(Date.parse(value.update_ts)));
            //cover_content += '<br/><span style="color:#C60419; font-style:italic; font-size:10px;">' + upd_human_date + '</span>';
        }
        */
        cover_content += "</div>";
        cover_content += '</li>';

        $('#covers-list').append(cover_content);
    });
    $('#covers-list').listview('refresh');
}

function play_song(url) { // eslint-disable-line no-unused-vars
  window.open(url, '_system');
}


function getSongSuccess(data) {

  $("#lyrics-list").empty();

  if (data.payload.message === "song not found" || data.payload.message === "not valid id") {
      $('#lyrics-list').append('<li style="white-space:normal;">Song not found ;(</li>');
      return;
  }

  //if (DEBUG) { console.info("Retrieved song data:" + JSON.stringify(data)); }
  var song = data.payload.message,
      song_header = '';

  if (DEBUG) { console.info("Retrieved song data:" + song.title + " - " + song.author); }
  song_header = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
  if (song.spotify !== undefined) {
    song_header += '<a href="#" id="spoty_album_go" data-role="button" data-inline="true" data-iconpos="right" data-mini="true" onclick="play_song(\'' + song.spotify + '\')">';
    song_header += '<img src="images/icons/spoti-icon.png" style="width:24px; heigh:24px; float:right; margin-top:5px; margin-left:10px"/>';
    song_header += '</a>';
  }
  song_header += '<button class="ui-btn ui-icon-refresh ui-btn-icon-notext ui-corner-all ui-mini ui-btn-inline ui-btn-b" style="margin-top:5px; float:right" onclick="get_song()"></button>';
  song_header += '<span style="color:yellow">' + song.title + '</span><br/>' + song.author + '</li>';
  $('#lyrics-list').append(song_header);

  if (song.lyrics.length === 0) {
      $('#lyrics-list').append('<li style="white-space:normal;">No lyrics available for this song</li>');
  }

  $.each(song.lyrics, function (index, value) {
      $('#lyrics-list').append('<li style="white-space:normal;">' + value.text + '</li>');
  });

  $('#lyrics-list').listview('refresh');

}


function getSongFailure(err) {
  console.info("Error while retrieving random song: " + err);
  $("#song_content").html("Error during song loading... Please, retry later...");
}


function get_song() { // eslint-disable-line no-unused-vars

    var data = {
        "method": "POST",
        "url": "/randomSong",
        "successCb": getSongSuccess,
        "failureCb": getSongFailure
      };
    json_request(data);

}

function sort_covers(s_type) {

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
    var response = data;
    storage.setItem("covers_storage", JSON.stringify(response.payload.payload));      // SAVE ON LOCALSTORAGE
    storage.setItem("covers_ts", new Date().getTime());
    setCacheInfo();
    current_covers = response.payload.payload;

    if (response.payload.payload.hasMore) {
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
      "limit": limit,
      "method": "POST",
      "url": "/getcovers2",
      "second_collection": get_ls_bool("second-collection", false),
      "successCb": getCoversSuccess,
      "failureCb": getCoversFailure
    };
  json_request(data);
}

/*
* EDIT Cover, NEW Cover and Show Cover
*/

function edit_cover(id) { // eslint-disable-line no-unused-vars

    var spotify_url_received = get_ls("spotify_url_received"),
        vote = 0;

    $(':mobile-pagecontainer').pagecontainer('change', '#cover_page');

    $("#cover_img").show();
    $("#cover_img").attr("src", "");
    $("#back-button-edit-page").attr("href", "#comments_page");
    $("#top_title_edit_album").html("New Album");
    $("#tooltip-new-cover").hide();
    $("#spoty_btn_search").prop('disabled', true).addClass('ui-disabled');
    $("#spoty_search").prop("readonly", "readonly");
    $("#spoty_btn").hide();
    $("#top_title_tracks_album").html("");
    $("#spoty_url").val("");
    $("#rosebud_uid").val(rosebud_uid);
    $("#device_uid").val(device.uuid);

    if (id === 0) {
        $("#cover_img").hide();
        $("#tooltip-new-cover").show();
        $("#back-button-edit-page").attr("href", "#song_page");
        $("#spoty_btn_search").prop('disabled', false).removeClass('ui-disabled');
        $("#spoty_search").removeProp("readonly");
        $("#spoty_btn").show();
        if (spotify_url_received !== undefined) {
          $("#spoty_url").val(spotify_url_received);
        }

    }
    //$("#tracks-button").attr("src", "images/icons/cd-off.png");
    $("#title").val("");
    $("#author").val("");
    $("#year").val("");
    $("#pic").val("");
    $("spoty_url").val("");
    $("#spoti_img_url").val("");
    $("#spotify_api_url").val("");
    $("#spotify_album_url").val("");
    $("#upload_result").html("");
    $("#spoty_search").val("");
    $('#spoti-list').empty();
    $("#vote").val(5).slider("refresh");
    $("#review").val('');
    $("#pic").removeAttr('disabled');
    $("#nl").prop("checked", false).checkboxradio("refresh");

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
        $("#top_title_edit_album").html('<span style="color:#000000">Edit: </span>' + result.name);

        if (result.reviews !== undefined && result.reviews !== null && result.reviews[icarusi_user] !== undefined) {
          vote = result.reviews[icarusi_user].vote;
          $("#review").val(result.reviews[icarusi_user].review);

          if (vote === -1) {
            $("#nl").prop("checked", true).checkboxradio("refresh");
          } else {
            $("#vote").val(result.reviews[icarusi_user].vote).slider("refresh");
          }

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
        /*
        if (result.spotifyUrl !== "") {
          get_spotify({
              "action": "album-only",
              "url": result.spotifyUrl
            });
        }
        */
        if (DEBUG) { console.info("cover img src: " + $("#cover_img").attr("src")); }
        curr_cover_id = result.id;
    } else {
        $("#id").val("0");
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
    $("#second_collection").val(get_ls_bool("second-collection", false));

    if ($("#nl").prop("checked")) {
      $("#vote").val("-1");
    }

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

function set_fallback_image() { // eslint-disable-line no-unused-vars
    $("#cover_img").attr("src", device_app_path + "www/images/no-image-available.jpg");
}


/*
* SPOTIFY FUNCTIONS
*/

function setTracks(tracks, tracks_list_obj, source) {

    if (tracks.items.length === 0) {
        alert("No tracks found on Spotify!");
        return false;
    }

    if (source === "xxx") {
      $(':mobile-pagecontainer').pagecontainer('change', '#list_page');
    }

    $('#' + tracks_list_obj).empty();
    //$("#top_title_tracks_album").html("");

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
    $("#cover_page").trigger("updatelayout");
    //$("#tracks_list_panel").panel("open");
}


function tracks_me(spotifyUrl, source) { // eslint-disable-line no-unused-vars

  if (source === "albums_page") {
   $("#back_button_list_page").attr("href", "#song_page");
  } else {
   $("#back_button_list_page").attr("href", "#comments_page");
  }

  if (spotifyUrl !== "") {
    get_spotify({
        "action": "tracks-only",
        "url": spotifyUrl
      });
  }

}

function setSpotifyAlbum(data) {
    data = data.payload;
    if (DEBUG) { console.info("Rosebud App============> " + data.images[0].url); }
    $("#id").val("0");
    $("#cover_img").attr("src", data.images[0].url);
    $("#spoti_img_url").val(data.images[0].url);
    $("#author").val(data.artists[0].name);
    $("#title").val(data.name);
    $("#year").val(data.release_date.split("-")[0]);
    $("#spotify_api_url").val(data.href);
    $("#spotify_album_url").val(data.external_urls.spotify);
    if (data.images[2].url !== undefined) {
      $("#thumbnail").val(data.images[2].url);
    }
    $("#cover_img").show();

    $("#back_button_list_page").attr("href", "#cover_page");
    $(':mobile-pagecontainer').pagecontainer('change', '#cover_page');

}

function setSpotifyTracks(data) {
    data = data.payload;
    $("#top_title_tracks_album").html(data.name + " <br/> " + data.artists[0].name + " (" + data.release_date.split("-")[0] + ")");
    setTracks(data.tracks, "spoti-list", "xxx");
}

function setBothTracksAlbums(data) {
    data = data.payload;
    setSpotifyAlbum(data);
    setTracks(data.tracks, "spoti-list", "yyy");
}

/*
function setAlbumOnly(data) {
    data = JSON.parse(data);
    setSpotifyAlbum(data);
}
*/

function spotyFailure(err) {
  if (DEBUG) { console.error("Rosebud App============> " + err.responseText); }
  alert(JSON.parse(err.responseText).message);
}

function get_spotify(fn_data) {
    if (DEBUG) { console.info("Rosebud App============> " + JSON.stringify(fn_data)); }

    var data,
        successCB = setSpotifyAlbum,
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
    } else if (fn_data.action === 'both') {
      successCB = setBothTracksAlbums;
      spoty_url = fn_data.url;
    } /* else if (fn_data.action === 'album-only') {
      successCB = setAlbumOnly;
      spoty_url = fn_data.url;
    } */

    data = {
      "album_url": spoty_url,
      "method": "POST",
      "url": "/spotify",
      "successCb": successCB,
      "failureCb": spotyFailure
    };
    if (DEBUG) { console.info("Rosebud App============> " + JSON.stringify(data)); }
    json_request(data);
}

function set_album(url) {  // eslint-disable-line no-unused-vars
  $("#spoty_url").val(url);
  get_spotify({
      'action':'album_only'
  });
}

function spotySearchSuccess(data) {

  if (data.payload.payload.length === 0) {
      if (DEBUG) { console.info("Rosebud App============> No tracks found on Spotify."); }
      alert("No albums found on Spotiy! Change your search query and try again...");
      return false;
  }

  $(':mobile-pagecontainer').pagecontainer('change', '#list_page');
  $("#back_button_list_page").attr("href", "#cover_page");
  $('#spoti-list').empty();

  var tracks_header = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
  tracks_header += 'Found <span style="color:yellow">' + data.payload.payload.length + '</span> albums on Spotify';
  tracks_header += '</li>';
  $('#spoti-list').append(tracks_header);

  if (data.payload.payload.length === 0) {
      $('#spoti-list').append('<li style="white-space:normal;">No results</li>');
  }

  $.each(data.payload.payload, function (index, value) {
      var album_item = '<li style="white-space:normal">';

      album_item += '<div style:"display:table">';

      album_item += '<span style="vertical-align: middle; display: table-cell;"><button style="border: none; padding:0; background:none; margin-right:10px" onclick="set_album(\'' + value.url + '\')">';
      album_item += '<img src="images/icons/import-icon.png" style="width:24px; height:24px; margin-top:5px"/></button></span>';

      album_item += '<span style="vertical-align: middle; display: table-cell;">' + value.name + " - ";
      album_item += value.author + " (" + value.year + ")</span>";

      album_item += '</div>';
      album_item += '</li>';
      $('#spoti-list').append(album_item);
  });
  $('#spoti-list').listview('refresh');
  //$("#album_list_panel").panel("open");

}

function search_spotify(fn_data) {
    if (DEBUG) { console.info("Rosebud App============> " + JSON.stringify(fn_data)); }

    var data,
        //successCB = setSpotifyAlbum,
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
      "query": spoty_search,
      "search_type": 'track',
      "method": "POST",
      "url": "/spotifysearch",
      "successCb": spotySearchSuccess,
      "failureCb": spotyFailure
    };
    if (DEBUG) { console.info("Rosebud App============> " + JSON.stringify(data)); }
    json_request(data);
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
        "second_collection": get_ls_bool("second-collection", false),
        "successCb": getCoversSuccess,
        "failureCb": getCoversFailure
      };
      json_request(data);
  }
}

/*
*   REFRESH TOKEN OVERRIDES
*/

function refreshTokenSuccessCB(data) { // eslint-disable-line no-unused-vars

  if (DEBUG) { console.info(data); }

  get_song();
  get_covers(15);

  }

function refreshTokenFailureCB(err) { // eslint-disable-line no-unused-vars
  if (DEBUG) { console.info("Rosebud App============> Error during refresh token retrieving"); }
  if (DEBUG) { console.info("Rosebud App============> " + err.responseText); }
}


  /*
  * CORDOVA ON DEVICE onDeviceReady
  */

function onDeviceReady() { // eslint-disable-line no-unused-vars

    icarusi_user = storage.getItem("icarusi_user");
    rosebud_uid = storage.getItem("rosebud_uid");
    covers_storage = storage.getItem("covers_storage");
    device_app_path = cordova.file.applicationDirectory;
    $("#second_collection").val(get_ls_bool("second-collection", false));

    window.plugins.intent.setNewIntentHandler(function (intent) { // eslint-disable-line no-unused-vars
        //console.info(JSON.stringify(intent));
        if (intent.clipItems !== undefined) {
           storage.setItem("spotify_url_received", intent.clipItems[0].text);
        } else {
          storage.setItem("spotify_url_received", "");
          $("#spoty_url").val("");
        }
    });

    var networkState = navigator.connection.type,
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

    if (networkState === Connection.NONE) {
        $("#connection").html("No network... Pantalica mode...");

        $("#random_song_message").html("No Random Song available<br/>on Pantalica mode! ;)");

        if (icarusi_user !== "" && covers_storage !== "" && covers_storage !== undefined && covers_storage !== null) {
            console.info("Rosebud App============> NO NETWORK -> Cached Covers loading");
            sort_covers("update_ts");
        }

    } else {

        refreshToken();
    }


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
            "second_collection": get_ls_bool("second-collection", false),
            "successCb": getCoversSuccess,
            "failureCb": getCoversFailure
          };
          json_request(data);
      }
    });

    $("#popupPhotoPortrait").bind({
        popupafterclose: function (event, ui) { // eslint-disable-line no-unused-vars
            if (DEBUG) { console.info("Rosebud App============> Closing popupPhotoPortrait Popup"); }
            $("#poster_pic").attr("src", "images/loading.gif");
        }
    });

    $(document).on("click", "#send_album_btn", function () {
        uploadCover();
    });

    $(document).on("click", "#send_comment_btn", function () {
        send_comment();
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
            'action':'album_only'
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
