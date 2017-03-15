'use strict'

// core
const EventEmitter = require('events')
const extname = require('path').extname
const fs = require('fs')

// npm
const chokidar = require('chokidar')
const debug = require('debug')('main')
const pify = require('pify')

const ignore = (p) => extname(p) !== '.json'

const json = (p) => {
  if (ignore(p)) { return false }
  try {
    const j = JSON.parse(fs.readFileSync(p, 'utf-8'))
    if (j._id) { return j }
    debug('No _id')
    return false
  } catch (e) {
    debug(e)
    return false
  }
}

class FsEm extends EventEmitter {
  constructor (p) {
    super()
    debug('super FsEm')
    const options = {
      ignoreInitial: true,
      ignorePermissionErrors: true
    }
    this.path = p
    this.watcher = chokidar.watch(p, options)
  }

  get watched () { return this.watcher.getWatched() }

  init () {
    const add = (p, stat) => {
      const j = json(p)
      if (j) { this.emit('update', p, stat, j) }
    }

    const unlink = (p) => {
      if (!ignore(p)) { this.emit('update', p) }
    }

    return new Promise((resolve, reject) => {
      const ready = () => {
        debug('FsEm ready', this.path)
        resolve(this.watched)
      }

      const error = (err) => {
        debug(err)
        reject(err)
      }

      this.watcher
        .once('ready', ready)
        .once('error', error)
        .on('add', add)
        .on('change', add)
        .on('unlink', unlink)
    })
  }
}

class CdbEm extends EventEmitter {
  constructor (p) {
    super()
    debug('super FsEm')
    const options = {
      ignoreInitial: true,
      ignorePermissionErrors: true
    }
    this.path = p
    this.watcher = chokidar.watch(p, options)
  }

  get watched () { return this.watcher.getWatched() }

  init () {
    const add = (p, stat) => {
      const j = json(p)
      if (j) { this.emit('update', p, stat, j) }
    }

    const unlink = (p) => {
      if (!ignore(p)) { this.emit('update', p) }
    }

    return new Promise((resolve, reject) => {
      const ready = () => {
        debug('FsEm ready', this.path)
        resolve(this.watched)
      }

      const error = (err) => {
        debug(err)
        reject(err)
      }

      this.watcher
        .once('ready', ready)
        .once('error', error)
        .on('add', add)
        .on('change', add)
        .on('unlink', unlink)
    })
  }
}

const writeFile = pify(fs.writeFile)
const readFile = pify(fs.readFile)
const unlink = pify(fs.unlink)

const y = new FsEm('d1')

const z = new CdbEm('d2')

y.on('update', (p, stat, j) => {
  debug('update-d1', p, stat, j)
  const pp = p.split('/')
  pp[0] = 'd2'
  const p2 = pp.join('/')

  const pr = stat
    ? readFile(p).then((b) => writeFile(p2, b))
    : unlink(p2)

  pr
    .then((x) => {
      console.log(typeof x, x)
    })
    .catch(debug)
})

z.on('update', (p, stat, j) => {
  debug('update-d2', p, stat, j)
  const pp = p.split('/')
  pp[0] = 'd1'
  const p2 = pp.join('/')

  const pr = stat
    ? readFile(p).then((b) => writeFile(p2, b))
    : unlink(p2)

  pr
    .then((x) => {
      console.log(typeof x, x)
    })
    .catch(debug)
})

Promise.all([y.init(), z.init()])
  .then((ww) => {
    const w = ww[0]
    console.log('GO!', ww.length, w)
  })
