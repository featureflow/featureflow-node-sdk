export default class Evaluate{
  constructor(featureKey, evaluatedVariant, user,  eventsClient){
    this.featureKey = featureKey;
    this.evaluatedVariant = evaluatedVariant;
    this.user = user;
    this.eventsClient = eventsClient;
  }

  is(value){
    this.eventsClient.evaluateEvent(this.featureKey, this.evaluatedVariant, value, this.user);
    return value === this.evaluatedVariant;
  }

  isOn(){
    return this.is('on');
  }

  isOff(){
    return this.is('off');
  }

  value(){
    return this.evaluatedVariant;
  }
}