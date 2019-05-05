function drawVoronoi() {
    var svg = d3.select("svg");
    var mapLayer = svg.append("g");
    var voronoiLayer = svg.append("g");
    var projection = d3.geoMercator();

    const voronoi = d3.voronoi()
        .extent([
            [-1, -1],
            [1920 + 1, 1080 + 1]
        ]);

    let points = [];
    meetWaarden.forEach(w =>
        points.push([map.latLngToLayerPoint([w.lat, w.long]).x, map.latLngToLayerPoint([w.lat, w.long]).y, calcHeatColor(w.temp, minTemp, maxTemp)]));

    console.log(points);

    voronoiLayer.selectAll(".point")
        .data(points)
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("transform", d => `translate(${d[0]}, ${d[1]})`)
        .attr("r", 2);

    let polygons = voronoi(points).polygons();

    console.log(polygons);

    voronoiLayer.selectAll(".cell")
        .data(polygons)
        .enter()
        .append("path")
        .attr("class", "cell")
        .attr("fill", d => { if (d != null) { return d.data[2]; } })
        .attr("fill-opacity", ".5")
        .attr("stroke", "black")
        .attr("d", d => { if (d != null) { return `M${d.join("L")}Z`; } });
}