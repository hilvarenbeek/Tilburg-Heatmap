var map;
// nummers van de meetstations (op de sticker gezet bij de workshops)
var meetjestadIds = ["251", "403", "410", "427", "430", "437", "486", "492", "493", "494", "499"];
var meetWaarden = [];

function Kaart() {
    var map = Initmap();

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
}

function Datalaag(jsonData) {
    var minTemp, maxTemp;
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

    // cirkels met kleur op basis van meetwaarde
    meetWaarden.forEach(meetwaarde => {
        heatColor = CalcHeatColor(meetwaarde.temp, minTemp, maxTemp);

        L.circle([meetwaarde.lat, meetwaarde.long], {
            color: heatColor,
            fillColor: heatColor,
            fillOpacity: 0.5,
            radius: 500
        }).addTo(map);
    })
}

function CalcHeatColor(temp, min, max) {
    // verschil tussen laagste en hoogste temperatuur
    let range = Math.round(max * 100) - Math.round(min * 100);
    // kleur is in HSL, H waarde 0=rood, 250=diepblauw
    var h = 250 - (Math.round(temp * 100) - Math.round(min * 100)) * (250 / range);
    // S=verzadiging (grijs tot pure kleur), L=Lightness (zwart via pure kleur naar wit)
    var hsl = { h: h, s: 100, l: 50 };
    return Color().fromHsl(hsl).toString();
}