var map;
var meetjestadIds = "251,403,430,437,492,493,494,499"; // nummers van de meetstations (op de sticker gezet bij de workshops)

function Kaart() {
    var map = Initmap();
    // gisteren = nu - (24 uur * 60 minuten * 60 seconden * 1000 milliseconden)
    let yesterday = new Date(Date.now() - (24 * 60 * 60 * 1000));
    // een kwartier zou van elk actief station 1 meting moeten geven
    let beginDate = yesterday;
    let endDate = new Date(Date.now() - ((24 * 60) - 15) * 60 * 1000);
    // getMonth is 0-based, dus januari = 0, december = 11
    let dataSince = beginDate.getFullYear() + "-" + (beginDate.getMonth() + 1) + "-" + beginDate.getDate() + "," + beginDate.getHours() + ":" + beginDate.getMinutes();
    let dataUntil = endDate.getFullYear() + "-" + (endDate.getMonth() + 1) + "-" + endDate.getDate() + "," + endDate.getHours() + ":" + endDate.getMinutes();
    console.log(dataSince);
    // Had een probleem met ophalen data vanuit script, work-around via een CORS proxy
    let url = 'http://cors-anywhere.herokuapp.com/http://meetjestad.net/data?type=sensors&ids=' + meetjestadIds + '&format=csv&start=' + dataSince;
    if (dataUntil) { url += '&end=' + dataUntil; }
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            csvData = xhr.responseText;
            Datalaag(map);
        }
    }
    xhr.send();
}

function Initmap() {
    let osm = new L.StamenTileLayer("toner-lite");
    map = new L.Map('map', { center: new L.LatLng(51.5554, 5.0824), zoom: 13 });
    map.addLayer(osm);
}

function Datalaag() {
    var metingen = csvData.split("\n"); // CSV data splitsen in regels
    metingen.shift(); // header regel verwijderen
    metingen.pop(); // laatste (lege) regel verwijderen

    for (meting in metingen) {
        meetGegevens = metingen[meting].split("\t");
        var lat = meetGegevens[3];
        var long = meetGegevens[2];
        var temp = meetGegevens[4];

        //        console.log(temp);
        heatColor = CalcHeatColor(temp);
        //        console.log(heatColor);

        var circle = L.circle([lat, long], {
            color: heatColor,
            fillColor: heatColor,
            fillOpacity: 0.5,
            radius: 500
        }).addTo(map);
    }
}

function CalcHeatColor(temp) {
    if (temp < -20) temp = -20;
    if (temp > 40) temp = 40;
    var h = Math.round(250 - ((Math.round(temp) + 20) * (250 / 60)));
    var hsl = { h: h, s: 100, l: 50 };
    return Color().fromHsl(hsl).toString();
}