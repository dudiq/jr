JR
=

This is javascript framework to create simple Single Page Applications (SPA)

#### consist of ####

 - broadcast (simple communication module. using sync events)
 - cookie (cookie module)
 - errors logger (wrapper of console.log[warn, error])
 - helper (helper methods for using framework simply)
 - http adapter (jquery ajax wrapper module)
 - local-storage (wrapper of window.localStorage)
 - storage (just a memory storage, simple key->value storage)
 - navigation (slide pages and used routing)
 - routing (detect changes in url)
 - pages (communication between views and other parts of system)
 - page-auth (ACL for pages)
 - suspend (veeery simple '*deffered*' object)
 - templater (store and process views)
 - translate (multy language support)

Browser support
-
IE9+, Android 4.x, IOS 5.x, Chrome 30+, FF 4+

----------
## Docs
- [cordova preparation](docs/cordova.md)
- [how to install](docs/install.md)
- [tasks for build, run, test](docs/build.md)
- [features](docs/features.md)
- [jr structure](docs/structure.md)
- [version inserting](docs/version.md)
- [testing](docs/testing.md)


----------
## News

11/03/2016

- updated jquery to 2.2.1 version
- updated core plugins
- big update of watch scope plugins
- changed page initialize. old way will work too
- added simple modal-popup-page
- bug fixes

21/02/2016
- changed scss builder to `libSass`, instead of `compass`. please update node packages using 'npm i'
- separated core-plugins and others

----------

## License

MIT (c) 2016 dudiq

created at https://stackedit.io/