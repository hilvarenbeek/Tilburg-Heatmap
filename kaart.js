// nummers van de meetstations (op de sticker gezet bij de workshops)
const meetjestadIds = [
    "251", "264", "286", "361", "369", "370", "373", "378", "379", "380", "387", "388", "401", "402", "403",
    "410", "413", "416", "421", "424", "427", "430", "431", "436", "437", "438", "439", "440", "441", "443",
    "444", "445", "446", "448", "449", "450", "451", "452", "453", "455", "456", "467", "472", "475", "477",
    "478", "480", "483", "486", "488", "489", "490", "492", "493", "494", "495", "499", "500", "501", "502",
    "504", "505", "506", "507", "508", "509", "560", "561", "562", "563", "564", "568", "569", "570", "571",
    "572", "573", "574", "575", "576", "577", "578", "579", "580", "581", "582", "583", "584", "585", "587",
    "588", "589", "600", "601", "602", "603", "604", "605", "607", "686", "687", "688", "705", "706", "707",
    "708", "709", "711", "712", "713"
];

// handige coordinaten om de kaart op te centreren
const centerAmersfoort = new L.LatLng(52.1568, 5.38391),
    centerTilburg = new L.LatLng(51.5554, 5.0824),
    centerTilburgNoord = new L.LatLng(51.572, 5.0824);

const center = centerTilburgNoord,
    zoomLevel = 13;
const showTemp = true,
    showHumidity = true,
    showVoronoi = true;
// tilburgOnly=false om alle Meet je Stad meetstations te zien en mee te tellen in berekeningen.
const tilburgOnly = true;

var map;
var meetWaarden = [];
var minTemp, maxTemp;

function kaart() {
    initmap();

    let url = 'https://meetjestad.net/data/sensors_json.php';

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            let jsonData = xhr.responseText;
            datalaag(jsonData);
            if (showVoronoi) drawVoronoi();
            if (showTemp) addHeatLegend();
            if ((showHumidity) || (!showTemp && showVoronoi)) addHumidityLegend();
        }
    }
    xhr.send();
}

function initmap() {
    let osm = new L.StamenTileLayer("toner-lite");
    map = new L.Map('map', { center: center, zoom: zoomLevel });
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

function addHeatLegend() {
    let legend = L.control({ position: 'bottomleft' });
    legend.onAdd = function (map) {
        let div = L.DomUtil.create('div', 'info legend');
        // verschil tussen laagste en hoogste temperatuur
        let range = (Math.round(maxTemp * 100) - Math.round(minTemp * 100)) / 100;
        let step = range / 10;
        for (var i = 0; i < 10; i++) {
            div.innerHTML +=
                '<i style="background:' + calcHeatColor(i, 0, 10) + '"></i>' +
                (Math.round((minTemp + (i * step)) * 100)) / 100 +
                ' ℃<br/>';
        }
        return div;
    };
    legend.addTo(map);
}

function addHumidityLegend() {
    let humLegend = L.control({ position: 'bottomleft' });
    humLegend.onAdd = function (map) {
        let div = L.DomUtil.create('div', 'humidity legend');
        let range = 100;
        let step = range / 10;
        for (var i = 0; i < 10; i++) {
            div.innerHTML +=
                '<i style="background:' + calcHumidityColor(i * step) + '"></i>' +
                (Math.round(i * step)) +
                '%<br/>';
        }
        return div;
    };
    humLegend.addTo(map);
}

function datalaag(jsonData) {
    let metingen = JSON.parse(jsonData);
    metingen.features.forEach(meting => {

        // alleen meetellen als id in het lijstje van Tilburg staat
        if (!tilburgOnly || meetjestadIds.includes(meting.properties.id)) {
            let temp = parseFloat(meting.properties.temperature);
            let humidity = parseFloat(meting.properties.humidity);
            if ((!minTemp) || (temp < minTemp)) { minTemp = temp };
            if ((!maxTemp) || (temp > maxTemp)) { maxTemp = temp };
            // controleer of positie gevuld is, anders niet toevoegen
            if (meting.geometry.coordinates[1]) {
                meetWaarden.push({ id: meting.properties.id, coords: meting.geometry.coordinates, lat: meting.geometry.coordinates[1], long: meting.geometry.coordinates[0], temp: temp, humidity: humidity });
            }
        }
    })

    redrawD3Layer();
}

function redrawD3Layer() {
    drawD3Layer(map, meetWaarden);
}

function drawD3Layer(map, meetWaarden) {
    if (showHumidity) {
        d3.select("#map")
            .select("svg")
            .selectAll("myCircles")
            .data(meetWaarden)
            .enter()
            .append("circle")
            .attr("cx", function (d) { return map.latLngToLayerPoint([d.lat, d.long]).x })
            .attr("cy", function (d) { return map.latLngToLayerPoint([d.lat, d.long]).y })
            .attr("r", 20)
            .style("fill", function (d) { return calcHumidityColor(d.humidity) })
            .attr("stroke", function (d) { return calcHumidityColor(d.humidity) })
            .attr("stroke-width", 1)
            .attr("fill-opacity", .6);
    }
    if (showTemp) {
        d3.select("#map")
            .select("svg")
            .selectAll("myCircles")
            .data(meetWaarden)
            .enter()
            .append("circle")
            .attr("cx", function (d) { return map.latLngToLayerPoint([d.lat, d.long]).x })
            .attr("cy", function (d) { return map.latLngToLayerPoint([d.lat, d.long]).y })
            .attr("r", 6)
            .style("fill", function (d) { return calcHeatColor(d.temp, minTemp, maxTemp) })
            .attr("stroke", function (d) { return calcHeatColor(d.temp, minTemp, maxTemp) })
            .attr("stroke-width", 3)
            .attr("fill-opacity", .4);
    }

    function updateD3() {
        d3.select("#map")
            .select("svg")
            .selectAll("circle")
            .remove();

        redrawD3Layer();
    }

    function updateVoronoi() {
        d3.select("#map")
            .select("svg")
            .selectAll(".point")
            .remove();
        d3.select("#map")
            .select("svg")
            .selectAll(".cell")
            .remove();

        drawVoronoi();
    }

    function updateD3AndVoronoi() {
        updateVoronoi();
        updateD3();
    }

    map.on("zoomend", updateD3AndVoronoi);
}

function drawVoronoi() {
    if (!showVoronoi) { return; }

    var svg = d3.select("svg");
    var voronoiLayer = svg.append("g");

    const voronoi = d3.voronoi()
        .extent([
            // [-1, -1],
            // [1920 + 1, 1080 + 1]
            [-2000, -1000],
            [4000, 2000]
        ]);

    let points = [];
    if (showTemp) {
        meetWaarden.forEach(w =>
            points.push([map.latLngToLayerPoint([w.lat, w.long]).x, map.latLngToLayerPoint([w.lat, w.long]).y, calcHeatColor(w.temp, minTemp, maxTemp)]));
    } else { // assume showHumidity
        meetWaarden.forEach(w =>
            points.push([map.latLngToLayerPoint([w.lat, w.long]).x, map.latLngToLayerPoint([w.lat, w.long]).y, calcHumidityColor(w.humidity)]));
    }

    if (!showTemp && !showHumidity) {
        voronoiLayer.selectAll(".point")
            .data(points)
            .enter()
            .append("circle")
            .attr("class", "point")
            .attr("transform", d => `translate(${d[0]}, ${d[1]})`)
            .attr("fill", d => d[2])
            .attr("fill-opacity", .6)
            .attr("r", 10);
    }

    let polygons = voronoi(points).polygons();

    voronoiLayer.selectAll(".cell")
        .data(polygons)
        .enter()
        .append("path")
        .attr("class", "cell")
        .attr("fill", d => { if (d != null) { return d.data[2]; } })
        .attr("fill-opacity", ".2")
        .attr("stroke", "none")
        .attr("d", d => { if (d != null) { return `M${d.join("L")}Z`; } });
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
    let hue = 100 + ((Math.round(humidity) * 1.4));
    let sat = 50 + Math.floor(humidity / 2);
    let hsl = { h: hue, s: sat, l: 50 };
    return Color().fromHsl(hsl).toString();
}
