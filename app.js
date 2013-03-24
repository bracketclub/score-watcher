#!/usr/bin/env node

/*global console */

var express = require('express'),
    http = require('http'),
    log = require('simplest-log'),
    app = express(),
    Scores = require('./lib/scores'),
    scores = new Scores({
      interval: 1000 * 60 * 5,
      url: 'confId=100'
    });

app.configure(function () {
  app.set('port', 8080);
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
});

http.createServer(app).listen(app.get('port'), function () {
  log.debug('Express server listening', app.get('port'), app.settings.env);
  scores.watchFinals();
});
