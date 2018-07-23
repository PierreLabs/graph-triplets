/*jshint esversion: 6 */
$(function() {
    var iSPO = -1;

    $("#nouvTriple").click(function() {
        iSPO++;
        $(this).before("<input placeholder='Sujet' type='text' id='Suj" + iSPO + "'><input placeholder='Prédicat' type='text' id='Pred" + iSPO + "'><input placeholder='Objet' type='text' id='Obj" + iSPO + "'><br><br>");
        $("#prse").css("display", "block");
    });

    $("#prse").on("click", function() {

        $(this).val("Mettre le graphe à jour");

        var nodes = [];
        var links = [];
        var dataobj = {};

        //Sujets = noeuds
        var $sujs = $("input[id^='Suj']");
        $.each($sujs, function(i, e) {
            nodes.push({
                id: e.value, //Sujet
                group: "sujets"
            });
        });

        //Objets = noeuds
        var $objs = $("input[id^='Obj']");
        $.each($objs, function(i, e) {
            nodes.push({
                id: e.value, //objet
                group: "objets"
            });
        });

        //Prédicats = arcs
        var $preds = $("input[id^='Pred']");
        $.each($preds, function(i, e) {
            links.push({
                //Source et Target inversées... Je ne suis pas parvenu à faire un rotate(180) sur le label. Pas beau sur la logique globale mais c'est fonctionnel pour avoir des liens orientés à partir du label.
                target: e.previousSibling.value, //Sujet
                source: e.nextSibling.value, //Objet
                value: e.value //Prédicat
            });
        });

        var newnodes = supprDoublons(nodes, "id"); //Tableau des noeuds uniques
        dataobj = {
            nodes: newnodes,
            links: links
        };

        d3.selectAll("svg > *").remove();

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
            }).distance(function(d) { return d.value.length > 4 ? d.value.length * 10 : 40; }))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height / 2));

        var link = g
            .attr("class", "links")
            .selectAll("line")
            .data(dataobj.links)
            .enter().append("line")
            .attr("stroke-width", 1)
            .attr("stroke", function(d) { return color(d.value); });

        var pathT = g.selectAll(".links")
            .data(dataobj.links)
            .enter().append("path")
            .attr("class", "pathT")
            .attr("id",
                function(d) {
                    return "path" + d.source + "_" + d.target;
                });

        var label = g.selectAll("text")
            .data(dataobj.links)
            .enter().append("text");

        label.attr("font-family", "Arial, Helvetica, sans-serif")
            .style("font", "normal 9px Arial")
            .style("fill", function(d) {
                d3.selectAll("input").select(function() {
                    if (this.value == d.value) {
                        this.style.color = color(d.value);
                        //this.style.border = "2px solid" + color(d.value);
                    }
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
                    return "#path" + d.source + "_" + d.target;
                })
            .text(function(d) {
                return d.value;
            });

        function moveto(d) {
            return "M" + d.target.x + "," + d.target.y;
        }

        function lineto(d) {
            return "L" + d.source.x + "," + d.source.y;
        }



        var node = g
            .attr("class", "nodes")
            .selectAll("circle")
            .data(dataobj.nodes)
            .enter().append("circle")
            .attr("r", 10)
            .attr("fill", function(d) {
                d3.selectAll("input").select(function() {
                    if (this.value == d.id) {
                        this.style.border = "2px solid" + color(d.id);
                    }
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
    });

    function supprDoublons(myArr, prop) {
        return myArr.filter((obj, pos, arr) => {
            return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
        });
    }
});