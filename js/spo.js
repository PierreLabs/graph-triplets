/*jshint esversion: 6 */
$(function() {
    var iSPO = -1;

    //Ajout des inputs SPO
    $("#nouvTriple").click(function() {
        iSPO++;
        $(this).before("<input placeholder='Sujet' type='text' id='Suj" + iSPO + "'><input placeholder='Prédicat' type='text' id='Pred" + iSPO + "'><input placeholder='Objet' type='text' id='Obj" + iSPO + "'><br><br>");
        $("#prse").css("display", "block").val("Générer le graphe");
    });

    //Parsing
    $("#prse").on("click", function() {
        //Si aucun input n'est renseigné
        if ($("input[type='text']").is(function() { return $(this).val() == ""; })) {
            return false;
        }
        $(this).val("Mettre le graphe à jour");

        var nodes = []; //Les noeuds
        var links = []; //Les arcs
        var dataObj = {}; //Objet des tableaux noeuds/liens
        d3.selectAll("svg > *").remove();

        //Si chargement échantillon
        if (!$("#Suj0").length) {
            $.get("exemple.json", function(data) {
                iSPO = 0;
                $.each(data.links, function(i, e) {
                    $("#nouvTriple").before("<input placeholder='Sujet' type='text' id='Suj" + iSPO + "'><input placeholder='Prédicat' type='text' id='Pred" + iSPO + "'><input placeholder='Objet' type='text' id='Obj" + iSPO + "'><br><br>");
                    $("#Suj" + iSPO).val(e.target).attr("data-type", function() {
                        var type = data.nodes.find(a => a.id == e.target).type;
                        return type ? type : null;
                    });
                    $("#Pred" + iSPO).val(e.value);
                    $("#Obj" + iSPO).val(e.source).attr("data-type", function() {
                        var type = data.nodes.find(a => a.id == e.source).type;
                        return type ? type : null;
                    });
                    iSPO++;
                });
                dataObj = data;
            });
        } else {
            //Sujets = noeuds
            var $sujs = $("input[id^='Suj']");
            $.each($sujs, function(i, e) {
                nodes.push({
                    id: e.value, //Sujet
                    group: "sujets",
                    type: e.dataset.type
                });
            });

            //Objets = noeuds
            var $objs = $("input[id^='Obj']");
            $.each($objs, function(i, e) {
                nodes.push({
                    id: e.value, //objet
                    group: "objets",
                    type: e.dataset.type
                });
            });

            //Prédicats = arcs
            var $preds = $("input[id^='Pred']");
            $.each($preds, function(i, e) {
                links.push({
                    //Source et Target inversées... Je ne suis pas parvenu à faire un rotate(180) sur le label. Pas beau sur la logique globale mais c'est fonctionnel pour avoir des labels orientés sur le lien.
                    target: e.previousSibling.value,
                    source: e.nextSibling.value,
                    value: e.value
                });
            });

            var newnodes = supprDoublons(nodes, "id"); //Tableau des noeuds uniques
            dataObj = {
                nodes: newnodes,
                links: links
            };
        }

        //Json résultant et affichage sur la page (popup)
        var jsonTemp = JSON.stringify(dataObj, undefined, 1);
        $("#jsonModalBody").html("<pre>" + jsonTemp + "</pre>");
        $("#jsonModalTitle").html(dataObj.nodes.length + " noeuds et " + dataObj.links.length + " relations");
        $("#btJson").prop("disabled", false); //Activation du bouton désactivé par défaut

        //Init D3
        var svg = d3.select("svg"),
            width = $("#lesvg").width(), //+svg.attr("width"),
            height = $("#lesvg").height(); //+svg.attr("height");

        var dictColorTB = { "oeuvre": "#c00000", "expression": "#ff9900", "manifestation": "#92d050", "item": "#803b13", "agent": "#315fba", "concept": "#f580f4", "lapstemps": "#ffcc66" };

        var tabcouleurs = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];
        var color = d3.scaleOrdinal(tabcouleurs); //d3.schemeCategory10

        var g = svg.append("g");

        //Zoom
        var zoom = d3.zoom()
            .scaleExtent([0.8 / 2, 4])
            .on("zoom", zoomed);

        svg.call(zoom);

        function zoomed() {
            g.attr("transform", d3.event.transform);
        }

        //Mise en place des forces
        var attractForce = d3.forceManyBody().strength(-500).distanceMin(25).distanceMax(200);
        var collisionForce = d3.forceCollide(20).strength(1).iterations(64);
        var simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(function(d) {
                return d.id;
            }).distance(function(d) {
                //évalue la longueur du lien en fonction de la longueur de chaine
                return d.value.length + 70;
            }))
            .force("attractForce", attractForce)
            .force("collisionForce", collisionForce)
            .force("center", d3.forceCenter(width / 2, height / 2));

        //liens
        var link = g
            .attr("class", "links")
            .selectAll("line")
            .data(dataObj.links)
            .enter().append("line")
            .attr("stroke-width", 1)
            .attr("stroke", function(d) { return color(d.value); });

        //Chemins labels
        var pathT = g.selectAll(".links")
            .data(dataObj.links)
            .enter().append("path")
            .attr("class", "pathT")
            .attr("id",
                function(d) {
                    return "path" + d.source + "_" + d.target;
                });

        //Labels
        var label = g.selectAll("text")
            .data(dataObj.links)
            .enter().append("text")
            .style("font", "normal 11px Arial")
            .style("fill", function(d) {
                d3.selectAll("input").select(function() {
                    if (this.value == d.value) {
                        //couleurs inputs (texte pour les arcs)
                        this.style.color = color(d.value);
                    }
                });
                return color(d.value);
            })
            .attr("dy", "-5")
            .attr("dx", "26")
            .style('text-anchor', 'start')
            .attr("fill-opacity", 0.75);

        label.append("textPath")
            .attr("xlink:href",
                function(d) {
                    return "#path" + d.source + "_" + d.target;
                })
            .text(function(d) {
                return d.value + " >";
            });

        function moveto(d) {
            return "M" + d.target.x + "," + d.target.y;
        }

        function lineto(d) {
            return "L" + d.source.x + "," + d.source.y;
        }

        //Noeuds
        var node = g
            .attr("class", "nodes")
            .selectAll("circle")
            .data(dataObj.nodes)
            .enter().append("circle")
            .attr("r", 15)
            .attr("fill", function(d) {
                var coul = d.type ? dictColorTB[d.type] : color(d.id)
                d3.selectAll("input")
                    .select(function() {
                        if (this.value == d.id) {
                            //couleurs inputs (border pour les noeuds)
                            this.style.border = "5px solid" + coul;
                            this.style.borderRadius = "50%";
                        }
                    });
                return coul;
            })
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        //Title pour avoir l'id du noeud au survol
        node.append("title")
            .text(function(d) {
                return d.id;
            });

        simulation
            .nodes(dataObj.nodes)
            .on("tick", ticked);

        simulation.force("link")
            .links(dataObj.links);

        link.exit().remove();
        pathT.exit().remove();
        label.exit().remove();
        node.exit().remove();

        //Survol d'un input => changement du rayon du noeud + couleur inputs similaires
        $("input[type='text']").hover(function() { //mouseEnter
            let laVal = this.value;
            let coul = this.dataset.type ? dictColorTB[this.dataset.type] : color(laVal);
            //le noeud possédant la valeur de l'input
            g.selectAll("circle")
                .filter(function(d) {
                    return d.id === laVal;
                }).transition().attr("r", 23);
            d3.selectAll("input")
                .filter(function() {
                    // input => Prédicat ?
                    var isPredicat = $(this).attr("id").indexOf("Pred") > -1;
                    return $(this).val() === laVal && !isPredicat;
                }).transition().style("background-color", coul).style("color", "white").style("font-weight", "bold");

        }, function() { //mouseOut
            let laVal = this.value;
            //le noeud possédant la valeur de l'input
            g.selectAll("circle")
                .filter(function(d) {
                    return d.id === laVal;
                }).transition().attr("r", 15);
            d3.selectAll("input")
                .filter(function() {
                    // input => Prédicat ?
                    var isPredicat = $(this).attr("id").indexOf("Pred") > -1;
                    return $(this).val() === laVal && !isPredicat;
                }).transition().style("background-color", null).style("color", null).style("font-weight", null);
        });

        //Survol d'un noeud => mise en évidence des inputs correspondants
        node.on("mouseover", function(d) {
            d3.selectAll("input")
                .select(function() {
                    if (this.value == d.id) {
                        this.style.backgroundColor = d.type ? dictColorTB[d.type] : color(d.id);
                        this.style.fontWeight = "bold";
                        this.style.color = "white";
                        this.style.transition = "background-color 0.2s";
                    }
                });
        }).on("mouseout", function(d) {
            d3.selectAll("input")
                .select(function() {
                    if (this.value == d.id) {
                        this.style.backgroundColor = null;
                        this.style.fontWeight = null;
                        this.style.color = null;
                        this.style.transition = null;
                    }
                });
        });

        //Fonction itération d3
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

    //Fonction pour supprimer les doublons dans le tableau des noeuds
    function supprDoublons(myArr, prop) {
        return myArr.filter((obj, pos, arr) => {
            return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
        });
    }
});