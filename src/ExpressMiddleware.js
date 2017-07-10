import Client from './Client';
import { ContextBuilder }from './Context';

export default function(options){
  let _featureflow;

  function respondWithFeatureflow(req, res, next){
    req.featureflow = {
      ..._featureflow,
      evaluate: function(key, context){
        if (typeof context === 'string'){
          context = new ContextBuilder(context).build();
        }
        context.addValue('featureflow.ip', req.ip);
        return _featurelfow.evaluate(key, context);
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