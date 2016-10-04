## Cordova cli installation
### install:

preparations:

 - nodejs (if not installed)
 - mercurial hg (cli) (if not installed)
 - call "`npm install -g cordova`"

for android build:

 - java jdk
 - java jre
 - android sdk
 - ant

for ios build:

 - xcode

for windows build:

 - visual stiduo
 - windows sdk

how to install cordova and create own project, read this topic http://cordova.apache.org/#getstarted

> for release, please use `cordova build android --release`

> for debug version, please use `cordova build android`

> for logging errors or something else, use `adb logcat CordovaLog:D *:S`

for automatically install/remove cordova plugins, read/write `shells/plugins/*` scripts
