How to (installation guide)
-

> for windows:
 install visual studio express edition for correct install grunt gyp package

at first, install:

* nodejs
* git (cli)
* mercurial hg (cli) (if your project using mercurial repo)
* grunt (`npm install grunt -g`)
* grunt-cli (`npm install grunt-cli -g`)
* ruby
* ruby-gems (`gem update --system` and second `gem install rubygems-update`)
* in cmd run `gem install compass` after installed ruby-gems
* python 2.7.6 (but try install latest, maybe they fixed old problems)
* karma (`npm install karma -g`)
* karma-cli (`npm install karma-cli -g`)
* dalekjs (`npm install dalek-cli -g`)


then do:

* clone repo
* goto repo root
* run `npm install`
* copy `/app/scripts/dev-config.js` to `/app/scripts/config.js` (for local run app)
* run `grunt server` for local development or see other tasks and keys in `build.md`

> if `npm install` crashes with karma dependencies, try to remove from package.json all karma tasks and run again `npm install`.
> this is problem with latest version of karma runnig on windows/linux systems
