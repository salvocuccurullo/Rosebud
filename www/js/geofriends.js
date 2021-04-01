/*global $, window, document, loading, alert, getX*/
/*global navigator, Connection, cordova */
/*global swipeleftHandler, swipeRightHandler, get_ls_bool, locale_date, plugin */
/*eslint no-console: ["error", { allow: ["info","warn", "error"] }] */
/*eslint no-global-assign: "error"*/

"use strict";

var storage = window.localStorage,
    DEBUG = true,
    icarusi_user = "",
    kanazzi,  // eslint-disable-line no-unused-vars
    rosebud_uid,
//    swipe_left_target = "song.html",
//    swipe_right_target = "movies.html",
    curr_action = "GET",
    curr_latitude = "",
    curr_longitude = "",
    curr_positions = [],
    curr_friend_pos = {},
//    curr_picture = '',
    friend_photo_url = "",
    map,
    enable_geoloc = false,
    geoloc_state = 0;

document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);     //CORDOVA

function zoomTo(username) {

    //TO BE CHANGED USING A DICTIONARY WITH USERNAME AS KEY
    if (DEBUG) { console.info("------------ ZOOM TO -------------"); }
    if (DEBUG) { console.info("Current friend location " + JSON.stringify(curr_friend_pos)); }
    if (DEBUG) { console.info("All friends " + curr_positions.length + " locations: " + JSON.stringify(curr_positions)); }
    if (DEBUG) { console.info("----------------------------------"); }

    $.each(curr_positions, function (index, value) { // eslint-disable-line no-unused-vars
        if (value.name === username) {

            map.animateCamera({
                target: {
                    lat: value.latitude,
                    lng: value.longitude
                },
                zoom: 14,
                tilt: 60,
                bearing: 0,
                duration: 5000
            });

            //map.setCameraTarget({"lat": value.latitude, "lng": value.longitude});
            //map.setCameraZoom(14);

            var marker = map.addMarker({
                position: {
                    "lat": value.latitude,
                    "lng": value.longitude
                },
                title: "GeoFriends",
                snippet: value.name + " was here on:\n" + locale_date(value.last_locate),
                animation: plugin.google.maps.Animation.DROP
            });

            // Show the info window
            marker.showInfoWindow();

            return false;
        }
    });
}

/*
 * SET SELECT FOR ZOOMING ON FRIENDS POSITION
 */

function setMarkers(positions) {

    var friend_pos = {};

    if (enable_geoloc === false) {
        positions.push(curr_friend_pos);
        friend_pos = curr_friend_pos;
    }

    if (DEBUG) {
        console.info("Locations array size: " + positions.length);
        console.info("Locations array: " + JSON.stringify(positions));
    }

    map.clear().then(function () {
        $.each(positions, function (index, value) {

            if (value.name === icarusi_user) {
                friend_pos = value;
                if (!value.photo) {
                    value.photo = friend_photo_url;
                }
            }

            var marker = map.addMarker({
                position: {
                    "lat": value.latitude,
                    "lng": value.longitude
                },
                title: "GeoFriends",
                snippet: value.name + " was here on:\n" + locale_date(value.last_locate),
                animation: plugin.google.maps.Animation.DROP,
                icon: {
                    url : value.photo,
                    size: {
                        width: 40,
                        height: 40
                    }
                }
            });

            // Show the info window
            marker.showInfoWindow();
        });
    });

    if (DEBUG) { console.info("Locations friend: " + JSON.stringify(friend_pos)); }

    // Zoom to mypos
    map.setCameraTarget({
        "lat": friend_pos.latitude,
        "lng": friend_pos.longitude
    });

    if (curr_action === "SET") {
        map.setCameraZoom(12);
    } else if (curr_action === "GET") {
        map.setCameraZoom(5);
    }
}

function setMarkers2() {

    if (curr_positions.length === 0) {
        return false;
    }

    map.clear().then(function () {

        var friend_pos = {};

        if (enable_geoloc === false) {
            curr_positions.push(curr_friend_pos);
        }

        if (DEBUG) { console.info("Locations array size: " + curr_positions.length); }
        if (DEBUG) { console.info("Locations array: " + JSON.stringify(curr_positions)); }

        $.each(curr_positions, function (index, value) {

            if (value.name === icarusi_user) {
                friend_pos = value;
                if (!value.photo) {
                    value.photo = friend_photo_url;
                }
            }

            map.addMarker(
                {
                    position: {
                        "lat": value.latitude,
                        "lng": value.longitude
                    },
                    title: "GeoFriends",
                    snippet: value.name + " was here on:\n" + locale_date(value.last_locate),
                    animation: plugin.google.maps.Animation.DROP,
                    icon: {
                        url: value.photo,
                        size: {
                            width: 40,
                            height: 40
                        }
                    }
                },
                function (marker) {
                    // Show the info window
                    marker.showInfoWindow();
                }
            );
        });
        if (DEBUG) { console.info("Locations friend: " + JSON.stringify(friend_pos)); }
    });
}


/*
 * SET SELECT FOR ZOOMING ON FRIENDS POSITION
 */

function setButtons(positions) {
    $('#friends_loc_buttons').empty();
    $('#friends_loc_buttons').append('<option value="">-</option>');
    if (!$.isEmptyObject(curr_friend_pos)) {
        $('#friends_loc_buttons').append('<option value="' + icarusi_user + '">' + icarusi_user + '</option>');
    }
    $.each(positions, function (index, value) {
        if (value.name !== icarusi_user) {
            var content = '<option value="' + value.name + '">' + value.name + '</option>';
            $('#friends_loc_buttons').append(content);
        }
    });
    $('#friends_loc_buttons').selectmenu('refresh');
    $('#select_zoom_div').show();
}

/*
 * GET/SET REMOTE DATA
 */

function geolocationSuccessCB(data) {

  //console.info(JSON.stringify(data));
  $('#get_locations').prop('disabled', false).removeClass('ui-state-disabled');

  if (DEBUG) { console.info("Response from server =====> " + JSON.stringify(data)); }

  if (data.result === "failure") {
      alert(data.message);
      return false;
  }

  $("#distance_info").html("As the crow flies...<br/> from your last location you moved about " + data.distance + " km.");

  if (curr_action === "GET") {
      curr_positions = data.body;
      //$("#distance_info").html("As the crow flies...<br/> from your last location you moved about " + data.distance + " km.");
      //storage.setItem("location_string", data.location_string);
      setMarkers2();
      setButtons(curr_positions);
  }
}

function geolocationFailureCB(err) {
  console.error(JSON.stringify(err));
  alert("Server error! Try again, please.");
}

function geoLocation(geoloc_params) { // eslint-disable-line no-unused-vars

    if (icarusi_user === "" || icarusi_user === undefined || icarusi_user === null) {
        alert("Please login for share your location and/or getting info on your friends location");
        return false;
    }

    if (DEBUG) { console.info("GeoLocation remote action: " + curr_action + " for user: " + icarusi_user); }

    var data = {
      "method": "POST",
      "url": "/geolocation",
      "action": curr_action,
      "latitude": curr_latitude,
      "longitude": curr_longitude,
      "notification_on" : geoloc_params.notification_on,
      "photo": friend_photo_url,
      "username": icarusi_user,
      "rosebud_uid": rosebud_uid,
      "cB": generic_json_request_new,     // eslint-disable-line no-undef
      "successCb": geolocationSuccessCB,
      "failureCb": geolocationFailureCB,
    };
    encrypt_and_execute(getX(), "kanazzi", data);   // eslint-disable-line no-undef

}

// CORDOVA
function onDeviceReady() { // eslint-disable-line no-unused-vars

    icarusi_user = storage.getItem("icarusi_user");
    enable_geoloc = get_ls_bool("enable-geoloc");
    friend_photo_url = storage.getItem("google_photo_url");
    rosebud_uid = storage.getItem("rosebud_uid");
    storage.setItem("notification_on", false);
    //storage.setItem("spotify_url_received", "");

/*
    window.plugins.intent.setNewIntentHandler(function (intent) {
        console.info(JSON.stringify(intent));
        //if (intent !== undefined) {
           storage.setItem("spotify_url_received", intent.clipItems[0].text);
        //}
    });
*/
    var positions = [],
        networkState,
        div;

    $("#geoloc_info").html("");
    $("#distance_info").html("");

    if (icarusi_user === undefined || icarusi_user === "" || icarusi_user === null) {
        $('#get_locations').prop('disabled', true).addClass('ui-state-disabled');
        $('#locate_me').prop('disabled', true).addClass('ui-state-disabled');
        $('#locate_me_notif').prop('disabled', true).addClass('ui-state-disabled');
        alert("You must be logged in for accessing Rosebud page!!");
        return false;
    }

    if (!enable_geoloc) {
        $("#geoloc_info").html("You're not sharing your location with your friends. Enable it on settings!");
    }

    /*
     * NETWORK INFO
     */

    networkState = navigator.connection.type;
    $("#connection").html("");
    if (networkState === Connection.NONE) {
        $("#connection").html("No network... Pantalica mode...");
    }

    cordova.getAppVersion.getVersionNumber().then(function (version) {
        $('#version').html(" " + version);
        storage.setItem("app_version", version);
    });

    /*
     * BUILD GOOGLE MAPS CANVAS
     */

    div = document.getElementById("map_canvas");
    // Create a Google Maps native view under the map_canvas div.
    map = plugin.google.maps.Map.getMap(div);
    map.setOptions({
        'backgroundColor': 'white',
        'mapType': plugin.google.maps.MapTypeId.ROADMAP,
        'controls': {
            'compass': true,
            'myLocationButton': true,
            'indoorPicker': true,
            'zoom': true // Only for Android
        },
        'camera': {
          'target': [
            {'lat': 41.9, 'lng': 12.4}
          ]
        },
        preferences: {
          building: true
        }
    });

    /*
     * DISABLE BUTTONS UNTIL GOOGLE MAP IS NOT READY OR UNDER OTHER CONDITIONS
     */

    $('#get_locations').prop('disabled', true).addClass('ui-state-disabled');
    $('#locate_me').prop('disabled', true).addClass('ui-state-disabled');
    $('#locate_me_notif').prop('disabled', true).addClass('ui-state-disabled');

    /*
     * GEOLOCATION CALLBACKS
    */

    function onSuccessLocation(position) {
        /*
        $("#geoloc_info").html('Latitude:<b>'          + position.coords.latitude    + '<br/>' +
        'Longitude:<b>'         + position.coords.longitude         + '</b><br/>' +
        'Altitude:<b>'          + position.coords.altitude          + '</b><br/>' +
        'Accuracy:<b>'          + position.coords.accuracy          + '</b><br/>' +
        'Altitude Accuracy:<b>' + position.coords.altitudeAccuracy  + '</b><br/>' +
        'Heading:<b>'           + position.coords.heading           + '</b><br/>' +
        'Speed:<b>'             + position.coords.speed             + '</b><br/>' +
        'Timestamp:<b>'         + position.timestamp                + '</b><br/>');
        */

        var geoloc_params = {};
        geoloc_state = 0;

        loading(false, "");
        $('#locate_me').prop('disabled', false).removeClass('ui-state-disabled');
        $('#locate_me_notif').prop('disabled', false).removeClass('ui-state-disabled');
        $('#get_locations').prop('disabled', false).removeClass('ui-state-disabled');

        if (icarusi_user === "" || icarusi_user === null) {
            positions.push({
                "name": "Not logged user",
                "latitude": position.coords.latitude,
                "longitude": position.coords.longitude
            });
        } else {
            curr_positions.pop(curr_friend_pos);

            curr_friend_pos = {
                "name": icarusi_user,
                "latitude": position.coords.latitude,
                "longitude": position.coords.longitude,
                "friend_photo_url": friend_photo_url,
                "last_locate": new Date()
            };

            curr_positions.push(curr_friend_pos);
        }

        if (DEBUG) { console.info("Current positions: " + JSON.stringify(curr_positions)); }
        setMarkers(curr_positions);

        if (icarusi_user === "" || icarusi_user === null || icarusi_user === undefined) {
            return false;
        }

        zoomTo(icarusi_user);

        if (enable_geoloc === true) {
            curr_action = "SET";
            curr_latitude = position.coords.latitude;
            curr_longitude = position.coords.longitude;
            //curr_picture = friend_photo_url;
        } else {
            curr_action = "DELETE";
        }

        geoloc_params = {
          "notification_on": storage.getItem("notification_on")
        };
        geoLocation(geoloc_params);
    }

    // onError Callback receives a PositionError object

    function onErrorLocation(error) {
        console.info("GeoLocation ERROR! " + error.message);
        loading(false, "Retrieving your positions...");
        if (geoloc_state === 0) {
            geoloc_state = 1;
            loading(true, "Retrieving your position using network....");
            navigator.geolocation.getCurrentPosition(onSuccessLocation, onErrorLocation, {
                timeout: 30000,
                enableHighAccuracy: false
            });
        } else {
            geoloc_state = 0;
            loading(false, "Retrieving your position...");
            alert('Most likely you\'re inside a cave... Pantalica? \n code: ' + error.code + '\n' + 'message: ' + error.message); // eslint-disable-line no-useless-concat
            $('#locate_me').prop('disabled', false).removeClass('ui-state-disabled');
            $('#locate_me_notif').prop('disabled', false).removeClass('ui-state-disabled');
        }
    }

    /*
     * EXECUTE THE USER GEOLOCATION AFTER MAP IS READY
     */

    map.on(plugin.google.maps.event.MAP_READY, function () {

        loading(false, "Loading Google Maps...");

        if (DEBUG) { console.info("Google Maps is ready!"); }

        loading(true, "Retrieving your position using GPS...");

        navigator.geolocation.getCurrentPosition(onSuccessLocation, onErrorLocation, {
            timeout: 30000,
            enableHighAccuracy: true
        });
    });

    // var watchID = navigator.geolocation.watchPosition(onSuccessLocation, onErrorLocation, { timeout: 30000 });


    /*
     * BINDINGS
    */

    $(document).on("click", "#get_locations", function () {
        curr_action = "GET";
        $('#get_locations').prop('disabled', true).addClass('ui-state-disabled');

        var geoloc_params = {
          "notification_on": storage.getItem("notification_on")
        };
        geoLocation(geoloc_params);
    });

    $(document).on("change", "#friends_loc_buttons", function () {
        if (this.value !== "") {
          zoomTo(this.value);
        }
    });

    $(document).on("click", "#locate_me", function () {
        $('#locate_me').prop('disabled', true).addClass('ui-state-disabled');
        $('#locate_me_notif').prop('disabled', true).addClass('ui-state-disabled');
        storage.setItem("notification_on", false);
        loading(true, "Retrieving your position using GPS...");
        navigator.geolocation.getCurrentPosition(onSuccessLocation, onErrorLocation, {
            timeout: 30000,
            enableHighAccuracy: true
        });
    });

    $(document).on("click", "#locate_me_notif", function () {
      var message = "Do you want to notify your friend about your curren location?";
          //user_loc = storage.getItem("location_string");

      /*
      if (user_loc !== "" && user_loc !== undefined) {
        message += "\n" + user_loc;
      }
      */

      if (confirm(message)) {
        $('#locate_me_notif').prop('disabled', true).addClass('ui-state-disabled');
        $('#locate_me').prop('disabled', true).addClass('ui-state-disabled');
        storage.setItem("notification_on", true);
        loading(true, "Retrieving your position using GPS...");
        navigator.geolocation.getCurrentPosition(onSuccessLocation, onErrorLocation, {
            timeout: 30000,
            enableHighAccuracy: true
        });
      }
    });

    // SWIPE RUDIMENTALE
    $("#geofriends_page").on("swipeleft", swipeleftHandler);
    $("#geofriends_page").on("swiperight", swipeRightHandler);
    // FINE SWIPE RUDIMENTALE

} // CORDOVA
