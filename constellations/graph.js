$(document).ready(function() {

    // Specify database server
    var neo4j_url = "http://ec2-54-229-149-196.eu-west-1.compute.amazonaws.com:7474/db/data/transaction/commit";

    // Set up D3 force-directed layout and global variables
    var width = $("#graph").width();
    var height = Math.max($("#control-panel").height(), $(window).height()-10);
    var layout = d3.layout.force()
        .charge(-width/6).linkDistance(width/25).size([width, height]);

    var frame = d3.select("#graph").append("svg")
        .attr("width", width).attr("height", height)
        .attr("pointer-events", "all");

    var labels_size = 10;
    var labels_display = "block";

    // Draw the initial graph
    load($("#birthdates").val(), $("#weight").val(), init = true, name = "All");

    // Set up event handlers that require a redraw
    $("#birthdates, #weight").on("slideStop", function() {
        load($("#birthdates").val(), $("#weight").val(), init = false, name = "All");
    });

    function filterClick(poet) {
        load($("#birthdates").val(), $("#weight").val(), init = false, name = poet);
    }

    // Set up event handlers that do not require a redraw (UI settings)
    $("button").click(function() {
        if (this.id == "launch-3d") {
            window.open("3d/"); // Open 3D visualisation
        }
        else if (this.id == "labels-toggle") {
            if ($("#labels-toggle").hasClass("active")) {
                labels_display = "block"; // Show labels
            }
            else {
                labels_display = "none"; // Hide labels
            }
            frame.selectAll("text").style("display", labels_display);
        }
        else if (this.id == "labels-minus" && labels_size > 4) {
            labels_size = labels_size - 2; // Decrease label size
        }
        else if (this.id == "labels-plus" && labels_size < 40) {
            labels_size = labels_size + 2; // Increase label size
        }
        if (this.id == "labels-minus" || this.id == "labels-plus") {
            frame.selectAll("text").style("font-size", labels_size + "px");
        }
    });

    // The main load function, which generates a query, sends it to Neo4j and passes the resulting data to D3
    function load(birth_range, weight_cutoff, init, name) {

        if (name != "All") { // No restriction by poet
            var query_phrase =
                "MATCH g=(s:poet) -[l:linked]-> (t:poet) \
                WHERE s.name = " + '"' + name + '"' +
                " OR t.name = " + '"' + name + '"' + 
                " AND l.weight > " + weight_cutoff;
        }
        else { // Restriction by poet
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

        var query = {"statements": [{"statement": query_phrase, "resultDataContents": ["graph", "row"]}]};

        // Request the data from Neo4j
        $.ajax({
            type: "POST",
            url: neo4j_url,
            accepts: {json: "application/json"},
            dataType: "json",
            contentType:"application/json",
            data: JSON.stringify(query)
        });
    };

    // Handle the response
    $(document).ajaxSuccess(function(event, response) {

        // Convert the data into a form usable by D3
        graph = jsonToD3(response.responseJSON);

        // Repopulate the poet filter list based on the data
        populateList(graph, $("#poet-list"));

        // Listen for user input using the poet filter list
        $(".dropdown-item").off("click");
        $(".dropdown-item").click(function() {
            filterClick($(this).text());
        });

        // Store the data for use in the 3D graph
        sessionStorage.setItem("nodes", JSON.stringify(graph.nodes));
        sessionStorage.setItem("links", JSON.stringify(graph.links));

        // (Re)draw the graph!
        draw(graph, layout, frame, labels_size, labels_display);
   });
});

// The draw function, containing all the D3 code except the initial set-up
function draw(graph, layout, frame, labels_size, labels_display) {

    // If this is the first run, set up the force layout with the data
    if (init = true) {
        layout.nodes(graph.nodes).links(graph.links);
    }

    // Plot a D3 force-directed graph
    var link = frame.selectAll(".link")
        .data(graph.links);

    link.enter()
        .append("line").attr("class", "link"); // Add new edges

    link.exit().remove(); // Remove unused edges

    frame.selectAll("g").remove();

    var node = frame.selectAll(".node")
        .data(graph.nodes);

    node_group = node.enter()
        .append("g"); // Add new vertices

    node_group.append("circle")
        .attr("r", 5)
        .attr("fill", "#ff9")
        .call(layout.drag); // Add circles to vertices

    node_group.append("text")
        .style("fill", "#bbb")
        .style("font-size", labels_size + "px")
        .style("display", labels_display)
        .attr("x", 12)
        .attr("dy", ".35em")
        .text(function (d) { return d.title; }); // Add text to vertices

    node.exit()
        .remove(); // Remove unused vertices

    // Update the layout dynamically
    layout.on("tick", function() {
        link.attr("x1", function(d) { return d.source.x; })
            .attr("stroke", "#999")
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node.attr("transform", function(d){return "translate("+d.x+","+d.y+")"});
    });

    layout.start();
}

// Function to convert JSON from Neo4j to nodes and links for D3
function jsonToD3(data) {

    var nodes = [], links = [];
    data.results[0].data.forEach(function (row) {
        row.graph.nodes.forEach(function (n) {
            if (idIndex(nodes, n.id) == null){
                nodes.push({id: n.id, label: n.labels[0], title: n.properties.name});
            }
        });
        links = links.concat( row.graph.relationships.map(function(r) {
            return {source: idIndex(nodes, r.startNode), target: idIndex(nodes, r.endNode), type: r.type};
        }));
    });

    return {nodes: nodes, links: links};

    // Helper function from Neo4j documentation
    function idIndex(a, id) {
        for (var i = 0; i < a.length; i++) { if (a[i].id == id) return i; }
        return null;
    }
}

// Function to repopulate dropdown poet list after data reload
function populateList(graph, list) {

    var poets = [];

    for (node in graph.nodes) {
        poets.push(graph.nodes[node].title);
    }

    poets.sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });

    list.empty();
    list.append('<a class="dropdown-item" href="#">All</a>');

    for (poet in poets) {
        list.append('<a class="dropdown-item" href="#">' + poets[poet] + '</a>');
    }
}
