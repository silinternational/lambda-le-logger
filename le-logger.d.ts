declare var module: any;
declare var process: any;
declare var require: any;
declare var request: any;
declare class LeLogger {
    static LOGENTRIES_BASE_ENDPOINT: string;
    private callOnCompletion;
    private logEntriesFullEndpoint;
    private messageCount;
    private trace;
    private pendingMessageIDs;
    private reportCompletionASAP;
    constructor();
    private areMessagesPending();
    private clearPendingMessage(trace);
    private getTraceCode();
    private makeId();
    private recordPendingMessage(trace);
    private reportCompletionIfApplicable();
    private onRequestCallback(error, response, body);
    private postLog(level, message);
    log(message: string): void;
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
    registerCompletionCallback(callback: Function): void;
}
