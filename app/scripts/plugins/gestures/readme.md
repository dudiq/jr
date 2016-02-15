## gestures

how to use gestures

in controller define gesture module

```
(function(){

	var app = window.app;
    var gestures = app('gestures');
	//some code
	//...

// when you create page class, define gesture in `prepareDomContent` method
    var page = pages.createClass();
    var p = page.prototype;

    p.prepareDomContent = function(content){

        var swipeLeftCl = gestures('swipe-left');
        var swipeLeft = new swipeLeftCl(content.find('.gesture-left'), {
            maxLen: 100// optional
        });
		//some code
   	    //...
    };

})();
```
that's all