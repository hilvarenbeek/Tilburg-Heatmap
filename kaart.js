var map;
var meetjestadIds = "251,403,430,437,492,493,494,499"; // nummers van de meetstations (op de sticker gezet bij de workshops)
var meetWaarden = [];

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
    let metingen = csvData.split("\n"); // CSV data splitsen in regels
    metingen.shift(); // header regel verwijderen
    metingen.pop(); // laatste (lege) regel verwijderen
    var minTemp, maxTemp;
    for (meting in metingen) {
        let meetGegevens = metingen[meting].split("\t");
        let temp = parseFloat(meetGegevens[4]);
        if ((!minTemp) || (temp < minTemp)) { minTemp = temp };
        if ((!maxTemp) || (temp > maxTemp)) { maxTemp = temp };
        meetWaarden.push({ lat: meetGegevens[3], long: meetGegevens[2], temp: temp });
    }

    // cirkels met kleur op basis van meetwaarde
    meetWaarden.forEach(meetwaarde => {
        console.log(meetwaarde);
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