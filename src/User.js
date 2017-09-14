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

  addAttribute(key, attribute){
    this.attributes[key] = [].concat(attribute);
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

  withAttribute(key, attribute){
    this.attributes[key] = [].concat(attribute);
    return this;
  }

  withAttributes(key, attributes){
    this.withAttribute(key, attributes);
    return this;
  }

  build(){
    return new User(this.id, this.attributes);
  }
}