class Context{
  constructor(key, values){
    this.key = key;
    this.values = {...values};
  }

  getKey(){
    return this.key;
  }

  getValuesForKey(key){
    return this.values[key];
  }
}

export class ContextBuilder{
  constructor(key){
    if (!key || !key.length){
      throw new Error("Context must have a key");
    }
    this.key = key;
    this.values = {
      'featureflow.key': [key],
      'featureflow.date': [new Date().toISOString()]
    }
  }

  withValue(key, value){
    this.values[key] = [].concat(value);
    return this;
  }

  withValues(key, values){
    this.withValue(key, values);
    return this;
  }

  build(){
    return new Context(this.key, this.values);
  }
}