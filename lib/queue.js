var async = require('async');

function Queue(options) {
    this.updater = options.updater;
    this.logger = options.logger;

    this.queue = async.queue(function (game, cb) {
        this.logger.debug('[UPDATE]', game);
        this.updater.update(game);
        async.nextTick(cb);
    }.bind(this), 1);

    this.drain(options.drain);
}

Queue.prototype.drain = function (onDrain) {
    this.queue.drain = function () {
        this.queue.concurrency = 0;
        this.logger.info('[UPDATE MASTER]', this.updater.currentMaster);
        onDrain(this.updater.currentMaster, function () {
            this.queue.concurrency = 1;
        }.bind(this));
    }.bind(this);
};

module.exports = Queue;
