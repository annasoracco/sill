import { getPlant, updatePlant, deletePlant, getWateringMeta, daysSinceWatered } from '../data/plants.js';
import {
  getCareSchedules,
  addCareSchedule,
  markCareDone,
  deleteCareSchedule,
  getCareStatus,
  formatDueDate,
  CARE_TYPES,
} from '../data/care.js';
import {
  getJournalEntries,
  addJournalEntry,
  deleteJournalEntry,
  uploadJournalPhoto,
  formatEntryDate,
  ENTRY_TYPES,
} from '../data/journal.js';

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
          <div class="detail-badges" style="margin-top: var(--space-xs);">
            <span class="detail-badge">
              <i class="fas fa-calendar"></i> Acquired: ${plant.dateAcquired || 'Unknown'}
            </span>
            <span class="detail-badge">
              <i class="fas fa-store"></i> From: ${plant.locationAcquired || 'Unknown'}
            </span>
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
            <h3><i class="fas fa-calendar-check"></i> Care Schedule</h3>
            <button class="btn-icon" id="add-care-btn" title="Add care task">
              <i class="fas fa-plus"></i>
            </button>
          </div>
          <div class="detail-card-body" id="care-schedule-body">
            <div class="loading-state" style="padding: var(--space-md);">
              <div class="loading-spinner"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-card" style="margin-top: var(--space-lg);">
        <div class="detail-card-header">
          <h3><i class="fas fa-book-open"></i> Growth Journal</h3>
          <button class="btn-icon" id="add-journal-btn" title="Add entry">
            <i class="fas fa-plus"></i>
          </button>
        </div>
        <div class="detail-card-body" id="journal-body">
          <div class="loading-state" style="padding: var(--space-md);">
            <div class="loading-spinner"></div>
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

    <div class="modal-overlay" id="care-modal-overlay">
      <div class="modal" style="max-width: 420px;">
        <div class="modal-header">
          <h2>Add Care Task</h2>
          <button class="btn-icon modal-close" id="care-modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-form" id="care-type-picker">
          ${Object.entries(CARE_TYPES).map(([key, type]) => `
            <button class="care-type-option" data-type="${key}">
              <span class="care-type-icon" style="color: ${type.color}">
                <i class="fas ${type.icon}"></i>
              </span>
              <div class="care-type-info">
                <span class="care-type-label">${type.label}</span>
                <span class="care-type-desc">${type.description}</span>
              </div>
              <span class="care-type-freq">${type.defaultFrequency < 30 ? `~${type.defaultFrequency}d` : type.defaultFrequency < 365 ? `~${Math.round(type.defaultFrequency / 30)}mo` : '~1yr'}</span>
            </button>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="modal-overlay" id="journal-modal-overlay">
      <div class="modal" style="max-width: 480px;">
        <div class="modal-header">
          <h2>Add Journal Entry</h2>
          <button class="btn-icon modal-close" id="journal-modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form class="modal-form" id="journal-form">
          <div class="form-group">
            <label>Type</label>
            <div class="room-chips" id="entry-type-chips">
              ${Object.entries(ENTRY_TYPES).map(([key, t]) => `
                <button type="button" class="room-chip ${key === 'observation' ? 'selected' : ''}" data-type="${key}">
                  <i class="fas ${t.icon}" style="color: ${t.color}"></i> ${t.label}
                </button>
              `).join('')}
            </div>
            <input type="hidden" id="journal-type" value="observation">
          </div>
          <div class="form-group">
            <label for="journal-note">Note <span class="required">*</span></label>
            <textarea id="journal-note" rows="3" placeholder="What's happening with your plant?" required></textarea>
          </div>
          <div class="form-group">
            <label>Photo (optional)</label>
            <div class="photo-upload">
              <div class="photo-upload-area" id="journal-upload-area">
                <i class="fas fa-camera"></i>
                <span>Add a photo</span>
              </div>
              <img id="journal-photo-preview" class="photo-preview" style="display: none;">
              <input type="file" id="journal-photo" accept="image/*" hidden>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="journal-cancel">Cancel</button>
            <button type="submit" class="btn btn-primary" id="journal-submit">
              <i class="fas fa-plus"></i> Add Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Load care schedules and journal
  loadCareSchedules(user.uid, plant, navigate, container);
  loadJournal(user.uid, plant);

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

  // Care modal
  const careOverlay = document.getElementById('care-modal-overlay');
  document.getElementById('add-care-btn').addEventListener('click', () => {
    careOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
  document.getElementById('care-modal-close').addEventListener('click', () => {
    careOverlay.classList.remove('open');
    document.body.style.overflow = '';
  });
  careOverlay.addEventListener('click', (e) => {
    if (e.target === careOverlay) {
      careOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  // Care type selection
  document.getElementById('care-type-picker').addEventListener('click', async (e) => {
    const option = e.target.closest('.care-type-option');
    if (!option) return;

    const type = option.dataset.type;
    const careType = CARE_TYPES[type];
    const now = new Date();
    const nextDue = new Date(now);
    nextDue.setDate(nextDue.getDate() + careType.defaultFrequency);

    try {
      await addCareSchedule(user.uid, plant.id, {
        type,
        frequencyDays: careType.defaultFrequency,
        lastDone: null,
        nextDue,
      });
      careOverlay.classList.remove('open');
      document.body.style.overflow = '';
      loadCareSchedules(user.uid, plant, navigate, container);
    } catch (err) {
      console.error('Failed to add care schedule:', err);
    }
  });

  // Journal modal
  const journalOverlay = document.getElementById('journal-modal-overlay');
  const journalForm = document.getElementById('journal-form');
  const journalFileInput = document.getElementById('journal-photo');
  const journalUploadArea = document.getElementById('journal-upload-area');
  const journalPreview = document.getElementById('journal-photo-preview');
  let journalFile = null;

  document.getElementById('add-journal-btn').addEventListener('click', () => {
    journalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    journalForm.reset();
    journalFile = null;
    journalPreview.style.display = 'none';
    journalUploadArea.style.display = '';
    document.getElementById('journal-type').value = 'observation';
    document.querySelectorAll('#entry-type-chips .room-chip').forEach((c) => {
      c.classList.toggle('selected', c.dataset.type === 'observation');
    });
    setTimeout(() => document.getElementById('journal-note').focus(), 100);
  });

  document.getElementById('journal-modal-close').addEventListener('click', () => {
    journalOverlay.classList.remove('open');
    document.body.style.overflow = '';
  });
  document.getElementById('journal-cancel').addEventListener('click', () => {
    journalOverlay.classList.remove('open');
    document.body.style.overflow = '';
  });
  journalOverlay.addEventListener('click', (e) => {
    if (e.target === journalOverlay) {
      journalOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  // Entry type chips
  document.getElementById('entry-type-chips').addEventListener('click', (e) => {
    const chip = e.target.closest('.room-chip');
    if (!chip) return;
    document.querySelectorAll('#entry-type-chips .room-chip').forEach((c) => c.classList.remove('selected'));
    chip.classList.add('selected');
    document.getElementById('journal-type').value = chip.dataset.type;
  });

  // Photo upload for journal
  journalUploadArea.addEventListener('click', () => journalFileInput.click());
  journalFileInput.addEventListener('change', () => {
    if (journalFileInput.files.length) {
      journalFile = journalFileInput.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        journalPreview.src = ev.target.result;
        journalPreview.style.display = 'block';
        journalUploadArea.style.display = 'none';
      };
      reader.readAsDataURL(journalFile);
    }
  });

  // Journal submit
  journalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('journal-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
      let photoURL = null;
      if (journalFile) {
        photoURL = await uploadJournalPhoto(user.uid, plant.id, journalFile);
      }
      await addJournalEntry(user.uid, plant.id, {
        type: document.getElementById('journal-type').value,
        note: document.getElementById('journal-note').value.trim(),
        photoURL,
        date: new Date(),
      });
      journalOverlay.classList.remove('open');
      document.body.style.overflow = '';
      loadJournal(user.uid, plant);
    } catch (err) {
      console.error('Failed to add journal entry:', err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Entry';
    }
  });
}

async function loadCareSchedules(userId, plant, navigate, container) {
  const body = document.getElementById('care-schedule-body');
  try {
    const schedules = await getCareSchedules(userId, plant.id);
    if (schedules.length === 0) {
      body.innerHTML = `
        <div class="care-empty">
          <p>No care tasks scheduled yet.</p>
          <p class="text-muted" style="font-size: 0.8125rem;">Add fertilizing, repotting, or rotation reminders.</p>
        </div>
      `;
      return;
    }

    body.innerHTML = `
      <div class="care-list">
        ${schedules.map((s) => {
          const type = CARE_TYPES[s.type] || { label: s.type, icon: 'fa-circle', color: 'var(--sage)' };
          const status = getCareStatus(s);
          const dueText = formatDueDate(s);

          return `
            <div class="care-item care-${status}" data-id="${s.id}">
              <span class="care-item-icon" style="color: ${type.color}">
                <i class="fas ${type.icon}"></i>
              </span>
              <div class="care-item-info">
                <span class="care-item-label">${type.label}</span>
                <span class="care-item-due">${dueText}</span>
              </div>
              <div class="care-item-actions">
                <button class="btn btn-secondary btn-sm care-done-btn" data-id="${s.id}" data-freq="${s.frequencyDays}">
                  <i class="fas fa-check"></i> Done
                </button>
                <button class="btn-icon care-remove-btn" data-id="${s.id}" title="Remove">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Done buttons
    body.querySelectorAll('.care-done-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await markCareDone(userId, plant.id, btn.dataset.id, parseInt(btn.dataset.freq));
          loadCareSchedules(userId, plant, navigate, container);
        } catch (err) {
          console.error('Failed to mark care done:', err);
        }
      });
    });

    // Remove buttons
    body.querySelectorAll('.care-remove-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await deleteCareSchedule(userId, plant.id, btn.dataset.id);
          loadCareSchedules(userId, plant, navigate, container);
        } catch (err) {
          console.error('Failed to remove schedule:', err);
        }
      });
    });
  } catch (err) {
    console.error('Failed to load care schedules:', err);
    body.innerHTML = '<p class="text-muted">Could not load care schedules.</p>';
  }
}

async function loadJournal(userId, plant) {
  const body = document.getElementById('journal-body');
  try {
    const entries = await getJournalEntries(userId, plant.id);
    if (entries.length === 0) {
      body.innerHTML = `
        <div class="care-empty">
          <p>No journal entries yet.</p>
          <p class="text-muted" style="font-size: 0.8125rem;">Record observations, milestones, and care moments.</p>
        </div>
      `;
      return;
    }

    body.innerHTML = `
      <div class="journal-timeline">
        ${entries.map((entry) => {
          const type = ENTRY_TYPES[entry.type] || ENTRY_TYPES.observation;
          return `
            <div class="journal-entry">
              <div class="journal-entry-marker" style="color: ${type.color}">
                <i class="fas ${type.icon}"></i>
              </div>
              <div class="journal-entry-content">
                <div class="journal-entry-header">
                  <span class="journal-entry-type">${type.label}</span>
                  <span class="journal-entry-date">${formatEntryDate(entry.date)}</span>
                </div>
                <p class="journal-entry-note">${entry.note}</p>
                ${entry.photoURL ? `
                  <img src="${entry.photoURL}" class="journal-entry-photo" alt="Journal photo">
                ` : ''}
              </div>
              <button class="btn-icon journal-delete-btn" data-id="${entry.id}" title="Delete">
                <i class="fas fa-times"></i>
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;

    body.querySelectorAll('.journal-delete-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this journal entry?')) return;
        try {
          await deleteJournalEntry(userId, plant.id, btn.dataset.id);
          loadJournal(userId, plant);
        } catch (err) {
          console.error('Failed to delete journal entry:', err);
        }
      });
    });
  } catch (err) {
    console.error('Failed to load journal:', err);
    body.innerHTML = '<p class="text-muted">Could not load journal.</p>';
  }
}
