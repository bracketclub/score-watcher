score-watcher
==============

[![Build Status](https://travis-ci.org/tweetyourbracket/score-watcher.png?branch=master)](https://travis-ci.org/tweetyourbracket/score-watcher)

Score watcher for tweetyourbracket.com.

## Usage

1. Create `config.js` file in root with `db` connection string to a mongodb instance.
2. `npm install`
3. `npm start`

## What is it doing?

It is setting up an async.queue and creating a watcher/emitter with [`scores`](http://github.com/tweetyourbracket/scores). Then every time the queue drains, it finds the current master bracket in the DB and updates it.

## Is it on npm?

No. There's a lot of specific code here and it wouldn't make sense to publish this as it is currently. Most of the code here is configuration of some other modules which are on npm such as [`bracket-data`](http://github.com/tweetyourbracket/bracket-data), [`bracket-updater`](http://github.com/tweetyourbracket/bracket-updater), [`scores`](http://github.com/tweetyourbracket/scores).But feel free to use this a basis for something else.

### LICENSE

MIT
