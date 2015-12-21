var request = require('request');
var LeLogger = (function () {
    function LeLogger() {
        this.callOnCompletion = null;
        this.logEntriesFullEndpoint = null;
        this.messageCount = 0;
        this.trace = null;
        this.pendingMessageIDs = [];
        this.reportCompletionASAP = false;
    }
    LeLogger.prototype.areMessagesPending = function () {
        return (this.pendingMessageIDs.length > 0);
    };
    LeLogger.prototype.clearPendingMessage = function (trace) {
        var index = this.pendingMessageIDs.indexOf(trace);
        if (index > -1) {
            this.pendingMessageIDs.splice(index, 1);
        }
        if (this.reportCompletionASAP) {
            if (this.callOnCompletion !== null) {
                if (!this.areMessagesPending()) {
                    this.callOnCompletion();
                    this.callOnCompletion = null;
                }
            }
        }
    };
    LeLogger.prototype.getTraceCode = function () {
        if (this.trace === null) {
            this.trace = this.makeId();
        }
        return this.trace + '/' + (++this.messageCount);
    };
    LeLogger.prototype.makeId = function () {
        var text = '';
        var possible = 'abcdefghijklmnopqrstuvwxyz0123456789';
        for (var i = 0; i < 8; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    };
    LeLogger.prototype.recordPendingMessage = function (trace) {
        this.pendingMessageIDs.push(trace);
    };
    LeLogger.prototype.reportCompletionIfApplicable = function () {
        if (this.callOnCompletion !== null) {
            if (this.areMessagesPending()) {
                this.reportCompletionASAP = true;
            }
            else {
                this.callOnCompletion();
                this.callOnCompletion = null;
                this.reportCompletionASAP = false;
            }
        }
    };
    LeLogger.prototype.onRequestCallback = function (error, response, body) {
        if (error) {
            console.error(error);
        }
        var statusCode = Number(response.statusCode);
        if ((statusCode < 200) || (statusCode >= 300)) {
            console.error('Error while sending log data (' + response.statusCode + ' ' +
                response.statusMessage + ').');
        }
    };
    LeLogger.prototype.postLog = function (level, message) {
        this.reportCompletionASAP = false;
        if (this.logEntriesFullEndpoint === null) {
            if (process.env.LOGENTRIES_TOKEN) {
                this.logEntriesFullEndpoint = LeLogger.LOGENTRIES_BASE_ENDPOINT +
                    process.env.LOGENTRIES_TOKEN;
            }
            else {
                throw new Error('Cannot log data to Logentries. No LOGENTRIES_TOKEN environment ' +
                    'variable was provided.');
            }
        }
        var trace = this.getTraceCode();
        console.log(trace, level, message);
        this.recordPendingMessage(trace);
        var leLogger = this;
        request({
            uri: this.logEntriesFullEndpoint,
            method: 'POST',
            strictSSL: true,
            headers: {
                'Content-type': 'application/json'
            },
            timeout: 5000,
            body: JSON.stringify({ trace: trace, level: level, event: message })
        }, function (error, response, body) {
            leLogger.onRequestCallback(error, response, body);
            leLogger.clearPendingMessage(trace);
            leLogger.reportCompletionIfApplicable();
        });
    };
    ;
    LeLogger.prototype.log = function (message) {
        this.postLog('LOG', message);
    };
    LeLogger.prototype.info = function (message) {
        this.postLog('INFO', message);
    };
    LeLogger.prototype.warn = function (message) {
        this.postLog('WARN', message);
    };
    LeLogger.prototype.error = function (message) {
        this.postLog('ERROR', message);
    };
    LeLogger.prototype.registerCompletionCallback = function (callback) {
        if (this.callOnCompletion === null) {
            this.callOnCompletion = callback;
        }
        else {
            var oldCallOnCompletion = this.callOnCompletion;
            this.callOnCompletion = function () {
                oldCallOnCompletion();
                oldCallOnCompletion = null;
                callback();
                callback = null;
            };
        }
        if (!this.areMessagesPending()) {
            this.callOnCompletion();
            this.callOnCompletion = null;
        }
    };
    LeLogger.LOGENTRIES_BASE_ENDPOINT = 'https://js.logentries.com/v1/logs/';
    return LeLogger;
})();
module.exports = LeLogger;
