var Watcher = require('./lib/watcher');
var path = require('path');
var config = require('./config');
var Database = require('db-schema');
var db = new Database(config.db);

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
    start: function () {
        db.findMaster(function (err, master) {
            var startMaster;
            if (master && !err && process.argv.join(' ').indexOf('--reset') === -1) {
                startMaster = master.bracket;
            } else {
                startMaster = this.emptyBracket;
            }

            this.logger.debug('[START MASTER]', startMaster);
            this.updater.currentMaster = startMaster;

            this.scores.start();
        }.bind(this));
    },
    drain: function (currentMaster, cb) {
        db.updateMaster(currentMaster, function (err, entry) {
            if (err) {
                this.logger.error('[UPDATE MASTER]', err);
            } else {
                this.logger.info('[UPDATE MASTER]', entry.bracket);
            }
            cb();
        }.bind(this));
    }
}).start();