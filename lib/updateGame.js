var validate = function (game) {
    if (!game.winner) return new Error('No winner');
    if (!game.loser) return new Error('No loser');
    if (!game.fromRegion) return new Error('No region');
};

function UpdateGame(options) {
    this.logger = options.logger;
    this.queue = options.queue;
    return this;
}

UpdateGame.prototype.update = function (game) {
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
        this.logger.error('[INVALID UPDATE]', isNotValid, result);
    } else {
        this.queue.push(result);
    }
};

module.exports = UpdateGame;
