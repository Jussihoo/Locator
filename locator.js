
// init
var locators = [];


var socket = io("http://localhost:8040"); 

socket.on('PushLocation', function (data) {
  console.log("got data from socket");

  var allData = JSON.parse(data);
  console.log("data: ", data);
  if (allData.source === "phone") {
  } else if (allData.source === "thingsee") {
    console.log("Thingsee");
  }
  updateLocation(allData.lat, allData.lon, allData.name);
});

var jussiIcon = L.icon({
  iconUrl: 'jussi_icon.png',
  iconRetinaUrl: 'jussi_icon.png',
  iconSize: [35, 35],
  iconAnchor: [10, 35],
  popupAnchor: [35, 35]});

var maaritIcon = L.icon({
  iconUrl: 'maarit_icon.png',
  iconRetinaUrl: 'maarit_icon.png',
  iconSize: [35, 35],
  iconAnchor: [10, 35],
  popupAnchor: [35, 35]});

var thingseeIcon = L.icon({
  iconUrl: 'thingsee_icon.png',
  iconRetinaUrl: 'thingsee_icon.png',
  iconSize: [35, 35],
  iconAnchor: [10, 35],
  popupAnchor: [35, 35]});

var xIcon = L.icon({
  iconUrl: 'x_icon.png',
  iconRetinaUrl: 'x_icon.png',
  iconSize: [35, 35],
  iconAnchor: [10, 35],
  popupAnchor: [35, 35]});

function updateLocation(lat, lon, name){
  var point = [lat,lon];
  
  var nameFound = false;
  if (locators.length >0){
     for (var i=0; i<locators.length; i++){
      if (locators[i].name == name){
        console.log ("locator exists");
        mymap.removeLayer(locators[i].object.marker);
        var icon = locators[i].object.icon; 
        locators[i].object.marker = L.marker([lat, lon],{icon: icon}).addTo(mymap);
        locators[i].object.polyline.addLatLng(point);
        console.log("update location for " + name);
        nameFound = true;
        break;
      }
     }  
    }
    if (!nameFound){ // Create new locator
      console.log("name not found");
      // set icon
      if (name != ""){
        if (name == "Jussi"){
          var icon = jussiIcon;
        }
        else if (name == "Maarit"){
          var icon = maaritIcon;
        }
        else if (name == "thingsee"){
          var icon = thingseeIcon;
        }
        else{
          var icon = xIcon;
        }
      }
      else{ // name is unknown
        var icon = xIcon;
      }
      // create a new marker
      var marker = new L.marker([lat, lon],{icon: icon}).addTo(mymap);
      // create a new polyline
      var polyline = L.polyline([], {color: 'blue'}).addTo(mymap);
      polyline.addLatLng(point);
      // create a new locator
      var locator = new locateObject(name, marker, icon, polyline);
      locators.push({"name": name, "object": locator});
      console.dir(locators);  
    }
    // set the map view to the last location
    mymap.setView([lat, lon]);
  
    /* 
  
  if (name != ""){
    if (name == "Jussi"){
      mymap.removeLayer(marker);
      marker = L.marker([lat, lon],{icon: jussiIcon}).addTo(mymap);
      polyline1.addLatLng(point);
      console.log("Jussi");
    }
    else if (name == "Maarit"){
      mymap.removeLayer(marker2);
      marker2 = L.marker([lat, lon],{icon: maaritIcon}).addTo(mymap);
      polyline2.addLatLng(point);
      console.log("Maarit");
    }
    else if (name == "thingsee"){
      mymap.removeLayer(marker3);
      marker3 = L.marker([lat, lon],{icon: thingseeIcon}).addTo(mymap);
      polyline3.addLatLng(point);
      console.log("Thingsee");
    }
    else{
      mymap.removeLayer(marker4);
      marker4 = L.marker([lat, lon],{icon: xIcon}).addTo(mymap); 
      polyline4.addLatLng(point);
      console.log("Unknown");
    }
  }
  else{
    mymap.removeLayer(marker);
    marker = L.marker([lat, lon],{icon: jussiIcon}).addTo(mymap); 
    polyline1.addLatLng(point);
  }
  mymap.setView([lat, lon]);    */
}

function locateObject(name, marker, icon, polyline){
  this.name = name;
  this.marker = marker;
  this.icon = icon;
  this.polyline = polyline;
  console.log("name is "+this.name);
}

// Map tile layer URLs
var mapMMLUrl =   'http://tiles.kartat.kapsi.fi/peruskartta/{z}/{x}/{y}.jpg';
var mapMMLOrtoUrl = 'http://tiles.kartat.kapsi.fi/ortokuva/{z}/{x}/{y}.jpg';
var mapOpenStreetUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var mapGoogleUrl = 'http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
var mapGoogleSatUrl = 'http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';

// Map tile layers
var MML   = L.tileLayer(mapMMLUrl); // MML Terrain maps
var MMLOrto = L.tileLayer(mapMMLOrtoUrl); // MML orto maps
var OpenStreet = L.tileLayer(mapOpenStreetUrl); // Open Street maps
var Google = L.tileLayer(mapGoogleUrl, {id: 'mapbox.light', maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']}); // Google maps
var GoogleSat = L.tileLayer(mapGoogleSatUrl, {id: 'mapbox.light', maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']}); // Google satellite maps

// init
var startLat = 61.49505;
var startLon = 23.61751667;

// create map and set the view
var mymap = L.map('mapid').setView([startLat, startLon], 15);
//L.tileLayer('http://tiles.kartat.kapsi.fi/peruskartta/{z}/{x}/{y}.jpg').addTo(mymap);
L.tileLayer(mapGoogleUrl, {id: 'mapbox.light', maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']}).addTo(mymap);

    /*
// create markers 
var marker = new L.marker([startLat, startLon],{icon: jussiIcon});
var marker2 = new L.marker([startLat, startLon],{icon: maaritIcon});
var marker3 = new L.marker([startLat, startLon],{icon: thingseeIcon});
var marker4 = new L.marker([startLat, startLon],{icon: xIcon});
//mymap.addLayer(marker);
// init routelines
var polyline1 = L.polyline([], {color: 'blue'}).addTo(mymap);
var polyline2 = L.polyline([], {color: 'red'}).addTo(mymap);
var polyline3 = L.polyline([], {color: 'red'}).addTo(mymap);
var polyline4 = L.polyline([], {color: 'red'}).addTo(mymap);     */

// create map selector
var mapTileLayers = {
			"Google maps": Google,
      "Google Satellite maps": GoogleSat,
      "MML Orto maps": MMLOrto,
      "MML Terrain maps": MML,
      "Open Street maps": OpenStreet
		};
L.control.layers(mapTileLayers).addTo(mymap);
