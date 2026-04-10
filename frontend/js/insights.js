const CAT_ICONS_INSIGHT = { transport: '🚗', food: '🍽️', energy: '⚡', other: '♻️' };

async function renderInsights() {
  try {
    const { goals, tips } = await api.getInsights();
    renderGoals(goals);
    renderTips(tips);
  } catch (err) {
    console.error('Insights error:', err.message);
  }
}


function renderGoals(goals) {
  if (!goals || goals.length === 0) {
    document.getElementById('goal-bars').innerHTML =
      '<p style="color:var(--text-muted);font-size:13px">Log some activities to see your weekly goals.</p>';
    return;
  }

  document.getElementById('goal-bars').innerHTML = goals.map((g) => {
    const color = g.onTrack ? '#1D9E75' : '#E24B4A';
    return `
      <div class="goal-row">
        <span class="goal-label">${CAT_ICONS_INSIGHT[g.category] || ''} ${g.category}</span>
        <div class="goal-bar-wrap">
          <div class="goal-bar-fill" style="width:${g.percentage}%;background:${color}"></div>
        </div>
        <span class="goal-pct" style="color:${color}">
          ${g.current.toFixed(1)} / ${g.goal} kg
        </span>
      </div>`;
  }).join('');
}


function renderTips(tips) {
  const grid = document.getElementById('insights-grid');

  if (!tips || tips.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🌱</div>
        Log some activities to unlock personalised insights.
      </div>`;
    return;
  }

  grid.innerHTML = tips.map((t) => {
    const vsLabel = t.aboveCommunity
      ? `${t.vsCommunitPct}% above community average`
      : `${t.vsCommunitPct}% below community average`;

    return `
      <div class="insight-card">
        <div class="insight-icon">${CAT_ICONS_INSIGHT[t.category] || ''}</div>
        <div class="insight-title">${t.category}</div>
        <div class="insight-body">
          ${t.totalCo2.toFixed(1)} kg CO2 total &mdash; ${vsLabel}
        </div>
        ${t.tip ? `<div class="insight-tip">💡 ${t.tip}</div>` : ''}
      </div>`;
  }).join('');
}
