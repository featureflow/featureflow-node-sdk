const EventSource = require('eventsource');
const Emitter = require('tiny-emitter');
const debug = require('./debug');

function connect(url, apiKey){
  debug('connecting to event-source');
  const emitter = new Emitter();
  const eventSourceInitDict = {
    headers: {
      Authorization: "Bearer "+apiKey,
      Accept: 'application/json'
    }};
  let es = new EventSource(url, eventSourceInitDict);
  es.addEventListener('message', (e) => {
    debug('connected to event-source');
    emitter.emit('features.updated', JSON.parse(e.data));
    emitter.emit('init');
  });

  es.addEventListener('features.updated', (e)=>{
    emitter.emit('features.updated', JSON.parse(e.data));
  });

  es.onerror = (e) => {
    debug('error connecting to event-source');
    emitter.emit('error', e);
  };
  return emitter;
}
module.exports = {
  connect: connect
};