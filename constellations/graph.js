$(document).ready(function() {

	// force layout setup
    var bounds = $("#graph").width();
    var width = bounds, height = Math.max(bounds, $(window).height());
    var force = d3.layout.force()
        .charge(-bounds/7).linkDistance(bounds/25).size([width, height]);
	
	// setup svg div    
	var svg = d3.select("#graph").append("svg")
    	.attr("width", bounds).attr("height", bounds)
    	.attr("pointer-events", "all");

    var birth_range = $("#birthdates").val();
	var weight_cutoff = $("#weight").val();
    var boundaries = $("#boundaries").val();

    go(birth_range, weight_cutoff, boundaries);

    $("#birthdates, #weight").on("slideStop", function(slide_event) {
        if(typeof slide_event.value == "object") {
            birth_range = $("#birthdates").val();
            go(birth_range, weight_cutoff, boundaries);
        } else {
	        weight_cutoff = $("#weight").val();
            go(birth_range, weight_cutoff, boundaries);
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
    
    function go(birth_range, weight_cutoff, boundaries) {
	   
            // WHAT IS THE ISSUE HERE? NOT FILTERING BIRTHDATES CORRECTLY 
            var query = {"statements":[{"statement":"MATCH p=(s:poet) -[l:linked]-> (t:poet) WHERE l.weight > " + weight_cutoff + " AND s.birthdate >= " + birth_range.slice(0, 4) + " AND t.birthdate <= " + birth_range.slice(5, 9) + " AND t.birthdate >= " + birth_range.slice(0, 4) + " AND s.birthdate <= " + birth_range.slice(5, 9) + " RETURN p", "resultDataContents":["graph","row"]}]};
    		// The helper function provided by neo4j documents
    		function idIndex(a,id) {
        		for (var i=0;i<a.length;i++) {if (a[i].id == id) return i;}
			return null;
    		}

		    // jQuery ajax call
		    var request = $.ajax({
    			type: "POST",
    			url: "http://ec2-54-229-149-196.eu-west-1.compute.amazonaws.com:7474/db/data/transaction/commit",
    			accepts: { json: "application/json" },
    			dataType: "json",
			    contentType:"application/json",
			    data: JSON.stringify(query),
    			//now pass a callback to success to do something with the data
    			success: function (data) {
                    var nodes = [], links = [];
        			// parsing the output of neo4j rest api
        			data.results[0].data.forEach(function (row) {
            				row.graph.nodes.forEach(function (n) {
                				if (idIndex(nodes,n.id) == null){
                    					nodes.push({id:n.id,label:n.labels[0],title:n.properties.name});
               					}
            				});
            				links = links.concat( row.graph.relationships.map(function(r) {
                			// the neo4j documents has an error : replace start with source and end with target
                				return {source:idIndex(nodes,r.startNode),target:idIndex(nodes,r.endNode),type:r.type};
            				}));
				});
				var graph = {nodes:nodes, links:links};
                draw_graph(graph, force, svg);
    			}
		});
	};

    function draw_graph(graph, force, svg)	{

        force.nodes(graph.nodes).links(graph.links).start(); // does this need to be run only once?

        // render relationships as lines
	    var link = svg.selectAll(".link")
		    .data(graph.links);
    
        link.enter()
	    	.append("line").attr("class", "link");
   
        link.exit().remove();

        svg.selectAll("g").remove();
	    
        var node = svg.selectAll(".node")
		    .data(graph.nodes).enter()
            .append("g");
        
        node.append("circle")
		    .attr("r", 5)
		    .attr("fill", "#ff9")
            .call(force.drag);

        node.append("text")
            .style("fill", "#bbb")
            .style("display", "block")
            .style("font-size", "10px")
            .attr("x", 12)
            .attr("dy", ".35em")
            .text(function (d) { return d.title; });

        // force feed algo ticks for coordinate computation
	    force.on("tick", function() {
		    link.attr("x1", function(d) { return d.source.x; })
            	.attr("stroke", "#999")
             	.attr("y1", function(d) { return d.source.y; })
            	.attr("x2", function(d) { return d.target.x; })
         	    .attr("y2", function(d) { return d.target.y; });

      	    node.attr("cx", function(d) { return d.x; })
             	.attr("cy", function(d) { return d.y; })
                .attr("transform", function(d){return "translate("+d.x+","+d.y+")"});
	    });
    };
});
