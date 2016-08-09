/* eslint no-magic-numbers:0 */

'use strict'

const _ = require('lodash')
const test = require('tape')
const bracketData = require('bracket-data')
const Watcher = require('../index')

const year = '2013'
const sport = 'ncaam'
const data = bracketData({year, sport})
const order = data.order
const constants = data.constants

const scores = {
  url: 'http://mock-url-for-tests.com'
}

test('It should update the first round all at once', (t) => {
  const masters = []

  const watcher = new Watcher({
    scores,
    year,
    sport,
    onSave (master) {
      masters.push(master)
    },
    onDrain () {
      t.equal(masters.length, 32)
      t.equal(_.last(masters), 'MW18546372XXXXXXXW18546372XXXXXXXS18546372XXXXXXXE18546372XXXXXXXFFXXX')
      t.end()
    }
  }).scores

  constants.REGION_IDS.forEach((region) => {
    for (let i = 0, m = order.length; i < m; i += 2) {
      watcher.emit('event', {
        region,
        home: {
          rank: order[i],
          winner: true
        },
        away: {
          rank: order[i + 1],
          winner: false
        }
      })
    }
  })
})

test('It should update the first round separately if not queued and async', (t) => {
  let drainCount = 0
  const masters = []
  const after = [
    'MW1XXXXXXXXXXXXXXWXXXXXXXXXXXXXXXSXXXXXXXXXXXXXXXEXXXXXXXXXXXXXXXFFXXX',
    'MW18XXXXXXXXXXXXXWXXXXXXXXXXXXXXXSXXXXXXXXXXXXXXXEXXXXXXXXXXXXXXXFFXXX',
    'MW185XXXXXXXXXXXXWXXXXXXXXXXXXXXXSXXXXXXXXXXXXXXXEXXXXXXXXXXXXXXXFFXXX',
    'MW1854XXXXXXXXXXXWXXXXXXXXXXXXXXXSXXXXXXXXXXXXXXXEXXXXXXXXXXXXXXXFFXXX',
    'MW18546XXXXXXXXXXWXXXXXXXXXXXXXXXSXXXXXXXXXXXXXXXEXXXXXXXXXXXXXXXFFXXX',
    'MW185463XXXXXXXXXWXXXXXXXXXXXXXXXSXXXXXXXXXXXXXXXEXXXXXXXXXXXXXXXFFXXX',
    'MW1854637XXXXXXXXWXXXXXXXXXXXXXXXSXXXXXXXXXXXXXXXEXXXXXXXXXXXXXXXFFXXX',
    'MW18546372XXXXXXXWXXXXXXXXXXXXXXXSXXXXXXXXXXXXXXXEXXXXXXXXXXXXXXXFFXXX'
  ]

  const watcher = new Watcher({
    scores,
    year,
    sport,
    onSave (master, cb) {
      masters.push(master)
      t.equal(master, after[drainCount])
      drainCount++
      if (drainCount === 8) {
        t.equal(masters.join(','), after.join(','))
      }
      setTimeout(() => cb(), _.random(100, 150))
    },
    onDrain () {
      t.equal(drainCount, 8)
      t.end()
    }
  }).scores

  for (let i = 0, m = order.length; i < m; i += 2) {
    watcher.emit('event', {
      region: 'MW',
      home: {
        rank: order[i],
        winner: true
      },
      away: {
        rank: order[i + 1],
        winner: false
      }
    })
  }
})

test('It should update a few games with gaps', (t) => {
  let count = 0

  const watcher = new Watcher({
    scores,
    year,
    sport,
    onSave (master) {
      if (count === 0) {
        t.equal(master, constants.EMPTY.replace('MWXX', 'MW1X'))
      } else if (count === 1) {
        t.equal(master, constants.EMPTY.replace('MWXX', 'MW18'))
      }
    },
    onDrain () {
      count++
      if (count === 2) t.end()
    }
  }).scores

  watcher.emit('event', {
    region: 'MW',
    home: {
      rank: 1,
      winner: true
    },
    away: {
      rank: 16,
      winner: false
    }
  })

  setTimeout(() => {
    watcher.emit('event', {
      region: 'midwest',
      home: {
        rank: 8,
        winner: true
      },
      away: {
        rank: 9,
        winner: false
      }
    })
  }, 500)
})
