(function(){
    var app = window.app;
    var navi = app('navigation');

    app('pages').create({
        id: 'thr',
        weight: 6,
        viewId: 'pages/thr',
        prepareDomContent: function(content){
            content.find(".btn-second").on("jrclick", function(){
                navi.switchPage('main');
            });
        }
    });

})();