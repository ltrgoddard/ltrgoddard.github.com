$(document).ready(function() {

    var bounds = $("#graph").width();
    var width = bounds, height = $(window).height()-10;
    var force = d3.layout.force()
        .charge(-bounds/6).linkDistance(bounds/25).size([width, height]);
	
	var svg = d3.select("#graph").append("svg")
    	.attr("width", bounds).attr("height", $(window).height()-10)
    	.attr("pointer-events", "all");

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

    $("#labels").button("toggle");

    $("#labels").click(function() {
        if($("#labels").hasClass("active")) {
            svg.selectAll("text").style("display", "none"); 
        } else {
            svg.selectAll("text").style("display", "block");
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
				
                var graph = {nodes:nodes, links:links};
                
                if (init = true) {
                    force.nodes(graph.nodes).links(graph.links);
                }
                
                var link = svg.selectAll(".link")
		            .data(graph.links);
    
                link.enter()
	    	        .append("line").attr("class", "link");
   
                link.exit().remove();

                svg.selectAll("g").remove();
	    
                var node = svg.selectAll(".node")
		            .data(graph.nodes);
        
                node_group = node.enter()
                    .append("g");
        
                node_group.append("circle")
		            .attr("r", 5)
		            .attr("fill", "#ff9")
                    .call(force.drag);

                node_group.append("text")
                    .style("fill", "#bbb")
                    .style("display", "block")
                    .style("font-size", "10px")
                    .attr("x", 12)
                    .attr("dy", ".35em")
                    .text(function (d) { return d.title; });

                node.exit()
                    .remove();

	            force.on("tick", function() {
		            link.attr("x1", function(d) { return d.source.x; })
            	        .attr("stroke", "#999")
             	        .attr("y1", function(d) { return d.source.y; })
            	        .attr("x2", function(d) { return d.target.x; })
         	            .attr("y2", function(d) { return d.target.y; });

                    node.attr("transform", function(d){return "translate("+d.x+","+d.y+")"});
	            });

                force.start();
            }
		});
	};
});


// Helper function from Neo4j documentation

function idIndex(a,id) {

    for (var i=0; i<a.length;i++) { if (a[i].id == id) return i; }
    return null;
}
