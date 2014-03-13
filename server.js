/**
 * @fileoverview Application server for hosting static application files and
 *     client to client mapping actions.
 */

var fs = require('fs');
var path = require('path');
var http = require('http');
var sio = require('socket.io');
var url = require('url');

var mapbox = require(path.join(__dirname, 'mapbox.js'));


/**
 * Main content handler to serve up static files.
 *
 * @param {http.ClientRequest} request The HTTP request object.
 * @param {http.ServerRespone} response The HTTP response object.
 */
function handler(request, response) {
  var uri = url.parse(request.url).pathname;
  var filename = path.join(__dirname, uri);

  fs.exists(filename, function(exists) {
    // Send a simple 404 if the file does not exist.
    if(!exists) {
      response.writeHead(404, {'Content-Type': 'text/plain'});
      response.write('404 Not Found\n');
      response.end();
      return;
    }

    // Look for an index file if the requested path is a directory.
    // TODO(jordoncm): This should recheck that an index file exists and error
    //     properly if not. Currently if the folder exists and the index.html
    //     does not it will 500 below.
    if(fs.statSync(filename).isDirectory()) {
      filename += '/index.html';
    }

    // Read the file and write it to the response.
    fs.readFile(filename, 'binary', function(err, file) {
      if(err) {
        response.writeHead(500, {'Content-Type': 'text/plain'});
        response.write(err + '\n');
        response.end();
        return;
      }

      // TODO(jordoncm): Add proper Content-Type headers for things like CSS
      //     and Javascript.
      response.writeHead(200);
      response.write(file, 'binary');
      response.end();
    });
  });
}


/**
 * The main method to execute at runtime.
 *
 * Sets up the HTTP server and turns on socket listening.
 */
function main() {
  var app = http.createServer(handler);
  var io = sio.listen(app);
  app.listen(8000);

  // TODO(jordoncm): To ever do this on any kind of scale you will need a
  //     better layer of persistence for features than a simple in memory map,
  //     but this should work for prototype purposes.
  var features = {};

  io.sockets.on('connection', function(socket) {
    // Loop through features registered with the server and sync it to the new
    // client.
    for(var i in features) {
      socket.emit(mapbox.Topics.FEATURE_CREATED, features[i]);
    }

    socket.on(mapbox.Topics.FEATURE_CREATED, function(data) {
      // Add the feature to the server side hash and notfiy all clients.
      features[data.id] = data;
      io.sockets.emit(mapbox.Topics.FEATURE_CREATED, data);
    });

    socket.on(mapbox.Topics.FEATURE_DELETED, function(data) {
      // Delete the feature from the server and notify all clients.
      if(features[data]) {
        delete features[data];
        io.sockets.emit(mapbox.Topics.FEATURE_DELETED, data);
      }
    });

    socket.on(mapbox.Topics.FEATURE_EDITED, function(data) {
      // Update the feature with the server and notify all clients.
      if(features[data.id]) {
        features[data.id] = data;
        io.sockets.emit(mapbox.Topics.FEATURE_EDITED, data);
      }
    });
  });
}

main();
