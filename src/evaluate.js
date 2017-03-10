module.exports = class Evaluate{
  constructor(value){
    this.value = value;
  }

  is(value){
    return value === this.value;
  }

  isOn(){
    return this.is('on');
  }

  ifOff(){
    return this.is('off');
  }

  value(){
    return this.value;
  }
}