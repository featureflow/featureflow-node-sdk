import EventSource from 'eventsource';
import Emitter from 'tiny-emitter';
import debug from './debug';

export function connect(url, apiKey){
  let hasAttempted = false;
  debug('connecting to event-source');
  const emitter = new Emitter();
  const eventSourceInitDict = {
    headers: {
      Authorization: "Bearer "+apiKey,
      Accept: 'application/json'
    }};
  let es = new EventSource(url, eventSourceInitDict);
  es.addEventListener('message', (e) => {
    hasAttempted = true;
    debug('connected to event-source');
    emitter.emit('features.updated', JSON.parse(e.data));
    emitter.emit('connected', true);
    emitter.emit('init');
  });

  es.addEventListener('features.updated', (e)=>{
    emitter.emit('features.updated', JSON.parse(e.data));
  });

  es.onerror = (e) => {
    if (!hasAttempted){
      hasAttempted = true;
      debug('error connecting to event-source, starting in offline mode');
      emitter.emit('connected', false);
    }
  };
  return emitter;
}
