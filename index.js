var path = require('path');
var bucker = require('bucker');
var _ = require('lodash');
var Scores = require('scores');
var BracketUpdater = require('bracket-updater');
var bracketData = require('bracket-data');
var async = require('async');
var EventEmitter = require('events').EventEmitter;
var util = require('util');


function Watcher (options) {
    EventEmitter.call(this);

    options || (options = {});

    this.options = _.defaults(options, {
        logger: null,
        sport: 'ncaa-mens-basketball',
        year: new Date().getFullYear(),
        master: '',
        logfile: path.resolve(__dirname, 'logs', 'app.log'),
        onSave: function () {},
        onDrain: function () {},
        scores: {}
    });

    if (!options.sport || !options.year) {
        throw new Error('Needs a sport and a year');
    }


    // The logger will be passed to the score watcher to
    // log everything there.
    this.logger = options.logger || bucker.createLogger({
        console: {
            color: true
        },
        app: {
            filename: options.logfile,
            format: ':level :time :data',
            timestamp: 'HH:mm:ss',
            accessFormat: ':time :level :method :status :url'
        }
    });


    // An empty bracket to start from by default
    var empty = bracketData({year: options.year, sport: options.sport}).constants.EMPTY;


    // Create our bracket update with the initial master to be updated
    this.updater = new BracketUpdater({
        sport: options.sport,
        year: options.year,
        currentMaster: options.master || empty
    });


    // Helpful for debugging how the watcher was started
    this.logger.debug('[INIT SCORE-WATCHER]', JSON.stringify({
        master: this.updater.currentMaster,
        year: options.year,
        sport: options.sport
    }));


    // Queue ensures that even if the score watcher emits
    // more than one game, we can still update the master bracket
    // in order, by optionally passing a callback to onSave
    this.queue = async.queue(this.queueWorker.bind(this), 1);

    // Drain is mostly just used in tests
    this.queue.drain = this.options.onDrain;
}

util.inherits(Watcher, EventEmitter);


Watcher.prototype.queueWorker = function (game, cb) {
    this.logger.debug('[GAME QUEUED]', JSON.stringify(game));

    var updated = this.updater.update(game);
    if (updated instanceof Error) {
        this.logger.error('[UPDATE FAILED]', updated);
        cb();
        return;
    }

    this.logger.debug('[UPDATED]', updated);

    // If we have a callback, then use that async
    if (this.options.onSave.length === 2) {
        this.options.onSave(updated, cb);
    } else {
        this.options.onSave(updated);
        cb();
    }
};


Watcher.prototype.onUpdateGame = function (game) {
    var validate = function (game) {
        if (!game.winner) return new Error('No winner');
        if (!game.loser) return new Error('No loser');
        if (!game.fromRegion) return new Error('No region');
    };

    var result = {
        fromRegion: game.region
    };

    if (game.home.isWinner) {
        result.winner = game.home;
        result.loser = game.visitor;
    } else if (game.visitor.isWinner) {
        result.winner = game.visitor;
        result.loser = game.home;
    }

    var isNotValid = validate(result);
    if (isNotValid) {
        this.logger.error('[INVALID UPDATE]', isNotValid);
    }
    else {
        var duplicateTask = _.findWhere(_.pluck(this.queue.tasks, 'data'), result);

        // Dont allow games that are already in the queue to be added again
        if (duplicateTask) {
            this.logger.debug('[DUPLICATE UPDATE]', JSON.stringify(result));
        } else {
            this.queue.push(result);
        }
    }
};


Watcher.prototype.startScores = function () {
    var self = this;
    new Scores(_.extend({
        logger: this.logger,
        interval: 1
    }, this.options.scores))
    .on('game', function (game) {
        self.emit('game', game);
    })
    .start();
};


// Start our score watcher and listen for game eventsß
Watcher.prototype.start = function () {
    this.on('game', this.onUpdateGame.bind(this));
    if (!_.isEmpty(this.options.scores)) {
        this.startScores();
    }
    return this;
};


module.exports = Watcher;
