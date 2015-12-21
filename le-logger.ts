declare var module: any;
declare var process: any;
declare var require: any;

var request = require('request');

class LeLogger {

  public static LOGENTRIES_BASE_ENDPOINT: string = 'https://js.logentries.com/v1/logs/';

  private callOnCompletion: Function;
  private logEntriesFullEndpoint: string;
  private messageCount: number;
  private trace: string;
  private pendingMessageIDs: string[];
  private reportCompletionASAP: boolean;

  constructor() {
    this.callOnCompletion = null;
    this.logEntriesFullEndpoint = null;
    this.messageCount = 0;
    this.trace = null;
    this.pendingMessageIDs = [];
    this.reportCompletionASAP = false;
  }

  private areMessagesPending() {
    return (this.pendingMessageIDs.length > 0);
  }

  /**
   * Clear the specified message from the list of pending messages.
   *
   * @param {string} trace The pending message's full trace code (aka. ID).
   */
  private clearPendingMessage(trace) {
    var index = this.pendingMessageIDs.indexOf(trace);
    if (index > -1) {
      this.pendingMessageIDs.splice(index, 1);
    }

    if (this.reportCompletionASAP) {
      if (this.callOnCompletion !== null) {
        if ( ! this.areMessagesPending()) {
          this.callOnCompletion();
          this.callOnCompletion = null;
        }
      }
    }
  }

  private getTraceCode() {
    if (this.trace === null) {
      this.trace = this.makeId();
    }
    return this.trace + '/' + (++this.messageCount);
  }

  /**
   * Generate a pseudo-random string of characters.
   *
   * Adapted from "http://stackoverflow.com/a/1349426/3813891".
   *
   * @returns {String}
   */
  private makeId(): string {
    var text: string = '';
    var possible: string = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (var i: number = 0; i < 8; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  private recordPendingMessage(trace) {
    this.pendingMessageIDs.push(trace);
  }

  private reportCompletionIfApplicable() {
    if (this.callOnCompletion !== null) {
      if (this.areMessagesPending()) {
        this.reportCompletionASAP = true;
      } else {
        this.callOnCompletion();
        this.callOnCompletion = null;
        this.reportCompletionASAP = false;
      }
    }
  }

  private onRequestCallback(error, response, body) {
    if (error) {
      console.error(error);
    }

    var statusCode: number = Number(response.statusCode);

    if ((statusCode < 200) || (statusCode >= 300)) {
      console.error(
        'Error while sending log data (' + response.statusCode + ' ' +
        response.statusMessage + ').'
      );
    }
  }

  private postLog(level: string, message: string) {
    this.reportCompletionASAP = false;

    if (this.logEntriesFullEndpoint === null) {
      if (process.env.LOGENTRIES_TOKEN) {
        this.logEntriesFullEndpoint = LeLogger.LOGENTRIES_BASE_ENDPOINT +
                                      process.env.LOGENTRIES_TOKEN;
      } else {
        throw new Error(
          'Cannot log data to Logentries. No LOGENTRIES_TOKEN environment ' +
          'variable was provided.'
        );
      }
    }

    var trace: string = this.getTraceCode();

    /* Also output the log message to the console (so that it is included in the
     * AWS CloudWatch logs).  */
    console.log(trace, level, message);

    this.recordPendingMessage(trace);

    // Set up a reference to this that can be used in the closure below.
    var leLogger = this;

    /*
     * NOTE:
     * The attributes of the JSON body of this call (trace, level, event) are
     * NOT arbitrary. See the data variable in _rawLog function here:
     * https://github.com/logentries/le_js/blob/master/product/le.js#L160
     */
    request(
      {
        uri: this.logEntriesFullEndpoint,
        method: 'POST',
        strictSSL: true,
        headers: {
          'Content-type': 'application/json'
        },
        timeout: 5000, // Timeout in milliseconds.
        body: JSON.stringify({ trace: trace, level: level, event: message })
      },
      function(error, response, body) {
        leLogger.onRequestCallback(error, response, body);
        leLogger.clearPendingMessage(trace);
        leLogger.reportCompletionIfApplicable();
      }
    );
  };

  public log(message: string) {
    this.postLog('LOG', message);
  }
  public info(message: string) {
    this.postLog('INFO', message);
  }
  public warn(message: string) {
    this.postLog('WARN', message);
  }
  public error(message: string) {
    this.postLog('ERROR', message);
  }

  /**
   * Register a function to be called ONCE as soon as the last of the pending
   * attempts at sending a log message has completed (successfully or not). If
   * there are currently no pending messages, the callback will be called
   * immediately.
   *
   * @param {Function} callback The callback function.
   */
  public registerCompletionCallback(callback: Function) {
    if (this.callOnCompletion === null) {
      this.callOnCompletion = callback;
    } else {
      var oldCallOnCompletion = this.callOnCompletion;
      this.callOnCompletion = function() {
        oldCallOnCompletion();
        oldCallOnCompletion = null;
        callback();
        callback = null;
      };
    }

    if ( ! this.areMessagesPending()) {
      this.callOnCompletion();
      this.callOnCompletion = null;
    }
  }
}

module.exports = LeLogger;
