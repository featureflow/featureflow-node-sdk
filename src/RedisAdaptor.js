import redis from 'redis';
import debug from './debug';

export default class RedisAdaptor{
  config = {};
  prefix;
  constructor(config){
    debug('RedisAdaptor: Connecting to redis');
    this.config = {
      ...this.config,
      ...config,
      prefix: undefined
    };
    this.prefix = config.prefix;
    this.pub = redis.createClient(this.config);
    this.sub = redis.createClient(this.config);
    this.sub.subscribe(this.prefix+':event');

    this.pub.on('error', function(e){
      debug('RedisAdaptor: PUB error %o', e);
    });

    this.sub.on('error', function(e){
      debug('RedisAdaptor: SUB error %o', e);
    });
  }

  publish(event, payload){
    this.debug('PUB', event, payload);
    this.pub.publish(this.prefix+':event', JSON.stringify({event, payload}));
    let features;
    switch(event){
      case 'set':
        features = Object.keys(payload).map(key=>{
          return [key, JSON.stringify(payload[key])];
        }).reduce((args, next)=>{
          return args.concat(next);
        },[]);
        return this.pub.hmset(this.prefix+':features', features);
      case 'reset':
        features = Object.keys(payload).map(key=>{
          return [key, JSON.stringify(payload[key])];
        }).reduce((args, next)=>{
          return args.concat(next);
        },[]);
        this.pub.del(this.prefix+':features');
        return this.pub.hmset(this.prefix+':features', features);
      case 'remove':
        return this.pub.hdel(this.prefix+':features', payload);
    }
  }

  subscribe(event, cb){
    this.sub.on('message', (channel, payload)=>{
      const json = JSON.parse(payload);
      if (json.event === event){
        this.debug('SUB', event, json.payload);
        cb(json.payload);
      }
    });
  }

  debug(client, event, payload){
    debug('RedisAdaptor: %s %s - %o',
      client,
      event,
      typeof payload == 'string' ? payload : Object.keys(payload)
    );
  }
}