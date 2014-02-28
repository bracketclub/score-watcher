var BracketData = require('bracket-data');
var BracketUpdater = require('bracket-updater');
var UpdateGame = require('./updateGame');
var Queue = require('./queue');
var Scores = require('scores');
var _ = require('lodash-node');


function Watcher(options) {
    this.logger = options.logger || require('bucker').createNullLogger();

    this.emptyBracket = new BracketData({
        sport: options.sport,
        year: options.year,
        props: ['constants']
    }).constants.EMPTY;

    this.updater = new BracketUpdater({
        sport: options.sport,
        year: options.year
    });

    this.queue = new Queue({
        logger: this.logger,
        updater: this.updater,
        drain: options.drain && options.drain.bind(this)
    });

    this.updateGame = new UpdateGame({
        logger: this.logger,
        queue: this.queue
    });

    this.scores = new Scores(_.extend({
        logger: this.logger,
        maxInterval: 60
    }, options.scores)).on('game', this.updateGame.update.bind(this.updateGame));

    this._start = options.start;

    return this;
}

Watcher.prototype.start = function (cb) {
    (cb || this._start || function () {}).call(this);
};

Watcher.prototype.drain = function (cb) {
    this.queue.drain(cb.bind(this));
};

module.exports = Watcher;
