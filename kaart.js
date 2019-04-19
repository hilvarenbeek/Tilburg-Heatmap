var map;
var meetjestadIds = "251,403,430,437,492,493,494,499";
var csvData = "id	timestamp	longitude	latitude	temperature	humidity	lux	supply	pm2.5	pm10\n" +
    "493	2019-04-19 00:02:17	5.04926	51.5669	13.8125	50.4375		3.43		\n" +
    "494	2019-04-19 00:03:16	5.06772	51.5563	13.3125	53.375		3.34		\n" +
    "430	2019-04-19 00:05:29	5.04297	51.5231	18.125	46.875		3.3		\n" +
    "437	2019-04-19 00:08:56	5.11014	51.5551	12.625	59.125		3.37		\n" +
    "403	2019-04-19 00:11:09	5.07648	51.5538	13.75	52.3125		3.36		\n" +
    "492	2019-04-19 00:11:48	5.08008	51.5699	12.3125	55.5625		3.45		\n" +
    "499	2019-04-19 00:13:04	5.0567	51.5191	14.125	49.5		3.31		\n";

function Kaart() {
    var map = Initmap();
    // var url = 'http://meetjestad.net/data/?type=sensors&start=2019-4-19,00:00&end=2019-4-19,00:15&ids=251,403,430,437,492,493,494,499&cmd=download+CSV';
    // var xhr = new XMLHttpRequest();
    // xhr.open("GET", url, true);
    // xhr.onreadystatechange = function() {
    //     if (xhr.readyState === 4) {
    //         csvData = xhr.responseText;
    Datalaag(map);
    //     }
    // }
    // xhr.send();
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

        console.log(temp);
        heatColor = CalcHeatColor(temp);
        console.log(heatColor);

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
    console.log(hsl.h);
    return Color().fromHsl(hsl).toString();
}