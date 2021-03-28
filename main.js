// Add your JavaScript code here
const MAX_WIDTH = Math.max(1080, window.innerWidth);
const MAX_HEIGHT = 720;
const margin = {top: 40, right: 100, bottom: 40, left: 175};
const NUM_EXAMPLES = 10;
const LOC_STRINGS = {"NA_Sales": "North America","EU_Sales": "Europe","JP_Sales": "Japan","Other_Sales": "Other Regions"};
const GENRE_LIST = {"Sports":0, "Platform":1, "Racing":2,
                    "Role-Playing":3, "Puzzle":4, "Misc":5,
                    "Shooter":6, "Simulation":7, "Action":8,
                    "Fighting":9, "Adventure":10, "Strategy":11};
const NORM_WEIGHT = 10;

// Assumes the same graph width, height dimensions as the example dashboard. Feel free to change these if you'd like
let graph_1_width = (MAX_WIDTH / 2) - 10, graph_1_height = 350;
let graph_2_width = (MAX_WIDTH / 2) - 10, graph_2_height = 350;
let graph_3_width = MAX_WIDTH / 2, graph_3_height = 575;



function setup_graph1() {
    //setup svg
    let svg1 = d3.select("#graph1")
        .append("svg")
        .attr("width", graph_1_width)
        .attr("height", graph_1_height)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    d3.csv("data/video_games.csv").then(function(data) {
        // find top ten games
        data = data.filter(function(a) { return parseInt(a["Rank"]) <= 10; });

        // Create a linear scale for the x axis
        let x = d3.scaleLinear()
            .domain([0, d3.max(data, function(d) { return parseFloat(d.Global_Sales); })])
            .range([0, graph_1_width - margin.left - margin.right]);

        //  Create a scale band for the y axis
        let y = d3.scaleBand()
            .domain(data.map(function(d) { return d["Name"]; }))
            .range([0, graph_1_height - margin.top - margin.bottom])
            .padding(0.1);  // Improves readability

        // Add y-axis label
        svg1.append("g")
            .call(d3.axisLeft(y).tickSize(0).tickPadding(10));

        let bars = svg1.selectAll("rect").data(data);

        // Define color scale
        let color = d3.scaleOrdinal()
            .domain(data.map(function(d) { return d["Name"]; }))
            .range(d3.quantize(d3.interpolateHcl("#a83232", "#81c2c3"), NUM_EXAMPLES));

        //Render the bar elements on the DOM
        bars.enter()
            .append("rect")
            .merge(bars)
            .attr("fill", function(d) { return color(d["Name"]); }) // Here, we are using functin(d) { ... } to return fill colors based on the data point d
            .attr("x", x(0))
            .attr("y", function (d) { return y(d["Name"]); })               // HINT: Use function(d) { return ...; } to apply styles based on the data point (d)
            .attr("width", function (d) { return x(parseFloat(d["Global_Sales"])); })
            .attr("height",  y.bandwidth());        // HINT: y.bandwidth() makes a reasonable display height

        //render text-Sales counts
        let counts = svg1.append("g").selectAll("text").data(data);

        counts.enter()
            .append("text")
            .merge(counts)
            .attr("x", function (d) { return x(parseFloat(d["Global_Sales"])) + 3; })
            .attr("y", function (d) { return y(d["Name"]) + (graph_1_height / NUM_EXAMPLES)/2 - 1; })
            .style("text-anchor", "start")
            .style("font-size", 13)
            .text(function (d) { return `\$${parseFloat(d["Global_Sales"]).toFixed(1)}m`});

        //render text-titles / labels
        svg1.append("text")
            .attr("transform", `translate(${(graph_1_width - margin.left - margin.right) / 2}, ${-20})`)       // HINT: Place this at the top middle edge of the graph
            .style("text-anchor", "middle")
            .style("font-size", 15)
            .text(`Top 10 Video Games of All Time`);

        svg1.append("text")
            .attr("transform", `translate(${(graph_1_width - margin.left - margin.right) / 2},
                                        ${(graph_1_height - margin.top - margin.bottom) + 15})`)       // HINT: Place this at the bottom middle edge of the graph
            .style("text-anchor", "middle")
            .text("Global Sales (in millions)");
    });
}

function setup_graph2(location) {
    d3.selectAll("#graph2 > *").remove()
    let svg2 = d3.select("#graph2")
        .append("svg")
        .attr("width", graph_2_width)
        .attr("height", graph_2_height)
        .append("g")
        .attr("transform", `translate(${graph_2_width/2}, ${graph_2_height/2})`);

    d3.csv("data/video_games.csv").then(function(data) {
        var loc_genre = d3.nest()
            .key(function(d) { return d.Genre;})
            .rollup(function(d) {
                return d3.sum(d, function(g) {return parseFloat(g[location]); }); })
            .entries(data);

        var pie = d3.pie()
            .padAngle(0.005)
            .sort(function(a, b) {
                return d3.descending(a.value, b.value); })
            .value(d => d.value)
            .startAngle(0.5 * Math.PI)
	        .endAngle(2.5 * Math.PI);

        let color = d3.scaleOrdinal()
            .domain(loc_genre.map(function(d) { return d.key; }))
            .range(d3.quantize(d3.interpolateHcl("#a83232", "#81c2c3"), loc_genre.length));

        //DRAW DONUT
        const arcs = pie(loc_genre);

        let MAX_RAD = Math.min(graph_2_height, graph_2_width) / 2 - 1;

        arc = d3.arc()
            .innerRadius(0.6*MAX_RAD)
            .outerRadius(0.8*MAX_RAD);

        svg2.selectAll("path")
          .data(arcs)
          .join("path")
            .attr("fill", d => color(d.data.key))
            .attr("d", arc)
          .append("title")
            .text(d => `${d.data.key}: \$${d.data.value.toFixed(2)} million`);

        //LABELS
        var outerArc = d3.arc()
            .innerRadius(MAX_RAD * 0.85)
            .outerRadius(MAX_RAD * 0.85);

        svg2.selectAll('allPolylines')
            .data(arcs)
            .enter()
            .append('polyline')
              .attr("stroke", "black")
              .style("fill", "none")
              .attr("stroke-width", 1)
              .attr('points', function(d) {
                var posA = arc.centroid(d) // line insertion in the slice
                var posB = outerArc.centroid(d) // line break: we use the other arc generator that has been built only for that
                var posC = outerArc.centroid(d); // Label position = almost the same as posB
                var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
                posC[0] += 15 * (midangle < Math.PI || midangle > 2*Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
                return [posA, posB, posC]
            });

        let tot_sales = d3.sum(loc_genre, d => d.value);
        console.log(tot_sales);

        svg2.selectAll('allLabels')
            .data(arcs)
            .enter()
            .append('text')
            .text( function(d) { return `${d.data.key} (${((d.data.value/tot_sales)*100).toFixed(0)}%)`; } )
            .attr('transform', function(d) {
                var pos = outerArc.centroid(d);
                var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                pos[0] += 20 * (midangle < Math.PI || midangle > 2*Math.PI ? 1 : -1);
                return 'translate(' + pos + ')';
            })
            .style('text-anchor', function(d) {
                var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                return (midangle < Math.PI || midangle > 2*Math.PI ? 'start' : 'end')
            });

        // Add chart title
        svg2.append("text")
            .style("text-anchor", "middle")
            .style("font-size", 15)
            .text(`Sales in ${LOC_STRINGS[location]}`);

        svg2.append("text")
            .style("text-anchor", "middle")
            .style("font-size", 15)
            .text(`by Genre`)
            .attr("transform", `translate(${0}, ${20})`);

    });
}

function setup_graph3() {
    d3.select("#selectButton")
        .selectAll('myOptions')
        .data(Object.keys(GENRE_LIST))
        .enter()
        .append('option')
        .text(function (d) { return d; })
        .attr("value", function (d) { return d; });

    var selectedGroup = "Sports";

    d3.csv("data/video_games.csv").then(function(data) {
        d3.select("#selectButton").on("change", function(d) {
            selectedGroup = this.value;
            update_graph3(selectedGroup, data);
        })

        update_graph3(selectedGroup, data);
    });
}

function update_graph3(selectedGroup, data) {
    d3.selectAll("#graph3 > *").remove()

    let svg3 = d3.select("#graph3")
        .append("svg")
        .attr("width", graph_3_width)
        .attr("height", graph_3_height)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    genre_data = data.filter(function(a) { return a["Genre"] === selectedGroup; });

    var pub_genre_data = d3.nest()
        .key(function(d) { return d.Publisher;})
        .rollup(function(d) {
            return {
                genre_sales: d3.sum(d, function(e) { return parseFloat(e["Global_Sales"]); }),
                num_titles: d3.sum(d, function(e) { return 1; })
            };
        })
        .entries(genre_data);

    //get a weighted average score for
    pub_genre_data = pub_genre_data.map(function(d) {
        d.value.w_sales_per_title = d.value.genre_sales / (d.value.num_titles);
        return d; })

    // - - - - - - avg sales - - - - - -

    var top_avg_sales = pub_genre_data
        .filter(function(a) { return a.value.num_titles > NORM_WEIGHT; })
        .sort(function(a, b) {
            return d3.descending(a.value.w_sales_per_title, b.value.w_sales_per_title); })
        .slice(0,5);

        // Create a linear scale for the x axis
        let x = d3.scaleLinear()
            .domain([0, d3.max(top_avg_sales, function(d) { return parseFloat(d.value.w_sales_per_title); })])
            .range([0, graph_3_width - margin.left - margin.right]);

        //  Create a scale band for the y axis
        let y = d3.scaleBand()
            .domain(top_avg_sales.map(function(d) { return d.key; }))
            .range([0, (graph_3_height - margin.top - margin.bottom) / 2 - 10])
            .padding(0.1);  // Improves readability

        // Add y-axis label
        svg3.append("g").call(d3.axisLeft(y).tickSize(0).tickPadding(10));

        let bars = svg3.append("g").selectAll("rect").data(top_avg_sales);

        // Define color scale
        let color = d3.scaleOrdinal()
            .domain(top_avg_sales.map(function(d) { return d.key; }))
            .range(d3.quantize(d3.interpolateHcl("#a83232", "#81c2c3"), 5));

        //Render the bar elements on the DOM
        bars.enter()
            .append("rect")
            .merge(bars)
            .attr("fill", function(d) { return color(d.key); }) // Here, we are using functin(d) { ... } to return fill colors based on the data point d
            .attr("x", x(0))
            .attr("y", function (d) { return y(d.key); })               // HINT: Use function(d) { return ...; } to apply styles based on the data point (d)
            .attr("width", function (d) { return x(parseFloat(d.value.w_sales_per_title)); })
            .attr("height",  y.bandwidth());

        let counts = svg3.append("g").selectAll("text").data(top_avg_sales);

        counts.enter()
            .append("text")
            .merge(counts)
            .attr("x", function (d) { return x(parseFloat(d.value.w_sales_per_title)) + 3; })
            .attr("y", function (d) { return y(d.key) + (graph_3_height / (5*2))/2 - 1; })
            .style("text-anchor", "start")
            .style("font-size", 13)
            .text(function (d) { return `\$${parseFloat(d.value.w_sales_per_title).toFixed(2)}m / game`});

    // - - - - - - tot sales

    var top_tot_sales = pub_genre_data
        .sort(function(a, b) {
            return d3.descending(a.value.genre_sales, b.value.genre_sales); })
        .slice(0,5);

    // Create a linear scale for the x axis
    let x2 = d3.scaleLinear()
        .domain([0, d3.max(top_tot_sales, function(d) { return parseFloat(d.value.genre_sales); })])
        .range([0, graph_3_width - margin.left - margin.right]);

    //  Create a scale band for the y axis
    let y2 = d3.scaleBand()
        .domain(top_tot_sales.map(function(d) { return d.key; }))
        .range([(graph_3_height - margin.top - margin.bottom) / 2 + 10, graph_3_height - margin.top - margin.bottom])
        .padding(0.1);  // Improves readability

    // Add y-axis label
    svg3.append("g").call(d3.axisLeft(y2).tickSize(0).tickPadding(10));

    let bars2 = svg3.append("g").selectAll("rect").data(top_tot_sales);

    // Define color scale
    let color2 = d3.scaleOrdinal()
        .domain(top_tot_sales.map(function(d) { return d.key; }))
        .range(d3.quantize(d3.interpolateHcl("#a83232", "#81c2c3"), 5));

    //Render the bar elements on the DOM
    bars2.enter()
        .append("rect")
        .merge(bars2)
        .attr("fill", function(d) { return color2(d.key); }) // Here, we are using functin(d) { ... } to return fill colors based on the data point d
        .attr("x", x2(0))
        .attr("y", function (d) { return y2(d.key); })               // HINT: Use function(d) { return ...; } to apply styles based on the data point (d)
        .attr("width", function (d) { return x2(parseFloat(d.value.genre_sales)); })
        .attr("height",  y2.bandwidth());

        let counts2 = svg3.append("g").selectAll("text").data(top_tot_sales);

        counts2.enter()
            .append("text")
            .merge(counts2)
            .attr("x", function (d) { return x2(parseFloat(d.value.genre_sales)) + 3; })
            .attr("y", function (d) { return y2(d.key) + (graph_3_height / (5*2))/2 - 1; })
            .style("text-anchor", "start")
            .style("font-size", 13)
            .text(function (d) { return `\$${parseFloat(d.value.genre_sales).toFixed(1)}m`});


    // Add chart title
    svg3.append("text")
        .attr("transform", `translate(${(graph_3_width - margin.left - margin.right) / 2}, ${-20})`)       // HINT: Place this at the top middle edge of the graph
        .style("text-anchor", "middle")
        .style("font-size", 15)
        .text(`Top Publishers by Genre`);

        // Add chart title
    svg3.append("text")
        .attr("transform", `translate(${(graph_3_width - margin.left - margin.right) / 2}, ${0})`)       // HINT: Place this at the top middle edge of the graph
        .style("text-anchor", "middle")
        .style("font-size", 13)
        .text(`Average Sales per Game*`)
        .append("title")
        .text("Publishers with less than 5 games excluded");

    svg3.append("text")
        .attr("transform", `translate(
            ${(graph_3_width - margin.left - margin.right) / 2},
            ${(graph_3_height - margin.top - margin.bottom) / 2 + 10})`)       // HINT: Place this at the top middle edge of the graph
        .style("text-anchor", "middle")
        .style("font-size", 13)
        .text(`Total Sales`);
}


setup_graph1();
setup_graph2('NA_Sales');
setup_graph3();
