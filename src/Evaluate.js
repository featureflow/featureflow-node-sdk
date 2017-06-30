export default class Evaluate{
  constructor(featureKey, evaluatedVariant, context,  eventsClient){
    this.featureKey = featureKey;
    this.evaluatedVariant = evaluatedVariant;
    this.context = context;
    this.eventsClient = eventsClient;
  }

  is(value){
    this.eventsClient.evaluateEvent(this.featureKey, this.evaluatedVariant, value, this.context);
    return value === this.evaluatedVariant;
  }

  isOn(){
    return this.is('on');
  }

  ifOff(){
    return this.is('off');
  }

  value(){
    return this.evaluatedVariant;
  }
}