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

### registerCompletionCallback(callback)
Register a function to be called **ONCE** as soon as the last of the pending
attempts at sending a log message has completed (successfully or not). If
there are currently no pending messages, the callback will be called
immediately. No parameters will be sent to the callback you provide.

You can call this more than once if you have more than one place in your code
that needs to know when everything has completed. Callback functions sent to
this function first will be called first.

### log(message) / info(message) / warn(message) / error(message)
Send log data to Logentries.

## License
This code is made available under the MIT license.
