import EventSource from 'eventsource';
import Emitter from 'tiny-emitter';
import debug from './debug';

export function connect(url, apiKey){
  let hasAttempted = false;
  let attempts = 0;
  debug('connecting to event-source');
  const emitter = new Emitter();
  const eventSourceInitDict = {
    headers: {
      Authorization: "Bearer "+apiKey,
      Accept: 'application/json'
    }
  };
  let es = new EventSource(url, eventSourceInitDict);
  es.addEventListener('message', (e) => {
    hasAttempted = true;
    attempts = 0;
    debug('connected to event-source');
    emitter.emit('connected', true);
    emitter.emit('init', JSON.parse(e.data));
  });

  es.addEventListener('features.updated', (e)=>{
    emitter.emit('features.updated', JSON.parse(e.data));
  });

  es.onerror = () => {
    if (!hasAttempted){
      hasAttempted = true;
      debug('error connecting to event-source, starting in offline mode');
      emitter.emit('connected', false);
      emitter.emit('init');
    }
    else{
      attempts++;
      debug('error connecting, retry attempt %d', attempts);
    }
  };
  return {
    emitter,
    close: es.close.bind(this)
  };
}
