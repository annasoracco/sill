import { getWishlistItems, addWishlistItem, deleteWishlistItem } from '../data/wishlist.js';

export async function renderWishlist(container, user) {
  container.innerHTML = `
    <div class="wishlist-view">
      <div class="plants-header">
        <div>
          <h2 class="plants-title">Wishlist</h2>
          <p class="plants-subtitle text-muted">Plants you're dreaming about</p>
        </div>
        <button class="btn btn-primary" id="add-wish-btn">
          <i class="fas fa-plus"></i>
          <span>Add to Wishlist</span>
        </button>
      </div>
      <div id="wishlist-body">
        <div class="loading-state">
          <div class="loading-spinner"></div>
        </div>
      </div>
    </div>

    <div class="modal-overlay" id="wish-modal-overlay">
      <div class="modal" style="max-width: 460px;">
        <div class="modal-header">
          <h2 id="wish-modal-title">Add to Wishlist</h2>
          <button class="btn-icon modal-close" id="wish-modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form class="modal-form" id="wish-form">
          <div class="form-group">
            <label for="wish-name">Plant name <span class="required">*</span></label>
            <input type="text" id="wish-name" placeholder="e.g. String of Pearls" required>
          </div>
          <div class="form-group">
            <label for="wish-species">Species</label>
            <input type="text" id="wish-species" placeholder="e.g. Senecio rowleyanus">
          </div>
          <div class="form-group">
            <label for="wish-notes">Notes</label>
            <textarea id="wish-notes" rows="2" placeholder="Where to find it, price notes, etc."></textarea>
          </div>
          <div class="form-group">
            <label for="wish-priority">Priority</label>
            <select id="wish-priority">
              <option value="low">🌱 Would be nice</option>
              <option value="medium" selected>🌿 Want it</option>
              <option value="high">🌳 Need it!</option>
            </select>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="wish-cancel">Cancel</button>
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-heart"></i> Add
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const overlay = document.getElementById('wish-modal-overlay');
  const form = document.getElementById('wish-form');

  function openModal() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    form.reset();
    setTimeout(() => document.getElementById('wish-name').focus(), 100);
  }

  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('add-wish-btn').addEventListener('click', openModal);
  document.getElementById('wish-modal-close').addEventListener('click', closeModal);
  document.getElementById('wish-cancel').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await addWishlistItem(user.uid, {
        name: document.getElementById('wish-name').value.trim(),
        species: document.getElementById('wish-species').value.trim(),
        notes: document.getElementById('wish-notes').value.trim(),
        priority: document.getElementById('wish-priority').value,
      });
      closeModal();
      loadWishlist(user);
    } catch (err) {
      console.error('Failed to add wishlist item:', err);
    }
  });

  loadWishlist(user);
}

async function loadWishlist(user) {
  const body = document.getElementById('wishlist-body');
  try {
    const items = await getWishlistItems(user.uid);
    if (items.length === 0) {
      body.innerHTML = `
        <div class="empty-state">
          <div class="coming-soon-icon">💭</div>
          <h3 class="empty-state-title">No plants on your wishlist yet</h3>
          <p class="empty-state-text">
            Start dreaming! Add plants you want to bring home someday.
          </p>
        </div>
      `;
      return;
    }

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    items.sort((a, b) => (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1));

    body.innerHTML = `
      <div class="wishlist-grid">
        ${items.map((item) => renderWishCard(item)).join('')}
      </div>
    `;

    body.querySelectorAll('.wish-remove-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('Remove from wishlist?')) return;
        try {
          await deleteWishlistItem(user.uid, btn.dataset.id);
          loadWishlist(user);
        } catch (err) {
          console.error('Failed to remove:', err);
        }
      });
    });
  } catch (err) {
    console.error('Failed to load wishlist:', err);
    body.innerHTML = '<p class="text-muted">Could not load wishlist.</p>';
  }
}

function renderWishCard(item) {
  const priorityIcons = {
    high: { emoji: '🌳', label: 'Need it!' },
    medium: { emoji: '🌿', label: 'Want it' },
    low: { emoji: '🌱', label: 'Would be nice' },
  };
  const p = priorityIcons[item.priority] || priorityIcons.medium;

  return `
    <div class="wish-card">
      <div class="wish-card-top">
        <div>
          <h3 class="wish-name">${item.name}</h3>
          ${item.species ? `<p class="wish-species">${item.species}</p>` : ''}
        </div>
        <button class="btn-icon wish-remove-btn" data-id="${item.id}" title="Remove">
          <i class="fas fa-times"></i>
        </button>
      </div>
      ${item.notes ? `<p class="wish-notes">${item.notes}</p>` : ''}
      <div class="wish-priority">
        <span>${p.emoji}</span>
        <span class="wish-priority-label">${p.label}</span>
      </div>
    </div>
  `;
}
