var EventSource = require('eventsource');
var Emitter = require('tiny-emitter');
var debug = require('./debug');

function connect(url, apiKey) {
  debug('connecting to event-source');
  var emitter = new Emitter();
  var eventSourceInitDict = {
    headers: {
      Authorization: "Bearer " + apiKey,
      Accept: 'application/json'
    } };
  var es = new EventSource(url, eventSourceInitDict);
  es.addEventListener('message', function (e) {
    debug('connected to event-source');
    emitter.emit('features.updated', JSON.parse(e.data));
    emitter.emit('init');
  });

  es.addEventListener('features.updated', function (e) {
    emitter.emit('features.updated', JSON.parse(e.data));
  });

  es.onerror = function (e) {
    debug('error connecting to event-source');
    emitter.emit('error', e);
  };
  return emitter;
}
module.exports = {
  connect: connect
};