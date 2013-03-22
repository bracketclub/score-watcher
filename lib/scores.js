var ScoreTracker = require('scores').ScoreTracker,
    Database = require('./database'),
    _ = require('underscore'),
    async = require('async'),
    db = new Database(),
    log = require('./log'),
    Bracket = require('bracket-validator')(),
    BracketValidator = Bracket.validator,
    order = Bracket.order,
    regionMapping = {
      'MIDWEST': 'MW',
      'WEST': 'W',
      'SOUTH': 'S',
      'EAST': 'E'
    };

var scoreTracker = new ScoreTracker({
  interval: 1000 * 60 * 15,
  scoresUrl: '{{date}}&confId=100'
});

scoreTracker.on('gameFinal', function(games) {
  log.debug(new Date() + ' GAME FINALS: ' + games.length + ' games');
  async.concatSeries(games, function(game, cb) {
    log.debug('GAME FINAL: ' + game.region + ': ' + game.home.seed + game.home.team + ' vs ' + game.visitor.seed + game.visitor.team + ' ' + game.status);
    db.findMaster(function(err, entry) {
      if (err || !entry) cb(new Error('Aborting: Error getting master'), null);
      log.debug('CURRENT MASTER: ' + entry.bracket);

      new BracketValidator({flatBracket: entry.bracket}).validate(function(err, bracketData) {
        if (err) return cb(null, 'Bad bracket validation');

        // TODO: this wont work for Final Four
        var regionId = regionMapping[game.region];

        if (!regionId) return cb(null, 'Aborting, no region: ' + game.id + ' - ' + game.region);

        var region = bracketData[regionId],
            returnString = '';

        _.each(region.rounds, function(round, roundIndex) {
          _.each(round, function(roundGame, gameIndex) {
            if (roundGame !== null && roundGame.seed === game.home.seed) {
              var resultIndex = Math.floor(gameIndex/2);
              log.debug('WINNER: ' + regionId + ' ' + game[game.winner].seed + ' to round ' + (roundIndex + 1));
              if (game.winner === 'home') {
                bracketData[regionId].rounds[roundIndex+1][resultIndex] = {seed: game.home.seed};
              } else if (game.winner === 'visitor') {
                bracketData[regionId].rounds[roundIndex+1][resultIndex] = {seed: game.visitor.seed};
              }
            }
          });
        });

        _.each(bracketData, function(bracketRegion) {
          var regionString =_.map(bracketRegion.rounds, function(round, roundIndex) {
            if (roundIndex === 0) return '';
            return _.map(round, function(roundGame) {
              if (roundGame === null) return 'X';
              if (_.isNumber(roundGame)) return roundGame;
              return roundGame.seed;
            }).join('');
          }).join('')
          .replace(new RegExp(order.join(''), 'g'), '')
          .replace(new RegExp(_.values(regionMapping).join(''), 'g'), '');
          returnString += bracketRegion.id + regionString;
        });

        log.debug('NEW MASTER: ' + returnString);

        db.updateMaster(returnString, function(err, entry) {
          if (err) return cb(null, 'BRACKET NOT UPDATED');
          return cb(null, 'BRACKET UPDATED');
        });

      });
    });
  }, function(err, results) {
    if (err) return log.debug('GAME CHANGE ERROR: ' + err.message);
    return log.debug('GAME CHANGE SUCCESS: ' + results.toString());
  });
});

module.exports = scoreTracker;
