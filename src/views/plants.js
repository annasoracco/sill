import { getPlants, getWateringMeta, daysSinceWatered } from '../data/plants.js';

export async function renderPlants(container, user, navigate) {
  container.innerHTML = `
    <div class="plants-view">
      <div class="plants-header">
        <div>
          <h2 class="plants-title">My Plants</h2>
          <p class="plants-subtitle text-muted">Your green family, all in one place</p>
        </div>
        <button class="btn btn-primary" id="add-plant-btn">
          <i class="fas fa-plus"></i>
          <span>Add Plant</span>
        </button>
      </div>

      <div class="plants-filters" id="plants-filters">
        <button class="filter-chip active" data-filter="all">All</button>
      </div>

      <div id="plants-grid" class="plants-grid">
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading your plants...</p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('add-plant-btn').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('open-plant-modal'));
  });

  try {
    const plants = await getPlants(user.uid);
    renderPlantGrid(plants, navigate);
    renderFilterChips(plants);
  } catch (err) {
    console.error('Failed to load plants:', err);
    document.getElementById('plants-grid').innerHTML = `
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
        </p>
        <button class="btn btn-primary" onclick="window.dispatchEvent(new CustomEvent('open-plant-modal'))">
          <i class="fas fa-plus"></i>
          <span>Add Your First Plant</span>
        </button>
      </div>
    `;
  }
}

function renderPlantGrid(plants, navigate) {
  const grid = document.getElementById('plants-grid');

  if (plants.length === 0) {
    grid.innerHTML = `
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
        </p>
        <button class="btn btn-primary" onclick="window.dispatchEvent(new CustomEvent('open-plant-modal'))">
          <i class="fas fa-plus"></i>
          <span>Add Your First Plant</span>
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = plants.map((plant) => renderPlantCard(plant)).join('');

  grid.querySelectorAll('.plant-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      navigate(`/plant/${id}`);
    });
  });
}

function renderPlantCard(plant) {
  const meta = getWateringMeta(plant);
  const days = daysSinceWatered(plant);
  const daysText = days === null ? 'Not tracked' : days === 0 ? 'Today' : `${days}d ago`;

  const photoHtml = plant.photoURL
    ? `<img src="${plant.photoURL}" alt="${plant.name}" class="card-photo">`
    : `<div class="card-photo-placeholder">
        <span class="placeholder-emoji">${getPlantEmoji(plant.species)}</span>
       </div>`;

  return `
    <div class="plant-card" data-id="${plant.id}" data-room="${plant.room || 'none'}">
      <div class="card-photo-wrap">
        ${photoHtml}
        <div class="card-status-badge ${meta.cssClass}">
          <i class="fas ${meta.icon}"></i>
        </div>
      </div>
      <div class="card-body">
        <h3 class="card-name">${plant.name}</h3>
        ${plant.species ? `<p class="card-species">${plant.species}</p>` : ''}
        <div class="card-meta">
          ${plant.room ? `
            <span class="card-room">
              <i class="fas fa-location-dot"></i>
              ${plant.room}
            </span>
          ` : ''}
          <span class="card-watered ${meta.cssClass}">
            <i class="fas fa-droplet"></i>
            ${daysText}
          </span>
        </div>
      </div>
    </div>
  `;
}

function renderFilterChips(plants) {
  const filtersEl = document.getElementById('plants-filters');
  const rooms = [...new Set(plants.map((p) => p.room).filter(Boolean))];

  if (rooms.length === 0) {
    filtersEl.style.display = 'none';
    return;
  }

  filtersEl.innerHTML = `
    <button class="filter-chip active" data-filter="all">All (${plants.length})</button>
    ${rooms.map((room) => {
      const count = plants.filter((p) => p.room === room).length;
      return `<button class="filter-chip" data-filter="${room}">${room} (${count})</button>`;
    }).join('')}
  `;

  filtersEl.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;

    filtersEl.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');

    const filter = chip.dataset.filter;
    document.querySelectorAll('.plant-card').forEach((card) => {
      card.style.display = (filter === 'all' || card.dataset.room === filter) ? '' : 'none';
    });
  });
}

function getPlantEmoji(species) {
  if (!species) return '🌱';
  const s = species.toLowerCase();
  if (s.includes('cactus') || s.includes('succulent')) return '🌵';
  if (s.includes('fern')) return '🌿';
  if (s.includes('palm')) return '🌴';
  if (s.includes('flower') || s.includes('orchid') || s.includes('rose')) return '🌸';
  if (s.includes('herb') || s.includes('basil') || s.includes('mint')) return '🌿';
  if (s.includes('tree') || s.includes('fig') || s.includes('olive')) return '🌳';
  if (s.includes('vine') || s.includes('pothos') || s.includes('ivy')) return '🍃';
  if (s.includes('monstera') || s.includes('philodendron')) return '🪴';
  return '🪴';
}
