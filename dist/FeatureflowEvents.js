var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var request = require('request');
var debug = require('./debug');

module.exports = function () {
  function Events(apiKey, hostname) {
    _classCallCheck(this, Events);

    this.apiKey = apiKey;
    this.hostname = hostname;
  }

  _createClass(Events, [{
    key: '_event',
    value: function _event(method, path, json) {
      var _this = this;

      debug('post "%s" with json=%o', this.hostname + path, json);
      request({
        method: method,
        uri: this.hostname + path,
        json: json,
        headers: {
          'Authorization': 'Bearer ' + this.apiKey
        }
      }, function (errors, response, body) {
        if (response.statusCode < 200 || response.statusCode > 299) {
          debug('error posting, uri="%s", json=%o, apiKey=%s', _this.hostname + path, json, _this.apiKey);
          debug('error response, %O', response.body);
        }
      });
    }
  }, {
    key: 'send',
    value: function send(featureKey, expectedVariant, evaluatedVariant, context) {
      debug('sending evaluate event for feature "%s"', featureKey);
      this._event('POST', '/api/sdk/v1/events', [{
        featureKey: featureKey,
        evaluatedVariant: evaluatedVariant,
        expectedVariant: expectedVariant,
        context: context
      }]);
    }
  }, {
    key: 'register',
    value: function register(features) {
      debug('sending registration event for features="%o"', features);
      this._event('PUT', '/api/sdk/v1/register', features);
    }
  }]);

  return Events;
}();