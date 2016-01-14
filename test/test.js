var Watcher = require('../index');
var bracketData = require('bracket-data');
var assert = require('assert');
var year = '2013';
var sport = 'ncaa-mens-basketball';
var data = bracketData({year: year, sport: sport});
var order = data.order;
var constants = data.constants;
var _ = require('lodash');
var nullLogger = require('bucker').createNullLogger();


describe('Score watcher', function () {
    it('It should update the first round all at once', function (done) {
        var masters = [];

        var watcher = new Watcher({
            logger: nullLogger,
            year: year,
            sport: sport,
            onSave: function (master) {
                // No callback means its all sync
                masters.push(master);
            },
            onDrain: function () {
                assert.equal(masters.length, 32);
                assert.equal(_.last(masters), 'MW18546372XXXXXXXW18546372XXXXXXXS18546372XXXXXXXE18546372XXXXXXXFFXXX');
                done();
            }
        }).start();

        constants.REGION_IDS.forEach(function (region) {
            for (var i = 0, m = order.length; i < m; i += 2) {
                watcher.emit('game', {
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
        });
    });

    it('It should update the first round separately if not queued and async', function (done) {
        var drainCount = 0;
        var masters = [];
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

        var watcher = new Watcher({
            logger: nullLogger,
            year: year,
            sport: sport,
            onSave: function (master, cb) {
                masters.push(master);
                assert.equal(master, after[drainCount]);
                drainCount++;
                if (drainCount === 8) {
                    assert.equal(masters.join(','), after.join(','));
                }
                setTimeout(function () {
                    cb(); // Making it randomly async
                }, _.random(100, 150));
            },
            onDrain: function () {
                assert.equal(drainCount, 8);
                done();
            }
        }).start();

        for (var i = 0, m = order.length; i < m; i += 2) {
            watcher.emit('game', {
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

    it('It should update a few games with gaps', function (done) {
        var count = 0;

        var watcher = new Watcher({
            logger: nullLogger,
            year: year,
            sport: sport,
            onSave: function (master) {
                if (count === 0) {
                    assert.equal(master, constants.EMPTY.replace('MWXX', 'MW1X'));
                } else if (count === 1) {
                    assert.equal(master, constants.EMPTY.replace('MWXX', 'MW18'));
                }
            },
            onDrain: function () {
                count++;
                if (count === 2) done();
            }
        }).start();

        watcher.emit('game', {
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
            watcher.emit('game', {
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
        }, 500);
    });

    it('It should only update once if the same game is added to the queue multiple times', function (done) {
        var masters = [];
        var watcher = new Watcher({
            logger: nullLogger,
            year: year,
            sport: sport,
            onSave: function (master) {
                masters.push(master);
            },
            onDrain: function () {
                assert.equal(masters.length, 1);
                assert.equal(masters[0], constants.EMPTY.replace('MWX', 'MW1'));
                done();
            }
        }).start();

        for (var i = 0; i < 5; i++) {
            watcher.emit('game', {
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
