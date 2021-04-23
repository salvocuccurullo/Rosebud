/*global $, document, swipe_left_target, swipe_right_target, btoa, cryptographyAES, key, window, DEBUG, BE_URL, moment, storage */
/*eslint no-global-assign: "error"*/
/*globals kanazzi:true*/
/*exported kanazzi */
/*globals rosebud_uid:true*/
/*exported rosebud_uid */
/*eslint no-console: ["error", { allow: ["info","warn", "error"] }] */

"use strict";

function loading(show, message) {
    if (show) {
        //$("body").block({ "message": null });
        $.mobile.loading("show", {
            text: message,
            textVisible: true,
            theme: 'b',
            html: '',
        });
    } else {
        $.mobile.loading("hide");
        //$("body").unblock();
    }
}

/*
function parseQuery(queryString) {
    var query = {},
        pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
}
*/

function fancyDate(ts) { // eslint-disable-line no-unused-vars

    var d = new Date(Number(ts)),
        min = d.getMinutes(),
        hour = d.getHours(),
        s = '';

    if (min < 10) { min = "0" + min; }
    if (hour < 10) { hour = "0" + hour; }

    s = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear() + " " + hour + ":" + min;

    return s;
}

function get_stars(n) { // eslint-disable-line no-unused-vars
    var x = "",
        i = 0;

    for (i = 0; i < n; i += 1) {
        x += "*";
    }

    return x;
}

function swipeleftHandler(event) { // eslint-disable-line no-unused-vars
    document.location = swipe_left_target;
}

function swipeRightHandler(event) { // eslint-disable-line no-unused-vars
    document.location = swipe_right_target;
}


function make_base_auth(user, password) { // eslint-disable-line no-unused-vars

    var tok = user + ':' + password,
        hash = btoa(tok);

    return 'Basic ' + hash;
}


function json_request(data) { // eslint-disable-line no-unused-vars

    if (icarusi_user != "" && icarusi_user != undefined && data.url !== "/login") {
        data.username = icarusi_user;
    }
    
    data.rosebud_uid =  rosebud_uid;
    data.device_uuid = device.uuid;
    data.device_platform = device.platform;
    data.device_version = device.version;
    data.app_version = storage.getItem("app_version");

    loading(true, "Loading...");

    $.ajax({
        url: BE_URL + data.url,
        method: data.method,
        data: JSON.stringify(data),
        contentType: "application/json",
        dataType: "json"
    })
        .done(function (response) {

            loading(false, "Loading...");

            if (DEBUG) {
                console.info("Request to " + data.url + " completed");
                console.info("Payload received " + JSON.stringify(response));
            }

            if (response.new_token !== undefined && response.new_token !== "") {
              console.debug("New Token received!");
              storage.setItem("rosebud_uid", response.new_token);
              rosebud_uid = response.new_token;
            }

            try {
                if (DEBUG) {
                    console.info("Status response: " + response.result);
                }
                if (response.result === "failure") {
                    if (data.failureCb) {
                        data.failureCb(response);
                    }
                }
            } catch (err) {
                if (DEBUG) { console.error(err); }
                if (data.failureCb) {
                    data.failureCb(err);
                }
            }

            if (data.successCb) {
                data.successCb(response);
            }

        })
        .fail(function (err) {
            loading(false, "Loading...");
            if (DEBUG) {
                console.info("Rosebud App============> Error during request to " + data.url);
                console.info("Rosebud App============> " + err.responseText);
                console.info("Rosebud App============> " + JSON.stringify(err));
            }
            if (data.failureCb) {
                data.failureCb(err);
            }
        })
        .always(function () {
            loading(false, "Loading...");
        });
}

/*
*   REFRESH TOKEN
*/

/*
function refreshTokenSuccessCB(data) {

  if (DEBUG) { console.debug(data); }
    console.debug("Fuochi e Fiamme!")

}

function refreshTokenFailureCB(err) {
  if (DEBUG) { console.info("Rosebud App============> Error during refresh token retrieving"); }
  if (DEBUG) { console.info("Rosebud App============> " + err.responseText); }
}
*/

function refreshToken() { // eslint-disable-line no-unused-vars


  if (DEBUG) { console.info("Rosebud App UID============> " + rosebud_uid); }

  var data = {
    "method": "POST",
    "url": "/refreshtoken",
    "successCb": refreshTokenSuccessCB,
    "failureCb": refreshTokenFailureCB
  };
  if (DEBUG) { console.info("Rosebud App============> " + JSON.stringify(data)); }
  json_request(data);

}

function locale_date(input_date) { // eslint-disable-line no-unused-vars
    var d = new Date(input_date);
    moment.locale('it');
    return moment(d).format("ddd, DD/MM/YYYY HH:mm");
}

function is_storage_expired_or_invalid(storage_name, storage_ts_name, exp_seconds) { // eslint-disable-line no-unused-vars

    var old_ts = parseInt(storage.getItem(storage_ts_name), 10),
        new_ts,
        diff,
        diff_sec,
        the_storage;

    the_storage = storage.getItem(storage_name);
    if (the_storage) {

        if (DEBUG) {
            console.info("Localstorage " + storage_name + " exists");
        }

        if (storage_ts_name !== "") {
            new_ts = new Date().getTime();
            diff = new_ts - old_ts;
            diff_sec = diff / 1000;

            if (diff_sec < exp_seconds) {
                if (DEBUG) {
                    console.info("Localstorage " + storage_name + " is not expired");
                }
                return false;
            }
        } else {
            return false;
        }
    }
    if (DEBUG) {
        console.info("Localstorage " + storage_name + " is empty or expired");
    }

    return true;
}
