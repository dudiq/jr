## Build & Commands
> btw, most popular scripts is located in `/shells` folder

 `grunt server` - run developer server
     `--port-reload=9000:35729` - set port:reloadPort for `grunt server` cmd
    `--hostname=0.0.0.0` - set host IP. if value is 0.0.0.0, this server will be accessed from outside


 `grunt build` - compile all src to `www` folder for phonegap build

     `--build-type=dev` - default value. for DEVELOPMENT. used `dev-config.js`
     `--build-type=release` - for PRODUCTION. used `dist-config.js`
     `--build-type=corporate` - for CORPORATE. used `corp-config.js`

     `--build-version=x.x.x` - for define custom version of app. instead `package.json:version` field value
     `--minify=false` - `true` by default. minify js, css files
     `--rev-files=false` - `true` by default. static asset revisioning through file content hash
     `--config-mixin=my-config.js` - for define own my-config.js file for build. keys and values from config-mixin will be used as primary.
     `--web=true` - `false` by default. make web app, NOT cordova version.
     `--config-xml=my-config.xml` - empty by default. for custom config.xml using
     `--copy-static=false` - `true` by default. copy from `www-static/**` to `www/`
     `--cordova-id=just.my.id` - set `id` value to config.xml. instead `package.json:cordova-id` field value

     `--exclude=module1,module2,etc...` - exclude modules for build
     `--excludeAll=true` - `false` by default. exclude all defined modules. flag `--exclude` will be dropped.


 `app('tester').run()'` - run unit tests. must be called in browser console