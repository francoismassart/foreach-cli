#!/usr/bin/env node
// Generated by CoffeeScript 1.10.0
(function() {
  var args, chalk, commandToExecute, console, exec, executeCommandFor, finalLogs, fs, getDirName, glob, globToRun, help, options, outputFinalLogs, path, processPath, regEx, statusBar, yargs;

  options = {
    'g': {
      alias: 'glob',
      describe: 'Specify the glob ',
      type: 'string',
      demand: false
    },
    'x': {
      alias: 'execute',
      describe: 'Command to execute upon file addition/change',
      type: 'string',
      demand: false
    }
  };

  fs = require('fs');

  path = require('path');

  glob = require('glob');

  chalk = require('chalk');

  statusBar = require('node-status');

  console = statusBar.console();

  exec = require('child_process').exec;

  yargs = require('yargs').usage("Usage: -g <glob> -x <command>  |or|  <glob> <command>\nPlaceholders can be either noted with double curly braces {{name}} or hash+surrounding curly braces \#{name}").options(options).help('h').wrap(null).version();

  args = yargs.argv;

  globToRun = args.g || args.glob || args._[0];

  commandToExecute = args.x || args.execute || args._[1];

  help = args.h || args.help;

  regEx = {
    placeholder: /(?:\#\{|\{\{)([^\/\}]+)(?:\}\}|\})/ig
  };

  finalLogs = {
    'log': {},
    'warn': {},
    'error': {}
  };

  if (help || !globToRun || !commandToExecute) {
    process.stdout.write(yargs.help());
    process.exit(0);
  }

  glob(globToRun, function(err, files) {
    if (err) {
      return console.error(err);
    } else {
      this.progress = statusBar.addItem({
        'type': ['bar', 'percentage'],
        'name': 'Processed',
        'max': files.length,
        'color': 'green'
      });
      this.errorCount = statusBar.addItem({
        'type': 'count',
        'name': 'Errors',
        'color': 'red'
      });
      this.totalTime = statusBar.addItem({
        'type': 'time',
        'name': 'Time'
      });
      statusBar.start({
        'invert': false,
        'interval': 20,
        'uptime': false
      });
      this.queue = files.slice();
      return processPath(this.queue.pop());
    }
  });

  processPath = function(filePath) {
    if (filePath) {
      return executeCommandFor(filePath).then(function() {
        return processPath(this.queue.pop());
      });
    } else {
      statusBar.stop();
      return outputFinalLogs();
    }
  };

  executeCommandFor = function(filePath) {
    return new Promise(function(resolve) {
      var command, pathParams;
      pathParams = path.parse(path.resolve(filePath));
      pathParams.reldir = getDirName(pathParams, path.resolve(filePath));
      console.log("Executing command for: " + filePath);
      this.progress.inc();
      this.totalTime.count = process.uptime() * 1000;
      command = commandToExecute.replace(regEx.placeholder, function(entire, placeholder) {
        switch (false) {
          case placeholder !== 'path':
            return filePath;
          case pathParams[placeholder] == null:
            return pathParams[placeholder];
          default:
            return entire;
        }
      });
      return exec(command, function(err, stdout, stderr) {
        if (err) {
          finalLogs.warn[filePath] = err;
        }
        if (stdout) {
          finalLogs.log[filePath] = stdout;
        }
        if (stderr) {
          this.errorCount.inc();
          finalLogs.error[filePath] = stderr;
        }
        return resolve();
      });
    });
  };

  getDirName = function(pathParams, filePath) {
    var dirInGlob;
    dirInGlob = globToRun.match(/^[^\*\/]*/)[0];
    dirInGlob += dirInGlob ? '/' : '';
    return filePath.replace(pathParams.base, '').replace(process.cwd() + ("/" + dirInGlob), '').slice(0, -1);
  };

  outputFinalLogs = function() {
    var file, message, ref, ref1, ref2, results;
    ref = finalLogs.log;
    for (file in ref) {
      message = ref[file];
      console.log(chalk.bgWhite.black.bold.underline(file));
      console.log(message);
    }
    ref1 = finalLogs.warn;
    for (file in ref1) {
      message = ref1[file];
      console.log(chalk.bgYellow.white.bold.underline(file));
      console.warn(message);
    }
    ref2 = finalLogs.error;
    results = [];
    for (file in ref2) {
      message = ref2[file];
      console.log(chalk.bgRed.white.bold.underline(file));
      results.push(console.error(message));
    }
    return results;
  };

}).call(this);
