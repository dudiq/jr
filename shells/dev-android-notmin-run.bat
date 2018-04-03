call cd ..
call grunt build --image-set-prefix=dev- --minify=core,corePlugins --cordova-id=com.my.app.id
call cordova run android
