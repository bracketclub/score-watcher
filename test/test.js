var Watcher = require('../lib/watcher');
var BracketData = require('bracket-data');
var assert = require('assert');
var year = '2013';
var sport = 'ncaa-mens-basketball';
var data = new BracketData({year: year, sport: sport, props: ['order', 'constants']});
var order = data.order;
var constants = data.constants;
var _ = require('lodash');


describe('Score watcher', function () {
    it('It should update the first round all at once', function (done) {
        var watcher = new Watcher({
            year: year,
            sport: sport
        });

        watcher.drain(function (master, cb) {
            assert.equal(master, 'MW18546372XXXXXXXW18546372XXXXXXXS18546372XXXXXXXE18546372XXXXXXXFFXXX');
            cb();
            done();
        });

        watcher.start(function () {
            this.updater.currentMaster = this.emptyBracket;

            constants.REGION_IDS.forEach(function (region) {
                for (var i = 0, m = order.length; i < m; i += 2) {
                    this.scores.emit('game', {
                        region: region,
                        home: {
                            seed: order[i],
                            isWinner: true
                        },
                        visitor: {
                            seed: order[i + 1],
                            isWinner: false
                        }
                    });
                }
            }.bind(this));
        });
    });

    it('It should update the first round separately if not queued and async', function (done) {
        var watcher = new Watcher({
            year: year,
            sport: sport,
            useCargo: true
        });
        var drainCount = 0;

        var after = [
            'MW1XXXXXXXXXXXXXXWXXXXXXXXXXXXXXXSXXXXXXXXXXXXXXXEXXXXXXXXXXXXXXXFFXXX',
            'MW18XXXXXXXXXXXXXWXXXXXXXXXXXXXXXSXXXXXXXXXXXXXXXEXXXXXXXXXXXXXXXFFXXX',
            'MW185XXXXXXXXXXXXWXXXXXXXXXXXXXXXSXXXXXXXXXXXXXXXEXXXXXXXXXXXXXXXFFXXX',
            'MW1854XXXXXXXXXXXWXXXXXXXXXXXXXXXSXXXXXXXXXXXXXXXEXXXXXXXXXXXXXXXFFXXX',
            'MW18546XXXXXXXXXXWXXXXXXXXXXXXXXXSXXXXXXXXXXXXXXXEXXXXXXXXXXXXXXXFFXXX',
            'MW185463XXXXXXXXXWXXXXXXXXXXXXXXXSXXXXXXXXXXXXXXXEXXXXXXXXXXXXXXXFFXXX',
            'MW1854637XXXXXXXXWXXXXXXXXXXXXXXXSXXXXXXXXXXXXXXXEXXXXXXXXXXXXXXXFFXXX',
            'MW18546372XXXXXXXWXXXXXXXXXXXXXXXSXXXXXXXXXXXXXXXEXXXXXXXXXXXXXXXFFXXX'
        ];
        var masters = [];

        watcher.drain(function (master, cb) {
            masters.push(master);
            assert.equal(master, after[drainCount]);
            drainCount++;
            if (drainCount === 8) {
                assert.equal(masters.join(','), after.join(','));
                done();
            }
            setTimeout(function () {
                cb();
            }, _.random(100, 150));
        });

        watcher.start(function () {
            this.updater.currentMaster = this.emptyBracket;
            for (var i = 0, m = order.length; i < m; i += 2) {
                this.scores.emit('game', {
                    region: 'MW',
                    home: {
                        seed: order[i],
                        isWinner: true
                    },
                    visitor: {
                        seed: order[i + 1],
                        isWinner: false
                    }
                });
            }
        });
    });

    it('It should update a few games with gaps', function (done) {
        var watcher = new Watcher({
            year: year,
            sport: sport
        });

        var count = 0;

        watcher.drain(function (master, cb) {
            if (count === 0) {
                assert.equal(master, constants.EMPTY.replace('MWXX', 'MW1X'));
            } else if (count === 1) {
                assert.equal(master, constants.EMPTY.replace('MWXX', 'MW18'));
            }
            cb();
            count++;
            if (count === 2) {
                done();
            }
        });

        watcher.start(function () {
            this.updater.currentMaster = this.emptyBracket;

            this.scores.emit('game', {
                region: 'MW',
                home: {
                    seed: 1,
                    isWinner: true
                },
                visitor: {
                    seed: 16,
                    isWinner: false
                }
            });

            setTimeout(function () {
                this.scores.emit('game', {
                    region: 'MW',
                    home: {
                        seed: 8,
                        isWinner: true
                    },
                    visitor: {
                        seed: 9,
                        isWinner: false
                    }
                });
            }.bind(this), 500);
        });
    });

    it('It should only update once if the same game is added to the queue multiple times', function (done) {
        var watcher = new Watcher({
            year: year,
            sport: sport
        });

        watcher.drain(function (master, cb) {
            assert.equal(master, constants.EMPTY.replace('MWX', 'MW1'));
            cb();
            done();
        });

        watcher.start(function () {
            this.updater.currentMaster = this.emptyBracket;
            for (var i = 0; i < 5; i++) {
                this.scores.emit('game', {
                    region: 'MW',
                    home: {
                        seed: 1,
                        isWinner: true
                    },
                    visitor: {
                        seed: 16,
                        isWinner: false
                    }
                });
            }
        });
    });
});
