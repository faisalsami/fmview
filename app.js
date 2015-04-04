EWD.sockets.log = true;

EWD.application = {
    name: 'fmview',
    timeout: 3600,
    labels: {
        'ewd-title': 'Fileman View',
        'ewd-navbar-title-phone': 'FM View',
        'ewd-navbar-title-other': 'FM View'
    },
    enableSelect2: function(authorization) {
        $("#selectedFile").select2({
            minimumInputLength: 1,
            query: function (query) {
                EWD.application.select2 = {
                    callback: query.callback
                };
                EWD.sockets.sendMessage({
                    type: 'fileQuery',
                    params: {
                        prefix: query.term,
                        authorization: authorization
                    }
                });
            }
        });
    },
    GenerateChart: function(file){
        document.getElementById('main_Container').innerHTML = "";
        EWD.sockets.sendMessage({
            type: 'fileSelected',
            params: {
                fileId: file,
                authorization: EWD.application.authorization
            }
        });
    },
    onStartup: function() {
        this.enableSelect2(EWD.application.authorization);
        $('body').on( 'click', '#fileBtn', function(event) {
            event.preventDefault();
            EWD.application.GenerateChart($('#selectedFile').select2('val'));
        });
        var getParameterByName = function(name) {
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                results = regex.exec(location.search);
            return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        }
        var initfile = getParameterByName('file');
        if(parseFloat(initfile)>0){
            EWD.application.GenerateChart(initfile);
        }
    },

    onPageSwap: {
    },

    onFragment: {

    },

    onMessage: {
        fileSelected: function(messageObj) {
            if(messageObj.message.error){
                alert(messageObj.message.error);
            }else{
                d3GenerationChart.drawChart(messageObj.message.results.fileDD,messageObj.message.results.name);
            }
            return;
        },
        fileMatches : function(messageObj){
            if (messageObj.params) {
                EWD.application.select2.results = messageObj.params;
            }
            else {
                EWD.application.select2.results = messageObj.message;
            }
            EWD.application.select2.callback(EWD.application.select2);
            return;
        }
    }

};
EWD.onSocketsReady = function() {
    if ($('#main_Container').length > 0) $('#main_Container').show();
    for (id in EWD.application.labels) {
        try {
            document.getElementById(id).innerHTML = EWD.application.labels[id];
        }
        catch(err) {}
    };
    if (EWD.application.onStartup) EWD.application.onStartup();
};
EWD.onSocketMessage = function(messageObj) {
    if (EWD.application.messageHandlers) EWD.application.messageHandlers(messageObj);
};