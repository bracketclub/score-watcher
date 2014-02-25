var Watcher = require('../lib/watcher');
var BracketData = require('bracket-data');
var assert = require('assert');
var year = '2013';
var sport = 'ncaa-mens-basketball';
var data = new BracketData({year: year, sport: sport, props: ['order', 'constants']});
var order = data.order;
var constants = data.constants;


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
            }.bind(this));
        });
    });
});
