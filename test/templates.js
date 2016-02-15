(function(){
    var app = window.app;

    // this is need to correct work of templater, because karma can't get html content as is

    // this wrapper is fix getting all templates as is

    // all html files will be preprocessed by `html2js`
    var html2jsData = window.__html__;

    if (html2jsData){
        var data = {};

        // each view have 'app/views/myview.hmtl', we need myview as key to define them in templater
        var match = 'app/views/';
        var endMatch = '.html';
        var startPos = match.length;
        for (var key in html2jsData){
            if (key.indexOf(match) == 0){
                var lastPos = key.lastIndexOf(endMatch);
                var newKey = key.substring(startPos, lastPos);
                data[newKey] = html2jsData[key];
            }
        }

        // and also checking how templater.set working.
        app('templater').set(data);
    }
})();
