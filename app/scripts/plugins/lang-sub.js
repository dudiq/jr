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

    langSub.regSub = function(id, lang, words){
        var coll = collection[id] = collection[id] || {};
        if (coll[lang]){
            logger.error('sub for "' + id + '" in lang="' + lang + '" is already exist');
        } else {
            coll[lang] = words;
        }
    };

    // for test only
    langSub.setSubstituteId = function(id){
        currId = id;
        var currLang = translate.getCurrLang();
        translate.setLang(currLang);
    };

    useConf.on(function(){
        currId = config.id;
        var currLang = translate.getCurrLang();
        setCurrent(currLang);
    });

    function setCurrent(currLang){
        var coll = collection[currId];
        if (currId && coll && coll[currLang]){
            var collLang = coll[currLang];
            var processedWords = translate.buildWords(collLang);
            translate.setSubstitute(currLang, processedWords);
        }
    }

    broadcast.on(langEvs.onLangSet, function(currLang){
        setCurrent(currLang);
    });
})();