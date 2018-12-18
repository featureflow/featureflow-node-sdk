import Client from './Client';

export default function(options){
  let _featureflow;

  function respondWithFeatureflow(req, res, next){
    req.featureflow = _featureflow;
    next();
  }

  return function(req, res, next){
    if (!_featureflow){
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