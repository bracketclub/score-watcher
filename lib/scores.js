var ScoreTracker = require('scores').ScoreTracker,
    Database = require('tweetyourbracket-db'),
    config = require('../config'),
    async = require('async'),
    db = new Database(config.db),
    log = require('simplest-log'),
    Bracket = require('bracket-validator')(),
    BracketUpdater = Bracket.updater;

function Scores(options) {
  options = options || {};
  this.scoreTracker = new ScoreTracker({
    interval: options.interval,
    scoresUrl: options.url
  });
}

Scores.prototype.watchFinals = function() {
  log.debug('Starting Score Watcher');
  this.scoreTracker.watch();
  this.scoreTracker.on('gameFinal', this.gameChanges.bind(this));
};

Scores.prototype.test = function() {
  log.debug('TESTING');
  this.gameChanges([{
    region: 'EAST',
    status: 'final',
    winner: 'home',
    home: {
      seed: 4,
      team: 'Syracuse'
    },
    visitor: {
      seed: 12,
      team: 'Cal'
    }
  }]);
};

Scores.prototype.updateMaster = function(newMaster, cb) {
  log.debug('UPDATING MASTER:', newMaster);
  db.updateMaster(newMaster, function(err, entry) {
    if (err) return cb(null, 'BRACKET NOT UPDATED');
    return cb(null, 'BRACKET UPDATED');
  });
};

Scores.prototype.checkGame = function(game, cb) {
  var self = this;
  log.debug('GAME FINAL: ' + game.region + ': ' + game.home.seed + game.home.team + ' vs ' + game.visitor.seed + game.visitor.team + ' ' + game.status);

  db.findMaster(function(err, master) {
    if (err || !master) cb(new Error('Aborting: Error getting master'), null);
    log.debug('CURRENT MASTER: ' + master.bracket);

    new BracketUpdater({
      currentMaster: master.bracket,
      winningSeed: game[game.winner].seed,
      losingSeed: game[(game.winner === 'home') ? 'visitor' : 'home'].seed,
      fromRegion: game.region
    }).update(function(err, updated) {
      if (err) return cb(new Error('Couldnt update bracket'), null);
      db.updateMaster(updated, cb);
    });
  });
};

Scores.prototype.gameChanges = function(games) {
  var self = this;
  log.debug(new Date() + ' GAME FINALS: ' + games.length + ' games');
  async.concatSeries(games, self.checkGame.bind(self), function(err, results) {
    if (err) return log.debug('GAME CHANGE ERROR: ' + err.message);
    return log.debug('GAME CHANGE SUCCESS: ' + results.toString());
  });
};

module.exports = Scores;
