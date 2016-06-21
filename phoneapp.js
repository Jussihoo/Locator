"use strict";

// init
var timerId = 0;

function startRoute() {
  console.log("start route");
  var url = "http://localhost:8040/startRoute";
  var status = communicateWithTheServer(url,"");    
}

function stopRoute() {
  console.log("stop route");
  var url = "http://localhost:8040/stopRoute";
  var status = communicateWithTheServer(url,"");
}

function stopAutomaticPosition(){
  // stop the automatic position update;
  clearTimeout(timerId);
}

function startAutomaticPosition(){
  // start a 10 second interval to send coordinates
  timerId = setInterval(sendPosition, 10*1000);
}

function sendPosition() {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(positionSuccess, positionError, { enableHighAccuracy: true });
	} 
 }

function positionSuccess(position) {
		var lat = position.coords.latitude;
		var lon = position.coords.longitude;
		var acr = position.coords.accuracy;

		console.log("lat " + lat + "longitude " + lon + "accuracy " + acr);
    //alert("lat " + lat + "longitude " + lon + "accuracy " + acr);
    var position = {"source":"phone", "name":"", "lat":lat, "lon":lon, "accuracy":acr};
    console.dir(position);
    var url = "http://localhost:8040/sendCoords";
    var status = communicateWithTheServer(url,JSON.stringify(position));
}

function positionError(position){
  console.log("position error");
}

function communicateWithTheServer(url, data) {
    var client = new XMLHttpRequest(); //
    client.onreadystatechange = function() {
        if (client.readyState == 4 && client.status == 200) {
            console.log("Response ok");
        }
        // If status code is not 200, do not handle
        if (client.status != 200) {
            console.log("status " + client.status + " State: " + client.readyState);
            return false;
        }
    };
    client.open("POST", url, true);
    client.withCredentials = false;
    client.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
    client.setRequestHeader('Content-Length', data.length);
    client.send(data);
}
