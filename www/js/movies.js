/*global $, cordova, device, window, document, loading, alert, getX, generic_json_request_new, encrypt_and_execute*/
/*global encryptText2, navigator, Connection, BE_URL, PullToRefresh, get_ls_bool_default*/
/*global power_user, get_ls_bool, base_url_poster, PhotoViewer, fancyDate, confirm, FormData, power_user */
/*eslint no-console: ["error", { allow: ["info","warn", "error"] }] */

"use strict";

var storage = window.localStorage,
    icarusi_user = "",
    ct_movies = "",
    //tvshows = "",
    jsonTvShows = [],
    currentId = 0,
    kanazzi,
    DEBUG = true,
    top_movies_count = 20,
    sort_type = "datetime_sec",
    sort_order = 1,
    swipe_left_target = "carusi.html",
    swipe_right_target = "index.html",
    device_app_path = "",
    tv_shows_storage,
    tv_shows_storage_ts,
    curr_file_size = 0,
    curr_pic,
    lazy_load = get_ls_bool_default("lazy-load", true);

document.addEventListener('deviceready', this.onDeviceReady.bind(this), false); // eslint-disable-line no-unused-vars

function poster(img_name) { // eslint-disable-line no-unused-vars

    var final_pic_url,
        android_version;

    curr_pic = img_name;

    if (curr_pic !== "") {
        final_pic_url = base_url_poster + curr_pic;
    } else {
        final_pic_url = device_app_path + "www/images/no-image-available.jpg";
    }

    if (DEBUG) { console.info("Show poster called on " + final_pic_url); }

    android_version = device.version.split(".");

    if (parseInt(android_version[0], 10) < 5) {
        $("#poster_pic").attr("src", final_pic_url);
        $("#popupPhotoPortrait").popup('open');
    } else {
        PhotoViewer.show(final_pic_url, "");
    }
}

/***
 RESET POPUP DATA
***/

function resetPopupElements() {
    currentId = 0;
    $("#title").prop('readonly', false);
    $("#link").prop('readonly', false);
    $("#title").textinput("option", "clearBtn", true);
    $("#link").textinput("option", "clearBtn", true);
    $('#media').selectmenu('enable');
    $('#type').selectmenu('enable');
    $('#giveup').checkboxradio('disable');
    $("#title").val('');
    $("#link").val('');
    $("#curr_pic").val('');
    $('#media').val("").attr('selected', true).siblings('option').removeAttr('selected');
    $('#media').selectmenu('refresh', true);
    $('#type').val("").attr('selected', true).siblings('option').removeAttr('selected');
    $('#type').selectmenu('refresh', true);
    $("#the_votes_d").hide();
    $("#vote").val(5).slider("refresh");
    $("#send_movie_btn").text("Send...");
    $("#delete_movie_btn").addClass("ui-btn ui-state-disabled");
    $("#send_movie_btn").removeClass("ui-state-disabled");
    $("#pic").removeClass("ui-btn ui-state-disabled");
    $("#nw").prop("checked", false).checkboxradio("refresh");
    $("#giveup").prop("checked", false).checkboxradio("refresh");
    $("#later").prop("checked", false).checkboxradio("refresh");
    $("#season").val('');
    $("#episode").val('');
    $("#comment").val('');
    $("#curr_link").val('');
    $("#upload_result").html('');
    $("#pic").val(null);
    $('#users_votes').empty();
    $("#top_title").html('Add a new movie/serie...');
    $("#btn_link").show();
}


function setCacheInfo() {
    var show_info = get_ls_bool("show-extra-info");
    if (show_info) {

        tv_shows_storage = storage.getItem("tv_shows");
        tv_shows_storage_ts = storage.getItem("tv_shows_count_ts");

        if (tv_shows_storage !== "" && tv_shows_storage !== undefined && tv_shows_storage !== null) {
            $("#cache_info").html("TvShows cached " + JSON.parse(tv_shows_storage).length + " element(s) --- last update " + fancyDate(tv_shows_storage_ts));
        }
    }
}

 /***
    SET TV SHOWS
 ***/

function setTvShows(tvshows, votes_user) {

    loading(true, 'Rendering movies...');

    if (DEBUG) {
        console.info("iCarusi App============> SetTvShows called");
        console.info(JSON.stringify(tvshows));
    }

    $("#movies-list").empty();
    $("#movies-list_r4").empty();
    $("#movies-list_nw").empty();
    $('#top-list-voters').empty();
    $('#top-list-movies').empty();

    setCacheInfo();

    if (tvshows.length === 0) {
        $('#movies-list').append('<li style="white-space:normal;">No Movies/Series available</li>');
    }

    var bnc = 0,
        r4c = 0,
        header_content = '',
        content = '',
        count;

    if (sort_type === "avg_vote") {
        tvshows.sort(function (a, b) {
            if (parseFloat(a[sort_type]) > parseFloat(b[sort_type])) {
                return (sort_order * -1);
            }
            if (parseFloat(a[sort_type]) < parseFloat(b[sort_type])) {
                return sort_order;
            }
            return 0;
        });
    } else {
        tvshows.sort(function (a, b) {
            if (a[sort_type] > b[sort_type]) {
                return (sort_order * -1);
            }
            if (a[sort_type] < b[sort_type]) {
                return sort_order;
            }
            return 0;
        });
    }

    $.each(tvshows, function (index, value) { // eslint-disable-line no-unused-vars

        var comment_count = 0,
            content_nw = '',
            at_least_one_nw = false,
            name = '',
            epi = '',
            season = '',
            users_votes_keys,
            comment = '';

        content = '<li style="white-space:normal;">';

        jsonTvShows[value.id] = value;

        if (value.avg_vote === 0) {
            content += '<b>' + value.title + '</b> <span style="color:#C60419; float:right"> [ N/A ]</span>';
        } else {
            content += '<b>' + value.title + '</b> <span style="color:#C60419; float:right"> [ ' + value.avg_vote + ' ]</span>';
        }

        // NW SECTION
        content_nw = '<li style="white-space:normal;">';
        content_nw += '<a data-transition="slide" href="javascript:setPopupData(' + value.id + ',\'nw\')">';
        content_nw += '<b>' + value.title + '</b> <br/>';
        content_nw += '<span style="color:#000099; font-style:italic; font-size:11px;">';

        users_votes_keys = Object.keys(value.u_v_dict);
        $.each(users_votes_keys, function (index1, value1) { // eslint-disable-line no-unused-vars

            comment = value.u_v_dict[value1].comment;
            if (comment !== "") {
                comment_count += 1;
            }

            if (value.u_v_dict[value1].now_watching) {
                at_least_one_nw = true;
                name = value.u_v_dict[value1].us_name;
                epi = value.u_v_dict[value1].episode;
                season = value.u_v_dict[value1].season;
                content_nw += "[" + name + ' S' + season + 'E' + epi + ']&nbsp;&nbsp;';
            }
        });
        content_nw += '</span>';
        content_nw += '</a>';
        content_nw += '</li>';
        // END NW SECTION

        content += '<br/><span style="text-align:right; font-size:10px;">Added on ' + value.datetime + ' by </span>';
        content += '<span style="color:#000099; font-style:italic; font-size:10px;">' +  value.username + '</span>';

        if (sort_type === "media") {
            content += '<br/><span style="color:#000099; font-style:italic; font-size:10px;">' +  value.media + '</span>';
        }
        // ICONS BLOCK -------------------------
        content += '<span style="color:#C60419; float:right">';

        // PICTURE ICON
        if (value.poster !== "") {
            content += '<button class="ui-btn ui-icon-camera ui-btn-icon-notext ui-corner-all ui-mini ui-btn-inline" id="btn_show_poster" onclick="poster(\'' + value.poster + '\')"></button>';
        }

        // EDIT ICON
        content += '<button class="ui-btn ui-icon-edit ui-btn-icon-notext ui-mini ui-corner-all ui-btn-inline" id="btn_show_poster" onclick="setPopupData(\'' + value.id + '\',\'a\')"></button>';

        // LINK ICON
        if (value.link !== "") {
            content += '<button class="ui-btn ui-btn-icon-notext ui-icon-forward ui-mini ui-corner-all ui-btn-inline" data-theme="a" id="btn_link" onclick="javascript:open_link(\'' + value.link + '\')"></button>';
        }

        // COMMENT ICON
        if (comment_count > 0) {
            content += '<button class="ui-btn  ui-mini ui-corner-all ui-btn-inline" data-theme="e" onclick="setComments(\'' + value.id + '\',\'c\')">' + comment_count + '</button>';
        }

        content += '</span><br/>';
        // END ICONS BLOCK ---------------------------

        content += '</li>';

        if (at_least_one_nw) {
            $('#movies-list_nw').append(content_nw);
        }

        if (value.type === 'r4') {
            $('#movies-list_r4').append(content);
            r4c += 1;
        } else {
            $('#movies-list').append(content);
            bnc += 1;
        }
    });

    header_content = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
    header_content += '<span style="color:yellow"> ' + bnc + ' </span>movies found.';
    header_content += '</li>';
    $('#movies-list').prepend(header_content);

    header_content = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
    header_content += '<span style="color:yellow"> ' + r4c + ' </span>movies found.</li>';
    $('#movies-list_r4').prepend(header_content);

    header_content = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
    header_content += '<span style="color:yellow">Currently ongoing...</span></li>';
    $('#movies-list_nw').prepend(header_content);

    // For the top chart force sorting by avg_vote
    tvshows.sort(function (a, b) {
        if (parseFloat(a.avg_vote) > parseFloat(b.avg_vote)) {
            return -1;
        }
        if (parseFloat(a.avg_vote) < parseFloat(b.avg_vote)) {
            return 1;
        }
        return 0;
    });

    header_content = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
    header_content += 'Top<span style="color:yellow"> ' + top_movies_count + ' </span>movies</li>';
    $('#top-list-movies').append(header_content);

    count = 0;
    $.each(tvshows, function (index, value) { // eslint-disable-line no-unused-vars
        if (count === top_movies_count) {
             return false;
        }
        content = '<li style="white-space:normal;">';
        if (value.avg_vote !== 0) {
            content += '<b>' + value.title + '</b> <span style="color:red; float:right">' + value.avg_vote + '</span>';
        } else {
            content += '<b>' + value.title + '</b> <span style="color:red; float:right">N/A</span>';
        }
        content += '</li>';
        $('#top-list-movies').append(content);
        count += 1;
    });

    header_content = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
    header_content += '<span style="color:yellow"> Top Voters </span></li>';
    $('#top-list-voters').append(header_content);

    votes_user = votes_user.sort(function (a, b) {
        return a.count < b.count;
    });

    $.each(votes_user, function (index, value) { // eslint-disable-line no-unused-vars
        content = '<li style="white-space:normal;">';
        content += '<b>' + value.name + '</b> <span style="color:red; float:right">' + value.count + '</span>';
        content += '</li>';
        $('#top-list-voters').append(content);
    });

    $('#movies-list').listview('refresh');
    $('#movies-list_r4').listview('refresh');
    $('#movies-list_nw').listview('refresh');
    $('#top-list-voters').listview('refresh');
    $('#top-list-movies').listview('refresh');
    checkMoviesCT();

    loading(false, '');
}

function sort_movies() {
    sort_order *=  -1;

    var tvshows = storage.getItem("tv_shows"),      // GET FROM LOCALSTORAGE
        votes_user = storage.getItem("votes_user");

    $("#movie_search").val("");
    if (tvshows !== "" && tvshows !== undefined && tvshows !== null && votes_user !== "" && votes_user !== undefined && votes_user !== null) {
        setTvShows(JSON.parse(tvshows), JSON.parse(votes_user));
    }
}

function tvShowsNewSuccess(data) {

    if (DEBUG) { console.info(JSON.stringify(data)); }

    var tvshows = data.payload.tvshows,
        votes_user = [];

    if (data.payload.query === "") {
        storage.setItem("tv_shows", JSON.stringify(tvshows));       // SAVE ON LOCALSTORAGE
        storage.setItem("tv_shows_count_ts", new Date().getTime());
        storage.setItem("votes_user", JSON.stringify(votes_user));
        setCacheInfo();
    }

    setTvShows(tvshows, votes_user);
}

function tvShowsNewFailure(data) {

    if (DEBUG) { console.info(JSON.stringify(data)); }
    alert(data.message);

}

function getTvShows(use_cache) {

    if (icarusi_user === undefined || icarusi_user === "" || icarusi_user === null) {
        alert("You must be logged in for accessing movies!!");
        return false;
    }

    if (!use_cache) {

        var data = {"username": icarusi_user,
            "firebase_id_token": storage.getItem("firebase_id_token"),
            "method": "POST",
            "url": "/getTvShows2",
            "cB": generic_json_request_new,
            "successCb": tvShowsNewSuccess,
            "failureCb": tvShowsNewFailure,
            };
        encrypt_and_execute(getX(), "kanazzi", data);

        //encryptText2(getX(), "getTvShowsGo");
    } else {
        var tvshows = storage.getItem("tv_shows"),      // GET FROM LOCALSTORAGE
            votes_user = storage.getItem("votes_user");

        if (tvshows !== "" && tvshows !== undefined && tvshows !== null && votes_user !== "" && votes_user !== undefined && votes_user !== null) {
            setTvShows(JSON.parse(tvshows), JSON.parse(votes_user));
        } else {
            getTvShows(false);
        }
    }
}


function getTvShowsGo() { // eslint-disable-line no-unused-vars

    loading(true, 'Loading movies...');

    $("#movies-list").empty();
    $("#movies-list_r4").empty();
    $("#movies-list_nw").empty();
    $("#top-list-movies").empty();
    $("#top-list-voters").empty();
    $("#ct-movies").empty();

    //if (DEBUG) console.info("iCarusi App============> ----------------> " + kanazzi + " <---------------");

    $.ajax({
        url: BE_URL + "/getTvShows",
        method: "POST",
        dataType: "json",
        data: {
            username: icarusi_user,
            kanazzi: kanazzi,
        },
    })
        .done(function (data) {

            var response = JSON.parse(data.payload),
                tvshows = response.tvshows,
                votes_user = response.votes_user;

            storage.setItem("tv_shows", JSON.stringify(tvshows));       // SAVE ON LOCALSTORAGE
            storage.setItem("tv_shows_count_ts", new Date().getTime());
            storage.setItem("votes_user", JSON.stringify(votes_user));

            setCacheInfo();

            setTvShows(tvshows, votes_user);
        })
        .fail(function (err) {
            if (DEBUG) { console.error("error " + err.responseText); }
            $("#movies_content").html('<br/><span style="color:red; text-align:center">Error during song loading...<br/>Tiricci Pippo !!</span>');
        })
        .always(function () {
            loading(false, '');
            //if (DEBUG) console.info("iCarusi App============> ajax call completed");
        });
}


/***
CT MOVIES
***/

function checkMoviesCT() {

    var ct_movies = storage.getItem("baracca"),
        ul_ct_size = $('#ct-movies li').length; //CHECK WHETHER THE UL IS ALREADY POPULATED

    if (ct_movies !== "" && ul_ct_size > 1) {
        if (DEBUG) { console.info("iCarusi App============> Skipping CT movies rebuild..."); }
        return false;
    }

    if (ct_movies === "" || ct_movies === "undefined" || ct_movies === null) {
        if (DEBUG) { console.info("iCarusi App============> No cache for CT movies... going to retrieve from remote server..."); }
        getMoviesCT();
    } else {
        ct_movies = JSON.parse(ct_movies);
        if (DEBUG) { console.info("iCarusi App============> Data cached found for CT movies... data retireved from localstorage... Size: " + ct_movies.length); }
        setCtMovies(ct_movies, true, false);
    }
}

function setCtMovies(data, cached, by_search) { // eslint-disable-line no-unused-vars

    var header_content,
        content,
        movie_str;

    $('#ct-movies').empty();

    if (cached) {
        ct_movies = data;
    }

    data.sort(function (a, b) {
        if (a.title < b.title) {
            return -1;
        }
        if (a.title > b.title) {
            return 1;
        }
        return 0;
    });

    if (data.length === 1) {
        movie_str = "movie";
    } else {
        movie_str = "movies";
    }

    header_content = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
    header_content += '<span style="color:yellow">' + data.length + '</span>&nbsp;' + movie_str + ' found</li>';

    $('#ct-movies').append(header_content);

    $.each(data, function (index, value) { // eslint-disable-line no-unused-vars
        content = '<li style="white-space:normal;">';
        content += '<a data-transition="slide" href="javascript:setPopupCT(' + value.id + ')">';
        content += '<div style="font-size:11px">';
        content += '<b>' + value.title + '</b><br/><span style="font-style:italic">' + value.director + '</span>';
        content += '<span style="color:red; float:right">' + value.year + " - " + value.cinema + '</span>';
        content += '</div>';
        content += '</li>';
        content += '</a>';
        $('#ct-movies').append(content);
    });

    $("#ct-movies").listview('refresh');
}

function getMoviesCT() {

    $.ajax({
        url: BE_URL + "/moviesct",
        method: "GET",
        dataType: "json"
    })
        .done(function (data) {
            storage.setItem("baracca", JSON.stringify(data.payload));
            ct_movies = data.payload;            // IT'S ME
            setCtMovies(data.payload, false, false);
        })
        .fail(function () {
            alert("Server Error");
        })
        .always(function () {
            loading(false, '');
        });
}


function setPopupCT(id) { // eslint-disable-line no-unused-vars

    if (id === undefined) {
        return false;
    }

    if (DEBUG) { console.info("iCarusi App============> Id to open.. " + id); }

    $("#popupMovieCt").panel("open");
    var content = '',
        temp = ct_movies,
        result;

    result = $.grep(temp, function (element, index) { // eslint-disable-line no-unused-vars
        return (element.id === id);
    });

    content = '<span style="font-size:14px; font-weight:bold">' + result[0].title + "</span><br/><br/>";
    content += "Directed by: <i><b>" + result[0].director + "</b></i><br/><br/>";
    content += 'Cast:<br/><span style="width:65%; font-style:italic; font-weight:bold">' + result[0].cast + '</span><br/><br/>';
    content += 'Year: <b>' + result[0].year + '</b><br/><br/>';
    content += 'Cinema: <b>' + result[0].cinema + '</b><br/><br/>';
    content += '<span style="font-weight:bold">FilmTV:</span><br/>';

    if (result[0].filmtv.indexOf("A") === 0) {
        content += '<img src="images/green.png" style="width:60px"/>';
    } else if (result[0].filmtv.indexOf("B") === 0) {
        content += '<img src="images/blue.png" style="width:60px"/>';
    } else if (result[0].filmtv.indexOf("C") === 0) {
        content += '<img src="images/red.png" style="width:60px"/>';
    }

    content += '<br/><br/><br/><span style="font-style:italic;">Tap outside the panel for close</span>';

    $("#movie-table-custom").html(content);
}

 /***
    SAVE NEW MOVIE
 ***/

$(document).on("click", "#send_movie_btn", function () {
    encryptText2(getX(), "saveMovieNew");
});

function saveMovieNew() { // eslint-disable-line no-unused-vars

    var username = icarusi_user,
        title = $("#title").val(),
        media = $("#media :selected").val(),
        type = $("#type :selected").val(),
        new_pic = $("#pic").val(),
        the_form = $("#movie_form"),
        formData = new FormData(the_form[0]);

    $("#username").val(username);
    $("#kanazzi").val(kanazzi);
    $("#id").val(currentId);

    // TRICK
    $('#media').selectmenu('enable');
    $('#type').selectmenu('enable');
    // END TRICK

    if (username === "" || username === undefined || username === null) {
        alert("You must be logged in for saving or updating Movies/Serie");
        return false;
    }

    if (curr_file_size > 512000) {
        alert("File size exceeded! Max 500KB");
        return false;
    }

    if (title === "" || title === undefined || title === null || media === "" || media === undefined || media === null || type === "" || type === undefined || type === null) {
        alert("Title, media and type cannot be blank!!\nTitle: " + title + "\nMedia: " + media + "\nType: " + type);
        return false;
    }

    if ($("#curr_pic").val() !== "" && new_pic !== "") {
        if (!confirm("Warning! The image you're going to upload will replace the existing one.\n\nAre you sure?")) {
            return false;
        }
    }

    loading(true, 'Submitting movie...');

    $.ajax({
        url: BE_URL + "/savemovienew",
        method: "POST",
        data: formData,
        cache: false,
        contentType: false,
        processData: false
    })
        .done(function (data) {

            var response = data;

            if (response.result === "failure") {
                alert(response.message);
                return false;
            }

            if (DEBUG) { console.info(JSON.stringify(response)); }
            if (response.upload_result.result === "failure") {
                alert(response.upload_result.message);
            }

            resetPopupElements();
            getTvShows(false);
            currentId = 0;
            //$("#popupMovie").popup("close");      //OLD
            $.mobile.back();                        //NEW
        })
        .fail(function (err) {
            alert("Server error!");
            console.error(err.responseText);
        })
        .always(function () {
            loading(false, "");
        });
}

/***
    DELETE
***/

$(document).on("click", "#delete_movie_btn", function () {
    if (confirm("Are you sure?")) {
        encryptText2(getX(), "deleteMovie");
    }
});

function deleteMovie() { // eslint-disable-line no-unused-vars

    if (icarusi_user === "" || icarusi_user === undefined || icarusi_user === null) {
        alert("You must be logged in for deleting Movies/Serie");
        return false;
    }

    loading(true, 'Submitting movie...');

    $.ajax({
        url: BE_URL + "/deletemovie",
        method: "POST",
        data: {
            id: currentId,
            username: icarusi_user,
            kanazzi: kanazzi,
        },
    })
        .done(function (data) {
            var response = data;
            if (DEBUG) {
                console.info("iCarusi App============> ========> " + response.result);
                console.info("iCarusi App============> ========> " + response.message);
            }

            if (response.result === "failure") {
                alert(response.message);
                return false;
            }

            resetPopupElements();
            getTvShows(false);
            currentId = 0;

            $.mobile.back(); //NEW

        })
        .fail(function (err) {
            alert("Server error!");
            console.error(err.responseText);
        })
        .always(function () {
            loading(false, '');
        });
}

function newMoviePage() { // eslint-disable-line no-unused-vars
    $(':mobile-pagecontainer').pagecontainer('change', '#detail_page');
    resetPopupElements();
}

/***
 SET DETAILS PAGE
***/

function setPopupData(id, src) { // eslint-disable-line no-unused-vars
    //OLD
    //$("#popupMovie").popup("open");

    // NEW
    $(':mobile-pagecontainer').pagecontainer('change', '#detail_page');
    resetPopupElements();
    //END NEW

    $("#nw").prop("checked", false).checkboxradio("refresh");
    $('#giveup').checkboxradio('enable');

    currentId = id;

    var item = jsonTvShows[id],
        vote,
        episode,
        season,
        comment,
        nw,
        collapse_vote,
        additional_info;

    if (DEBUG) {
        console.info("iCarusi App============> " + item.title + " ** " + item.media + " ** " + item.username + " ** " + item.avg_vote);
        console.info("iCarusi App============> " + JSON.stringify(item.u_v_dict));
    }

    if (!(icarusi_user in item.u_v_dict)) {
        vote = 5;
        episode = 1;
        season = 1;
        comment = '';
        if (DEBUG) { console.info("iCarusi App============> User " + icarusi_user + " has not voted for this movie. Setting default value to: " + vote); }
    } else {
        vote = item.u_v_dict[icarusi_user].us_vote;
        nw = item.u_v_dict[icarusi_user].now_watching;
        episode = item.u_v_dict[icarusi_user].episode;
        season = item.u_v_dict[icarusi_user].season;
        comment = item.u_v_dict[icarusi_user].comment;
        if (nw) {
            $("#nw").prop("checked", true).checkboxradio("refresh");
        }
        if (DEBUG) { console.info("iCarusi App============> Vote for user " + icarusi_user + " = " + vote + " (Now watching: " + nw + ")"); }
    }

    $("#top_title").html('<span style="text-align:center; vertical-align:middle">' + item.title + '</span>');
    $("#title").val(item.title);
    $("#link").val(item.link);
    $('#media').val(item.media).selectmenu('refresh', true);
    $('#type').val(item.type).selectmenu('refresh', true);
    $("#curr_pic").val(item.poster);
    $("#vote").val(vote).slider("refresh");
    $("#the_votes_d").show();
    $("#episode").val(episode);
    $("#season").val(season);
    $("#comment").val(comment);
    $("#curr_link").val(item.link);

    if (item.link === "") {
        $("#btn_link").hide();
    }

    if (icarusi_user === "" || icarusi_user === undefined || icarusi_user === null) {
        $("#send_movie_btn").addClass("ui-btn ui-state-disabled");
        $("#delete_movie_btn").addClass("ui-btn ui-state-disabled");
    }

    collapse_vote = $("#the_votes_d").collapsible("option", "collapsed");
    if (collapse_vote === false) {
        $("#the_votes_d").collapsible("option", "collapsed", "true");
    }

    additional_info = $("#additional_info").collapsible("option", "collapsed");
    if (additional_info === false) {
        $("#additional_info").collapsible("option", "collapsed", "true");
    }

    if (icarusi_user !== item.username) {

        $("#title").prop('readonly', true);
        //$("#link").prop('readonly', true);             // new feature to allow not owner to edit the link
        $("#title").textinput("option", "clearBtn", false);
        $("#link").textinput("option", "clearBtn", false);
        $("#title").textinput("refresh");
        $("#link").textinput("refresh");
        $('#media').selectmenu('disable');
        $('#type').selectmenu('disable');
        $('#media').prop("readonly", true);
        $('#type').prop("readonly", true);
        $("#send_movie_btn").text("Vote...");
        //$("#pic").addClass("ui-btn ui-state-disabled");       // new feature to allow not movier owner to upload the poster
        $("#delete_movie_btn").addClass("ui-btn ui-state-disabled");
    } else {
        $("#send_movie_btn").text("Update...");
        $("#send_movie_btn").removeClass("ui-state-disabled");
        $("#delete_movie_btn").removeClass("ui-state-disabled");
    }

    $('#users_votes').empty();
    $.each(item.u_v_dict, function (index, value) { // eslint-disable-line no-unused-vars
        var content = '<li style="white-space:normal;">';
        if (value.now_watching === true) {
            content += '<b>' + value.us_username + '</b> <span style="color:red; float:right">now watching...</span>';
        } else {
            content += '<b>' + value.us_username + '</b> <span style="color:red; float:right">' + value.us_vote + '</span>';
            content += '<br/><p style="white-space:normal; font-style:italic">' + value.comment + '</p>';
        }
        content += '</li>';
        $('#users_votes').append(content);
    });
    $('#users_votes').listview('refresh');
}

/***
 SET COMMENTS PAGE
***/

function setComments(id, src) { // eslint-disable-line no-unused-vars

    // NEW
    $(':mobile-pagecontainer').pagecontainer('change', '#comments_page');
    //END NEW

    var item = jsonTvShows[id],
        comments_count,
        content,
        header_content;

    if (DEBUG) { console.info("iCarusi App============> " + item.title + " ** " + item.media + " ** " + item.username + " ** " + item.avg_vote); }
    currentId = id;

    $("#top_title_comments").html("iCarusi's reviews <br/><i>" + item.title + "</i>");

    if (DEBUG) { console.info("iCarusi App============> " + JSON.stringify(item.u_v_dict)); }

    $('#movie_comments').empty();

    comments_count = 0;
    $.each(item.u_v_dict, function (index, value) { // eslint-disable-line no-unused-vars
        content = '<li style="white-space:normal;">';
        if (value.comment !== "") {
            comments_count += 1;
        }

        if (value.now_watching === true) {
            content += '<b>' + value.us_username + '</b> <span style="color:red; float:right">now watching...</span>';
        } else {
            content += '<b>' + value.us_username + '</b> <span style="color:red; float:right">' + value.us_vote + '</span>';
            content += '<br/><p style="white-space:normal; font-style:italic; font-size:12px">' + value.comment + '</p>';
        }
        content += '</li>';
        $('#movie_comments').append(content);
    });

    header_content = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
    header_content += '<span style="color:yellow">' + comments_count + ' comments...</span></li>';
    $('#movie_comments').prepend(header_content);
    $('#movie_comments').listview('refresh');
}


function open_link(link) { // eslint-disable-line no-unused-vars
    if (link !== "") {
        cordova.InAppBrowser.open(link, '_self', 'location=no');
    }
}

// CORDOVA
function onDeviceReady() { // eslint-disable-line no-unused-vars

    icarusi_user = storage.getItem("icarusi_user");
    tv_shows_storage = storage.getItem("tv_shows");
    tv_shows_storage_ts = storage.getItem("tv_shows_count_ts");
    device_app_path = cordova.file.applicationDirectory;
    if (DEBUG) {
        console.info("iCarusi App============> Found Tv Shows Storage");
        console.info("iCarusi App============> Tv Shows Storage datetime " + tv_shows_storage_ts);
    }

    var networkState = navigator.connection.type;

    $("#connection").html("");

    if (icarusi_user === power_user) {
        $("#sabba_info").html(BE_URL);
    }

    /*
    console.info("===============================================");
    var location = window.location;
    console.info("RECEIVED LOCATION " + location);

    if (location !== "") {
        q = parseQuery(location);
        console.info(JSON.stringify(q));
    }
    console.info("===============================================");
    */

/*
 * OFFLINE MODE CHECKER
 */

    if (networkState === Connection.NONE) {
        $("#connection").html("No network... Pantalica mode...");

        checkMoviesCT();

        if (tv_shows_storage !== "" && tv_shows_storage !== undefined && tv_shows_storage !== null) {
            if (DEBUG) { console.info("iCarusi App============> Found Tv Shows Storage"); }
            getTvShows(true);
        }
    } else {

        var old_ts = parseInt(storage.getItem("tv_shows_count_ts"), 10),
            new_ts,
            diff,
            diff_sec;

        if (old_ts !== "" && old_ts !== null && old_ts !== undefined) {

            new_ts = new Date().getTime();
            diff = new_ts - old_ts;
            diff_sec = diff / 1000;

            if (diff_sec < 86400 && tv_shows_storage !== "" && tv_shows_storage !== undefined && tv_shows_storage !== null) {
                if (DEBUG) { console.info("iCarusi App============> Cached TVShows loading"); }
                getTvShows(true); // load movies on startup from cache if there is cache and last update time is greater than 1 day
            } else {
                getTvShows(false);
            }
        } else {
            getTvShows(true);
        }

    }

/*
 *  BINDINGS
 */
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

    $("#popupPhotoPortrait").bind({
        popupafteropen: function (event, ui) { // eslint-disable-line no-unused-vars
            if (DEBUG) { console.info("iCarusi App============> Opening Picture Popup -> "); }
        },
        popupafterclose: function (event, ui) { // eslint-disable-line no-unused-vars
            if (DEBUG) { console.info("iCarusi App============> Closing Picture Popup -> Resetting picture src"); }
        }
    });

    /*
     * BUTTONS ACTIONS
     */

    $("#btn_t_sort").on("click", function () {
        sort_type = "title";
        sort_movies();
    });

    $("#btn_d_sort").on("click", function () {
        sort_type = "datetime_sec";
        sort_movies();
    });

    $("#btn_m_sort").on("click", function () {
        sort_type = "media";
        sort_movies();
    });

    $("#btn_v_sort").on("click", function () {
        sort_type = "avg_vote";
        sort_movies();
    });


    $('#ct_search').on('change', function () {
        var search = $("#ct_search").val();
        if (search.length === 0) {
            setCtMovies(ct_movies, false, true);
            return false;
        }
    });

    /*
     * TABS MANAGEMENT
     */
    /*
    $("#movies_page").on( "tabsactivate", function (event,ui) {
        console.info(JSON.stringify(ui.oldPanel.selector));
        console.info(JSON.stringify(ui.newPanesavel.selector));

        if (ui.newPanel.selector === "#tab_movies") {
            $("#movie_type_tabs").tabs( "option", "active", 0 );
            $("#movies_link").addClass('ui-btn-active ui-state-persist');
        };

        if (ui.newPanel.selector === "#movies_nw") {
            $("#sort_span").hide();
            $("#movie_search_div").hide();
        }
        else{
            $("#sort_span").show();
            $("#movie_search_div").show();
        }
    });
    */
    /*
     * CT SEARCH
     */

    $("#ct_search").bind("input", function () {
        var search = $("#ct_search").val(),
            result = ct_movies;

        if (search.length === 0) {
            setCtMovies(ct_movies, false, true);
            return false;
        }

        if (search.length < 4) {
            return false;
        }

        result = $.grep(result, function (element, index) { // eslint-disable-line no-unused-vars
            return (
                (element.year.toString() === search) ||
                (element.title.toUpperCase().indexOf(search.toUpperCase()) >= 0) ||
                (element.cinema.toUpperCase().indexOf(search.toUpperCase()) >= 0) ||
                (element.director.toUpperCase().indexOf(search.toUpperCase()) >= 0)
            );
        });
        setCtMovies(result, false, true);
    });

    /*
     * MOVIE SEARCH
     */

    $('#movie_search').on('change', function () {
/*
        var search = $("#movie_search").val(),
            tvshows,
            votes_user;

        var data = {"username": icarusi_user,
            "firebase_id_token": storage.getItem("firebase_id_token"),
            "method": "POST",
            "url": "/getTvShows2",
            "cB": generic_json_request_new,
            "successCb": tvShowsNewSuccess,
            "failureCb": tvShowsNewFailure,
            "query": search
            };
        encrypt_and_execute(getX(), "kanazzi", data);


        if (search.length === 0) {
            tvshows = storage.getItem("tv_shows");      // GET FROM LOCALSTORAGE
            votes_user = storage.getItem("votes_user");
            if (tvshows !== "" && tvshows !== undefined && tvshows !== null && votes_user !== "" && votes_user !== undefined && votes_user !== null) {
                setTvShows(JSON.parse(tvshows), JSON.parse(votes_user));
            }
        }
*/
    });

    $("#movie_search").bind("input", function () {
        var tvshows = storage.getItem("tv_shows"), // GET FROM LOCALSTORAGE
            votes_user = storage.getItem("votes_user"),
            search = $("#movie_search").val(),
            result;

        if (tvshows === "" || tvshows === undefined || tvshows === null || votes_user === "" || votes_user === undefined || votes_user === null) {
            return false;
        }

        result = JSON.parse(tvshows);
        votes_user = JSON.parse(votes_user);

        if (search.length === 0) {
            setTvShows(result, votes_user);
            return false;
        }

        if (search.length < 4) {
            return false;
        }

        if (lazy_load) {

            var data = {"username": icarusi_user,
                "firebase_id_token": storage.getItem("firebase_id_token"),
                "method": "POST",
                "url": "/getTvShows2",
                "cB": generic_json_request_new,
                "successCb": tvShowsNewSuccess,
                "failureCb": tvShowsNewFailure,
                "query": search
                };
            encrypt_and_execute(getX(), "kanazzi", data);

        } else {

            result = $.grep(result, function (element, index) { // eslint-disable-line no-unused-vars
                return (
                    (element.title.toUpperCase().indexOf(search.toUpperCase()) >= 0) ||
                    (element.media.toUpperCase().indexOf(search.toUpperCase()) >= 0) ||
                    (element.username.toUpperCase().indexOf(search.toUpperCase()) >= 0)
                );
            });
            setTvShows(result, votes_user);
        }
    });

    /*
     * PULL DOWN REFRESH
     */

    PullToRefresh.init({
        mainElement: '#movies-list',
        onRefresh: function () {
            getTvShows(false);
        },
        instructionsReleaseToRefresh: "Pull down for get fresh data from remote server...",
        distThreshold : 20,
    });

    PullToRefresh.init({
        mainElement: '#movies-list_r4',
        onRefresh: function () {
            getTvShows(false);
        },
        instructionsReleaseToRefresh: "Pull down for get fresh data from remote server...",
        distThreshold : 20,
    });

    PullToRefresh.init({
        triggerElement: '#movies-list_nw',
        onRefresh: function () {
            getTvShows(false);
        },
        instructionsReleaseToRefresh: "Pull down for get fresh data from remote server...",
        distThreshold : 20,
    });

    /*
     * SWIPE RUDIMENTALE
     */

    $("#movies_page").on("swipeleft", swipeleftHandler);
    $("#movies_page").on("swiperight", swipeRightHandler);

    function swipeleftHandler(event) { // eslint-disable-line no-unused-vars
        document.location = swipe_left_target;
    }

    function swipeRightHandler(event) { // eslint-disable-line no-unused-vars
        document.location = swipe_right_target;
    }

    /*
     * INITIALIZATION
     */

    $("#top-list-movies").listview('refresh');
    $("#top-list-voters").listview('refresh');


}  // CORDOVA
