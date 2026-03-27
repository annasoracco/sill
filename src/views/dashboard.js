export function renderDashboard(container, user) {
  const greeting = getGreeting();
  const firstName = user.displayName?.split(' ')[0] || 'friend';

  container.innerHTML = `
    <div class="dashboard">
      <div class="dashboard-header">
        <h2 class="dashboard-greeting">${greeting}, ${firstName} 🌱</h2>
        <p class="dashboard-date">${formatDate(new Date())}</p>
      </div>

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
        <button class="btn btn-primary" id="add-first-plant-btn">
          <i class="fas fa-plus"></i>
          <span>Add Your First Plant</span>
        </button>
      </div>
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
