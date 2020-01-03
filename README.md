# Rosebud (formerly known as iCarusiTheApp)

Plugins List (version number may change, please ignore it):

- com.napolitano.cordova.plugin.intent 0.1.3 "IntentPlugin"
- cordova-plugin-app-version 0.1.9 "AppVersion"
- cordova-plugin-browsertab2 0.3.1 "cordova-plugin-browsertab2"
- cordova-plugin-buildinfo 4.0.0 "BuildInfo"
- cordova-plugin-cryptography-aes 1.0.7 "CryptographyAES"
- cordova-plugin-device 2.0.3 "Device"
- cordova-plugin-file 6.0.2 "File"
- cordova-plugin-firebase-lib 5.1.1 "Google Firebase Plugin"
- cordova-plugin-geolocation 4.0.2 "Geolocation"
- cordova-plugin-googlemaps 2.6.2 "cordova-plugin-googlemaps"
- cordova-plugin-inappbrowser 3.1.0 "InAppBrowser"
- cordova-plugin-network-information 2.0.2 "Network Information"
- cordova-plugin-screen-orientation 3.0.2 "Screen Orientation"
- cordova-plugin-splashscreen 5.0.3 "Splashscreen"
- cordova-plugin-whitelist 1.3.4 "Whitelist"
- cordova-universal-links-plugin-v2 2.0.0 "Universal Links Plugin"
- es6-promise-plugin 4.2.2 "Promise"

cordova plugin add cordova-plugin-firebase-lib --save  
cordova plugin add cordova-android-firebase-gradle-release --variable FIREBASE_VERSION=17.+ --save  
cordova plugin add cordova-android-play-services-gradle-release --variable PLAY_SERVICES_VERSION=16.+ --save  

1. Migrate project to AndroidX  

2. For Google Maps plugin on files _PluginMap.java_ and _PluginLocationService.java_ replace the below lines:
```
import android.support.annotation.NonNull;
import android.support.v4.content.PermissionChecker;
```
with  
```
import androidx.annotation.NonNull;
import androidx.core.content.PermissionChecker;
```

3. For BrowserTab plugin on file _BrowserTab.java_ replace the below line:

```
import android.support.customtabs.CustomTabsIntent;
```
with  
```
androidx.browser.customtabs.CustomTabsIntent;
```
