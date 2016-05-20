(function(){
    var app = window.app;
    var translate = app('translate');
    var broadcast = app('broadcast');
    var config = app('app-config');
    var logger = app('logger')('lang-sub');
    var langEvs = broadcast.events('translate');
    var useConf = app('use-my-config');

    var langSub = app('lang-sub', {});

    var collection = {};
    var currId = null;
    var subSet = false;

    langSub.regSub = function(id, lang, words){
        var coll = collection[id] = collection[id] || {};
        if (coll[lang]){
            logger.error('sub for "' + id + '" in lang="' + lang + '" is already exist');
        } else {
            coll[lang] = words;
        }
    };

    useConf.on(function(){
        currId = config.id;
        var currLang = translate.getCurrLang();
        if (isSubstitute(currLang)){
            if (!app.startEnd){
                setCurrent(currLang);
            } else {
                translate.setLang(currLang);
            }
        } else {
            // just clear for not in substitute
            if (subSet){
                subSet = false;
                translate.setLang(currLang);
            }
        }
    });

    function isSubstitute(currLang){
        var coll = collection[currId];
        var ret = !!(currId && coll && coll[currLang]);
        return ret;
    }

    function setCurrent(currLang){
        var coll = collection[currId];
        if (currId && coll && coll[currLang]){
            var collLang = coll[currLang];
            var processedWords = translate.buildWords(collLang);
            translate.setSubstitute(processedWords);
            subSet = true;
        }
    }

    broadcast.on(langEvs.onWordsProcessed, function(currLang){
        setCurrent(currLang);
    });
})();