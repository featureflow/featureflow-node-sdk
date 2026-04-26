/**
 * Local harness: Express app using the built SDK in ../../dist
 *
 *   yarn example:server
 *   FEATUREFLOW_SERVER_KEY=ff.srv.xxx yarn example:server
 *   FEATUREFLOW_BASE_URL=https://beta.featureflow-staging.com FEATUREFLOW_SERVER_KEY=ff.srv.xxx yarn example:server
 *
 * Open http://127.0.0.1:3456/ — or use the JSON API below.
 */

const path = require('path');
const express = require('express');

const distIndex = path.join(__dirname, '..', '..', 'dist', 'index.js');
let Featureflow;
try {
  Featureflow = require(distIndex);
} catch (e) {
  console.error(
    'Could not load the SDK from dist/. Build the project first:\n  yarn build\n'
  );
  process.exit(1);
}

const apiKey = (process.env.FEATUREFLOW_SERVER_KEY || '').trim();
if (!apiKey) {
  console.error(
    'Set FEATUREFLOW_SERVER_KEY to your Featureflow server API key.\n' +
      'Example:\n' +
      '  FEATUREFLOW_SERVER_KEY=ff.srv.xxxxxxxxx yarn example:server\n'
  );
  process.exit(1);
}

const port = parseInt(process.env.PORT || '3456', 10);
const disableEvents = process.env.FEATUREFLOW_DISABLE_EVENTS !== 'false';

// baseUrl / eventsUrl: omitted here so the SDK applies FEATUREFLOW_BASE_URL / FEATUREFLOW_EVENTS_URL (see Client).
const clientConfig = {
  apiKey,
  disableEvents,
  withFeatures: [new Featureflow.Feature('harness-demo', 'off').build()]
};

const app = express();

app.get('/health', function (req, res) {
  res.json({ status: 'ok' });
});

app.get('/', function (req, res) {
  res.type('html');
  res.send(INDEX_HTML);
});

app.use(Featureflow.ExpressClient(clientConfig));

app.get('/api/config', function (req, res) {
  const ff = req.featureflow;
  if (!ff || !ff.config) {
    return res.status(503).json({ error: 'Featureflow client not attached' });
  }
  res.json({
    baseUrl: ff.config.baseUrl,
    eventsUrl: ff.config.eventsUrl,
    disableEvents: !!ff.config.disableEvents
  });
});

app.get('/api/ready', function (req, res) {
  const ff = req.featureflow;
  if (!ff) {
    return res.status(503).json({ error: 'Featureflow client not attached' });
  }
  res.json({ ready: !!ff.isReady });
});

app.get('/api/evaluate', function (req, res) {
  const feature = (req.query.feature && String(req.query.feature)) || '';
  if (!feature) {
    return res.status(400).json({ error: 'Query parameter "feature" is required' });
  }
  const userId = (req.query.userId && String(req.query.userId)) || 'anonymous';
  const ff = req.featureflow;
  if (!ff) {
    return res.status(503).json({ error: 'Featureflow client not attached' });
  }

  const evaluated = ff.evaluate(feature, userId);
  res.json({
    feature: feature,
    userId: userId,
    value: evaluated.value(),
    isOn: evaluated.isOn(),
    isOff: evaluated.isOff()
  });
});

app.use(function (req, res) {
  res.status(404).json({ error: 'Not found' });
});

app.listen(port, '127.0.0.1', function () {
  var baseLog = process.env.FEATUREFLOW_BASE_URL
    ? String(process.env.FEATUREFLOW_BASE_URL).replace(/\/+$/, '')
    : 'https://app.featureflow.io (default)';
  var evLog = process.env.FEATUREFLOW_EVENTS_URL
    ? String(process.env.FEATUREFLOW_EVENTS_URL).replace(/\/+$/, '')
    : 'https://events.featureflow.io (default)';
  console.log(
    'Featureflow SDK harness listening on http://127.0.0.1:' + port + '/\n' +
      '  GET  /health  GET  /api/config  GET  /api/ready  GET  /api/evaluate?feature=<key>&userId=<id>\n' +
      '  effective baseUrl (from env or default): ' +
      baseLog +
      '\n' +
      '  effective eventsUrl (from env or default): ' +
      evLog +
      '\n' +
      '  (harness disables events HTTP by default; set FEATUREFLOW_DISABLE_EVENTS=false to enable)\n'
  );
});

const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Featureflow node SDK — harness</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 42rem; margin: 2rem auto; padding: 0 1rem; }
    label { display: block; margin-top: 0.75rem; }
    input { width: 100%; max-width: 24rem; padding: 0.25rem 0.5rem; }
    pre { background: #f4f4f4; padding: 0.75rem; overflow: auto; }
    .ok { color: #0a0; } .err { color: #c00; }
  </style>
</head>
<body>
  <h1>Featureflow node SDK harness</h1>
  <p>Uses the SDK from this repo (run <code>yarn build</code> first). Set <code>FEATUREFLOW_SERVER_KEY</code>; use <code>FEATUREFLOW_BASE_URL</code> for staging (e.g. <code>https://beta.featureflow-staging.com</code>).</p>
  <p>SDK baseUrl: <strong id="baseUrl">…</strong></p>
  <p>Ready: <strong id="ready">…</strong></p>
  <label>Feature key <input id="feature" type="text" value="harness-demo" placeholder="my-feature-key" /></label>
  <label>User id <input id="userId" type="text" value="harness-user" placeholder="user id" /></label>
  <p><button type="button" id="go">Evaluate</button></p>
  <h2>Result</h2>
  <pre id="out">—</pre>
  <h2>Raw JSON</h2>
  <pre id="raw">—</pre>
  <script>
  (function () {
    var readyEl = document.getElementById('ready');
    var outEl = document.getElementById('out');
    var rawEl = document.getElementById('raw');
    function get(path) { return fetch(path).then(function (r) { return r.json(); }); }
    get('/api/config').then(function (c) {
      var b = document.getElementById('baseUrl');
      if (b) b.textContent = c.baseUrl + ' — events: ' + c.eventsUrl;
    }).catch(function () {
      var b = document.getElementById('baseUrl');
      if (b) b.textContent = '(unavailable)';
    });
    get('/api/ready').then(function (d) {
      readyEl.textContent = d.ready ? 'yes' : 'not yet / polling';
      readyEl.className = d.ready ? 'ok' : '';
    }).catch(function (e) { readyEl.textContent = 'error'; readyEl.className = 'err'; });
    document.getElementById('go').onclick = function () {
      var f = document.getElementById('feature').value.trim();
      var u = document.getElementById('userId').value.trim() || 'anonymous';
      var q = '/api/evaluate?feature=' + encodeURIComponent(f) + '&userId=' + encodeURIComponent(u);
      get(q).then(function (d) {
        outEl.textContent = 'value: ' + d.value + '\\n' + 'isOn: ' + d.isOn + ', isOff: ' + d.isOff;
        rawEl.textContent = JSON.stringify(d, null, 2);
      }).catch(function () {
        outEl.textContent = 'Request failed';
        outEl.className = 'err';
      });
    };
  })();
  </script>
</body>
</html>
`;
