import EventSource from './eventsource';
import debug from './debug';

export default class StreamingClient{
  hasInitialised = false;

  constructor(url, apiKey, featureStore, emit){
    this.es = new EventSource(url, {
      headers: {
        Authorization: "Bearer "+apiKey,
        Accept: 'application/json'
      }
    });

    debug('connecting to EventSource');
    this.es.addEventListener('message', (e) =>{
      featureStore.reset(JSON.parse(e.data));
      if (!this.hasInitialised){
        emit('init');
        this.hasInitialised = true;
        debug('connected to EventSource');
      }
    });

    this.es.addEventListener('features.updated', (e) => {
      featureStore.set(JSON.parse(e.data));
      emit('updated', Object.keys(e));
    });

    this.es.onerror = (e)=>{
      debug('error connecting to EventSource');
      if (!this.hasInitialised){
        emit('init');
        this.hasInitialised = true;
        debug('starting in offline mode');
      }
    }
  }

  close(){
    this.es.close();
  }

}

