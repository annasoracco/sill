import { getPlant, updatePlant, deletePlant, getWateringMeta, daysSinceWatered } from '../data/plants.js';

export async function renderPlantDetail(container, user, plantId, navigate) {
  container.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading plant...</p>
    </div>
  `;

  try {
    const plant = await getPlant(user.uid, plantId);
    if (!plant) {
      container.innerHTML = `
        <div class="coming-soon">
          <div class="coming-soon-icon">🥀</div>
          <h2>Plant not found</h2>
          <p>This plant may have been removed.</p>
          <a href="#/plants" class="btn btn-secondary" style="margin-top: 1rem; display: inline-flex;">
            <i class="fas fa-arrow-left"></i> Back to plants
          </a>
        </div>
      `;
      return;
    }

    renderDetail(container, plant, user, navigate);
  } catch (err) {
    console.error('Failed to load plant:', err);
    container.innerHTML = `
      <div class="coming-soon">
        <div class="coming-soon-icon">😬</div>
        <h2>Something went wrong</h2>
        <p>Could not load this plant. Try again?</p>
      </div>
    `;
  }
}

function renderDetail(container, plant, user, navigate) {
  const meta = getWateringMeta(plant);
  const days = daysSinceWatered(plant);
  const daysText = days === null ? 'Not tracked yet' : days === 0 ? 'Watered today!' : `${days} day${days !== 1 ? 's' : ''} ago`;

  const lightLabels = {
    low: '🌑 Low light',
    medium: '⛅ Medium light',
    bright: '☀️ Bright indirect',
    direct: '🔆 Direct sun',
  };

  container.innerHTML = `
    <div class="plant-detail" data-id="${plant.id}">
      <div class="detail-top-bar">
        <a href="#/plants" class="btn-back">
          <i class="fas fa-arrow-left"></i>
          <span>Back</span>
        </a>
        <div class="detail-actions">
          <button class="btn btn-secondary btn-sm" id="edit-plant-btn">
            <i class="fas fa-pen"></i>
            <span>Edit</span>
          </button>
          <button class="btn-icon detail-delete-btn" id="delete-plant-btn" title="Delete plant">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>

      <div class="detail-hero">
        <div class="detail-photo-wrap">
          ${plant.photoURL
            ? `<img src="${plant.photoURL}" alt="${plant.name}" class="detail-photo">`
            : `<div class="detail-photo-placeholder">🪴</div>`}
        </div>
        <div class="detail-hero-info">
          <h1 class="detail-name">${plant.name}</h1>
          ${plant.species ? `<p class="detail-species">${plant.species}</p>` : ''}
          <div class="detail-badges">
            ${plant.room ? `
              <span class="detail-badge">
                <i class="fas fa-location-dot"></i> ${plant.room}
              </span>
            ` : ''}
            ${plant.lightNeeds ? `
              <span class="detail-badge">
                ${lightLabels[plant.lightNeeds] || plant.lightNeeds}
              </span>
            ` : ''}
          </div>
        </div>
      </div>

      <div class="detail-grid">
        <div class="detail-card">
          <div class="detail-card-header">
            <h3><i class="fas fa-droplet"></i> Watering</h3>
            <span class="status-pill ${meta.cssClass}">
              <i class="fas ${meta.icon}"></i> ${meta.label}
            </span>
          </div>
          <div class="detail-card-body">
            <div class="watering-info">
              <div class="watering-stat">
                <span class="stat-label">Last watered</span>
                <span class="stat-value">${daysText}</span>
              </div>
              <div class="watering-stat">
                <span class="stat-label">Frequency</span>
                <span class="stat-value">${plant.wateringFrequencyDays ? `Every ${plant.wateringFrequencyDays} days` : 'Not set'}</span>
              </div>
            </div>
            <button class="btn btn-primary water-now-btn" id="water-now-btn">
              <i class="fas fa-droplet"></i>
              Water Now
            </button>
          </div>
        </div>

        <div class="detail-card">
          <div class="detail-card-header">
            <h3><i class="fas fa-book-open"></i> Journal</h3>
          </div>
          <div class="detail-card-body">
            <div class="coming-soon-mini">
              <span>📝</span>
              <p>Journal entries coming soon</p>
            </div>
          </div>
        </div>
      </div>

      ${plant.careNotes ? `
        <div class="detail-card" style="margin-top: var(--space-lg);">
          <div class="detail-card-header">
            <h3><i class="fas fa-sticky-note"></i> Care Notes</h3>
          </div>
          <div class="detail-card-body">
            <p class="care-notes-text">${plant.careNotes}</p>
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Water now
  document.getElementById('water-now-btn').addEventListener('click', async () => {
    try {
      await updatePlant(user.uid, plant.id, { lastWatered: new Date() });
      renderPlantDetail(container, user, plant.id, navigate);
    } catch (err) {
      console.error('Failed to log watering:', err);
    }
  });

  // Edit
  document.getElementById('edit-plant-btn').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('open-plant-modal', { detail: { plant } }));
  });

  // Delete
  document.getElementById('delete-plant-btn').addEventListener('click', async () => {
    if (!confirm(`Are you sure you want to remove ${plant.name}? This can't be undone.`)) return;
    try {
      await deletePlant(user.uid, plant.id);
      navigate('/plants');
    } catch (err) {
      console.error('Failed to delete plant:', err);
    }
  });
}
