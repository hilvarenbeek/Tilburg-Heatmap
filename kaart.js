var map;
// nummers van de meetstations (op de sticker gezet bij de workshops)
var meetjestadIds = ["251", "403", "410", "424", "427", "430", "437", "486", "492", "493", "494", "499"];
var meetWaarden = [];
var minTemp, maxTemp;

function kaart() {
    initmap();

    let url = 'https://meetjestad.net/data/sensors_json.php';

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            let jsonData = xhr.responseText;
            datalaag(jsonData);
            addLegend();
        }
    }
    xhr.send();
}

function initmap() {
    let osm = new L.StamenTileLayer("toner-lite");
    map = new L.Map('map', { center: new L.LatLng(51.5554, 5.0824), zoom: 13 });
    map.addLayer(osm);
    // SVG laag toevoegen aan Leaflet, hier kan D3 op tekenen
    let d3Layer = L.svg();
    map.addLayer(d3Layer);
    map.on("overlayadd", redrawD3Layer);

    let baseMaps = { "Stamen Toner Lite": osm };
    let overlayMaps = { "D3": d3Layer };
    L.control.layers(baseMaps, overlayMaps).addTo(map);

    map.attributionControl.addAttribution('Data points from <a href="http://meetjestad.net/">Meet je Stad</a>');
}

function addLegend() {
    let legend = L.control({ position: 'bottomleft' });
    legend.onAdd = function(map) {
        let div = L.DomUtil.create('div', 'info legend');
        // verschil tussen laagste en hoogste temperatuur
        let range = (Math.round(maxTemp * 100) - Math.round(minTemp * 100)) / 100;
        let step = range / 10;

        for (var i = 0; i < 10; i++) {
            div.innerHTML +=
                '<i style="background:' + calcHeatColor(i, 0, 10) + '"></i>' +
                (Math.round((minTemp + (i * step)) * 100)) / 100 +
                '<br/>';
        }

        return div;
    };

    legend.addTo(map);
}

function datalaag(jsonData) {
    let metingen = JSON.parse(jsonData);
    metingen.features.forEach(meting => {

        // alleen meetellen als id in het lijstje van Tilburg staat
        if (meetjestadIds.includes(meting.properties.id)) {
            let temp = parseFloat(meting.properties.temperature);
            let humidity = parseFloat(meting.properties.humidity);
            if ((!minTemp) || (temp < minTemp)) { minTemp = temp };
            if ((!maxTemp) || (temp > maxTemp)) { maxTemp = temp };
            meetWaarden.push({ lat: meting.geometry.coordinates[1], long: meting.geometry.coordinates[0], temp: temp, humidity: humidity });
        }
    })

    redrawD3Layer();
}

function redrawD3Layer() {
    drawD3Layer(map, meetWaarden);
}

function drawD3Layer(map, meetWaarden) {
    d3.select("#map")
        .select("svg")
        .selectAll("myCircles")
        .data(meetWaarden)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return map.latLngToLayerPoint([d.lat, d.long]).x })
        .attr("cy", function(d) { return map.latLngToLayerPoint([d.lat, d.long]).y })
        .attr("r", 40)
        .style("fill", function(d) { return calcHumidityColor(d.humidity) })
        .attr("stroke", function(d) { return calcHumidityColor(d.humidity) })
        .attr("stroke-width", 1)
        .attr("fill-opacity", .6);
    d3.select("#map")
        .select("svg")
        .selectAll("myCircles")
        .data(meetWaarden)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return map.latLngToLayerPoint([d.lat, d.long]).x })
        .attr("cy", function(d) { return map.latLngToLayerPoint([d.lat, d.long]).y })
        .attr("r", 14)
        .style("fill", function(d) { return calcHeatColor(d.temp, minTemp, maxTemp) })
        .attr("stroke", function(d) { return calcHeatColor(d.temp, minTemp, maxTemp) })
        .attr("stroke-width", 3)
        .attr("fill-opacity", .4);

    function updateD3() {
        d3.selectAll("circle")
            .attr("cx", function(d) { return map.latLngToLayerPoint([d.lat, d.long]).x })
            .attr("cy", function(d) { return map.latLngToLayerPoint([d.lat, d.long]).y });
    }

    map.on("moveend zoomend", updateD3);
}

function calcHeatColor(temp, min, max) {
    // verschil tussen laagste en hoogste temperatuur
    let range = Math.round(max * 100) - Math.round(min * 100);
    // kleur is in HSL, H waarde 0=rood, 125=groen, 250=diepblauw
    let h = 125 - (Math.round(temp * 100) - Math.round(min * 100)) * (125 / range);
    // S=verzadiging (grijs tot pure kleur), L=Lightness (zwart via pure kleur naar wit)
    let hsl = { h: h, s: 100, l: 50 };
    return Color().fromHsl(hsl).toString();
}

function calcHumidityColor(humidity) {
    if (humidity > 100) { humidity = 100 };
    let sat = Math.floor(humidity);
    let hsl = { h: 240, s: sat, l: 50 };
    return Color().fromHsl(hsl).toString();
}