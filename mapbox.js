/**
 * @fileoverview Provides mapbox main namespace.
 */


/**
 * Application namespace for collaboration demo.
 */
var mapbox = {};


/**
 * Enumeration of events with the server.
 *
 * @enum {string}
 */
mapbox.Topics = {
  FEATURE_CREATED: '//feature/created',
  FEATURE_DELETED: '//feature/deleted',
  FEATURE_EDITED: '//feature/edited'
};


/**
 * Generates a random alpha-numeric hash for use as a temporary identifier.
 *
 * Not really very securely random, but good enough for this demo.
 *
 * @return {string} A random alpha-numeric string.
 */
mapbox.generateHash = function() {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

    for(var i = 0; i < 15; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text + (new Date()).getTime();
};

try {
  module.exports = mapbox;
} catch(e) {}
