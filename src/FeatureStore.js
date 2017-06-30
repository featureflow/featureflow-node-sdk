export class InMemoryFeatureStore{
  constructor(features = {}){
    this.features = {};
    this.setAll(features);
  }


  get(key){
    return this.features[key];
  }

  set(key, feature){
    this.features[key] = {...feature};
  }

  setAll(features){
    this.features = {};
    for (let key in features){
      this.features[key] = {...features[key]};
    }
  }
}