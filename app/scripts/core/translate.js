/*
 *  translate module
 *
 *  just store and give us words with current language
 * */
(function(){
    var app = window.app;
    var helper = app('helper');
    var broadcast = app('broadcast');
    var translateEvs = broadcast.events('translate', {
        onLangSet: 'onLangSet'
    });

    var logger = app('logger')('translate');
    var navLang = (navigator.language || navigator.userLanguage).substring(0, 2).toLowerCase();
    var currLang = 'en';
    var currentWords;
    var collection = {};
    var processed = {};
    var $body;

    var translate = app('translate', function(key, values){
        if (collection[key]){
            logger.error('"' + key + '" already defined');
        } else {
            collection[key] = values;
        }
        return collection[key];
    });

    //create new translated words by lang and return it
    function process(){
        var words = collection[currLang] || {};
        var processWords = words;
        if (!processed[currLang]){
            processWords = translate.buildWords(words);
            processed[currLang] = processWords;
            collection[currLang] = processWords;
        }

        return helper.clone(processWords);
    }

    function getSingleTranslate(key){
        var subKey = "{{" + key + "}}";
        var currWord = currentWords[subKey];
        var ret = (currWord !== undefined) ? currWord : key;
        return ret;
    }

    // build list of words by object for correct translate from strings
    translate.buildWords = function(obj){
        var ret = {};
        helper.treeObjectToList(obj, function(hash, data){
            var newKey = "{{" + hash + "}}";
            ret[newKey] = data;
        });
        return ret;
    };

    // set substitute processed words
    // they was used for replace translates
    translate.setSubstitute = function(lang, processedWords){
        if (currentWords){
            for (var key in processedWords){
                currentWords[key] = processedWords[key];
            }
        } else {
            logger.error('trying to set substitute before set words');
        }
    };

    //change lang of all APP, it will redraw all pages
    // :todo think how to change content without redraw???
    translate.setLang = function(lang){
        updateBodyClass(currLang, lang);
        currLang = lang;
        cleanCurrentWords();
        currentWords = process();
        broadcast.trig(translateEvs.onLangSet, currLang);
    };

    // getting translated hash array words for core using only
    translate._words = function(){
        return currentWords;
    };

    // return current setted lang
    translate.getCurrLang = function(){
        return currLang;
    };

    // return translate from text
    // for example translate.getTranslate('mainPage.goToTree');
    // return text 'open tree page', defined in langs/en[ru].js
    // if not defined, just returned '{{mainPage.goToTree}}' text
    //
    // if need some replaces doing, use %s keys as you have arguments in method. define in lang strings
    // translate.getTranslate('mainPage.goToTree', 'text for replace1', 'second replace', ...);
    translate.getTranslate = function(key){
        var ret = getSingleTranslate(key);

        if (arguments.length > 1){
            for (var i = 1, l = arguments.length; i < l; i ++){
                var msg = getSingleTranslate(arguments[i]);
                ret = ret.replace('%s', msg);
            }
        }

        return ret;
    };

    // checking translate exist
    translate.isExist = function(key){
        var subKey = "{{" + key + "}}";
        var exist = !!currentWords.hasOwnProperty(subKey);
        return exist;
    };


    // start point for translate words,
    // started in templater module
    translate._start = function(){
        cleanCurrentWords();
        onStart();
        currentWords = process();

        // set cap for do not start after first start
        translate._start = function(){};
    };

    // add words to langs if they was defined in other modules
    translate.addWords = function(lang, words){
        var col = collection[lang];
        if (!processed[lang]){
            // if lang NOT processed, just add to keys
            for (var key in words){
                if (!col[key]){
                    col[key] = words[key];
                } else {
                    logger.error('"' + key + '" already defined');
                }
            }
        } else {
            // if lang processed, process new words and add them
            var processWords = translate.buildWords(words);
            for (var ke in processWords){
                if (!col[ke]){
                    col[ke] = processWords[ke];
                } else {
                    logger.error('"' + ke + '" already defined');
                }
            }
        }
        return words;
    };

    function cleanCurrentWords(){
        if (currentWords){
            currentWords = {};
        }
    }

    function updateBodyClass(prev, next){
        !$body && ($body = $(document.body));
        $body.removeClass('jr-lang-' + prev);
        $body.addClass('jr-lang-' + next);
    }

    function onStart(){
        if (collection[navLang]){
            currLang = navLang;
            cleanCurrentWords();
        }
    }

    helper.onDomReady(function(){
        updateBodyClass(currLang, navLang);
    });


})();