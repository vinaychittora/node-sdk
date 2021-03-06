var util = require('util');
var OAuth2Strategy = require('passport-oauth2');
var request = require('request');
var qs = require('querystring');
var cfg = require('../config');

function Strategy(options, verify) {
  var opts = options || {};

  this._sandbox = opts.sandbox;
  this._baseUrl = opts.sandbox ? cfg.sandbox_baseurl : cfg.baseurl;

  opts.authorizationURL = this._baseUrl + '/oauth2/authorize';
  opts.tokenURL = this._baseUrl + '/oauth2/token';
  opts.scopeSeparator = opts.scopeSeparator || ',';

  OAuth2Strategy.call(this, opts, verify);

  this.name = 'signeasy';

  this._oauth2._executeRequest = function(httpLib, ops, postBody, callback) {
    var callbackCalled = false;
    var postparams = JSON.parse(JSON.stringify(qs.parse(postBody)));
    var reqOptions = {
      url: 'https://' + ops.host + ops.path,
      json: true,
      formData: postparams
    };

    function passBackControl(response, result) {
      if (!callbackCalled) {
        callbackCalled = true;
        if (
          !(response.statusCode >= 200 && response.statusCode <= 299) &&
          response.statusCode !== 301 &&
          response.statusCode !== 302
        ) {
          callback({ statusCode: response.statusCode, data: result });
        } else {
          callback(null, result, response);
        }
      }
    }

    request.post(reqOptions, function(error, response, body) {
      if (error) {
        callbackCalled = true;
        callback(error);
        return;
      }

      passBackControl(response, JSON.stringify(body));
    });
  };
}

// Inherit from `OAuth2Strategy`.
util.inherits(Strategy, OAuth2Strategy);

// Expose constructor.
module.exports = Strategy;
