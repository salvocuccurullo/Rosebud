# Rosebud (formerly known as iCarusiTheApp)

Plugins List (version number may change, please ignore it):

- com.napolitano.cordova.plugin.intent 0.1.3 "IntentPlugin"
- cordova-plugin-app-version 0.1.9 "AppVersion"
- cordova-plugin-browsertab2 0.3.1 "cordova-plugin-browsertab2"
- cordova-plugin-buildinfo 4.0.0 "BuildInfo"
- cordova-plugin-cryptography-aes 1.0.7 "CryptographyAES"
- cordova-plugin-device 2.0.3 "Device"
- cordova-plugin-file 6.0.2 "File"
- cordova-plugin-firebasex 11.0.3 "Google Firebase Plugin"
- cordova-plugin-geolocation 4.0.2 "Geolocation"
- cordova-plugin-googlemaps 2.6.2 "cordova-plugin-googlemaps"
- cordova-plugin-inappbrowser 3.1.0 "InAppBrowser"
- cordova-plugin-network-information 2.0.2 "Network Information"
- cordova-plugin-screen-orientation 3.0.2 "Screen Orientation"
- cordova-plugin-splashscreen 5.0.3 "Splashscreen"
- cordova-plugin-whitelist 1.3.4 "Whitelist"
- cordova-universal-links-plugin-v2 2.0.0 "Universal Links Plugin"
- es6-promise-plugin 4.2.2 "Promise"

- - - -
**01-MAR-2021**
 - Upgraded _cordova-android_ from 8.1.0 to 9.0.0
 - Removed _cordova-plugin-firebase-lib_
 - Added _cordova-plugin-firebasex_

Added to _config.xml_

    <preference name="android-minSdkVersion" value="22" />
    <preference name="AndroidXEnabled" value="true" />
    <preference name="GradlePluginGoogleServicesEnabled" value="true" />
    <preference name="GradlePluginGoogleServicesVersion" value="4.2.0" />
    <plugin name="cordova-plugin-firebasex">
        <variable name="ANDROID_FIREBASE_CONFIG_FILEPATH" value="./google-services.json" />
    </plugin>

- - - -

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

- - - -
**21-JAN-2020**
Build was not working anymore because of this:
```
  Dependency failing: com.google.firebase:firebase-messaging:19.0.1 -> com.google.firebase:firebase-iid@[19.0.1], but firebase-iid version was 20.0.2
```

Editing the file _platforms/android/project.properties_

line:
```
cordova.system.library.4=com.google.firebase:firebase-messaging:19.+
```
has been replaced with:
```
cordova.system.library.4=com.google.firebase:firebase-messaging:20.+
```

issue sorted.

- - - -
If there are unwated permissions added to AndroidManifest.xml:

* add the permissions you need on config.xml
* delete the unwanted from ```\platforms\android\app\src\main\AndroidManifest.xml```
* delete the unwanted from ```\platforms\android\android.json```

Rebuild. The unwanted permissions should be gone.
