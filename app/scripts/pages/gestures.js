(function () {
    var app = window.app;
    var navi = app('navigation');
    var gestures = app('gestures');

    app('pages').create({
        id: 'gestures',
        weight: 5,
        prepareDomContent: function (content) {

            content.find(".btn-tree").on("jrclick", function () {
                navi.switchPage('tree');
            });

            var swipeLeftCl = gestures('swipe-left');
            var swipeLeft = new swipeLeftCl(content.find('.gesture-left'), {
                maxLen: 100
            });


            var swipeRightCl = gestures('swipe-right');
            var swipeRight = new swipeRightCl(content.find('.gesture-right'));


            var swipeTopCl = gestures('swipe-top');
            var swipeTop = new swipeTopCl(content.find('.gesture-top'));


            var swipeBottomCl = gestures('swipe-bottom');
            var swipeBottom = new swipeBottomCl(content.find('.gesture-bottom'), {
                maxLen: 100
            });

            var slrCl = gestures('swipe-left-right');
            var slr = new slrCl(content.find('.gesture-lr'), {
                maxLen: 100
            });


            // example for create own swipe custom
            var directions = gestures('directions');
            var customClass = gestures('swipe-base');
            var el = content.find('.gesture-custom');
            var directionStarted;
            var custom = new customClass(el, {
                direction: [directions.west, directions.south],
                onStart: function (data, ev) {
                    directionStarted = data.direction;
                },
                onMove: function (data, ev) {
                    if (directionStarted == directions.west) {
                        var dx = data.dx;
                        el.css('transform', 'translateX(' + dx + 'px)');
                    } else {
                        var dy = data.dy;
                        el.css('transform', 'translateY(' + dy + 'px)');
                    }
                }
            });
        }
    });
})();
