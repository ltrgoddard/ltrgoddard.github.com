$(document).ready(function() {

	// Set up global variables and D3 force-directed layout

    var graph = {};
    var name = "All";
	var labels_display = "block";
    var labels_size = 10;
    var birth_range = $("#birthdates").val();
    var weight_cutoff = $("#weight").val();

	var width = $("#graph").width(), height = Math.max($("#control-panel").height(), $(window).height()-10);
	var force = d3.layout.force()
		.charge(-width/6).linkDistance(width/25).size([width, height]);

	var svg = d3.select("#graph").append("svg")
		.attr("width", width).attr("height", height)
		.attr("pointer-events", "all");
		
	// Draw the initial graph

    draw(birth_range, weight_cutoff, init = true, name = "All");
	
	// Handle user input via the sliders and buttons

    $("#birthdates, #weight").on("slideStop", function(slide_event) {
		if(typeof slide_event.value == "object") {
            birth_range = $("#birthdates").val();
            draw(birth_range, weight_cutoff, init = false, name);
        } else {
            weight_cutoff = $("#weight").val();
            draw(birth_range, weight_cutoff, init = false, name);
        }
    });

    $("button").click(function() {
        if (this.id == "launch-3d") {
            window.open("3d/");
        } else if (this.id == "labels-toggle") {
            if ($("#labels-toggle").hasClass("active")) {
                labels_display = "block";
            } else {
                labels_display = "none";
            }
            svg.selectAll("text").style("display", labels_display);
        } else if (this.id == "labels-minus" && labels_size > 4) { labels_size = labels_size - 2;
        } else if (this.id == "labels-plus" && labels_size < 40) { labels_size = labels_size + 2; }

        if (this.id == "labels-minus" || this.id == "labels-plus") {
            svg.selectAll("text").style("font-size", labels_size + "px");
        }
    });
	
	function filter_click(name) {
		draw(birth_range, weight_cutoff, init = false, name);
	}

	// The main draw function, which generates a query, sends it to Neo4j and plots the resulting data

    function draw(birth_range, weight_cutoff, init, name) {

        if (name != "All") { // No restriction by poet
            
            var query_phrase =
                "MATCH g=(s:poet) -[l:linked]-> (t:poet) \
                 WHERE s.name = " + '"' + name + '"' +
               " OR t.name = " + '"' + name + '"' + 
               " AND l.weight > " + weight_cutoff;

        } else { // Restriction by poet

            var query_phrase = 
                "MATCH g=(s:poet) -[l:linked]-> (t:poet) \
                 WHERE l.weight > " + weight_cutoff;
        }

		// Add birthdate restrictions to the query
		
        query_phrase = query_phrase +
            " AND s.birthdate >= " + birth_range.slice(0, 4) +
            " AND t.birthdate <= " + birth_range.slice(5, 9) +
            " AND t.birthdate >= " + birth_range.slice(0, 4) +
            " AND s.birthdate <= " + birth_range.slice(5, 9) +
            " RETURN g";

        var query = {"statements":[{"statement": query_phrase, "resultDataContents": ["graph", "row"]}]};

		// Request the data from Neo4j
		
        $.ajax({
            type: "POST",
            url: "http://ec2-54-229-149-196.eu-west-1.compute.amazonaws.com:7474/db/data/transaction/commit",
            accepts: { json: "application/json" },
            dataType: "json",
            contentType:"application/json",
            data: JSON.stringify(query)
        });
		
		// Handle the response
		
		$(document).ajaxSuccess(function(event, response){
			
				// Convert the data into a form usable by D3
			
				var data = response.responseJSON;
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
				
				// Store the data for use in the 3D graph

                sessionStorage.setItem("nodes", JSON.stringify(nodes));
                sessionStorage.setItem("links", JSON.stringify(links));

                graph = {nodes:nodes, links:links};

				// Repopulate the poet filter list based on the data
				
                var poets = [];

                for (node in graph.nodes) {
                    poets.push(graph.nodes[node].title);
                }

                poets.sort(function (a, b) {
                    return a.toLowerCase().localeCompare(b.toLowerCase());
                });
                
                $("#poet-list").empty();
                $("#poet-list").append('<a class="dropdown-item" href="#">All</a>');
                
                for (poet in poets) {
                    $("#poet-list").append('<a class="dropdown-item" href="#">' + poets[poet] + '</a>');
                }
				
				// Listen for user input using the poet filter list
				
				$(".dropdown-item").off("click");
				$(".dropdown-item").click(function() {
					filter_click($(this).text());
				});
				
				// If this is the first run, set up the force layout with the data

                if (init = true) {
                    force.nodes(graph.nodes).links(graph.links);
                }

				// Plot a D3 force-directed graph

                var link = svg.selectAll(".link")
                    .data(graph.links);

                link.enter()
                    .append("line").attr("class", "link"); // Add new edges

                link.exit().remove(); // Remove unused edges

                svg.selectAll("g").remove();

                var node = svg.selectAll(".node")
                    .data(graph.nodes);

                node_group = node.enter()
                    .append("g"); // Add new vertices

                node_group.append("circle")
                    .attr("r", 5)
                    .attr("fill", "#ff9")
                    .call(force.drag);

                node_group.append("text")
                    .style("fill", "#bbb")
                    .style("font-size", labels_size + "px")
                    .style("display", labels_display)
                    .attr("x", 12)
                    .attr("dy", ".35em")
                    .text(function (d) { return d.title; });

                node.exit()
                    .remove(); // Remove unused vertices

                force.on("tick", function() {
                    link.attr("x1", function(d) { return d.source.x; })
                        .attr("stroke", "#999")
                        .attr("y1", function(d) { return d.source.y; })
                        .attr("x2", function(d) { return d.target.x; })
                        .attr("y2", function(d) { return d.target.y; });

                    node.attr("transform", function(d){return "translate("+d.x+","+d.y+")"});
                });

                force.start();
		});
    };
});

// Helper function from Neo4j documentation

function idIndex(a,id) {

    for (var i=0; i<a.length;i++) { if (a[i].id == id) return i; }
    return null;
}
