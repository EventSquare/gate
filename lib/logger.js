exports.log = function(...messages){
    let timing = new Date().toLocaleString();
    console.log("["+timing+"]",...messages);
}

exports.error = function(...messages){
    let timing = new Date().toLocaleString();
    console.error("["+timing+"] - ERROR : ",...messages);
}

exports.warn = function(...messages){
    let timing = new Date().toLocaleString();
    console.warn("["+timing+"] - WARN : ",...messages);
}

exports.trace = function(...messages){
    let timing = new Date().toLocaleString();
    console.trace("["+timing+"] - TRACE : ",...messages);
}