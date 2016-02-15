function getFiles(){
    var fs = require('fs');

    // insert files before id file
    var rulesBefore = {
        'scripts/core/templater-data.js': 'test/templates.js'
    };

    // processing file, searching ' karma ' tag and add this files to array
    function addFiles(path, pre, ret) {
        var ret = ret || [];
        pre = pre || "";
        var indexData = fs.readFileSync(path, 'utf8');
        var reg = /(<script)(.*)(>)/ig;
        var srcReg = /(src\s*=\s*('|")(.*)('|"))/ig;
        var result;
        while ((result = reg.exec(indexData)) !== null) {
            var inside = result[2];
            if (inside.indexOf(' karma ') != -1) {
                srcReg.lastIndex = 0;
                var fileParts = (srcReg.exec(inside));
                var filePart = fileParts[fileParts.length - 2];
                if (filePart){
                    ret.push(pre + filePart);
                    var item = rulesBefore[filePart];
                    if (item){
                        ret.push(item);
                    }
                }
            }
        }
        return ret;
    }


    var karmaFiles = [
        {pattern: 'node_modules/chai/chai.js', include: true},


        {pattern: 'test/fixtures/**/*.html', watched: false},

        {pattern: 'app/views/**/*.html', watched: false},

        'test/init.js'
    ];

    addFiles('app/index.html', 'app/', karmaFiles);

    karmaFiles.push('test/js/**/*.js');
    return karmaFiles;
}


module.exports = {
    getFiles: getFiles
};