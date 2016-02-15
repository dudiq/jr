
## Build & Commands
> btw, most popular scripts is located in `/shells` folder

flags for `grunt build`:

 `grunt build` - compile all src to `www` folder for phonegap build
 `grunt server` - run developer server
 `--build-type=dev(true, any other)` - use DEV configs for build, if flag not defined, used DEV as default config
 `--build-type=release` - use for PRODUCTION build configs
 `--build-type=corporate` - use for CORPORATE build configs
 `--build-version=x.x.x` - use custom version value. if no need to use package.json:version field value
 `--minify=false` - for do not minify code
 `--rev-files=false` - for do not rename files as their revision. (windows build)
 `--config-mixin=my-config.js` - for define own my-config.js file for build, if value is not defined, it will use `dev-config.js`
 `--web=true` - for web server, NOT cordova version
 `--config-xml=my-config.xml` - for define special config xml
 `--copy-static=false` - copy www-static/* files to dist
 `--cordova-id` - set `id` value to config.xml
 `--port-reload` - set port and reload port for `grunt server` cmd

 `--exclude=module1,module2,etc...` - exclude modules for build
 `--excludeAll=true` - exclude all defined modules. flag `--exclude` will be dropped

other commands:
`grunt server` - run locally web server for develop
`karma start` - run tests