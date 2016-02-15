JR structure and etc...
=

#Folders

>root
>>app - main folder of project
>>docs - documentation
>>shells - script files
>>tasks - grunt tasks
>>test - files for testing in karma
>>ui-test - files for UI testing, choosed by you

####docs:
> documentation files

####shells:
> for run commands, like build, live, test, add/remove cordova plugins, etc... for fast run

####tasks:
>tasks folder for grunt, if needed own task, put it here and define in `gruntfile.js`

####test/ui-test:
>test folder have `js` folder for create you own unit/ui tests of code

####main folder of project:
>app:
>
>`fonts`- folder for fonts, defined in css
>`images` - folder for images, defined in css
>`scripts` - all scripts
>`styles` - just styles
>`views`- views for controllers
>`config.xml` - xml for cordova build, you can use own config.xml file for build
>`cordova.js` - just a cap for correct run web version of project
>`index.html` - base html file for SPA project, where defined all files. scripts and styles. used for build and live watch

####app/styles:
>styles:
> all core styles defined in `jr/` folder, usually with `jr-` prefix. all other files are yours. please put your page styles into `styles/pages` folder, for correctly separate they.

#Js structure

####app/scripts:
>scripts:
> framework used **jQuery** for define event binding to DOM elements, accessing to `data` attributes and do manipulates in DOM.
>>`core` - base folder with all **must have**
>>`langs` - defined user languages
>>`pages` - all pages
>>`plugins` - plugins
>>`services` - special plugins for create communication between server and client, why it in separated folder? for separate logic of some plugins and server calls
>>`vendors` - all vendors what you need
>>`dev-config.js`, `dist-config.js` - this is files for develop and production builds. `dev-config.js` will be using as default config.
>>`jr-config.js` - config for JR framework
>>`myApp.js` - main file of app logic

####app/scripts/core:
>>`broadcast` - for bind and trigger events. also storage of all events. used for detect collisions of different events (checking messages). and showing it in developer console.
>>`cookie` - for access to cookies
>>`errors` - for logging errors or warnings or just logs into console output (for debug in dev and production)
>>`helper` - all helpers what you need to write own code
>>`http` - AJAX calls.
>>`js-overwrites` - methods what JR needs in javascript
>>`local-storage` - helper for simple use localStorage of browser
>>`main` - module for create any other module/plugin/subplugin/etc... this is start point of all modules.
>>`navigation` - for manipulate pages in DOM, switching between them, using animation (defined in jr-config)
>>`page` - base class of page (controller)
>>`page-auth` - acl module of pages. for correct showing pages in some cases, when we need check permissions for example.
>>`pages` - collection of all pages
>>`route` - routing address bar in browser
>>`storage` - simple key/value storage for communicate between modules/plugins/etc. store object only in run. when app is terminated, storage is cleaned.
>>`suspend` - own "deffered" object.
>>`templater` - templater for processing views in pages
>>`templater-data` - for build of framework. in this file stored all views as JSON object
>>`translate` - for translate views in automatical mode or translate words by calling from code. all words defined in `app/scripts/langs`

#some use cases
- **examples**:
see examples in `app/scripts/pages`, `app/views`, `app/styles`

- **creating new file**:
all **new** js files must be in closure, like
```
(function(){
   var app = window.app;
// define modules
   var helper = app('helper');
   var myModule1 = app('my-module-x');

// my own code...
   myModule('show message');

})();
```

- `click` **action to DOM element**
always use `jrclick` if you need process click to element. do not use `click`, `mousedown`, `tapstart`, etc. because they not processed as it need in SPA for different browsers and platforms equally
```
function bindMyButtonClick(content){
	content.find('.my-btn').on('jrclick', function(){
		// this - is default jQuery context for DOM element
		$this = $(this);
		$this.hide();
		// do some action
	});
}
```
- **switching pages**
-- for change page correctly use `app('navigation').switchPage('pageId', {key1: 1, key2: 2})`; second parameter - is keys for set in address bar, separated by `/`
-- for set/get/remove keys in address bars for current page, use route commander plugin `app('route-commander)`, also you can bind to changes of each key in address bar


- **Broadcast and Event Storage**
`broadcast` - this module needs to broadcast some message in app. for example say all, that my plugin was done some action.

```
(function(){
	var app = window.app;
	var broadcast = app('broadcast');
	var myPluginEvs = broadcast.putEvents('my-plugin', {
		'onStart':'onStartMsg',
		'onStop':'onStopMsg',
		'onStopAfter': 'onStopMsg' //this is wrong. `broadcast` detect this, because message is equal with prev event name. and will notify developer in console.
	});
	// some code

	function myClick(){
		broadcast.trig(myEvs.onStart, {data:'my own data1'});
	}
})();
```
then you can use this event in other plugins

```
(function(){
	var app = window.app;
	var broadcast = app('broadcast');
	var myPluginEvs = broadcast.getEvents('my-plugin');
	var helper = app('helper');

	function whenSomeEventTrigger(ev){
	    var message = ev.data; // will be 'my own data1'
	    alert(message);
	}

	// helper for detect start system
	helper.onStart(function(){
		broadcast.on(myPluginEvs.onStart, whenSomeEventTrigger);
	});
})();
```

- **How to translate from code**

```
(function(){
	var app= window.app;
	var translate = app('translate');

	var word = translate.getTranslate('test.my-word');
})();
```
`my-word` string must be defined in `langs` files

for example `en.js`
```
(function(){
    var app = window.app;
    var translate = app('translate');
    translate('en', {
        "hashone": "this is test",
        "test": {
            "ver1" :"testver 1, yeahh!",
            "ver2" :"testver 2, yeahh!",
            "my-word": "My Word!"
        }
    });

})();
```

- **How to use translates**

in views, define any lang variable like
```
<div>{{myPage.titleOfPage}}</div>
{{include(myPage/subContentOfPage)}}
```

in `langs/en.js` you have code like this
```
(function(){
    var app = window.app;
    var translate = app('translate');
    translate('en', {
        title: 'myApp',
        myPage: {
	        titleOfPage: 'This is title of page'
        }
...
```
when you page will be shown in DOM, each {{myPage.titleOfPage}} will be changed from directives in `langs/en.js` or other language, what you defined. language will detect by browser, it's system language.

also views used `{{include(absolute/path/to/page/view)}}` for split equal html in different pages

- **prevent start of framework**
system can be prevented to start by define `window.preventJr = true` before run framework

- **wait `start` trigger before plugin init finished**
use `app.wait()` method, and run them, when you are ready.
```
(function(){
	var app = window.app;
	var waiter = app.wait();

	setTimeout(function(){
		//system will know, that app can start. when all waiters will be called.
		// in other case, system will wait and will show loading DIV.
		waiter()
	}, 5000);
})();
```

#Workflow

 - wait for waiters( `var w = app.wait()` ) calling and the trigger `systemEvs.onStart`
 - all binds, helper.onStart(myHandler) will be executed
 - after core trigger `systemEvs.onStartEnd`
 - all binds, helper.onStartEnd(myHandler) will be executed
 - `route` start catching address bar value and detect first value, then trying to send message, that location defined(or changed)
 - each page have own alias parameter, if page have the same alias of the router value, this page will be shown by navigator. this is logic in `pages` collection, when page creates, `pages` module also define rule for route too.
 - `navigator` checking permissions of page by `page-auth` and show content of page or not. also each page have `weight` parameter, for detect direction of switching between pages (back/forward).

#Pages
- pages (or controllers) is communication level between views and other js modules.
- each page have prototype, defined in `app/scripts/core/page.js`
- method with `_` are not rewrited (`._detach` for example)
- methods what can be redefined, defined by comment like `//can be redefined` see in `core/page.js` file
- page rendered when:
	- first show;
	- language was changed;
- when page was left and then comeback, it does not render again, just append content to DOM and that's all


#Plugins

how to create new plugin and access to them?
- create file in `/plugins`
- put him to `plugins` section in index.html

```
(function(){
	var app = window.app;
	var myPlugin = app('my-plugin', {});
	var myPluginFunc = app('my-plugin-f', function(val){
		return val + 10;
	});

	myPlugin.alert = function(msg){
	    alert(msg);
	};

})();
``` 
for accessing in others plugins use 

``` 
(function(){
    var app = window.app;
    var mp = app('my-plugin')
    var mpf = app('my-plugin-f');
    
    var val = mpf(10);
    mp.alert(val);// will show 100 in alert message;

})();
``` 

for more details, see examples in `/plugins` folder

#What can be changed?

you can change all you need, but if you know, how it works =)