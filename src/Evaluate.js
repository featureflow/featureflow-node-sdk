export default class Evaluate{
  constructor(featureKey, evaluatedVariant, user, eventsClient, variants = []){
    this.featureKey = featureKey;
    this.evaluatedVariant = evaluatedVariant;
    this.user = user;
    this.eventsClient = eventsClient;
    this.variants = variants || [];
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
    this.eventsClient.evaluateEvent(this.featureKey, this.evaluatedVariant, null, this.user);
    return this.evaluatedVariant;
  }

  /**
   * The evaluated variant's JSON config payload, or undefined if it has none.
   * Records the same evaluation event as value()/is() — only the variant key ever reaches
   * events, never this payload.
   */
  jsonValue(){
    this.eventsClient.evaluateEvent(this.featureKey, this.evaluatedVariant, null, this.user);
    const variant = this.variants.find(v => v.key === this.evaluatedVariant);
    return variant ? variant.value : undefined;
  }
}