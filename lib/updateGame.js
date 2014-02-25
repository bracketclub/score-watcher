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

    if (result.winner && result.loser && result.fromRegion) {
        this.queue.push(result);
    } else {
        this.logger.error('[NO UPDATE]', result);
    }
};

module.exports = UpdateGame;
