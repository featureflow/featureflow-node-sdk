export default class Evaluate{
  constructor(featureKey, evaluatedVariant, user, eventsClient, variants = [], trackEvents = false, onRecord = undefined){
    this.featureKey = featureKey;
    this.evaluatedVariant = evaluatedVariant;
    this.user = user;
    this.eventsClient = eventsClient;
    this.variants = variants || [];
    // Per-flag exposure fidelity for experiments: set from the feature's `trackEvents`
    // wire field, forwarded so the events client records every (user, flag) exposure.
    this.trackEvents = trackEvents;
    // Invoked alongside every recorded evaluation event, so the client's 'evaluation'
    // emitter event fires exactly as often as an impression is counted — the two must
    // never disagree about what an exposure is.
    this.onRecord = onRecord;
  }

  _record(){
    this.eventsClient.evaluateEvent(this.featureKey, this.evaluatedVariant, this.user, this.trackEvents);
    if (this.onRecord) {
      this.onRecord();
    }
  }

  is(value){
    this._record();
    return value === this.evaluatedVariant;
  }

  isOn(){
    return this.is('on');
  }

  isOff(){
    return this.is('off');
  }

  value(){
    this._record();
    return this.evaluatedVariant;
  }

  /**
   * The evaluated variant's JSON config payload, or undefined if it has none.
   * Records the same evaluation event as value()/is() — only the variant key ever reaches
   * events, never this payload.
   */
  jsonValue(){
    this._record();
    const variant = this.variants.find(v => v.key === this.evaluatedVariant);
    return variant ? variant.value : undefined;
  }
}
