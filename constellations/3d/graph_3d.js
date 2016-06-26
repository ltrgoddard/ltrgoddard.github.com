$(document).ready(function() {

    var nodes = JSON.parse(sessionStorage.getItem("nodes"));
    var links = JSON.parse(sessionStorage.getItem("links"));
    var graph = {nodes: nodes, links: links};
    var forceTHREE = new D3THREE();
    forceTHREE.init("graph-3d");
    var forceViz = new D3THREE.Force(forceTHREE);
    forceTHREE.render(forceViz, graph);
    forceTHREE.animate();

});
