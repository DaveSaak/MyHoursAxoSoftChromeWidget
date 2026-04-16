// healthCheck.js
(function () {
    const con = () => document.getElementById('healthConsole');
    const sumEl = () => document.getElementById('healthSummary');
    let results = [];

    function ts() {
        const d = new Date();
        return `<span class="hc-dim">[${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}]</span>`;
    }
    function pad(n) { return n.toString().padStart(2, '0'); }

    function log(msg, cls = '') {
        const line = document.createElement('div');
        line.innerHTML = `${ts()} <span class="${cls}">${msg}</span>`;
        con().appendChild(line);
        con().scrollTop = con().scrollHeight;
    }

    function logSection(label) {
        const line = document.createElement('div');
        line.innerHTML = `<br>${ts()} <span class="hc-head">── ${label} ──</span>`;
        con().appendChild(line);
    }

    function spinnerId(id, msg) {
        const line = document.createElement('div');
        line.id = id;
        line.innerHTML = `${ts()} <span class="hc-info">⟳ ${msg}</span>`;
        con().appendChild(line);
        con().scrollTop = con().scrollHeight;
    }

    function resolveSpinner(id, msg, cls) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `${ts()} <span class="${cls}">${msg}</span>`;
        con().scrollTop = con().scrollHeight;
    }

    function addResult(label, status) {
        results.push({ label, status });
        const styles = status === 'ok'
            ? 'background:#d1fae5;color:#065f46;border:0.5px solid #6ee7b7'
            : status === 'fail'
                ? 'background:#fee2e2;color:#991b1b;border:0.5px solid #fca5a5'
                : 'background:#f3f4f6;color:#374151;border:0.5px solid #d1d5db';
        const badge = document.createElement('span');
        badge.style.cssText = styles + ';padding:2px 10px;border-radius:6px;font-size:12px;display:inline-flex;align-items:center;margin-right:6px';
        badge.textContent = label;
        sumEl().appendChild(badge);
    }

    // ── All Hours ─────────────────────────────────────────────────────────────
    async function checkAH(options) {
        logSection('All Hours');

        if (!options.allHoursAccessToken) {
            log('No access token stored — have you authorized yet?', 'hc-warn');
            addResult('AH token', 'skip');
            return;
        }

        // Token expiry check (mirrors checkTokenAndExecutePromise logic)
        const threshold = 5 * 60;
        const validTill = moment(options.allHoursAccessTokenValidTill);
        if (!validTill.isValid()) {
            log('Token expiry date is invalid — a refresh will be needed', 'hc-warn');
        } else {
            const expiresIn = Math.round(validTill.diff(moment(), 'minutes'));
            if (expiresIn < 0) {
                log(`Token expired ${Math.abs(expiresIn)} min ago — will auto-refresh on next use`, 'hc-warn');
            } else {
                log(`Token valid for ~${expiresIn} more minute${expiresIn === 1 ? '' : 's'}`, 'hc-ok');
            }
        }

        spinnerId('sp-ah-user', 'Fetching current user via UserInfo…');
        try {
            const ahApi = new AllHoursApi(options);
            // getCurrentUserName calls UserInfo and resolves given_name
            const name = await ahApi.getCurrentUserName();
            if (name) {
                resolveSpinner('sp-ah-user', `✓ Logged in as ${name}`, 'hc-ok');
                addResult('AH user', 'ok');
            } else {
                resolveSpinner('sp-ah-user', '✗ UserInfo returned empty — token may be invalid', 'hc-error');
                addResult('AH user', 'fail');
            }
        } catch (e) {
            resolveSpinner('sp-ah-user', `✗ ${e.message || e}`, 'hc-error');
            addResult('AH user', 'fail');
        }
    }

    // ── My Hours ──────────────────────────────────────────────────────────────
    async function checkMH(options) {
        logSection('My Hours');

        const pat = options.platforms && options.platforms.myHours && options.platforms.myHours.pat;
        if (!pat) {
            log('platforms.myHours.pat not set in settings.json -- skipping', 'hc-warn');
            addResult('MH', 'skip');
            return;
        }

        const apiUrl = options.platforms.myHours.apiUri2 || undefined;

        spinnerId('sp-mh-user', 'Fetching My Hours user...');
        let currentUser = { id: null };
        try {
            const mhApi = new MyHoursApi(currentUser, apiUrl, pat);
            const user = await mhApi.getUser();
            currentUser.id = user.id;
            const displayName = user.fullName || user.email || user.id;
            resolveSpinner('sp-mh-user', '✓ My Hours user: ' + displayName, 'hc-ok');
            addResult('MH user', 'ok');
        } catch (e) {
            resolveSpinner('sp-mh-user', '✗ ' + (e.message || e), 'hc-error');
            addResult('MH user', 'fail');
            return;
        }

        spinnerId('sp-mh-logs', "Fetching today's logs...");
        try {
            const mhApi = new MyHoursApi(currentUser, apiUrl, pat);
            const logs = await mhApi.getLogs(moment());
            const count = Array.isArray(logs) ? logs.length : 0;
            resolveSpinner('sp-mh-logs', '✓ ' + count + ' log entr' + (count === 1 ? 'y' : 'ies') + ' today', 'hc-ok');
            addResult('MH logs', 'ok');
        } catch (e) {
            resolveSpinner('sp-mh-logs', '✗ ' + (e.message || e), 'hc-error');
            addResult('MH logs', 'fail');
        }
    }

    // ── DevOps ────────────────────────────────────────────────────────────────
    async function checkDevOps(options) {
        logSection('DevOps');

        const devops = options.platforms && options.platforms.devops;
        if (!devops || !devops.pat) {
            log('platforms.devops.pat not set in settings.json — skipping', 'hc-warn');
            addResult('DevOps', 'skip');
            return;
        }
        if (!devops.uri) {
            log('platforms.devops.uri not set in settings.json — skipping', 'hc-warn');
            addResult('DevOps', 'skip');
            return;
        }

        spinnerId('sp-do', `Fetching repositories from ${devops.uri}…`);
        try {
            const doApi = new DevOpsApi(options);
            const result = await doApi.getMyRepositoriesAsync();
            const repos = result.value || [];
            const count = result.count || repos.length;
            resolveSpinner('sp-do', `✓ ${count} repositor${count === 1 ? 'y' : 'ies'} accessible`, 'hc-ok');
            addResult('DevOps', 'ok');
            if (repos.length > 0) {
                const names = repos.slice(0, 5).map(r => r.name).join(', ');
                log(`  ${names}${repos.length > 5 ? ` …+${repos.length - 5} more` : ''}`, 'hc-dim');
            }
        } catch (e) {
            resolveSpinner('sp-do', `✗ ${e.message || e}`, 'hc-error');
            addResult('DevOps', 'fail');
        }
    }

    // ── Main ──────────────────────────────────────────────────────────────────
    async function runChecks() {
        const btn = document.getElementById('runHealthChecksBtn');
        btn.disabled = true;
        btn.textContent = 'Running…';
        const c = con();
        c.innerHTML = '';
        c.classList.add('active');
        sumEl().innerHTML = '';
        results = [];

        log('Starting connection health checks…', 'hc-info');

        // Load options the same way optionsPage.js does — storage + settings.json
        let options = new Options();
        try {
            await options.load();
        } catch (e) {
            log('Failed to load options: ' + (e.message || e), 'hc-error');
        }

        await checkAH(options);
        await checkMH(options);
        await checkDevOps(options);

        logSection('Done');
        const ok = results.filter(r => r.status === 'ok').length;
        const fail = results.filter(r => r.status === 'fail').length;
        const skip = results.filter(r => r.status === 'skip').length;
        log(`${ok} passed · ${fail} failed · ${skip} skipped`, fail ? 'hc-warn' : 'hc-ok');

        btn.disabled = false;
        btn.textContent = 'Run checks';
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('runHealthChecksBtn').addEventListener('click', runChecks);
    });
})();