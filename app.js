/**
 * @fileoverview Realtime geospatial collaboration prototype.
 */

$(function() {
  var map = L.mapbox.map('map', 'examples.map-9ijuk24y');
  map.addControl(L.mapbox.geocoderControl('examples.map-vyofok3q'));

  var featureGroup = L.featureGroup().addTo(map);
  (new L.Control.Draw({
    draw: {
      // Turn off cicles for now. They get serialized as points in GeoJSON by
      // Leaflet which doesn't render properly when sent to other clients.
      circle: false
    },
    edit: {
      featureGroup: featureGroup
    }
  })).addTo(map);

  var socket = io.connect('http://localhost');

  // Initialize feature creation handlers.
  map.on(
    'draw:created',
    _.partial(mapbox.drawing.created, _, featureGroup, socket)
  );
  socket.on(
    mapbox.Topics.FEATURE_CREATED,
    _.partial(mapbox.drawing.createdExternally, _, featureGroup)
  );

  // Initialize feature deletion handlers.
  map.on('draw:deleted', _.partial(mapbox.drawing.deleted, _, socket));
  socket.on(
    mapbox.Topics.FEATURE_DELETED,
    _.partial(mapbox.drawing.deletedExternally, _, featureGroup)
  );

  // Initialize feature editing handlers.
  map.on('draw:edited', _.partial(mapbox.drawing.edited, _, socket));
  socket.on(
    mapbox.Topics.FEATURE_EDITED,
    _.partial(mapbox.drawing.editedExternally, _, featureGroup)
  );
});
