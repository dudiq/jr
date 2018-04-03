(function (app) {

    var $body;
    var $window;
    var $document;
    var cbsBodyClick = app('on-callbacks')();
    var cbsBodyClickDemand = app('on-callbacks')();

    app.onDomReady(function () {
        defineBody();
        defineDocument();
        defineWindow();
    });

    var domEls = app('top-dom-elements', {
        getBody: function () {
            if (!$body){
                defineBody();
            }
            return $body;
        },
        getWindow: function () {
            if (!$window){
                defineWindow();
            }
            return $window;
        },
        getDocument: function () {
            if (!$document){
                defineDocument();
            }
            return $document;
        },
        onBodyClickDemand: function (cb) {
            !definedBodyClick && defineBodyClick();
            cbsBodyClickDemand.push(cb);
        },
        onBodyClick: function (cb) {
            !definedBodyClick && defineBodyClick();
            cbsBodyClick.push(cb);
        }
    });

    var definedBodyClick = false;
    function defineBodyClick() {
        definedBodyClick = true;
        domEls.getBody()
            .on('jrclick', {passPrevent:true}, function(){
                // this is hack for bind to body action
            })
            .on('jrafterclick', function () {
                cbsBodyClick.callCbs.apply(cbsBodyClick, arguments);
            })
            .on('jrdeffered', function(){
                cbsBodyClickDemand.callCbs();
            });
    }

    function defineBody() {
        !$body && ($body = $(document.body));
    }

    function defineWindow() {
        !$window && ($window = $(window));
    }

    function defineDocument() {
        !$document && ($document = $(document));
    }

})(window.app);
