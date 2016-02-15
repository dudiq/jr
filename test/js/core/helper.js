describe('helper testing', function(){
    var app = window.app;
    var helper = app('helper');
    it('clone checking', function (done) {
        var obj1 = {
            field: {
                subData: 1
            }
        };
        var obj2 = helper.clone(obj1);
        assert.equal(obj1.field == obj2.field, false);
        done();
    });
    it('guid helper', function (done) {

        var map = {};
        var founded = false;
        for (var  i = 0; i <= 1000; i ++){
            var guid = helper.guid();
            if (map[guid]){
                founded = true;
                break;
            }
            map[guid] = true;
        }


        assert.equal(founded, false);
        done();
    });
    it('escaped text', function(done){
        var escaped = helper.getEscapedText('<test>');
        assert.equal(escaped, '&lt;test&gt;');
        done();
    });
    it('isEmpty checking', function(done){
        assert.equal(helper.isEmpty(null), true);
        assert.equal(helper.isEmpty(undefined), true);
        assert.equal(helper.isEmpty(''), true);
        assert.equal(helper.isEmpty({}), true);
        assert.equal(helper.isEmpty({test:1}), false);
        assert.equal(helper.isEmpty([]), true);
        assert.equal(helper.isEmpty([1]), false);
        assert.equal(helper.isEmpty(0), false);
        assert.equal(helper.isEmpty(false), false);
        assert.equal(helper.isEmpty(true), false);
        assert.equal(helper.isEmpty('text'), false);
        done();

    })
});