# Lambda-Le-Logger
A way to send logs to the [Logentries](https://logentries.com/) service, even
from an [AWS Lambda](https://aws.amazon.com/lambda/) function.

## Basic Usage
To use this, simply add the following to your code:

	// Up with your other require statements, add this:
	var logger = require('lambda-le-logger');
	
	// ... and then down where your code actually starts doing things, add this:
	logger.initLogger();
	
	// After that, you can call the log/info/warn/error methods at any time:
	logger.info('Starting...');

Make sure you call ```initLogger()``` on each execution of your code, before you
start sending logs to Logentries.


## Methods

### initLogger()
Initialize the (internal) logger instance. Call this before sending log data.

### log(message) / info(message) / warn(message) / error(message)
Send log data to Logentries.

### registerCompletionCallback(callback)
Register a function to be called **ONCE** as soon as the last of the
currently-pending attempts at sending a log message has completed (successfully
or not). If there are currently no pending messages, the callback will be called
immediately. No parameters will be sent to the callback you provide.

This can be helpful to use just before calling the main callback function of
your lambda code, to allow the sending of logs to Logentries to complete before
your lambda function terminates. For example:

    logFunctions.registerCompletionCallback(function() {
      mainCallback(null, results);
	});

If you don't do this, some of your logs might not make it to Logentries (which
is one of the main reasons I wrote this library).


## License
This code is made available under the MIT license.
