import { getPlants, getWateringMeta, daysSinceWatered, getWateringStatus } from '../data/plants.js';
import { getJournalEntries } from '../data/journal.js';

export async function renderDashboard(container, user) {
  const greeting = getGreeting();
  const firstName = user.displayName?.split(' ')[0] || 'friend';

  container.innerHTML = `
    <div class="dashboard">
      <div class="dashboard-header">
        <h2 class="dashboard-greeting">${greeting}, ${firstName} 🌱</h2>
        <p class="dashboard-date">${formatDate(new Date())}</p>
      </div>
      <div id="dashboard-body">
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Checking on your plants...</p>
        </div>
      </div>
    </div>
  `;

  try {
    const plants = await getPlants(user.uid);

    // Check each plant's journal for recent diagnosis issues (last 14 days)
    const sickPlants = [];
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    await Promise.all(plants.map(async (plant) => {
      try {
        const entries = await getJournalEntries(user.uid, plant.id);
        const recentIssue = entries.find((e) => {
          if (e.type !== 'issue') return false;
          const entryDate = e.date?.toDate ? e.date.toDate() : new Date(e.date);
          return entryDate >= twoWeeksAgo;
        });
        if (recentIssue) {
          const diagnosisLine = recentIssue.note?.split('\n')[0] || '';
          const diagnosis = diagnosisLine.replace(/^Diagnosis:\s*/, '').split('(')[0].trim();
          sickPlants.push({ ...plant, _diagnosis: diagnosis, _issueDate: recentIssue.date });
        }
      } catch (e) {
        // skip if journal fails for a plant
      }
    }));

    renderDashboardBody(document.getElementById('dashboard-body'), plants, sickPlants);
  } catch (err) {
    console.error('Failed to load dashboard:', err);
    renderEmptyState(document.getElementById('dashboard-body'));
  }
}

function renderDashboardBody(container, plants, sickPlants = []) {
  if (plants.length === 0) {
    renderEmptyState(container);
    return;
  }

  const thirsty = plants.filter((p) => {
    const status = getWateringStatus(p);
    return status === 'overdue' || status === 'due';
  });

  const soonPlants = plants.filter((p) => getWateringStatus(p) === 'soon');
  const sickIds = new Set(sickPlants.map((p) => p.id));
  const healthyHappyCount = plants.filter((p) => getWateringStatus(p) === 'happy' && !sickIds.has(p.id)).length;

  container.innerHTML = `
    <div class="dash-summary">
      <span class="dash-summary-item"><strong>${plants.length}</strong> plants</span>
      <span class="dash-summary-dot"></span>
      <span class="dash-summary-item"><strong>${healthyHappyCount}</strong> happy</span>
      ${thirsty.length > 0 ? `
        <span class="dash-summary-dot"></span>
        <span class="dash-summary-item dash-summary-alert"><strong>${thirsty.length}</strong> need water</span>
      ` : ''}
      ${sickPlants.length > 0 ? `
        <span class="dash-summary-dot"></span>
        <span class="dash-summary-item dash-summary-warn"><strong>${sickPlants.length}</strong> need care</span>
      ` : ''}
    </div>

    ${sickPlants.length > 0 ? `
      <div class="dash-section">
        <h3 class="dash-section-title">Under the weather</h3>
        <div class="attention-list">
          ${sickPlants.map((p) => renderSickCard(p)).join('')}
        </div>
      </div>
    ` : ''}

    ${thirsty.length > 0 ? `
      <div class="dash-section">
        <h3 class="dash-section-title">Needs water</h3>
        <div class="attention-list">
          ${thirsty.map((p) => renderAttentionCard(p)).join('')}
        </div>
      </div>
    ` : ''}

    ${soonPlants.length > 0 ? `
      <div class="dash-section">
        <h3 class="dash-section-title">Water soon</h3>
        <div class="attention-list">
          ${soonPlants.map((p) => renderAttentionCard(p)).join('')}
        </div>
      </div>
    ` : ''}

    ${thirsty.length === 0 && soonPlants.length === 0 && sickPlants.length === 0 ? `
      <div class="dash-all-good">
        <p>All your plants are happy. Nothing needs attention right now.</p>
      </div>
    ` : ''}

    <div class="dash-section">
      <div class="dash-section-header">
        <h3 class="dash-section-title">Your plants</h3>
        <a href="#/plants" class="btn btn-secondary btn-sm">View all</a>
      </div>
    </div>
  `;

  // Click handlers on attention cards
  container.querySelectorAll('.attention-card').forEach((card) => {
    card.addEventListener('click', () => {
      window.location.hash = `/plant/${card.dataset.id}`;
    });
  });
  container.querySelectorAll('.sick-card').forEach((card) => {
    card.addEventListener('click', () => {
      window.location.hash = `/plant/${card.dataset.id}`;
    });
  });
}

function renderSickCard(plant) {
  const issueDate = plant._issueDate?.toDate ? plant._issueDate.toDate() : new Date(plant._issueDate);
  const daysAgo = Math.floor((new Date() - issueDate) / (1000 * 60 * 60 * 24));
  const dateText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;

  return `
    <div class="attention-card sick-card" data-id="${plant.id}">
      <div class="attention-status status-sick">
        <i class="fas fa-stethoscope"></i>
      </div>
      <div class="attention-info">
        <span class="attention-name">${plant.name}</span>
        <span class="attention-species">${plant._diagnosis || 'Diagnosed issue'}</span>
      </div>
      <div class="attention-meta">
        <span class="attention-days status-sick">${dateText}</span>
      </div>
    </div>
  `;
}

function renderAttentionCard(plant) {
  const meta = getWateringMeta(plant);
  const days = daysSinceWatered(plant);
  const daysText = days === null ? '' : days === 0 ? 'Today' : `${days}d ago`;

  return `
    <div class="attention-card" data-id="${plant.id}">
      <div class="attention-status ${meta.cssClass}">
        <i class="fas ${meta.icon}"></i>
      </div>
      <div class="attention-info">
        <span class="attention-name">${plant.name}</span>
        ${plant.species ? `<span class="attention-species">${plant.species}</span>` : ''}
      </div>
      <div class="attention-meta">
        ${plant.room ? `<span class="attention-room">${plant.room}</span>` : ''}
        <span class="attention-days ${meta.cssClass}">${daysText}</span>
      </div>
    </div>
  `;
}

function renderEmptyState(container) {
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">
        <div class="empty-pot">
          <div class="empty-pot-soil"></div>
          <div class="empty-pot-sprout"></div>
        </div>
      </div>
      <h3 class="empty-state-title">Your garden is empty!</h3>
      <p class="empty-state-text">
        Add your first plant and start tracking its care.
        We'll help you remember watering, fertilizing, repotting, and more.
      </p>
      <a href="#/plants" class="btn btn-primary">
        <i class="fas fa-plus"></i>
        <span>Add Your First Plant</span>
      </a>
    </div>
  `;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}
