// -------------------------------------------
// Loads resources from the /resources folder
// -------------------------------------------
export default function redis(ripple){
  log('creating')
  key('adaptors.redis', d => init(ripple))(ripple)
  return ripple
}

const init = ripple => config => {
  log(`creating redis connection with ${config}`)
  const con = require('ioredis').createClient(config)
  
  return { 
    change: crud(con)
   ,load: load(con)
   ,decorator: cacher(con)
  }
}

, crud = con => type => (res, change) => {
    const { name, body } = res
    const { key, value, type } = change
    log(`${type} ${name} ${key}`)
    log(value)
    return con.get(name)
            .then(r => !!r && JSON.parse(r, recycl()))
            .then( r => {
                let v = !!r && set(change)(r) || value
                ;!!v && con.set(name, JSON.stringify(v, decycl()))
            })
            
}

, load = con => name => con
            .get(name)
            .then(r => JSON.parse(r))  

, hash = thing => !!thing && crypto
      .createHash('md5')
      .update(thing)
      .digest('hex')

, cacher = (redis,  namespace='rijs_cache') => fn => {
    return (arg, ...args) => {
      let h = hash(arg)
      ,   key = `${namespace}_${h}`
      ,     p = promise()
      ,   par = d => JSON.parse(JSON.parse(d))
      log(key)
      redis.get(key)
        .then( d => (!!d && JSON.parse(d)) || fn(arg) )
        .then( d => { redis.set(key, JSON.stringify(d)); p.resolve(d) } )
      return p
   }
}




import { default as from } from 'utilise/from'
import promise from 'utilise/promise'
import set from 'utilise/set'
import key from 'utilise/key'
const loaded = 'headers.redis.loaded'
const crypto = require('crypto')
    , jsutil = require('json-decycle')
    , decycl = jsutil.decycle
    , recycl = jsutil.retrocycle
    , log = require('utilise/log')('[ri/redis]')
    , err = require('utilise/err')('[ri/redis]')
