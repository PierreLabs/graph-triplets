$(function() {
    var iSPO = -1;

    $("#nouvTriple").click(function() {
        iSPO++;
        $(this).before("<br><input type='text' id='Suj" + iSPO + "'><input type='text' id='Pred" + iSPO + "'><input type='text' id='Obj" + iSPO + "'><br><br>");
        $("#prse").css("display", "block")
    });

    $("#prse").on("click", function() {

        $(this).val("Mettre le graphe à jour");

        var nodes = [];
        var links = [];
        var dataobj = {};

        var $sujs = $("input[id^='Suj']");
        $.each($sujs, function(i, e) {
            nodes.push({
                id: e.value,
                group: "sujets"
            });
        })

        var $objs = $("input[id^='Obj']");
        $.each($objs, function(i, e) {
            nodes.push({
                id: e.value,
                group: "objets"
            });
        })

        var $preds = $("input[id^='Pred']");
        $.each($preds, function(i, e) {
            links.push({
                target: e.previousSibling.value,
                source: e.nextSibling.value,
                value: e.value
            });
        })

        var newnodes = supprDoublons(nodes, "id"); //Tableau des noeuds uniques
        dataobj = {
            nodes: newnodes,
            links: links
        };

        d3.selectAll("svg > *").remove();

        var attractForce = d3.forceManyBody().strength(-500).distanceMin(150).distanceMax(200);

        var svg = d3.select("svg"),
            width = +svg.attr("width"),
            height = +svg.attr("height");

        var color = d3.scaleOrdinal(d3.schemeCategory10);

        var g = svg.append("g");

        var zoom = d3.zoom()
            .scaleExtent([0.8 / 2, 4])
            .on("zoom", zoomed);

        svg.call(zoom);

        function zoomed() {
            g.attr("transform", d3.event.transform);
        }

        var simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(function(d) {
                return d.id;
            }).distance(50))
            .force("charge", d3.forceManyBody())
            .force("attractForce", attractForce)
            .force("center", d3.forceCenter(width / 2, height / 2));

        var link = g
            .attr("class", "links")
            .selectAll("line")
            .data(dataobj.links)
            .enter().append("line")
            .attr("stroke-width", 1)
            .attr("stroke", function(d) { return color(d.value) });

        var pathT = g.selectAll(".links")
            .data(dataobj.links)
            .enter().append("path")
            .attr("class", "pathT")
            .attr("id",
                function(d) {
                    return "path" + d.target + "_" + d.source;
                });

        var label = g.selectAll("text")
            .data(dataobj.links)
            .enter().append("text");

        label.attr("font-family", "Arial, Helvetica, sans-serif")
            .style("font", "normal 9px Arial")
            .style("fill", function(d) {
                d3.selectAll("input").select(function() {
                    if (this.value == d.value)
                        this.style.color = color(d.value);
                });
                return color(d.value);
            })
            .attr("dy", "-3")
            .attr("dx", "13")
            .style('text-anchor', 'start')
            .attr("fill-opacity", 0.75);

        label.append("textPath")
            .attr("xlink:href",
                function(d) {
                    return "#path" + d.target + "_" + d.source;
                })
            .text(function(d) {
                return "->" + d.value + "->";
            });

        function moveto(d) {
            return "M" + d.target.x + "," + d.target.y;
        };

        function lineto(d) {
            return "L" + d.source.x + "," + d.source.y;
        };



        var node = g
            .attr("class", "nodes")
            .selectAll("circle")
            .data(dataobj.nodes)
            .enter().append("circle")
            .attr("r", 10)
            .attr("fill", function(d) {
                d3.selectAll("input").select(function() {
                    if (this.value == d.id)
                        this.style.backgroundColor = color(d.id);
                });
                return color(d.id);
            })
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        node.append("title")
            .text(function(d) {
                return d.id;
            });

        simulation
            .nodes(dataobj.nodes)
            .on("tick", ticked);

        simulation.force("link")
            .links(dataobj.links);

        function ticked() {
            link
                .attr("x1", function(d) {
                    return d.source.x;
                })
                .attr("y1", function(d) {
                    return d.source.y;
                })
                .attr("x2", function(d) {
                    return d.target.x;
                })
                .attr("y2", function(d) {
                    return d.target.y;
                });

            node
                .attr("cx", function(d) {
                    return d.x;
                })
                .attr("cy", function(d) {
                    return d.y;
                });

            pathT
                .attr("d",
                    function(d) {
                        return moveto(d) + lineto(d);
                    });
        }

        function dragstarted(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragended(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    })

    function supprDoublons(myArr, prop) {
        return myArr.filter((obj, pos, arr) => {
            return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
        });
    }
})