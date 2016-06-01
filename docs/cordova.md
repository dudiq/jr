##Cordova

###preparations:

####install:
 - nodejs (if not installed)
 - mercurial hg (cli) (if not installed)
 - git for windows(linux, macos) (if not installed)
 - call in command line "`npm install -g cordova`"
 - create in root folder `platforms` and `plugins` folders if not exist

####install for android build:
 - java jdk
 - java jre
 - android sdk
 - ant


how to install cordova and create own project, read this topic http://cordova.apache.org/#getstarted

> for release, please use `cordova build android --release`

> for debug version, please use `cordova build android`

> for logging errors or something else, use `adb logcat CordovaLog:D *:S`

for automatically install/remove cordova plugins, read/write `shells/plugins/*` scripts