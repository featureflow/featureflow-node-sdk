class User{
  constructor(id, attributes){
    this.id = id;
    this.attributes = {...attributes};
  }

  getId(){
    return this.id;
  }

  getAttributesForKey(key){
    return this.attributes[key];
  }

  addAttribute(key, value){
    this.attributes[key] = [].concat(value);
  }

  getAttributes(){
    return this.attributes;
  }
}

export class UserBuilder{
  constructor(id){
    if (!id || !id.length){
      throw new Error("User must have an id");
    }
    this.id = id;
    this.attributes = {
      'featureflow.user.id': [id],
      'featureflow.date': [new Date().toISOString()]
    }
  }

  withAttribute(key, value){
    this.attributes[key] = [].concat(value);
    return this;
  }

  withAttributes(key, values){
    this.withAttribute(key, values);
    return this;
  }

  build(){
    return new User(this.id, this.attributes);
  }
}