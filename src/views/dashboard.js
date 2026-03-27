import { getPlants, getWateringMeta, daysSinceWatered, getWateringStatus } from '../data/plants.js';

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
    renderDashboardBody(document.getElementById('dashboard-body'), plants);
  } catch (err) {
    console.error('Failed to load dashboard:', err);
    renderEmptyState(document.getElementById('dashboard-body'));
  }
}

function renderDashboardBody(container, plants) {
  if (plants.length === 0) {
    renderEmptyState(container);
    return;
  }

  const thirsty = plants.filter((p) => {
    const status = getWateringStatus(p);
    return status === 'overdue' || status === 'due';
  });

  const soonPlants = plants.filter((p) => getWateringStatus(p) === 'soon');
  const happyCount = plants.filter((p) => getWateringStatus(p) === 'happy').length;

  container.innerHTML = `
    <div class="dash-stats">
      <div class="stat-card">
        <span class="stat-number">${plants.length}</span>
        <span class="stat-label-text">Total plants</span>
      </div>
      <div class="stat-card stat-thirsty">
        <span class="stat-number">${thirsty.length}</span>
        <span class="stat-label-text">Need water</span>
      </div>
      <div class="stat-card stat-happy">
        <span class="stat-number">${happyCount}</span>
        <span class="stat-label-text">Happy</span>
      </div>
    </div>

    ${thirsty.length > 0 ? `
      <div class="dash-section">
        <h3 class="dash-section-title">
          <i class="fas fa-droplet" style="color: var(--danger);"></i>
          Needs water now
        </h3>
        <div class="attention-list">
          ${thirsty.map((p) => renderAttentionCard(p)).join('')}
        </div>
      </div>
    ` : ''}

    ${soonPlants.length > 0 ? `
      <div class="dash-section">
        <h3 class="dash-section-title">
          <i class="fas fa-clock" style="color: var(--warning);"></i>
          Water soon
        </h3>
        <div class="attention-list">
          ${soonPlants.map((p) => renderAttentionCard(p)).join('')}
        </div>
      </div>
    ` : ''}

    ${thirsty.length === 0 && soonPlants.length === 0 ? `
      <div class="dash-all-good">
        <span class="all-good-emoji">🌿</span>
        <h3>All your plants are happy!</h3>
        <p class="text-muted">Nothing needs attention right now. Nice work.</p>
      </div>
    ` : ''}

    <div class="dash-section">
      <div class="dash-section-header">
        <h3 class="dash-section-title">
          <i class="fas fa-seedling" style="color: var(--sage);"></i>
          Your plants
        </h3>
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
