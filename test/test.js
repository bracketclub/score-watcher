#!/usr/bin/env node

var BU = require('../lib/scores'),
    bu = new BU({interval: 1000 * 60 * 60, url: ''});

bu.test();