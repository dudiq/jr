(function(){
    var app = window.app;
    var helper = app('helper');
    var translate = app('translate');

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
                loadingDom && (loadingDom.className = cssClass + ' ' + 'l-hide');
                window._checkingStart && window._checkingStart();
            }, 10);
        });
    }

})();