var Watcher = require('./lib/watcher');
var path = require('path');
var config = require('figs');
var updateMaster = require('../bracket-data-live/lib/save').masterJSON;
var getMaster = require('../bracket-data-live/index');
var _ = require('lodash-node');


new Watcher({
    year: config.year,
    sport: config.sport,
    scores: config.scores,
    logger: require('bucker').createLogger({
        console: {
            color: true
        },
        app: {
            filename: path.resolve(__dirname, 'logs', 'app.log'),
            format: ':level :time :data',
            timestamp: 'HH:mm:ss',
            accessFormat: ':time :level :method :status :url'
        }
    }),
    useCargo: true,
    start: function () {
        var masters = getMaster({year: config.year, sport: config.sport}).masters;
        var startMaster = _.last(masters);

        this.logger.debug('[START MASTER]', startMaster);
        this.updater.currentMaster = startMaster;

        this.scores.start();
    },
    drain: function (currentMaster, cb) {
        updateMaster({year: config.year, sport: config.sport}, currentMaster, function (err) {
            if (err) {
                this.logger.error('[JSON SAVE ERROR]', err);
            } else {
                this.logger.debug('[JSON SAVE SUCESS]', currentMaster);
            }
            cb();
        }.bind(this));
    }
}).start();