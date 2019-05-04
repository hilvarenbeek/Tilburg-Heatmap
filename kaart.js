var map;
// nummers van de meetstations (op de sticker gezet bij de workshops)
var meetjestadIds = ["251", "403", "410", "424", "427", "430", "437", "486", "492", "493", "494", "499"];
var meetWaarden = [];
var minTemp, maxTemp;

function Kaart() {
    Initmap();

    let url = 'https://meetjestad.net/data/sensors_json.php';

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            let jsonData = xhr.responseText;
            Datalaag(jsonData);
        }
    }
    xhr.send();
}

function Initmap() {
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

function Datalaag(jsonData) {
    let metingen = JSON.parse(jsonData);
    metingen.features.forEach(meting => {

        // alleen meetellen als id in het lijstje van Tilburg staat
        if (meetjestadIds.includes(meting.properties.id)) {
            let temp = parseFloat(meting.properties.temperature);
            if ((!minTemp) || (temp < minTemp)) { minTemp = temp };
            if ((!maxTemp) || (temp > maxTemp)) { maxTemp = temp };
            meetWaarden.push({ lat: meting.geometry.coordinates[1], long: meting.geometry.coordinates[0], temp: temp });
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
    // kleur is in HSL, H waarde 0=rood, 250=diepblauw
    var h = 250 - (Math.round(temp * 100) - Math.round(min * 100)) * (250 / range);
    // S=verzadiging (grijs tot pure kleur), L=Lightness (zwart via pure kleur naar wit)
    var hsl = { h: h, s: 100, l: 50 };
    return Color().fromHsl(hsl).toString();
}