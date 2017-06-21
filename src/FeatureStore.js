import debug from './debug';
import Emitter from 'tiny-emitter';

class inMemoryAdaptor {
  constructor(){
    const emitter = new Emitter();
    this.subscribe = emitter.on.bind(emitter);
    this.unsubscribe = emitter.off.bind(emitter);
    this.publish = emitter.emit.bind(emitter);
  }
}

export default class FeatureStore{
  features = {};

  constructor(adaptor = new inMemoryAdaptor()){
    this.adaptor = adaptor;
    adaptor.subscribe('set', (features)=>{
      this.features = {
        ...this.features,
        ...features
      }
    });

    adaptor.subscribe('remove', (key)=>{
      this.features[key] = undefined;
    });

    adaptor.subscribe('reset', (features)=>{
      this.features = features;
    });
  }

  get(key){
    debug('FeatureStore: Getting %s', key);
    return this.features[key];
  }

  set(features){
    debug('FeatureStore: Setting features %o', Object.keys(features));
    this.adaptor.publish('set', features);
  }

  reset(features){
    debug('FeatureStore: Resetting features %o', Object.keys(features));
    this.adaptor.publish('reset', features);
  }

  remove(key){
    debug('FeatureStore: Removing feature %s', key);
    this.adaptor.publish('remove', key);
  }
}