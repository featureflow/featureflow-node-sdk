import EventSource from 'eventsource';
import Emitter from 'tiny-emitter';
import debug from './debug';

export function connect(url, apiKey){
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
