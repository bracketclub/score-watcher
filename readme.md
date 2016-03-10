score-watcher
==============

[![Build Status](https://travis-ci.org/tweetyourbracket/score-watcher.png?branch=master)](https://travis-ci.org/tweetyourbracket/score-watcher)

Score watcher for tweetyourbracket.com.

## Usage

```js
const ScoreWatcher = require('score-watcher');

new ScoreWatcher({
    // Required
    sport: 'ncaam',
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
        interval: '1m',
        url: 'http://url.com'
    }
}).start();

```

## What is it doing?

It is setting up an async.queue and creating a watcher/emitter with [`scores`](http://github.com/tweetyourbracket/scores). Then every time the queue drains, it calls `onSave` with the latest master (and an optional callback to notify the watcher when it has been added).

## Is it on npm?

Yeah, now that there are publically scoped modules it's at `npm install @lukekarrys/score-watcher`.

### LICENSE

MIT
