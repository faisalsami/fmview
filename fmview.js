// Re-usable core VistA interface functions
var getFilesByName = function(prefix, max, ewd) {
  var dicIndex = new ewd.mumps.GlobalNode("DIC", ["B"]);
  var results = [];
  var namesById = {};
  var i = 0;
    dicIndex._forPrefix(prefix.toUpperCase(), function(name, node) {
    node._forEach(function(id) {
      i++;
      if (i > max) return true;
      results.push({
        id: id, 
        text: name
      });
      namesById[id] = name;
    });
    if (i > max) return true;
  });
  return {
    results: results,
    namesById: namesById
  };
};

var getChildNode = function(filename,ewd){
    var result = {};
    var file = new ewd.mumps.GlobalNode("DIC", [filename, '0']);
    if(file._exists){
        var cfileName = '';
        var cfileName = file._value.split('^')[0] + ' [' + filename + ']';
        result.name = cfileName;
        result.children = [];
    }else{
        var file = new ewd.mumps.GlobalNode("DD", [filename, '0', 'UP']);
        result = getChildNode(file._value,ewd);
    }
    return result;
};

var getFilePointers = function(fileId, ewd) {
    var file0 = new ewd.mumps.GlobalNode("DIC", [fileId, '0']);
    var fileName = '';
    fileName = file0._value.split('^')[0] + ' [' + fileId + ']';
    var downward = {
        "direction":"downward",
        "name":"origin",
        "children": []
    };
    var upward = {
        "direction":"upward",
        "name":"origin",
        "children": []
    };
    var filePT = new ewd.mumps.GlobalNode("DD", [fileId, '0', 'PT']);
    filePT._forEach(function(name, node) {
        downward.children.push(
            getChildNode(name,ewd)
        );
    });
    var filePT = new ewd.mumps.GlobalNode("DD", [fileId]);
    filePT._forRange('0', 'A', function(name, node) {
        if(name == '0') return;
        if(isNaN(name)) return;
        var field0 = new ewd.mumps.GlobalNode("DD", [fileId, name, '0']);
        var field0arr = field0._value.split('^');
        if(field0arr[1].indexOf("P") > -1){
            if(field0arr[2].indexOf(",") > -1){
                var pfile0 = new ewd.mumps.GlobalNode(field0arr[2].split('(')[0], [field0arr[2].split('(')[1].split(',')[0], '0']);
                if(pfile0._exists){
                    var pfileName = '';
                    pfileName = pfile0._value.split('^')[0] + ' [' + pfile0._value.split('^')[1] + ']';
                    upward.children.push({
                        "name": pfileName,
                        "children": []
                    });
                }
            }else {
                var pfile0 = new ewd.mumps.GlobalNode(field0arr[2].split('(')[0], ['0']);
                if(pfile0._exists){
                    var pfileName = '';
                    pfileName = pfile0._value.split('^')[0] + ' [' + pfile0._value.split('^')[1] + ']';
                    upward.children.push({
                        "name": pfileName,
                        "children": []
                    });
                }
            }
        }
        if(field0arr[1].indexOf("V") > -1){
            var vpnode = new ewd.mumps.GlobalNode("DD", [fileId, name, "V", "B"]);
            vpnode._forEach(function(vfile, vfnode) {
                var file = new ewd.mumps.GlobalNode("DIC", [vfile, '0']);
                var pfileName = '';
                var pfileName = file._value.split('^')[0] + ' [' + vfile + ']';
                upward.children.push({
                    "name": pfileName,
                    "children": []
                });
            });
        }
    });
    return {
        "name": fileName,
        "fileDD" : {
            "upward": upward,
            "downward": downward
        }
  };
};

module.exports = {

  // EWD.js Application Handlers/wrappers

  onMessage: {
    fileQuery: function(params, ewd) {
        var results = getFilesByName(params.prefix, 40, ewd);
        ewd.session.$('files')._delete();
        ewd.session.$('files')._setDocument(results.namesById);
        ewd.sendWebSocketMsg({
          type: 'fileMatches',
          message: results.results
        });

    },
    fileSelected: function(params, ewd) {
        var file = new ewd.mumps.GlobalNode('DIC', [params.fileId]);
        if(!file._exists){
            return{
                error: params.fileId + ' file not exists.'
            }
        }
        ewd.session.$('fileIdSelected')._value = params.fileId;
        var results = getFilePointers(params.fileId, ewd);
        return {
            results: results,
            error: ''
        };
    }
  }
};