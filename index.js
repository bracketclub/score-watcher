var Watcher = require('./lib/watcher');
var path = require('path');
var config = require('./config');
var Database = require('db-schema');
var db = new Database(config.db);

new Watcher({
    year: '2013',
    sport: 'ncaa-mens-basketball',
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
            if (err || !master) master = this.emptyBracket;

            this.logger.debug('[START MASTER]', master);
            this.updater.currentMaster = master;

            this.scores.start();
        }.bind(this));
    },
    drain: function (currentMaster, cb) {
        db.updateMaster(currentMaster, function (err, entry) {
            if (err) {
                this.logger.error('[UPDATE MASTER]', err);
            } else {
                this.logger.error('[UPDATE MASTER]', entry);
            }
            cb();
        }.bind(this));
    }
}).start();