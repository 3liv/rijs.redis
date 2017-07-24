'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = redis;

var _from = require('utilise/from');

var _from2 = _interopRequireDefault(_from);

var _promise = require('utilise/promise');

var _promise2 = _interopRequireDefault(_promise);

var _set = require('utilise/set');

var _set2 = _interopRequireDefault(_set);

var _key = require('utilise/key');

var _key2 = _interopRequireDefault(_key);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// -------------------------------------------
// Loads resources from the /resources folder
// -------------------------------------------
function redis(ripple) {
  log('creating');
  (0, _key2.default)('adaptors.redis', function (d) {
    return init(ripple);
  })(ripple);
  return ripple;
}

var init = function init(ripple) {
  return function (config) {
    log('creating redis connection with ' + config);
    var con = require('ioredis').createClient(config);

    return {
      change: crud(con),
      load: load(con),
      decorator: cacher(con)
    };
  };
},
    crud = function crud(con) {
  return function (type) {
    return function (res, change) {
      var name = res.name,
          body = res.body;
      var key = change.key,
          value = change.value,
          type = change.type;

      log(type + ' ' + name + ' using key: ' + key);
      log(value);
      return con.get(name).then(function (r) {
        return !!r && JSON.parse(r, recycl());
      }).then(function (r) {
        var v = !!r && (0, _set2.default)(change)(r) || value;!!v && con.set(name, JSON.stringify(v, decycl()));
      }).catch(function () {
        return null;
      });
    };
  };
},
    load = function load(con) {
  return function (name) {
    return con.get(name).then(function (r) {
      return JSON.parse(r);
    });
  };
},
    hash = function hash(thing) {
  return !!thing && crypto.createHash('md5').update(thing).digest('hex');
},
    cacher = function cacher(redis) {
  var namespace = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'rijs_cache';
  return function (fn) {
    return function (arg) {
      var h = hash(arg),
          key = namespace + '_' + h,
          p = (0, _promise2.default)(),
          par = function par(d) {
        return JSON.parse(JSON.parse(d));
      };
      log(key);
      redis.get(key).then(function (d) {
        return !!d && JSON.parse(d) || fn(arg);
      }).then(function (d) {
        redis.set(key, JSON.stringify(d));p.resolve(d);
      }).catch(function () {
        return null;
      });
      return p;
    };
  };
};

var loaded = 'headers.redis.loaded';
var crypto = require('crypto'),
    jsutil = require('json-decycle'),
    decycl = jsutil.decycle,
    recycl = jsutil.retrocycle,
    log = require('utilise/log')('[ri/redis]'),
    err = require('utilise/err')('[ri/redis]');
