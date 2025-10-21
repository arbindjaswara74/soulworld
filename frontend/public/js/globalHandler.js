// Syncs global site state and handles crisis
// BroadcastChannel for low-latency cross-tab crisis events (optional)
let _bc_crisis = null;
try {
    if (typeof BroadcastChannel !== 'undefined') {
        _bc_crisis = new BroadcastChannel('soul_crisis');
    }
} catch(e) { /* ignore on older browsers */ }

function checkCrisis() {
    try {
        // Prefer the canonical object key
        const c = JSON.parse(localStorage.getItem('soul_crisis') || 'null');
        if (c && c.active && (typeof c.expires !== 'number' || c.expires > Date.now())) {
            window.location.href = 'crisis.html';
            return;
        }
    } catch(e){}

    // Fallback for legacy boolean flag
    try {
        const crisisActive = JSON.parse(localStorage.getItem('crisisActive') || 'false');
        if (crisisActive) {
            window.location.href = 'crisis.html';
        }
    } catch(e){}
}

// Monitor localStorage changes
window.addEventListener('storage', checkCrisis);

// Example: activate crisis manually (admin) - sets both legacy and canonical keys for compatibility
function activateCrisis(message, durationSecs = 300) {
    try {
        const now = Date.now();
        const obj = { active: true, started: now, expires: now + (durationSecs * 1000), message: message || 'Manual activation' };
        localStorage.setItem('soul_crisis', JSON.stringify(obj));
        localStorage.setItem('crisisActive', 'true');
        localStorage.setItem('soul_event', JSON.stringify({ type: 'crisis', t: now }));
        // Post to BroadcastChannel for immediate cross-tab notification
        try { if (_bc_crisis) _bc_crisis.postMessage({ type: 'crisis', payload: obj }); } catch(e){}
        window.location.href = 'crisis.html';
    } catch(e){ console.error('activateCrisis error', e); }
}

function deactivateCrisis() {
    try {
        localStorage.removeItem('soul_crisis');
        localStorage.setItem('crisisActive', 'false');
        localStorage.setItem('soul_event', JSON.stringify({ type: 'crisis_expired', t: Date.now() }));
        try { if (_bc_crisis) _bc_crisis.postMessage({ type: 'crisis_expired' }); } catch(e){}
    } catch(e){ console.error('deactivateCrisis error', e); }
}