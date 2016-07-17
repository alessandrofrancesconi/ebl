/* ********************* LOG ***********************
 * Very simple logging functions
 * *************************************************/
 
function logDebug (msg) {
    if (!DEBUG) return;
    console.log('[Ebl v'+ Ebl.version +'] ' + msg.replace(/(\r\n|\n|\r)/gm, ''));
}

function logWarning (msg) {
    console.warn('[Ebl v'+ Ebl.version +'] ' + msg.replace(/(\r\n|\n|\r)/gm, ''));
}

function logError (msg) {
    console.error('[Ebl v'+ Ebl.version +'] ' + msg.replace(/(\r\n|\n|\r)/gm, ''));
}