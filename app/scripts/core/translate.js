/*
 *  translate module
 *
 *  just store and give us words with current language
 *
 *
 *  ATTENTION!
 *  see also first script after <body> tag, where sets jr-lang-[language]
 *
 * */
(function (app) {
    var helper = app('helper');
    var broadcast = app('broadcast');
    var translateEvs = broadcast.events('translate', {
        onLangSet: 'onLangSet'
    });

    var logger = app('logger')('translate');
    var startLang = ((navigator.language || navigator.userLanguage) + '').substring(0, 2).toLowerCase();
    var currLang = startLang;
    var currentWords = {};
    var collection = {};
    var subColls = {};

    var numberFormaters = {};
    var canUseIntl = (typeof window.Intl != 'undefined');

    var includesReg = new RegExp('{{.*?}}', 'ig');

    // return translate from text
    // for example getTranslate('mainPage.goToTree');
    // return text 'open tree page', defined in langs/en[ru].js
    // if not defined, just returned '{{mainPage.goToTree}}' text
    //
    // if need some replaces doing, use %s keys as you have arguments in method. define in lang strings
    // getTranslate('mainPage.goToTree', 'text for replace1', 'second replace', ...);
    function translate(key) {
        var ret = getSingleTranslate(key);

        if (arguments.length > 1) {
            for (var i = 1, l = arguments.length; i < l; i++) {
                var msg = getSingleTranslate(arguments[i]);
                ret = ret.replace('%s', msg);
            }
        }
        return ret;
    }

    app('translate', translate);

    //create new translated words by lang and return it
    function setCurrentWords() {
        var collWords = collection[currLang] || {};
        helper.clearObject(currentWords);
        translate.buildWords(collWords, currentWords);
        var subCollWords = subColls[currLang];
        !helper.isEmpty(subCollWords) && translate.buildWords(subCollWords, currentWords);
    }

    function getSingleTranslate(key) {
        var subKey = (key && key[0] == '{' && key[1] == '{') ?
            key :
            "{{" + key + "}}";

        var currWord = currentWords[subKey];
        var ret = (currWord !== undefined) ? currWord : key;
        return ret;
    }

    function getNumByLang(number, lang) {
        var ret = number;
        lang = lang || currLang;
        if (numberFormaters[lang] && !isNaN(number - 0)) {
            ret = numberFormaters[lang].format(number);
        }
        return ret;
    }

    helper.extendObject(translate, {
        // build list of words by object for correct translate from strings
        buildWords: function (obj, toList) {
            var ret = toList || {};
            helper.treeObjectToList(obj, function (hash, data) {
                var newKey = "{{" + hash + "}}";
                ret[newKey] = data;
            });
            return ret;
        },

        //change lang of all APP, it will redraw all pages
        setLang: function (lang) {
            if (collection[lang]) {
                updateBodyClass(lang);
                currLang = lang;
                setCurrentWords();
                broadcast.trig(translateEvs.onLangSet, currLang);
            }
        },

        // return current setted lang
        getCurrLang: function () {
            return currLang;
        },

        // return default lang
        getStartLang: function () {
            return startLang;
        },

        text: function (template) {
            var newTpl = template;
            if (newTpl) {
                includesReg.lastIndex = 0;
                var matches = newTpl.match(includesReg);
                if (matches) {
                    for (var i = 0, l = matches.length; i < l; i++){
                        var key = matches[i];
                        var val = currentWords[key];
                        if (val !== undefined) {
                            newTpl = newTpl.replaceAll(key, val);
                        }
                    }
                }
                matches = null;
            }
            // old way
            // var newTpl = helper.replaceInText(template, currentWords);
            return newTpl;
        },

        // checking translate exist
        isExist: function (key) {
            var subKey = "{{" + key + "}}";
            var exist = !!currentWords.hasOwnProperty(subKey);
            return exist;
        },

        // start point for translate words,
        // started in templater module
        _start: function () {
            if (collection[currLang]) {
                currLang = currLang;
            }
            setCurrentWords();

            // set cap for do not start after first start
            translate._start = function () {
            };
        },

        num: function (number, lang, precision) {
            if (typeof lang == 'number') {
                precision = lang;
                lang = undefined;
            }
            var ret = '';
            if (precision !== undefined) {
                var dx = Math.pow(10, precision);
                var bigNum = Math.floor(number * dx);
                var floatDx = 1 / (dx * 10);

                var int = Math.floor(number);
                var float = Math.floor(bigNum - int * dx) / dx;
                float += floatDx;

                var localeInt = getNumByLang(int, lang);
                var localeFloat = getNumByLang(float, lang);
                localeFloat = localeFloat.substring(1, localeFloat.length - 1);

                ret = localeInt + ((localeFloat.length > 1) ? localeFloat : '');
            } else {
                ret = getNumByLang(number, lang);
            }

            return ret;
        },

        addSubWords: function (lang, wordsTree) {
            logger.warn('pushing to main collections', lang, wordsTree);
            subColls[lang] = wordsTree;
        },

        // add words to langs if they was defined in other modules
        addWords: function (lang, wordsTree) {
            registerNumFormatter(lang);

            if (wordsTree) {
                if (collection[lang]) {
                    // push to main langs
                    logger.error('trying to define already defined lang!', lang, wordsTree);
                } else {
                    collection[lang] = wordsTree;
                }
            }
            return collection[lang];
        }
    });

    function updateBodyClass(newLang) {
        var body = document.body;
        var classNames = body.className.split(' ');
        var prevClass = 'jr-lang-' + currLang;
        var nextClass = 'jr-lang-' + newLang;
        for (var i = 0, l = classNames.length; i < l; i++) {
            if (classNames[i] == prevClass) {
                classNames.splice(i, 1);
            }
        }
        classNames.push(nextClass);
        body.className = classNames.join(' ');
    }


    function registerNumFormatter(lang) {
        canUseIntl && !numberFormaters[lang] && (numberFormaters[lang] = new Intl.NumberFormat(lang));
    }

})(window.app);
