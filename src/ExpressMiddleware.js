import Client from './Client';
import { UserBuilder }from './User';

export default function(options){
  let _featureflow;

  function respondWithFeatureflow(req, res, next){
    req.featureflow = {
      ..._featureflow,
      evaluate: function(key, user){
        if (typeof user === 'string'){
            user = new UserBuilder(user).build();
        }
        user.addAttribute('featureflow.ip', req.ip);
        return _featurelfow.evaluate(key, user);
      }
    }
  }

  return function(req, res, next){
    if (!featureflow){
      new Client(options, function(err, featureflow){
        _featureflow = featureflow;
        respondWithFeatureflow(req, res, next);
      });
    }
    else{
      respondWithFeatureflow(req, res, next);
    }
  }
}