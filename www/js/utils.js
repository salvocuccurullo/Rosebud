/*global $, document, swipe_left_target, swipe_right_target, btoa, cryptographyAES, key, window, DEBUG, BE_URL, moment, storage */
/*eslint no-global-assign: "error"*/
/*globals kanazzi:true*/
/*exported kanazzi */
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


/***
  DUMMY SECURITY
 ***/

function encryptText2(pText, cb) { // eslint-disable-line no-unused-vars
    cryptographyAES.doEncryption(
        pText,
        key,
        function (crypted) {
            kanazzi = crypted;  // eslint-disable-line no-unused-vars
            var fn = window[cb];
            // is object a function?
            if (typeof fn === "function") {
                fn();
            }
        },
        function (err) {
            if (DEBUG) { console.error("iCarusi App============> onFailure: " + JSON.stringify(err)); }
        }
    );
}

function encrypt_and_execute(pText, encKeyName, data) { // eslint-disable-line no-unused-vars
    cryptographyAES.doEncryption(
        pText,
        key,
        function (crypted) {
            data[encKeyName] = crypted;
            if (data.cB && data.successCb && data.failureCb) {
                data.cB(data, data.successCb, data.failureCb);
            } else {
                data.cB(data);
            }
        },
        function (err) {
            if (DEBUG) { console.error("iCarusi App============> onFailure: " + JSON.stringify(err)); }
            if (data.failureCb) { data.failureCb(err); }
        }
    );
}

function generic_json_request_new(data, successCb, failureCb) { // eslint-disable-line no-unused-vars

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

            /*
            if ("forward_vars" in data) {
                $.each(data.forward_vars, function (index, value) { // eslint-disable-line no-unused-vars
                    response.value. = data.value;
                });
            }
            */

            try {
                if (DEBUG) {
                    console.info("Status response: " + response.result);
                }
                if (response.result === "failure") {
                    if (failureCb) {
                        failureCb(response);
                    }
                }
            } catch (err) {
                if (DEBUG) { console.error(err); }
                if (failureCb) {
                    failureCb(err);
                }
            }

            if (successCb) {
                successCb(response);
            }

        })
        .fail(function (err) {
            loading(false, "Loading...");
            if (DEBUG) {
                console.info("iCarusi App============> Error during generic request to " + data.url);
                console.info("iCarusi App============> " + err.responseText);
            }
            if (failureCb) {
                failureCb(err);
            }
        })
        .always(function () {
            loading(false, "Loading...");
        });
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
