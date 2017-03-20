# featureflow-node-sdk

[![][npm-img]][npm-url]

[![][dependency-img]][dependency-url]

> Featureflow Node SDK

Get your Featureflow account at [featureflow.io](http://www.featureflow.io)

## Get Started

The easiest way to get started is to follow the [Featureflow quick start guides](http://docs.featureflow.io/docs)

## Change Log

Please see [CHANGELOG](https://github.com/featureflow/featureflow-node-sdk/blob/master/CHANGELOG.md).

## Installation

```bash
$ npm install --save featureflow-node-sdk
```

## Usage

### Adding Featureflow

##### Webpack
```js
var Featureflow = require('featureflow-node-sdk');
```
or using es6 syntax
```js
import Featureflow from 'featureflow-node-sdk';
```

##### Bower
Include the following script in HTML file. This will expose the global variable `Featureflow`
```html
<script crossorigin="anonymous" src="bower_components/featureflow-client/dist/featureflow.min.js"></script>
```
Note: It is recommended to use build tools to manage your bower dependencies.
Please see the [bower website](https://bower.io/#use-packages) for more details.

### Quick start

Get your environment's Featureflow Server API key and initialise a new Featureflow client

```js
var FF_SERVER_API_KEY = '<Your server api key goes here>';
//...
Featureflow.init({ apiKey: FF_SERVER_API_KEY }, function(error, featureflow){
  if (error){
    //... do something with your error
  }
  
  //featureflow object is now initialised here
  featureflow.evaluate('example-feature').isOn()
  
});
```

This will load the rules for each feature for the current environment specified by the api key.
These rules can be changed at `https://<your-org-key>.featureflow.io`, and will be streamed in realtime to your application.

**Note: You are responsible for passing the featureflow instance around your application**

In your code, you can test the value of your feature where the value of `my-feature-key` is equal to `'on'` 
```js
  if (featureflow.evaluate('my-feature-key').is('on')){
    // this feature code will be run because 'my-feature-key' is set to 'on'
  }
```

Because the default variants for any feature are `'on'` and `'off'`, we have provided two helper methods `.isOn()` and `.isOff()`

```js

if(featureflow.evaluate('my-feature-key').isOn()){
  // this feature code will be run because 'my-feature-key' is set to 'on'
}

if(featureflow.evaluate('my-feature-key').isOff()){
  // this feature code won't be run because 'my-feature-key' is not set to 'off'
}
```

For targeting features for specific contexts you will need to pass in a context object. 
Typically you would write a middleware to get this context for you.

```js
var context = {
  key: 'user@example.com',
  values: {
    roles: ['USER_ADMIN', 'BETA_CUSTOMER'],
    country: 'US',
    //...
  }
}

if (featureflow.evaluate('my-feature-key', context).isOn()){
  //Targeting of my-feature-key and given context matched.
}
```


Further documentation can be found [here](http://docs.featureflow.io/docs)

### API and Configuration
#### Globals
####`Featureflow.init(config, callback)`
Returns a `featureflow` instance, see below

| Params | Type | Default | Description |
|---------------|----------|--------------|----------------------------------------------------------------|
| `config.apiKey*` | `string` | **`Required`** | The Featureflow Server API key for the current environment |
| `config.withFeatures` | `WithFeature[]` | | Pre-register features with **featureflow.io** in code. See below for an example |
| **`return`** | `callback` |  | Callback with the signature `function(error, featureflow){}`. If error is `undefined`, then the `featureflow` instance has been initialised |

```js
//With Features example
config.withFeatures = [{
  key: 'string', 
  failoverVariant: 'string',
  variants: [ //must have two variants - Defaults to the 'on', 'off' variants
    {
      key: 'variant1',
      name: 'Variant 1'
    },
    {
      key: 'variant2',
      name: 'Variant 2'
    },
    {
      key: 'custom',
      name: 'Custom Variant'
    }
  ]
}]
```

####Featureflow Instance
These properties are available on `featureflow` instance returned in the callback of `Featureflow.init(config, callback)`
####`featureflow.evaluate(featureKey, [context])`
Returns an object that can be used to help evaluate feature values in an expressive way.

| Params | Type | Default | Description |
|---------------|----------|--------------|----------------------------------------------------------------|
| `featureKey*`  | `string` | **`Required`** | The feature key you are targeting |
| `context`  | `Context` | `{key: 'anonymous', values:{}}` | The current context you want to use for targeting |
| **`return`** | `Evaluate` | | An `Evaluate` instance

These are the following methods on the `Evaluate` instance.

######`featureflow.evaluate(...).is(value)`
Evaluates the value of a feature for the given context.

| Params | Type | Default | Description |
|---------------|----------|--------------|----------------------------------------------------------------|
| **`return`** | `boolean` | | `true` if the feature's value is equal to the `value` provided, otherwise `false`  |


######`featureflow.evaluate(...).isOn()`
Evaluates the value of a feature for the given context is equal to `'on'`.

| Params | Type | Default | Description |
|---------------|----------|--------------|----------------------------------------------------------------|
| **`return`** | `boolean` | | `true` if the feature's value is equal to `'on'` provided, otherwise `false`  |


######`featureflow.evaluate(...).isOff()`
Evaluates the value of a feature for the given context is equal to `'off'`.

| Params | Type | Default | Description |
|---------------|----------|--------------|----------------------------------------------------------------|
| **`return`** | `boolean` | | `true` if the feature's value is equal to `'off'` provided, otherwise `false`  |

######`featureflow.evaluate(...).value()`
Returns the value of a feature for the given context.

| Params | Type | Default | Description |
|---------------|----------|--------------|----------------------------------------------------------------|
| **`return`** | `string` | | The value of the feature, or the default feature value from `config.withFeatures[featureKey].defaultValue` if present, or `'off'`  |


####`featureflow.on(event, callback, [bindContext])`
Listen to events when the `featureflow` instance is updated

| Params | Type | Default | Description |
|---------------|----------|--------------|----------------------------------------------------------------|
| `event*`  | `string` | **`Required`** | The name of the event to subscribe to. See `Events` section below for available events. |
| `callback*`  | `function` | **`Required`** | The function to call when the event is emitted.  |
| `bindContext`  | `any` | `undefined` | The context to bind the event callback to.  |


####`featureflow.off(event, [callback])`
Listen to events when the `featureflow` instance is updated

| Params | Type | Default | Description |
|---------------|----------|--------------|----------------------------------------------------------------|
| `event*`  | `string` | **`Required`** | The name of the event to unsubscribe from. |
| `callback`  | `function` | **`Required`** | The callback used when binding the object  |

#### Object Types
####`context`
| Property | Type | Default | Description |
|---------------|----------|--------------|----------------------------------------------------------------|
| `key` | `string` | `"anonymous"` | Uniquely identifies the current user. Also used to calculate split variants |
| `values` | `object` | `{}` | Flat key-value object containing extra meta about the current user. Used to serve different features for specifically targeted attributes.

## Roadmap
- [x] Write documentation
- [x] Release to npm

## License

Apache-2.0

[npm-url]: https://nodei.co/npm/featureflow-node-sdk
[npm-img]: https://nodei.co/npm/featureflow-node-sdk.png

[dependency-url]: https://www.featureflow.io
[dependency-img]: https://www.featureflow.io/wp-content/uploads/2016/12/featureflow-web.png