'use strict';

const path = require('path');
const bucker = require('bucker');
const _ = require('lodash');
const Scores = require('scores');
const BracketUpdater = require('bracket-updater');
const bracketData = require('bracket-data');
const async = require('async');

class Watcher {
  constructor(options) {
    this.options = _.defaults(options || {}, {
      logger: null,
      sport: 'ncaam',
      year: new Date().getFullYear(),
      master: '',
      logfile: path.resolve(__dirname, 'logs', 'app.log'),
      onSave() {},
      onDrain() {},
      scores: {}
    });

    const sport = this.options.sport;
    const year = this.options.year;
    const empty = bracketData({year, sport}).constants.EMPTY;
    const master = this.options.master || empty;

    if (!sport || !year) {
      throw new Error('Needs a sport and a year');
    }

    // Create the score watcher
    this.scores = new Scores(_.extend({logger: this.logger}, this.options.scores));
    this.scores.on('event', (event) => this.onEvent(event));

    // The logger will be passed to the score watcher to
    // log everything there.
    this.logger = this.options.logger || bucker.createLogger({
      console: {color: true},
      app: {
        filename: this.options.logfile,
        format: ':level :time :data',
        timestamp: 'HH:mm:ss',
        accessFormat: ':time :level :method :status :url'
      }
    });

    // Create our bracket update with the initial master to be updated
    this.updater = new BracketUpdater({
      sport,
      year,
      currentMaster: master
    });

    // Helpful for debugging how the watcher was started
    this.logger.debug('[INIT SCOREWATCHER]', JSON.stringify({master, year, sport}));

    // Queue ensures that even if the score watcher emits
    // more than one event, we can still update the master bracket
    // in order, by optionally passing a callback to onSave
    this.queue = async.queue(this.queueWorker.bind(this), 1);

    // Drain is mostly just used in tests
    this.queue.drain = this.options.onDrain;
  }

  queueWorker(event, cb) {
    this.logger.debug('[EVENT QUEUED]', JSON.stringify(event));

    const updated = this.updater.update(event);

    if (updated instanceof Error) {
      this.logger.error('[UPDATE FAILED]', updated);
      return cb();
    }

    this.logger.debug('[UPDATED]', updated);

    // If we have a callback, then use that async
    if (this.options.onSave.length === 2) {
      return this.options.onSave(updated, cb);
    }

    this.options.onSave(updated);
    return cb();
  }

  onEvent(event) {
    // Team will look like this:
    // { seed: 1, name: ['array of', 'some names'], winner: true }
    const transformTeam = (team) => _.transform(_.pick(team, 'names', 'rank', 'winner'), (res, value, key) => {
      if (key === 'names') {
        res.name = value;
      }
      else if (key === 'rank') {
        res.seed = value;
      }
      else {
        res[key] = value;
      }
    }, {});

    const result = {
      fromRegion: event.region,
      winner: transformTeam(event.home.winner ? event.home : event.away),
      loser: transformTeam(event.home.winner ? event.away : event.home)
    };

    if (!result.winner || !result.loser || !result.fromRegion) {
      this.logger.error('[INVALID RESULT]', JSON.stringify(result));
    }
    else {
      const duplicateTask = _.find(_.map(this.queue.tasks, 'data'), result);

      // Dont allow games that are already in the queue to be added again
      if (duplicateTask) {
        this.logger.debug('[DUPLICATE UPDATE]', JSON.stringify(result));
      }
      else {
        this.queue.push(result);
      }
    }
  }

  start() {
    this.scores.start();
    return this;
  }
}

module.exports = Watcher;
