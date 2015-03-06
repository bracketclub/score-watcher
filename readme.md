score-watcher
==============

[![Build Status](https://travis-ci.org/tweetyourbracket/score-watcher.png?branch=master)](https://travis-ci.org/tweetyourbracket/score-watcher)

Score watcher for tweetyourbracket.com.

## Usage

``js
var ScoreWatcher = require('score-watcher');

new ScoreWatcher({
    // Required
    sport: 'ncaa-mens-basketball',
    year: '2015',
    // An optional bracket to initialize the updater with
    // Will default to an empty bracket for the sport/year
    master: '',
    // Optional log file
    logfile: '/path/to/logs/app.log',
    // The callbacks
    onSave: function (master, cb) {
        // Will be called with each master as a string
        // `cb` is optional but should be used to ensure
        // that each bracket is saved before moving to
        // the next one
    },
    scores: {
        // Config for scores module
        interval: 1,
        url: 'http://url.com'
    }
}).start();

```

## What is it doing?

It is setting up an async.queue and creating a watcher/emitter with [`scores`](http://github.com/tweetyourbracket/scores). Then every time the queue drains, it pushes the latest master to an array in the [`bracket-data-live`](http://github.com/tweetyourbracket/bracket-data-live) repo located as a sibling dir.

## Is it on npm?

No. There's a lot of specific code here and it wouldn't make sense to publish this as it is currently. Most of the code here is configuration of some other modules which are on npm such as [`bracket-data`](http://github.com/tweetyourbracket/bracket-data), [`bracket-updater`](http://github.com/tweetyourbracket/bracket-updater), [`scores`](http://github.com/tweetyourbracket/scores).But feel free to use this a basis for something else.

### LICENSE

MIT
