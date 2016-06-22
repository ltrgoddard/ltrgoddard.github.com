//$(document).ready(function() {

    var labels_display = "block";
    var labels_size = 10;
    var birth_range = $("#birthdates").val();
    var weight_cutoff = $("#weight").val();

    draw(birth_range, weight_cutoff, init = true);

    $("#birthdates, #weight").on("slideStop", function(slide_event) {
        if(typeof slide_event.value == "object") {
            birth_range = $("#birthdates").val();
            draw(birth_range, weight_cutoff);
        
        } else {
	        weight_cutoff = $("#weight").val();
            draw(birth_range, weight_cutoff);
        }
    });

    $("button").click(function() {
        if(this.id == "labels-toggle") {
            
            if($("#labels-toggle").hasClass("active")) {
                labels_display = "block";
            
            } else {
                labels_display = "none";
            }
            svg.selectAll("text").style("display", labels_display);

        } else if(this.id == "labels-minus" && labels_size > 4) {
            labels_size = labels_size - 2;

        } else if(this.id == "labels-plus" && labels_size < 40) {
            labels_size = labels_size + 2; }

        if(this.id == "labels-minus" || this.id == "labels-plus") {
            svg.selectAll("text").style("font-size", labels_size + "px");
        }
    });
    
    function draw(birth_range, weight_cutoff) {
	   
        var query = {"statements":[{"statement":"MATCH g=(s:poet) -[l:linked]-> (t:poet) WHERE l.weight > " + weight_cutoff + " AND s.birthdate >= " + birth_range.slice(0, 4) + " AND t.birthdate <= " + birth_range.slice(5, 9) + " AND t.birthdate >= " + birth_range.slice(0, 4) + " AND s.birthdate <= " + birth_range.slice(5, 9) + " RETURN g", "resultDataContents":["graph","row"]}]};
        
		$.ajax({
    		type: "POST",
    		url: "http://ec2-54-229-149-196.eu-west-1.compute.amazonaws.com:7474/db/data/transaction/commit",
    		accepts: { json: "application/json" },
    		dataType: "json",
			contentType:"application/json",
			data: JSON.stringify(query),
    		success: function (data) {
                var nodes = [], links = [];
        		data.results[0].data.forEach(function (row) {
            		row.graph.nodes.forEach(function (n) {
                		if (idIndex(nodes,n.id) == null){
                    		nodes.push({id:n.id,label:n.labels[0],title:n.properties.name});
               		    }
            		});
            		links = links.concat( row.graph.relationships.map(function(r) {
                        return {source:idIndex(nodes,r.startNode),target:idIndex(nodes,r.endNode),type:r.type};
            		}));
				});
			
                var threeData = {nodes: nodes, links: links};
                var forceTHREE = new D3THREE();
                forceTHREE.init('canvas-force');
                var forceViz = new D3THREE.Force(forceTHREE);

                var color = d3.scale.category20();

var spheres = [], three_links = [];
// Define the 3d force
var force = d3.layout.force3d()
    .nodes(sort_data=[])
    .links(links=[])
    .size([50, 50])
    .gravity(0.3)
    .charge(-400)

var DISTANCE = 1;

for (var i = 0; i < threeData.nodes.length; i++) {
  sort_data.push({x:threeData.nodes.x + DISTANCE,y:threeData.nodes.y + DISTANCE,z:0})

  // set up the sphere vars
  var radius = 5,
      segments = 16,
      rings = 16;

  // create the sphere's material
  var nodeColor = +color(threeData.nodes[i].group).replace("#", "0x");
  var sphereMaterial = new THREE.MeshBasicMaterial({ color: nodeColor });

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

for (var i = 0; i < threeData.links.length; i++) {
  links.push({target:sort_data[threeData.links[i].target],source:sort_data[threeData.links[i].source]});

  var material = new THREE.LineBasicMaterial({ color: forceViz._config.linkColor,
                linewidth: forceViz._config.linkWidth});
  var geometry = new THREE.Geometry();

  geometry.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
  geometry.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
  var line = new THREE.Line( geometry, material );
  line.userData = { source: threeData.links[i].source,
                    target: threeData.links[i].target };
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

               
            }
		});
	};
//});


// Helper function from Neo4j documentation

function idIndex(a,id) {

    for (var i = 0; i < a.length; i++) { if (a[i].id == id) return i; }
    return null;
}
