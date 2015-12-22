
var LeLogger = require('./le-logger.js');
var logger = null;

/**
 * Initialize the logger.
 *
 * NOTE: We intentionaly DON'T automatically do this, in order to force
 * developers to explicitly call this at the beginning of their code. This
 * ensures that, on each new execution of their code, a new trace code will be
 * generated (as intended).
 *
 * Otherwise, since AWS Lambda preserves the state of global variables while the
 * container is still running, future executions of your code may reuse the
 * existing trace code and simply continue to increment its counter, making it
 * look like more logs from a different execution of your code.
 */
module.exports.initLogger = function() {
  logger = new LeLogger();
};

module.exports.registerCompletionCallback = function(callback) {
  logger.registerCompletionCallback(callback);
};

module.exports.log = function(message) { logger.log(message); };
module.exports.info = function(message) { logger.info(message); };
module.exports.warn = function(message) { logger.warn(message); };
module.exports.error = function(message) { logger.error(message); };
