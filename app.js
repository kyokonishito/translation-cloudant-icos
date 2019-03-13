﻿require('dotenv').config();
var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var upload = require('./routes/upload')

var app = express();

app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended : true }));
app.use(methodOverride('_method'));

app.use('/upload', upload);
app.use(express.static(path.join(__dirname + '/public')));

var server = app.listen(process.env.PORT || 3000, function() {
  console.log('Listening on port %d', server.address().port);
});