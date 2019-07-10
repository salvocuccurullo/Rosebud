/*global $, cordova, firebase, storage, DEBUG, loading, firebase_config */
/*global googleAuthSuccess, googleAuthFailure, getServerVersion, json_request */
/*global generic_json_request_new, encrypt_and_execute, show_post_login_features */
/*global icarusi_user, rosebud_uid */
/*eslint no-console: ["error", { allow: ["info","warn", "error"] }] */

"use strict";

/*
 * FIREBASE AUTH WITH GOOGLE
 */


 function googlePostSuccessAuth(data) {

     var g_photo = storage.getItem("google_photo_url"),
         g_name = storage.getItem("google_display_name");

     $("#logged").html('Logged in as <span style="color:green">' + g_name + '</span> (Google)');
     $("#cover_img").attr("src", g_photo);
     storage.setItem("icarusi_user", data.payload.username);

     getServerVersion();

 }

 function googlePostFailureAuth(data) {
     alert(data.message);
 }

function googleAuthSuccess() { // eslint-disable-line no-unused-vars

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
         "successCb": googlePostSuccessAuth,
         "failureCb": googlePostFailureAuth
     };

  json_request(data);

}

function googleAuthFailure() { // eslint-disable-line no-unused-vars
   alert("Error google auth!");
}

function authenticateWithGoogle(googleAuthSuccess, googleAuthFailure, data) { // eslint-disable-line no-unused-vars

    firebase.initializeApp(firebase_config);
    var provider = new firebase.auth.GoogleAuthProvider(); // eslint-disable-line no-unused-vars

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
                console.info(JSON.stringify(result));
                console.info("===========================================");
            }

            storage.setItem("firebase_id_token", token);
            storage.setItem("google_photo_url", user.photoURL);
            storage.setItem("google_display_name", user.displayName);
            storage.setItem("google_email", user.email);

            if (googleAuthSuccess) {
                googleAuthSuccess(data);
            }
        })
        .catch(function (error) {
            // Handle Errors here.
            var errorCode = error.code,
                errorMessage = error.message;

            console.info("========== GOOGLE LOGIN ERROR ===================");
            console.info(errorCode);
            console.info(errorMessage);
            console.info("===========================================");

            if (googleAuthFailure) {
                googleAuthFailure(data);
            }
        });
}

function refreshIdToken() { // eslint-disable-line no-unused-vars

    function successCallback (idToken) {
       console.info("token: " + idToken);
       storage.setItem("firebase_id_token", idToken);
       loading(false, "Refreshing token...");
    }

    function errorCallback (error) {
       console.error("error: " + error);
       loading(false, "Refreshing token...");
       authenticateWithGoogle();
    }

    loading(true, "Refreshing token...");
    cordova.plugins.firebase.auth.getIdToken().then(successCallback, errorCallback);
}

/*
 * SUBMIT
 */

function loginSuccesfulCB(data) {
  if (DEBUG) {
      console.info("========> Rosebud : login completed ");
      console.info("========> Rosebud : Result... ");
  }
  if (data.result === "success" && data.payload.logged === "yes") {
      if (DEBUG) { console.info("========> Rosebud : Login successful"); }
      if (DEBUG) { console.info("========> Rosebud : " + JSON.stringify(data.payload)); }
      storage.setItem("icarusi_user", data.payload.username);
      storage.setItem("rosebud_uid", data.payload.rosebud_uid);
      storage.setItem("poweruser", data.payload.extra_info.poweruser);
      storage.setItem("geoloc_enabled", data.payload.extra_info.geoloc_enabled);
      icarusi_user = data.payload.username;
      rosebud_uid = data.payload.rosebud_uid;
      $("#logged").html('Logged in as <span style="color:green">' + storage.getItem("icarusi_user") + '</span>');
      $("#popupLogin").popup("close");
      $("#login_message").html(data.payload.message);
      $("#popupLoginResult").popup("open");
      show_post_login_features();
  } else {
      console.info("========> Rosebud : Login unsuccessful");
  }
}

function loginFailureCB(err) {
  alert(err.responseJSON.payload.message);
  console.info("========> Rosebud : error during login");
}

function submit() { // eslint-disable-line no-unused-vars

    var u = $("#username").val(),
        p = $("#password").val(),
        data = {};

    if (u === "" || p === "") {
        alert("Username and/or Passowrd cannot be empty!");
        return false;
    }

    data = {
      "username": u,
      "method": "POST",
      "url": "/login",
      "cB": generic_json_request_new,
      "successCb": loginSuccesfulCB,
      "failureCb": loginFailureCB
    };
    if (DEBUG) { console.info("Rosebud App============> " + JSON.stringify(data)); }
    encrypt_and_execute(p, "password", data);


/*
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
                console.info("========> Rosebud : login completed ");
                console.info("========> Rosebud : Result... ");
            }
            if (response.result === "success" && response.payload.logged === "yes") {
                if (DEBUG) { console.info("========> Rosebud : Login successful"); }
                if (DEBUG) { console.info("========> Rosebud : " + JSON.stringify(response.payload)); }
                storage.setItem("icarusi_user", response.payload.username);
                storage.setItem("rosebud_uid", response.payload.rosebud_uid);
                storage.setItem("poweruser", response.payload.extra_info.poweruser);
                storage.setItem("geoloc_enabled", response.payload.extra_info.geoloc_enabled);
                icarusi_user = response.payload.username;
                rosebud_uid = response.payload.rosebud_uid;
                //console.info(rosebud_uid);
                $("#logged").html('Logged in as <span style="color:green">' + storage.getItem("icarusi_user") + '</span>');
                $("#popupLogin").popup("close");
                $("#login_message").html(response.payload.message);
                $("#popupLoginResult").popup("open");
                show_post_login_features();
            } else {
                console.info("========> Rosebud : Login unsuccessful");
            }
        })
        .fail(function (err) {
            alert(err.responseJSON.payload.message);
            console.info("========> Rosebud : error during login");
        })
        .always(function () {
            loading(false, "Logging in...");
        });
*/
}
