var async = require('async');
var _ = require('lodash-node');


function Queue(options) {
    this.updater = options.updater;
    this.logger = options.logger;

    this.queue = async.queue(function (game, cb) {
        this.logger.debug('[QUEUE]', game);
        this.updater.update(game);
        async.nextTick(cb);
    }.bind(this), 1);

    this.drain(options.drain);
}

Queue.prototype.push = function (data) {
    var duplicateTask = _.findWhere(_.pluck(this.queue.tasks, 'data'), data);
    if (!duplicateTask) this.queue.push(data);
};

Queue.prototype.drain = function (onDrain) {
    this.queue.drain = function () {
        this.queue.concurrency = 0;
        this.logger.debug('[QUEUE DRAIN]', this.updater.currentMaster);
        onDrain(this.updater.currentMaster, function () {
            this.queue.concurrency = 1;
        }.bind(this));
    }.bind(this);
};

module.exports = Queue;
