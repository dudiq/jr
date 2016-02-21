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
* karma (`npm install karma -g`)
* karma-cli (`npm install karma-cli -g`)

then do:

* clone repo
* goto repo root
* run `npm install`
* copy `/app/scripts/dev-config.js` to `/app/scripts/config.js` (for local run app) or just run `grunt build`.
* run `grunt server` for local development or see other tasks and keys in `build.md`

> if `npm install` crashes with karma dependencies, try to remove from package.json all karma tasks and run again `npm install`.
> this problem was happens with latest version of karma running on windows/linux systems
