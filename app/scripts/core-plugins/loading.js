(function(){
    var app = window.app;
    var helper = app('helper');
    var translate = app('translate');

    var isHidden = false;

    var hider = app('app-loading', function () {
        hide();
    });

    hider.immediately = function () {
        hide(true);
    };

    var loadingDom = document.querySelector('.jr-loading');
    var textDom = document.querySelector('.jr-loading-text');
    textDom && (textDom.innerHTML = translate.getTranslate('loading.title'));

    var cssClass = loadingDom && loadingDom.className;

    if (!!window.preventJr){
        loadingDom && (loadingDom.className = cssClass + ' ' + 'l-hide');
    } else {
        helper.onStartEnd(function(){
            // must be run before all other modules
            setTimeout(function(){
                hide();
            }, 10);
        });
    }

    function hide(isImmediately) {
        if (!isHidden){
            isHidden = true;
            if (loadingDom){
                isImmediately && (loadingDom.className = cssClass + ' ' + 'jr-loading-no-animate');
                (loadingDom.className = loadingDom.className + ' ' + 'jr-loading-hide');
            }

        }
    }

})();
