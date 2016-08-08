$(document).ready(function() {

    var nodes = JSON.parse(sessionStorage.getItem("nodes"));
    var links = JSON.parse(sessionStorage.getItem("links"));
    var graph = {nodes: nodes, edges: links};

    jgraph.create("#graph-3d", {
        directed: false,
        defaultNodeColor: 0xffff99,
        defaultEdgeColor: 0xbbbbbb
    });

    jgraph.draw(graph); 

});
