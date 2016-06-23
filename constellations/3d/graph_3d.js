$(document).ready(function() {

    var nodes = JSON.parse(sessionStorage.getItem("nodes"));
    var links = JSON.parse(sessionStorage.getItem("links"));
    var graph = {nodes: nodes, links: links};
    var forceTHREE = new D3THREE();
    forceTHREE.init("graph-3d");
    var forceViz = new D3THREE.Force(forceTHREE);

    var spheres = [], three_links = [];
    // Define the 3d force
    var force = d3.layout.force3d()
        .nodes(sort_data=[])
        .links(links=[])
        .size([50, 50])
        .gravity(0.3)
        .charge(-400)

        var DISTANCE = 1;

    for (var i = 0; i < graph.nodes.length; i++) {
        sort_data.push({x:graph.nodes.x + DISTANCE,y:graph.nodes.y + DISTANCE,z:0})

            // set up the sphere vars
            var radius = 5,
        segments = 16,
        rings = 16;

        // create the sphere's material
        var sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffff99 });

        var sphere = new THREE.Mesh(
                new THREE.SphereGeometry(
                    radius,
                    segments,
                    rings),
                sphereMaterial);

        spheres.push(sphere);

        // add the sphere to the scene
        forceViz._dt.scene.add(sphere);
    }

    for (var i = 0; i < graph.links.length; i++) {
        links.push({target:sort_data[graph.links[i].target],source:sort_data[graph.links[i].source]});

        var material = new THREE.LineBasicMaterial({ color: 0x999999, linewidth: forceViz._config.linkWidth});
        var geometry = new THREE.Geometry();

        geometry.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
        geometry.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
        var line = new THREE.Line( geometry, material );
        line.userData = { source: graph.links[i].source,
            target: graph.links[i].target };
        three_links.push(line);
        forceViz._dt.scene.add(line);

        force.start();
    }

    // set up the axes
    var x = d3.scale.linear().domain([0, 350]).range([0, 10]),
    y = d3.scale.linear().domain([0, 350]).range([0, 10]),
    z = d3.scale.linear().domain([0, 350]).range([0, 10]);

    var self = forceViz;
    force.on("tick", function(e) {
        for (var i = 0; i < sort_data.length; i++) {
            spheres[i].position.set(x(sort_data[i].x) * 40 - 40, y(sort_data[i].y) * 40 - 40,z(sort_data[i].z) * 40 - 40);

            for (var j = 0; j < three_links.length; j++) {
                var line = three_links[j];
                var vi = -1;
                if (line.userData.source === i) {
                    vi = 0;
                }
                if (line.userData.target === i) {
                    vi = 1;
                }

                if (vi >= 0) {
                    line.geometry.vertices[vi].x = x(sort_data[i].x) * 40 - 40;
                    line.geometry.vertices[vi].y = y(sort_data[i].y) * 40 - 40;
                    line.geometry.vertices[vi].z = y(sort_data[i].z) * 40 - 40;
                    line.geometry.verticesNeedUpdate = true;
                }
            }
        }
    });
    // call animate loop
    forceTHREE.animate();

    // Helper function from Neo4j documentation

    function idIndex(a,id) {

        for (var i = 0; i < a.length; i++) { if (a[i].id == id) return i; }
        return null;
    }
});
