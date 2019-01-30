/*global cordova, firebase, storage, DEBUG, loading, firebase_config */
/*googleAuthSuccess, googleAuthFailure */
/*eslint no-console: ["error", { allow: ["info","warn", "error"] }] */

"use strict";

/*
 * FIREBASE AUTH WITH GOOGLE
 */


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
