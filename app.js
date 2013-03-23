#!/usr/bin/env node

/*global console */

var express = require('express'),
    http = require('http'),
    log = require('simplest-log'),
    app = express(),
    scores = require('./lib/scores');

app.configure(function () {
  app.set('port', 8080);
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
});

http.createServer(app).listen(app.get('port'), function () {
  log.debug('Express server listening', app.get('port'), app.settings.env);
  scores.watch();
});
