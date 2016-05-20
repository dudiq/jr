How to (installation guide)
-

> for windows:
 install visual studio express edition for correct install grunt gyp package

at first, install:

* nodejs (latest stable version)
* git (cli)
* mercurial hg (cli) (if your project using mercurial repo)
* grunt (`npm install grunt -g`)
* grunt-cli (`npm install grunt-cli -g`)
* python (latest stable version)

then do:

* clone repo
* goto repo root
* run `npm install`
* copy `/app/scripts/dev-config.js` to `/app/scripts/config.js` (for local run app) or just run `grunt build`.
* run `grunt server` for local development or see other tasks and keys in `build.md`