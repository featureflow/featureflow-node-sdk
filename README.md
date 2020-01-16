# featureflow-node-sdk

[![][npm-img]][npm-url]

[![Featureflow](https://circleci.com/gh/featureflow/featureflow-node-sdk.svg?style=svg)](https://circleci.com/gh/featureflow/featureflow-node-sdk)

[![][dependency-img]][dependency-url]

> Featureflow Node SDK

Get your Featureflow account at [featureflow.io](http://www.featureflow.io)

## Get Started

The easiest way to get started is to follow the [Featureflow quick start guides](http://docs.featureflow.io/docs)

## Examples

Express: [here](https://github.com/featureflow/featureflow-node-example)

NextJS: [here](https://github.com/featureflow/featureflow-example-nextjs)

5 Minute: [here](https://github.com/featureflow/featureflow-fiveminute-node) [(docs)](https://docs.featureflow.io/docs/nodejs-5-minute-test)

## Change Log

Please see [CHANGELOG](https://github.com/featureflow/featureflow-node-sdk/blob/master/CHANGELOG.md).

## Installation

```bash
$ npm install --save featureflow-node-sdk
```

## Usage

##### Node

First require `Featureflow` in your code.

```javascript
const Featureflow = require('featureflow-node-sdk');
```

or es6

```javascript
import Featureflow from 'featureflow-node-sdk';
```

The `Featureflow` object exposes
 `Featureflow.Client`, `Featureflow.UserBuilder` and `Featureflow.Feature`.

The usage of each of these is documented below.

### Quick start

Firstly you will need to get your environment's Featureflow Server API key and initialise a new Featureflow client

This will load the rules for each feature for the current environment, specified by the api key.
These rules can be changed at `https://<your-org-key>.featureflow.io`. 
When the rules are updated, the changes made will be applied to your application.

##### Node Quick Start

If you are using nodejs you can create a featureflow client like this:

```javascript
let featureflow = new Featureflow.Client({apiKey: '<Your server api key goes here>'});
```

In the previous example you will be able to use the `featureflow` immediately, however the features won't  be available immediately.
This works great if want to quickly set and forget, however if you want to guarantee that the features are available, pass a callback as the last argument.

```javascript
new Featureflow.Client({apiKey: '<Your server api key goes here>'}, function(error, featureflow){
  //featureflow will contain the featureflow client.
});
```
If no response has been received in 5 seconds, the callback will be fired.

You can also register a callback to `featureflow.ready` like this

```javascript
let featureflow = new Featureflow.Client({apiKey: '<Your server api key goes here>'});

featureflow.ready(function(){
  //featureflow is now initialized in this block
})
```

When creating a `featureflow` client you must have at least an `apiKey` in the config object, 
alternatively you can write you can set the environment variable `FEATUREFLOW_SERVER_KEY` and just write:

```javascript
let featureflow = new Featureflow.Client();
```
**Note: `featureflow`, as instantiated above, should be treated as a singleton and should not be instantiated before every use. 
You are responsible for sharing it with the rest of your application**

##### Express Quick Start
Please see the example at https://github.com/featureflow/featureflow-node-example

#### Defining a User

Before evaluating a feature you must define a user for the current user.  
Featureflow uses users to target different user groups to specific feature variants. 
A featureflow user has an `id`, which should uniquely identify the current user, and optionally additional `attributes`. 
Featureflow requires the user `id` to be unique per user for gradual rollout of features.

There are two ways to define a user:
```javascript
import Featureflow from 'featureflow-node-sdk';
let userId = '<unique_user_identifier>';

// option 1, use the user builder
let user = new Featureflow.UserBuilder(userId)
                                     .withAttribute('country', 'US')
                                     .withAttributes('roles', ['USER_ADMIN', 'BETA_CUSTOMER'])
                                     .build();

// option 2, use just a string
let user = userId;
```

#### Evaluating Features

In your code, you can test the value of your feature using something similar to below
For these examples below, assume the feature `my-feature-key` is equal to `'on'` for the current `user`
```javascript
if (featureflow.evaluate('my-feature-key', user).is('on')){
  // this code will be run because 'my-feature-key' is set to 'on' for the given user
}
```
Because the most common variants for a feature are `'on'` and `'off'`, we have provided two helper methods `.isOn()` and `.isOff()`

```javascript

if (featureflow.evaluate('my-feature-key', user).isOn()){
  // this feature code will be run because 'my-feature-key' is set to 'on'
}

if (featureflow.evaluate('my-feature-key', user).isOff()){
  // this feature code won't be run because 'my-feature-key' is not set to 'off'
}
```

#### Pre-registering Features

Featureflow allows you to pre-register features that may not be defined in your Featureflow project to ensure that those 
features are available when that version of your code is running. 
If in the off-chance your application is unable to access the Featureflow servers and you don't have access 
to a cached version of the features, you can specify a failover variant for any feature. 

The failover variant allows you to control what variant a feature will evaluate to when no rules are available for the feature.
If a failover variant isn't defined, each feature will use a default failover variant of `'off'`.

You can pre-register features at the initialisation of your featureflow client like below:

```javascript
import Featureflow from 'featureflow-node-sdk';

const FEATUREFLOW_SERVER_KEY = '<Your server api key goes here>';

new Featureflow.Client({
  apiKey: FEATUREFLOW_SERVER_KEY,
  withFeatures: [
    new Featureflow.Feature('key-one', 'on').build(),
    new Featureflow.Feature('key-two').build(),
    new Featureflow.Feature('key-three', 'custom').build(),
  ]
}, function(err, featureflow){
  const user = "user1";
  //these features don't exist so we it will use the defaults provided
  featureflow.evaluate('key-one', user).isOn(); // == true
  featureflow.evaluate('key-two', user).isOff(); // == true
  featureflow.evaluate('key-three', user).is('custom'); // == true

});

```

#### Further documentation
Further documentation can be found [here](http://docs.featureflow.io/docs)

## Roadmap
- [x] Write documentation
- [x] Release to npm
- [ ] Write express integration

## License

Apache-2.0

[npm-url]: https://nodei.co/npm/featureflow-node-sdk
[npm-img]: https://nodei.co/npm/featureflow-node-sdk.png

[dependency-url]: https://www.featureflow.io
[dependency-img]: https://www.featureflow.io/wp-content/uploads/2016/12/featureflow-web.png
