export default class Feature{
  variants = [];
  constructor(key, failoverVariant = 'off'){
    this.key = key;
    this.failoverVariant = failoverVariant;
  }

  addVariant(key, value){
    value = value || key;
    this.variants.push({
      key,
      value
    });
    return this;
  }

  build(){
    if (this.variants.length < 2){
      this.variants = [];
      this.addVariant('on').addVariant('off');
    }
    return {
      key: this.key,
      failoverVariant: this.failoverVariant,
      variants: this.variants
    }
  }
}