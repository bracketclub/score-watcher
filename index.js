var config = require('./config'),
    ScoreTracker = require('scores').ScoreTracker,
    Database = require('db-schema'),
    //db = new Database(config.db),
    logger = require('bucker').createLogger({
        console: {
            colors: true
        }
    }),
    BracketUpdater = require('bracket-updater');

function Scores(options) {
    this.options = options || {};
    this.scoreTracker = new ScoreTracker({
        interval: this.options.interval,
        scoresUrl: this.options.url
    });
}

Scores.prototype.watchFinals = function () {
    logger.debug('Starting Score Watcher:', 'EVERY', this.options.interval / 1000, 'sec ON', this.options.url);
    this.scoreTracker.watch();
    //this.scoreTracker.on('gameFinal', this.gameChanges.bind(this));
    this.scoreTracker.on('gameFinal', function () {
        logger.debug(arguments);
    });
};

Scores.prototype.updateMaster = function (newMaster, cb) {
    logger.debug('UPDATING MASTER:', newMaster);
    db.updateMaster(newMaster, function (err, entry) {
        if (err) return cb(null, 'BRACKET NOT UPDATED');
        return cb(null, 'BRACKET UPDATED');
    });
};

Scores.prototype.checkGame = function (game, cb) {
    var self = this;
    logger.debug('GAME FINAL: ' + game.region + ': ' + game.home.seed + game.home.team + ' vs ' + game.visitor.seed + game.visitor.team + ' ' + game.status);

    db.findMaster(function (err, master) {
        if (err || !master) cb(new Error('Aborting: Error getting master'), null);
        logger.debug('CURRENT MASTER: ' + master.bracket);

        new BracketUpdater({
            currentMaster: master.bracket,
            winningSeed: game[game.winner].seed,
            losingSeed: game[(game.winner === 'home') ? 'visitor' : 'home'].seed,
            fromRegion: game.region
        }).update();
    });
};

Scores.prototype.gameChanges = function (games) {
    var self = this;
    logger.debug(new Date() + ' GAME FINALS: ' + games.length + ' games');
    games.forEach(self.checkGame.bind(self));
};


new Scores({
    interval: 1000 * 60 * 5,
    url: 'confId=100'
}).watchFinals();
