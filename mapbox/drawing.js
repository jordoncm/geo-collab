/**
 * @fileoverview Drawing controller methods for handling feature creation,
 *     editing and deletion events coming from the map or server.
 */


/**
 * The drawing namespace.
 */
mapbox.drawing = {};


/**
 * Handles creation of a feature on the map by the direct client.
 *
 * @param {Object} e The event object.
 * @param {L.FeatureGroup} featureGroup The feature group tied to the drawing
 *     tools.
 * @param {Object} socket The socket connection.
 */
mapbox.drawing.created = function(e, featureGroup, socket) {
  // Set an id to track this feature by.
  e.layer.id = mapbox.generateHash();

  // Add it to the group for future editing.
  featureGroup.addLayer(e.layer);

  // Notify server of creation.
  socket.emit(
    mapbox.Topics.FEATURE_CREATED,
    {id: e.layer.id, geometry: e.layer.toGeoJSON()}
  );
};


/**
 * Handles the creation of feature that was created by an external client.
 *
 * @param {Object} data The response data from the socket including the id and
 *     geometry.
 * @param {L.FeatureGroup} featureGroup The feature group tied to the drawing
 *     tools.
 */
mapbox.drawing.createdExternally = function(data, featureGroup) {
  // Make sure we don't already have the geometry.
  if(mapbox.drawing.hasLayer(data.id, featureGroup)) {
    return;
  }

  // Create the layer and add it to the feature group.
  var layer = L.GeoJSON.geometryToLayer(data.geometry);
  layer.id = data.id;

  featureGroup.addLayer(layer);
};


/**
 * Handles the deletion of features by the direct client.
 *
 * @param {Object} e The event object.
 * @param {Object} socket The socket connection.
 */
mapbox.drawing.deleted = function(e, socket) {
  e.layers.eachLayer(function(layer) {
    // Loop trough the deleted items and notify the server.
    socket.emit(mapbox.Topics.FEATURE_DELETED, layer.id);
  });
};


/**
 * Handles the deletion of a feature by an external client.
 *
 * @param {string} id The id of the layer to delete.
 * @param {L.FeatureGroup} featureGroup The feature group tied to the drawing
 *     tools.
 */
mapbox.drawing.deletedExternally = function(id, featureGroup) {
  if(mapbox.drawing.hasLayer(id, featureGroup)) {
    featureGroup.removeLayer(mapbox.drawing.getLayer(id, featureGroup));
  }
};


/**
 * Handles the editing of features by the direct client.
 *
 * @param {Object} e The event object.
 * @param {Object} socket The socket connection.
 */
mapbox.drawing.edited = function(e, socket) {
  e.layers.eachLayer(function(layer) {
    // Loop trough the edited items and notify the server.
    socket.emit(
      mapbox.Topics.FEATURE_EDITED,
      {id: layer.id, geometry: layer.toGeoJSON()}
    );
  });
};


/**
 * Handles an edit of a feature by an external client.
 *
 * NOTE: This method has a side effect of rerendering features that were
 * actually edited by the client. Not really a good way at this point to filter
 * that out.
 *
 * @param {Object} data The response data from the socket including the id and
 *     geometry.
 * @param {L.FeatureGroup} featureGroup The feature group tied to the drawing
 *     tools.
 */
mapbox.drawing.editedExternally = function(data, featureGroup) {
  if(mapbox.drawing.hasLayer(data.id, featureGroup)) {
    var updatedLayer = L.GeoJSON.geometryToLayer(data.geometry);
    var layer = mapbox.drawing.getLayer(data.id, featureGroup);
    if(layer instanceof L.Marker) {
      layer.setLatLng(updatedLayer.getLatLng());
    } else if(layer instanceof L.Polyline) {
      layer.setLatLngs(updatedLayer.getLatLngs());
    }
  }
};


/**
 * Determine whether or not a layer group has a given feature.
 *
 * @param {string} id The id of the layer to search for.
 * @param {L.LayerGroup} group The group to search.
 * @return {L.ILayer|undefined} Returns the layer if found, undefined
 *     otherwise.
 */
mapbox.drawing.getLayer = function(id, group) {
  var layers = group.getLayers();
  for(var i = 0; i < layers.length; i++) {
    if(layers[i].id == id) {
      return layers[i];
    }
  }
};


/**
 * Determine whether or not a layer group has a given feature.
 *
 * @param {string} id The id of the layer to search for.
 * @param {L.LayerGroup} group The group to search.
 * @return {boolean} True if feature by given id is found, false otherwise.
 */
mapbox.drawing.hasLayer = function(id, group) {
  var layers = group.getLayers();
  for(var i = 0; i < layers.length; i++) {
    if(layers[i].id == id) {
      return true;
    }
  }

  return false;
};
