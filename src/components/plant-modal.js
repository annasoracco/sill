import { addPlant, updatePlant, uploadPlantPhoto } from '../data/plants.js';

const COMMON_ROOMS = [
  'Living Room',
  'Bedroom',
  'Kitchen',
  'Bathroom',
  'Office',
  'Balcony',
  'Patio',
  'Hallway',
  'Dining Room',
  'Windowsill',
];

export function initPlantModal(userId, onSaved) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'plant-modal-overlay';
  overlay.innerHTML = `
    <div class="modal" id="plant-modal">
      <div class="modal-header">
        <h2 id="modal-title">Add New Plant</h2>
        <button class="btn-icon modal-close" id="modal-close">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <form id="plant-form" class="modal-form">
        <div class="form-group">
          <label for="plant-name">Name <span class="required">*</span></label>
          <input type="text" id="plant-name" placeholder="e.g. Monty the Monstera" required>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="plant-species">Species / Type</label>
            <input type="text" id="plant-species" placeholder="e.g. Monstera deliciosa">
          </div>
          <div class="form-group">
            <label for="plant-light">Light needs</label>
            <select id="plant-light">
              <option value="">Select...</option>
              <option value="low">🌑 Low light</option>
              <option value="medium">⛅ Medium light</option>
              <option value="bright">☀️ Bright indirect</option>
              <option value="direct">🔆 Direct sun</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="plant-room">Room / Location</label>
          <div class="room-selector">
            <div class="room-chips" id="room-chips">
              ${COMMON_ROOMS.map((r) => `
                <button type="button" class="room-chip" data-room="${r}">${r}</button>
              `).join('')}
            </div>
            <input type="text" id="plant-room" placeholder="Or type a custom location...">
          </div>
        </div>

        <div class="form-group">
          <label for="plant-watering">Watering frequency</label>
          <div class="watering-input">
            <span>Every</span>
            <input type="number" id="plant-watering" min="1" max="90" placeholder="7" class="input-sm">
            <span>days</span>
          </div>
        </div>

        <div class="form-group">
          <label>Photo</label>
          <div class="photo-upload" id="photo-upload">
            <div class="photo-upload-area" id="photo-upload-area">
              <i class="fas fa-camera"></i>
              <span>Click or drag to add a photo</span>
            </div>
            <img id="photo-preview" class="photo-preview" style="display: none;">
            <input type="file" id="plant-photo" accept="image/*" hidden>
          </div>
        </div>

        <div class="form-group">
          <label for="plant-notes">Care notes</label>
          <textarea id="plant-notes" rows="3" placeholder="Any special care instructions, observations..."></textarea>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="modal-cancel">Cancel</button>
          <button type="submit" class="btn btn-primary" id="modal-submit">
            <i class="fas fa-plus"></i>
            <span>Add Plant</span>
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  let editingPlant = null;
  let selectedFile = null;

  const form = document.getElementById('plant-form');
  const fileInput = document.getElementById('plant-photo');
  const uploadArea = document.getElementById('photo-upload-area');
  const preview = document.getElementById('photo-preview');

  // Room chip selection
  document.getElementById('room-chips').addEventListener('click', (e) => {
    const chip = e.target.closest('.room-chip');
    if (!chip) return;

    document.querySelectorAll('.room-chip').forEach((c) => c.classList.remove('selected'));
    chip.classList.add('selected');
    document.getElementById('plant-room').value = chip.dataset.room;
  });

  // Photo upload
  uploadArea.addEventListener('click', () => fileInput.click());
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });
  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) handleFile(fileInput.files[0]);
  });

  function handleFile(file) {
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.style.display = 'block';
      uploadArea.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  // Open modal
  function openModal(plant = null) {
    editingPlant = plant;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    if (plant) {
      document.getElementById('modal-title').textContent = 'Edit Plant';
      document.getElementById('modal-submit').innerHTML = '<i class="fas fa-check"></i> Save Changes';
      document.getElementById('plant-name').value = plant.name || '';
      document.getElementById('plant-species').value = plant.species || '';
      document.getElementById('plant-light').value = plant.lightNeeds || '';
      document.getElementById('plant-room').value = plant.room || '';
      document.getElementById('plant-watering').value = plant.wateringFrequencyDays || '';
      document.getElementById('plant-notes').value = plant.careNotes || '';

      if (plant.room) {
        document.querySelectorAll('.room-chip').forEach((c) => {
          c.classList.toggle('selected', c.dataset.room === plant.room);
        });
      }
      if (plant.photoURL) {
        preview.src = plant.photoURL;
        preview.style.display = 'block';
        uploadArea.style.display = 'none';
      }
    } else {
      document.getElementById('modal-title').textContent = 'Add New Plant';
      document.getElementById('modal-submit').innerHTML = '<i class="fas fa-plus"></i> Add Plant';
      form.reset();
      document.querySelectorAll('.room-chip').forEach((c) => c.classList.remove('selected'));
      preview.style.display = 'none';
      uploadArea.style.display = '';
      selectedFile = null;
    }

    setTimeout(() => document.getElementById('plant-name').focus(), 100);
  }

  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    editingPlant = null;
    selectedFile = null;
  }

  // Close handlers
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
  });

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('modal-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
      const data = {
        name: document.getElementById('plant-name').value.trim(),
        species: document.getElementById('plant-species').value.trim(),
        lightNeeds: document.getElementById('plant-light').value,
        room: document.getElementById('plant-room').value.trim(),
        wateringFrequencyDays: parseInt(document.getElementById('plant-watering').value) || null,
        careNotes: document.getElementById('plant-notes').value.trim(),
      };

      if (editingPlant) {
        if (selectedFile) {
          data.photoURL = await uploadPlantPhoto(userId, editingPlant.id, selectedFile);
        }
        await updatePlant(userId, editingPlant.id, data);
      } else {
        data.lastWatered = null;
        data.photoURL = null;
        const newId = await addPlant(userId, data);
        if (selectedFile) {
          const photoURL = await uploadPlantPhoto(userId, newId, selectedFile);
          await updatePlant(userId, newId, { photoURL });
        }
      }

      closeModal();
      onSaved();
    } catch (err) {
      console.error('Failed to save plant:', err);
      alert('Something went wrong saving your plant. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = editingPlant
        ? '<i class="fas fa-check"></i> Save Changes'
        : '<i class="fas fa-plus"></i> Add Plant';
    }
  });

  // Listen for open events
  window.addEventListener('open-plant-modal', (e) => {
    openModal(e.detail?.plant || null);
  });

  return { openModal, closeModal };
}
