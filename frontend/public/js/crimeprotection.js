// Monitors suspicious activity and preserves messages
function checkSuspicious(msg) {
    const crimeKeywords = ["kill", "steal", "bomb", "attack"];
    return crimeKeywords.some(word => msg.toLowerCase().includes(word));
}

function saveEvidence(msg) {
    const evidence = JSON.parse(localStorage.getItem("crimeEvidence") || "[]");
    evidence.push({ msg, timestamp: new Date().toISOString() });
    localStorage.setItem("crimeEvidence", JSON.stringify(evidence));
}

// Hook into community messages
const originalSend = window.sendMessageOriginal;
window.sendMessageOriginal = function(msg) {
    if (checkSuspicious(msg)) saveEvidence(msg);
    if (msgThresholdReached(msg)) {
        alert("Suspicious activity detected. Action may be taken.");
    }
    originalSend(msg);
}

function msgThresholdReached(msg) {
    // Simple example: more than 5 suspicious messages
    const evidence = JSON.parse(localStorage.getItem("crimeEvidence") || "[]");
    return evidence.length >= 5;
}