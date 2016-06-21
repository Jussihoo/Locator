"use strict";
var restify = require("restify");
var server = restify.createServer({
  name: 'Locator',
  version: '1.0.0'
});

var https = require("https");
var DOMParser = require('xmldom').DOMParser;
var fs = require('fs');
var socketio  = require ("socket.io");

var xmlDoc = "";
var fileName = "";

server.use(restify.bodyParser());

// REMOVE THESE?? Needed for enabling CORS and needed for allowing cross-origin resource sharing 
server.use(restify.CORS());
server.use(restify.fullResponse());

// socket
var io = socketio.listen(server.server);


var sendRes = function(res,items){
    console.dir(items);
    res.send(items);
};

function pushCoordsData(data){
  io.emit('PushLocation', JSON.stringify(data));  // send data to browser
  console.log("Coordinates pushed");
}

function sendCoordinates(coordData, res){
	coordData["source"] = "phone"; /*
	data["name"] = coordData.name;
	data["LAT"] = coordData.LAT;
	data["LON"] = coordData.LON; */
  if (fileName != ""){
    updateGPXFile(pushData.lat, pushData.lon,fileName);
  }
	pushCoordsData(coordData);
	console.dir(coordData);
	sendRes(res, "");
}

function handleSenses(senses, time){ 
    var pushData = {};  // init
    pushData["source"] = "thingsee";
    for (var i=0; i<senses.length; i++){ // go through all the senses data
      if (senses[i].sId == '0x00010100' ){ // Latitude
        console.log("The latitude is " + senses[i].val); // remove this
        pushData["lat"] = senses[i].val;  
      }
		if (senses[i].sId == '0x00010200' ){ // Longtitude
        console.log("The longitude is " + senses[i].val); // remove this
        pushData["lon"] = senses[i].val;  
      }      
      else{
        console.dir(senses[i]);
      }
    }
    if (fileName != ""){
      updateGPXFile(pushData.lat, pushData.lon,fileName);
    }
    pushCoordsData(pushData); // send data to browser
}

function addZero(i) { // adds leading zero to timestamp to get double digit figure
if (i < 10) {
      i = "0" + i;
    }
    return i;
}

function getDateTime() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();
    var h = today.getHours(); 
    var min = today.getMinutes();

    if(dd<10) {
        dd='0'+dd
    } 

    if(mm<10) {
        mm='0'+mm
    } 
    today = "_"+yyyy+"_"+mm+"_"+dd+"_"+h+"_"+min;
    console.log(today);
    return today;
}

function generateGPXFileName() {
    var time = getDateTime();
    fileName =  "track"+time+".gpx"; 
    return fileName;
}

function updateGPXFile(LAT, LON){
  // create first <trkpt></trkpt> tags with proper indent
  var trackSeg = xmlDoc.getElementsByTagName("trkseg")[0];
  var trackPointEle = xmlDoc.createElement("trkpt");
  var indent = xmlDoc.createTextNode("   ");
  trackSeg.appendChild(indent);
  trackSeg.appendChild(trackPointEle);
  indent = xmlDoc.createTextNode("\n       ");
  trackSeg.appendChild(indent)
  
  // create lat and lon attributes to the last <trkpt> and handle proper indent
  var length = xmlDoc.getElementsByTagName("trkpt").length;
  if (length>0){
    var trackPoint = xmlDoc.getElementsByTagName("trkpt")[length-1];
  }
  trackPoint.setAttribute("lat", LAT);
  trackPoint.setAttribute("lon", LON);
  indent = xmlDoc.createTextNode("\n          ");
  trackPoint.appendChild(indent);
  
  // add <time>add_time_here</time> tag with proper indent
  var timeISO = new Date().toISOString();
  var timeEle = xmlDoc.createElement("time");
  var timeText = xmlDoc.createTextNode(timeISO);
  timeEle.appendChild(timeText);
  trackPoint.appendChild(timeEle);
  indent = xmlDoc.createTextNode("\n       ");
  trackPoint.appendChild(indent);
  
  fs.writeFile(fileName, xmlDoc, function (err) {
    if (err) return console.log(err);
    console.log("GPX File "+ fileName + " updated");
  });
}

function createGPXFile(fileName){
  var text="<?xml version=\"1.0\"?>\n"+
  "<gpx version=\"1.0\" creator=\"Locator\" xmlns=\"http://www.topografix.com/GPX/1/0\">\n"+
  "  <trk>\n"+
  "    <trkseg>\n"+
  "    </trkseg>\n"+
  "  </trk>\n"+
  "</gpx>\n";
  
  var parser = new DOMParser();
  xmlDoc = parser.parseFromString(text,"text/xml");
  fs.writeFile(fileName, xmlDoc, function (err) {
    if (err) return console.log(err);
    console.log("GPX File "+ fileName + " created");
  });
}


//REST API implementation sending the coordinates from the mobile phone
server.post('/sendCoords', function (req, res, next) {
    var coordData = req.params;
    console.log ("coordinates received from phone");
    sendCoordinates(coordData, res);
    next();
});

//REST API implementation starting the route
server.post('/startRoute', function (req, res, next) {
    console.log ("Start button clicked");
    generateGPXFileName(fileName);
    createGPXFile(fileName);
    sendRes(res, fileName);
});

//REST API implementation finishing the route
server.post('/stopRoute', function (req, res, next) {
    console.log ("stop button clicked");
    fileName = "";
    sendRes(res, fileName);
});

// REST API implementation for handling the push messages from the Thingsee IOT
server.post('/', function (req, res, next) {
    var time = new Date();
    var hh = addZero(time.getHours());
    var mm = addZero(time.getMinutes());
    var ss = addZero(time.getSeconds());
    var consoleTime = hh + ":" + mm + ":" + ss; 
    
    console.log('got IOT message from Lutikka. Timestamp ' + consoleTime); // remove this
    handleSenses(req.params[0].senses, time);

    res.send(Number(200)); // send reply, otherwise Thingsee does not send next measurement normally
    next();
});

// Socket handling
io.sockets.on('connection', function (socket) {
    //wait for client to make a socket connection
    console.log("socket connection has been made");
});                              

server.listen(8040, function () {
    console.log('Node.js Locator server is listening at %s', server.url);
});

