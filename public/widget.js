(function () {
  'use strict';

  var API_BASE = (function () {
    var script = document.currentScript || (function () {
      var scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();
    var src = script.getAttribute('src') || '';
    var match = src.match(/^(https?:\/\/[^/]+)/);
    return match ? match[1] : 'https://pulse-ai-app-audit.vercel.app';
  })();

  function scoreColor(score) {
    if (score >= 80) return '#16a34a';
    if (score >= 60) return '#d97706';
    return '#dc2626';
  }

  function injectStyles() {
    if (document.getElementById('pulse-ai-widget-styles')) return;
    var style = document.createElement('style');
    style.id = 'pulse-ai-widget-styles';
    style.textContent = [
      '.pulse-widget{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:480px;border:1px solid #e5e5e5;border-radius:12px;padding:24px;background:#fff;box-sizing:border-box}',
      '.pulse-widget *{box-sizing:border-box}',
      '.pulse-widget h3{margin:0 0 4px;font-size:18px;font-weight:700;color:#18181b}',
      '.pulse-widget p.pulse-sub{margin:0 0 16px;font-size:13px;color:#71717a}',
      '.pulse-widget-form{display:flex;gap:8px}',
      '.pulse-widget-input{flex:1;height:40px;padding:0 12px;border:1px solid #d4d4d8;border-radius:8px;font-size:14px;outline:none}',
      '.pulse-widget-input:focus{border-color:#18181b}',
      '.pulse-widget-btn{height:40px;padding:0 18px;background:#18181b;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap}',
      '.pulse-widget-btn:disabled{opacity:0.6;cursor:not-allowed}',
      '.pulse-widget-btn:hover:not(:disabled){background:#27272a}',
      '.pulse-widget-error{margin-top:10px;font-size:13px;color:#dc2626}',
      '.pulse-widget-results{margin-top:20px;display:none}',
      '.pulse-widget-results.show{display:block}',
      '.pulse-widget-score-row{display:flex;align-items:center;gap:16px;margin-bottom:16px}',
      '.pulse-widget-ring{width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
      '.pulse-widget-ring-inner{font-size:24px;font-weight:800}',
      '.pulse-widget-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px}',
      '.pulse-widget-metric{background:#f4f4f5;border-radius:8px;padding:8px 10px;text-align:center}',
      '.pulse-widget-metric-val{font-size:16px;font-weight:700}',
      '.pulse-widget-metric-label{font-size:10px;color:#71717a;margin-top:2px}',
      '.pulse-widget-issue{font-size:13px;color:#71717a;margin-bottom:14px;padding:10px 12px;background:#fef2f2;border-radius:8px;border:1px solid #fecaca}',
      '.pulse-widget-cta{display:block;width:100%;text-align:center;padding:11px;background:#18181b;color:#fff;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none}',
      '.pulse-widget-cta:hover{background:#27272a}',
      '.pulse-widget-loading{display:flex;align-items:center;gap:8px;font-size:13px;color:#71717a;margin-top:10px}',
      '.pulse-widget-spinner{width:14px;height:14px;border:2px solid #d4d4d8;border-top-color:#18181b;border-radius:50%;animation:pulse-spin 0.7s linear infinite}',
      '@keyframes pulse-spin{to{transform:rotate(360deg)}}',
      '.pulse-widget-footer{margin-top:14px;text-align:center;font-size:11px;color:#a1a1aa}',
      '.pulse-widget-footer a{color:#71717a;text-decoration:underline}',
    ].join('');
    document.head.appendChild(style);
  }

  function render(container) {
    container.className = 'pulse-widget';
    container.innerHTML =
      '<h3>Free Website Audit</h3>' +
      '<p class="pulse-sub">Check your site\'s performance, SEO, security &amp; more in seconds</p>' +
      '<div class="pulse-widget-form">' +
        '<input type="text" class="pulse-widget-input" placeholder="yourwebsite.com" />' +
        '<button class="pulse-widget-btn">Audit</button>' +
      '</div>' +
      '<div class="pulse-widget-error" style="display:none"></div>' +
      '<div class="pulse-widget-loading" style="display:none"><span class="pulse-widget-spinner"></span>Analyzing your site...</div>' +
      '<div class="pulse-widget-results"></div>' +
      '<div class="pulse-widget-footer">Powered by <a href="' + API_BASE + '" target="_blank" rel="noopener">Pulse AI</a></div>';

    var input = container.querySelector('.pulse-widget-input');
    var button = container.querySelector('.pulse-widget-btn');
    var errorBox = container.querySelector('.pulse-widget-error');
    var loadingBox = container.querySelector('.pulse-widget-loading');
    var resultsBox = container.querySelector('.pulse-widget-results');

    function runAudit() {
      var url = input.value.trim();
      if (!url) return;

      errorBox.style.display = 'none';
      resultsBox.classList.remove('show');
      loadingBox.style.display = 'flex';
      button.disabled = true;

      fetch(API_BASE + '/api/widget/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url }),
      })
        .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
        .then(function (result) {
          loadingBox.style.display = 'none';
          button.disabled = false;

          if (!result.ok) {
            errorBox.textContent = result.data.error || 'Something went wrong';
            errorBox.style.display = 'block';
            return;
          }

          var d = result.data;
          var color = scoreColor(d.healthScore);
          resultsBox.innerHTML =
            '<div class="pulse-widget-score-row">' +
              '<div class="pulse-widget-ring" style="border:6px solid ' + color + '">' +
                '<span class="pulse-widget-ring-inner" style="color:' + color + '">' + Math.round(d.healthScore) + '</span>' +
              '</div>' +
              '<div>' +
                '<div style="font-size:13px;color:#71717a">Health Score</div>' +
                '<div style="font-size:13px;color:' + (d.criticalCount > 0 ? '#dc2626' : '#16a34a') + ';font-weight:600">' +
                  (d.criticalCount > 0 ? d.criticalCount + ' critical issue' + (d.criticalCount > 1 ? 's' : '') + ' found' : 'No critical issues') +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="pulse-widget-metrics">' +
              '<div class="pulse-widget-metric"><div class="pulse-widget-metric-val" style="color:' + scoreColor(d.performanceScore) + '">' + Math.round(d.performanceScore) + '</div><div class="pulse-widget-metric-label">Performance</div></div>' +
              '<div class="pulse-widget-metric"><div class="pulse-widget-metric-val" style="color:' + scoreColor(d.seoScore) + '">' + Math.round(d.seoScore) + '</div><div class="pulse-widget-metric-label">SEO</div></div>' +
              '<div class="pulse-widget-metric"><div class="pulse-widget-metric-val" style="color:' + scoreColor(d.securityScore) + '">' + Math.round(d.securityScore) + '</div><div class="pulse-widget-metric-label">Security</div></div>' +
            '</div>' +
            (d.topIssue ? '<div class="pulse-widget-issue">' + d.topIssue + '</div>' : '') +
            '<a class="pulse-widget-cta" href="' + API_BASE + '/?ref=widget&url=' + encodeURIComponent(d.url) + '" target="_blank" rel="noopener">See Full Report — Free</a>';
          resultsBox.classList.add('show');
        })
        .catch(function () {
          loadingBox.style.display = 'none';
          button.disabled = false;
          errorBox.textContent = 'Network error. Please try again.';
          errorBox.style.display = 'block';
        });
    }

    button.addEventListener('click', runAudit);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') runAudit();
    });
  }

  function init() {
    injectStyles();
    var containers = document.querySelectorAll('[data-pulse-ai-widget]');
    for (var i = 0; i < containers.length; i++) {
      render(containers[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
