google.load("jquery", "1");
google.setOnLoadCallback(function() {
    initialize().then (
        function (control) {
            doTheTreeViz(control);
        }
    );
});

function doTheTreeViz(control) {

    var svg = control.svg;

    var force = control.force;
    force.nodes(control.nodes)
        .links(control.links)
        .start();

    // Update the links
    var link = svg.selectAll("line.link")
        .data(control.links, function(d) {
            return d.key;
        } );

    // Enter any new links
    var linkEnter = link.enter().insert("svg:line", ".node")
        .attr("class", "link")
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; })
        .append("svg:title")
        .text(function(d) { return d.target.name + ":" + d.source.name ; });

    // Exit any old links.
    link.exit().remove();


    // Update the nodes
    var node = svg.selectAll("g.node")
        .data(control.nodes, function(d) { return d.key; });

    node.select("circle")
        .style("fill", function(d) {
            return getColor(d);
        })
        .attr("r", function(d) {
            return getRadius(d);
        })

    // Enter any new nodes.
    var nodeEnter = node.enter()
        .append("svg:g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
        .on("dblclick", function(d){
            if(parseFloat(d.key)>0){
                var url = window.location.href;
                var uarr = url.split("/");
                control.nodeClickInProgress=false;
                window.open(uarr[0] + '//' + uarr[2] + '/' + uarr[3] + '/' + uarr[4] + '/fileselect.html?file=' + d.key);
            }
        })
        .on("click", function(d){
            // this is a hack so that click doesnt fire on the1st click of a dblclick
            if (!control.nodeClickInProgress ) {
                control.nodeClickInProgress = true;
                setTimeout(function(){
                    if (control.nodeClickInProgress) {
                        control.nodeClickInProgress = false;
                        if (control.options.nodeFocus) {
                            d.isCurrentlyFocused = !d.isCurrentlyFocused;
                            doTheTreeViz(makeFilteredData(control));
                        }
                    }
                },control.clickHack);
            }
        })
        .call(force.drag);
    //Called only for the package nodes
    nodeEnter
        .append("svg:circle")
        .attr("r", function(d) {
            return getRadius(d);
        })
        .style("fill", function(d) {
            return getColor(d);
        })
        .on("mouseover", function(d){
            // enhance all the links that end here
            enhanceNode (d);
        })
        .on("mouseout", function(d){
            resetNode(d);

        })
        .append("svg:title")
        .text(function(d) { return d[control.options.nodeLabel]; });

    function enhanceNode(selectedNode) {
        var pkg = '';
        var cnt = 0;
        var dcnt = 0;
        link.filter ( function (d) {
            if((d.type == 'P') && (d.source.key == selectedNode.key || d.target.key == selectedNode.key)){
                if(parseFloat(selectedNode.key)>0){
                    pkg = d.target.name;
                }else{
                    cnt = cnt + 1;
                }
                return true;
            }else{
                return false;
            };
        } )
            .style("stroke", control.options.routeFocusStrokePrimary)
            .style("stroke-width", control.options.routeFocusStrokePrimaryWidth)
            .style("stroke-opacity","1");
        link.filter ( function (d) {
            if((d.type == 'S') && (d.source.key == selectedNode.key || d.target.key == selectedNode.key)){
                if(parseFloat(selectedNode.key)>0){
                    cnt = cnt + 1;
                }
                else{
                    dcnt = dcnt + 1;
                }
                return true;
            }else{
                return false;
            };
        } )
            .style("stroke", control.options.routeFocusStrokeSecondary)
            .style("stroke-width", control.options.routeFocusStrokeSecondaryWidth)
            .style("stroke-opacity","1");

        if (text) {
            text.filter ( function (d) {
                var lnk = areWeConnected (selectedNode,d);
                if(lnk == null) return false;
                if(lnk.type == 'P') return true;
                return false;
                //return ((d.type == 'P')&&(areWeConnected (selectedNode,d)));
            } )
                .style("fill", control.options.routeFocusStrokePrimary);
            text.filter ( function (d) {
                var lnk = areWeConnected (selectedNode,d);
                if(lnk == null) return false;
                if(lnk.type == 'S') return true;
                return false;
                return ((d.type == 'S')&&(areWeConnected (selectedNode,d)));
            } )
                .style("fill", control.options.routeFocusStrokeSecondary);
        }
        if(parseFloat(selectedNode.key)>0){
            var header1Text = "File Name: " + selectedNode.name + "</br> File Number: " + selectedNode.key + "</br>";
            $('#header1').html(header1Text);
            var primary = "Package: " + pkg;
            $('#primary').html(primary);
            var secondary = "Dependent Packages: " + cnt;
            $('#secondary').html(secondary);
            d3.select("#toolTip").style("left", (selectedNode.px + 10) + "px")
                .style("top", (d3.event.pageY) + "px")
                .style("opacity", ".9");
        }else{
            var header1Text = "Package Name: " + selectedNode.name + "</br> Prefix: " + selectedNode.key + "</br>";
            $('#header1').html(header1Text);
            var primary = "Primary Files: " + cnt;
            $('#primary').html(primary);
            var secondary = "Dependent Files: " + dcnt;
            $('#secondary').html(secondary);
            d3.select("#toolTip").style("left", (selectedNode.px + 10) + "px")
                .style("top", (d3.event.pageY) + "px")
                .style("opacity", ".9");
        }
    }

    function areWeConnected (node1,node2) {
        for (var i=0; i < control.data.links.length ; i++) {
            var lnk = control.data.links[i];
            if ( (lnk.source.key === node1.key && lnk.target.key === node2.key) ||
                (lnk.source.key === node2.key && lnk.target.key === node1.key) ){
                return lnk;
            }
        }
        return null;
    }
    function resetNode(selectedNode) {
        link.style("stroke", control.options.routeStroke)
            .style("stroke-width", control.options.routeStrokeWidth)
            .style("stroke-opacity","0.2");
        if (text) {
            text.style("fill", 'Black');
        }
        $('#header1').text("");
        $('#primary').text("");
        $('#secondary').text("");
        d3.select("#toolTip").style("opacity", "0");
    }
    if (control.options.nodeLabel) {
        // text is done once for shadow as well as for text
        var textShadow = nodeEnter.append("svg:text")
            .attr("x", function(d) {
                var x = (d.right || !d.fixed) ?
                    control.options.labelOffset :
                    (-d.dim.width - control.options.labelOffset)  ;
                return x;
            })
            .attr("dy", ".31em")
            .attr("class", "shadow")
            .attr("text-anchor", function(d) {
                return !d.right ? 'start' : 'start' ;
            })
            .style("font-size",control.options.labelFontSize + "px")
            .text(function(d) {
                if(parseFloat(d.key)>0){
                    return d.name;
                }else{
                    return d.key;
                }
                //return d.shortName ? d.shortName : d.name;
            });
        //Run for text whether it is package or file
        var text = nodeEnter.append("svg:text")
            .attr("x", function(d) {
                var x = (d.right || !d.fixed) ?
                    control.options.labelOffset :
                    (-d.dim.width - control.options.labelOffset)  ;
                return x;
            })
            .attr("dy", ".35em")
            .attr("class", "text")
            .attr("text-anchor", function(d) {
                return !d.right ? 'start' : 'start' ;})
            .style("font-size",control.options.labelFontSize + "px")
            .text(function(d) {
                if(parseFloat(d.key)>0){
                    return d.name;
                }else{
                    return d.key;
                }
                //return d.shortName ? d.shortName : d.name;
            })

            .on("mouseover", function(d){
                // enhance all the links that end here
                enhanceNode (d);
                d3.select(this)
                    .attr("font-weight", 'bold');
            })

            .on("mouseout", function(d){
                resetNode(d);
                d3.select(this)
                    .attr("font-weight", 'normal');
            });
    }

    // Exit any old nodes.
    node.exit().remove();
    control.link = svg.selectAll("line.link");
    control.node = svg.selectAll("g.node");
    force.on("tick", tick);

    if (control.options.linkName) {
        link.append("title")
            .text(function(d) {
                return d[control.options.linkName];
            });
    }


    function tick() {
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
        node.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

    }

    function getRadius(d) {
        return makeRadius(control,d);
    }
    function getColor(d) {
        return control.options.nodeFocus && d.isCurrentlyFocused ? control.options.nodeFocusColor  : control.color(d.group) ;
    }

}

function makeRadius(control,d) {
    var r = control.options.radius * (control.options.nodeResize ? Math.sqrt(d[control.options.nodeResize]) / Math.PI : 1);
    return control.options.nodeFocus && d.isCurrentlyFocused ? control.options.nodeFocusRadius  : r;
}

function makeFilteredData(control,selectedNode){
    // we'll keep only the data where filterned nodes are the source or target
    var newNodes = [];
    var newLinks = [];

    for (var i = 0; i < control.data.links.length ; i++) {
        var link = control.data.links[i];
        if (link.target.isCurrentlyFocused || link.source.isCurrentlyFocused) {
            newLinks.push(link);
            addNodeIfNotThere(link.source,newNodes);
            addNodeIfNotThere(link.target,newNodes);
        }
    }
    // if none are selected reinstate the whole dataset
    if (newNodes.length > 0) {
        control.links = newLinks;
        control.nodes = newNodes;
    }
    else {
        control.nodes = control.data.nodes;
        control.links = control.data.links;
    }
    return control;

    function addNodeIfNotThere( node, nodes) {
        for ( var i=0; i < nodes.length; i++) {
            if (nodes[i].key == node.key) return i;
        }
        return nodes.push(node) -1;
    }
}

function getPixelDims(scratch,t) {
    // scratch is an elemen with the correct styling, t is the text to be counted in pixels
    scratch.empty();
    scratch.append(document.createTextNode(t));
    return { width: scratch.outerWidth(), height: scratch.outerHeight() } ;
}
function initialize () {

    var initPromise = $.Deferred();
    var control = {};
    control.divName = "#chart";

    //some basic options
    var newoptions = {  nodeLabel:"label",
        nodeResize:"count", height:18000,
        nodeFocus:true, radius:3, charge:-500};
    // defaults
    control.options = $.extend({
        stackHeight : 12,
        radius : 5,
        fontSize : 14,
        labelFontSize : 12,
        labelLineSpacing: 2.5,
        nodeLabel : null,
        markerWidth : 0,
        markerHeight : 0,
        width : $(control.divName).outerWidth(),
        gap : 1.5,
        nodeResize : "",
        linkDistance : 80,
        charge : -120,
        styleColumn : null,
        styles : null,
        linkName : null,
        nodeFocus: true,
        nodeFocusRadius: 25,
        nodeFocusColor: "FireBrick",
        labelOffset: 5,
        gravity: .05,
        routeFocusStrokePrimary: "#d62728",
        routeFocusStrokePrimaryWidth: '2px',
        routeFocusStrokeSecondary: "#2ca02c",
        routeFocusStrokeSecondaryWidth: '2px',
        circleFill: "Black",
        routeStroke: "steelblue",
        routeStrokeWidth: 2,
        height : $(control.divName).outerHeight()

    }, newoptions);

    var options = control.options;
    options.gap = options.gap * options.radius;
    control.width = options.width;
    control.height = options.height;
    // this is an element that can be used to determine the width of a text label

    control.scratch = $(document.createElement('span'))
        .addClass('shadow')
        .css('display','none')
        .css("font-size",control.options.labelFontSize + "px");
    $('body').append(control.scratch);

    getTheData(control).then( function (data) {

        control.data = data;
        control.nodes = data.nodes;
        control.links = data.links;
        control.color = d3.scale.category20();
        control.clickHack = 200;

        control.svg = d3.select(control.divName)
            .append("svg:svg")
            .attr("width", control.width)
            .attr("height", control.height);

        control.force = d3.layout.force().
            size([control.width, control.height])
            .linkDistance(control.options.linkDistance)
            .charge(control.options.charge)
            .gravity(control.options.gravity);

        initPromise.resolve(control);
    });
    return initPromise.promise();
}

function getTheData(control) {
    var dataPromise = getPromiseData();
    var massage = $.Deferred();
    dataPromise.done ( function (data) {
        // need to massage it
        massage.resolve ( dataMassage (control,data));
    })
        .fail (function (error) {
        massage.reject(error);
    });
    return massage.promise();
}

function dataMassage(control,data) {
    var ind = data, nodes = [],links =[];
    // the tags are to be circles
    for (var i=0;i<ind.length;i++) {
        ind[i].isCurrentlyFocused = false;
        nodes.push(ind[i]);
        // add links to files
        for ( var j=0; j < ind[i].files.length; j++) {
            //push this file as a node
            var node = findOrAddFile(control,ind[i].files[j],nodes);
            node.isCurrentlyFocused = false;
            // create a link
            var link = { source:node , target:ind[i], key : node.key + "_" + ind[i].key , type: ind[i].files[j].type};
            links.push(link);
        }
    }
    // sort nodes alpha
    nodes.sort ( function (a,b) { return a.name < b.name  ? -1 : (a.name == b.name ? 0 : 1 ) ; });
    control.fileCount = 0;
    control.fileRectSize = {width:0,height:0,radius:0};
    for ( var i = 0; i < nodes.length ; i++) {
        file= nodes[i];
        file.group =0;
        file.dim = getPixelDims(control.scratch, file.name);
        if (file.fixed) {
            control.fileCount++;
            // this will calculate the width/height in pixels of the largest label
            control.fileRectSize.width = Math.max(control.fileRectSize.width,file.dim.width);
            control.fileRectSize.height = Math.max(control.fileRectSize.height,file.dim.height);
            control.fileRectSize.radius = Math.max(control.fileRectSize.radius,makeRadius(control,file));
            file.group =1;
        }
    }
    var options= control.options;

    // we're going to fix the nodes that are files into two columns
    for ( var i = 0, c=0; i < nodes.length ; i++) {
        var file = nodes[i];
        if (file.fixed) {
            file.right= (c > control.fileCount/2);
            // y dimension calc same for each column
            file.y = ((c % (control.fileCount/2)) + .5) * (control.fileRectSize.height)  ;

            // x based on right or left column
            file.x = file.right ?
            control.width - control.fileRectSize.width - options.labelOffset  :
            file.dim.width + options.labelOffset ;
            c++;
        }
    }
    return {  nodes: nodes, links: links };
}

function findOrAddFile(control,file,nodes) {
    for ( var i=0;i<nodes.length;i++) {
        if ( nodes[i].key === file.key ) {
            nodes[i].count++;
            return nodes[i];
        }
    }
    file.fixed = true;
    file.count = 0;
    return nodes[nodes.push(file) - 1] ;
}

function getPromiseData(){
    var deferred = $.Deferred();

    $.getJSON('VISTA-FOIA.json', null,
        function (data) {
            deferred.resolve(data);
        })
        .error(function(res, status, err) {
            deferred.reject("error " + err + " for " + url);
        });

    return deferred.promise();
}