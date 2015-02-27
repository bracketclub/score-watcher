var async = require('async');
var _ = require('lodash');


function Queue(options) {
    this.updater = options.updater;
    this.logger = options.logger;
    this.useCargo = options.useCargo;

    if (this.useCargo) {
        this.queue = async.cargo(function (games, cb) {
            this.updateGame(games[0]);
            this.drainFn(cb);
        }.bind(this), 1);
    } else {
        this.queue = async.queue(function (game, cb) {
            this.updateGame(game);
            async.nextTick(cb);
        }.bind(this), 1);
    }

    options.drain && this.drain(options.drain);
}

Queue.prototype.updateGame = function (game) {
    this.logger.debug('[QUEUE]', game);
    this.updater.update(game);
};

Queue.prototype.push = function (data) {
    var duplicateTask = _.findWhere(_.pluck(this.queue.tasks, 'data'), data);
    if (!duplicateTask) this.queue.push(data);
};

Queue.prototype.drain = function (onDrain) {
    this.drainFn = function (cb) {
        this.queue.concurrency = 0;
        this.logger.debug('[QUEUE DRAIN]', this.updater.currentMaster);
        onDrain(this.updater.currentMaster, function () {
            this.queue.concurrency = 1;
            cb && cb();
        }.bind(this));
    }.bind(this);

    if (!this.useCargo) {
        this.queue.drain = this.drainFn;
    }
};

module.exports = Queue;
