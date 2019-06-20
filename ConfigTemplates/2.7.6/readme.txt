<plugin name="cordova-plugin-app-version" spec="^0.1.9" />
 <plugin name="cordova-plugin-cryptography-aes" spec="^1.0.7" />
 <plugin name="cordova-plugin-network-information" spec="^2.0.1" />
 <plugin name="cordova-plugin-device" spec="^2.0.2" />
 <plugin name="cordova-plugin-file" spec="^6.0.1" />
 <plugin name="cordova-plugin-geolocation" spec="^4.0.1" />
<plugin name="com.napolitano.cordova.plugin.intent" spec="https://github.com/napolitano/cordova-plugin-intent" />
<plugin name="cordova-plugin-buildinfo" spec="^2.0.2" />
<plugin name="cordova-plugin-splashscreen" spec="^5.0.2" />

<plugin name="cordova-universal-links-plugin" spec="^1.2.1" />          OLD
<plugin name="cordova-universal-links-plugin-v2" spec="^x.x.x" />       NEW     PER APRIRE I LINK ESTERNI

 <plugin name="cordova-plugin-inappbrowser" spec="^3.0.0" />                    PER APRIRE I LINK ESTERNI

cordova plugin add cordova-plugin-firebase-lib --save
cordova plugin add cordova-android-firebase-gradle-release --variable FIREBASE_VERSION=17.+ --save
cordova plugin add cordova-android-play-services-gradle-release --variable PLAY_SERVICES_VERSION=16.+ --save

========================================================================


 <plugin name="cordova-plugin-firebase-authentication" spec="^1.1.2">
     <variable name="FIREBASE_AUTH_VERSION" value="16.1.+" />
 </plugin>
 <plugin name="cordova-support-google-services" spec="^1.2.1" />

 <plugin name="cordova-android-support-gradle-release" spec="^3.0.0" />
 <plugin name="cordova-plugin-googleplus" spec="^7.0.1" />

 <plugin name="cordova-android-firebase-gradle-release" spec="^3.0.0">
     <variable name="FIREBASE_VERSION" value="+" />
 </plugin>

 <plugin name="cordova-android-play-services-gradle-release" spec="^3.0.0">
     <variable name="PLAY_SERVICES_VERSION" value="+" />
 </plugin>

 <plugin name="cordova-plugin-whitelist" spec="^1.3.3" />
 <plugin name="com-sarriaroman-photoviewer" spec="^1.2.2" />

========================================================================

 This week a new library version has been released from firebase. It seems that there is a missmatch between used libraries from google play. I faced the same and other similar errors during build process.
I used with the same version ( #GH-1057-April-05-android-build-issue) and it worked lasth month (31 May) without problems - yesterday, without any change of the plugins by myself, the build failed (Execution failed for task ‘:app:transformDexArchiveWithExternalLibsDexMergerForDebug’.)
After trying several things I could build again after install additional Gradle-Plugins for define version of google-play and firebase.

Try to define which firebase library you are using with this plugin, e.g.:

cordova plugin add cordova-android-firebase-gradle-release --variable FIREBASE_VERSION=17.+ --save

Then define which version of google play services you are using with the sister-plugin, e.g.:

cordova plugin add cordova-android-play-services-gradle-release --variable PLAY_SERVICES_VERSION=16.+ --save

Check if you have additional google plugins which depends also on google play service, e.g. cordova-plugin-googlemaps where you could define PLAY_SERVICE_VERSION as well
In my case it worked with FIREBASE_VERSION=17.+ and PLAY_SERVICES_VERSION=16.+
Hope it helps
