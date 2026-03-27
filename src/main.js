import './style.css';
import { onAuthChange, signInWithGoogle, logOut } from './auth.js';
import { createRouter } from './router.js';
import { renderLanding } from './views/landing.js';
import { renderDashboard } from './views/dashboard.js';

const app = document.getElementById('app');
let currentUser = null;

function renderAppShell(viewName) {
  app.innerHTML = `
    <header class="app-header">
      <a href="#/" class="header-logo">
        <span class="logo-leaf">🌿</span>
        <span class="logo-text">Sill</span>
      </a>
      <nav class="main-nav">
        <a href="#/" class="nav-link ${viewName === 'dashboard' ? 'active' : ''}">
          <i class="fas fa-th-large"></i>
          <span>Dashboard</span>
        </a>
        <a href="#/plants" class="nav-link ${viewName === 'plants' ? 'active' : ''}">
          <i class="fas fa-seedling"></i>
          <span>My Plants</span>
        </a>
        <a href="#/wishlist" class="nav-link ${viewName === 'wishlist' ? 'active' : ''}">
          <i class="fas fa-heart"></i>
          <span>Wishlist</span>
        </a>
      </nav>
      <div class="header-user">
        <div class="user-info">
          <img src="${currentUser.photoURL || ''}" alt="" class="user-avatar"
               onerror="this.style.display='none'">
          <span class="user-name">${currentUser.displayName || 'Plant Parent'}</span>
        </div>
        <button class="btn-icon" id="logout-btn" title="Sign out">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </header>
    <main class="main-content" id="main-content"></main>
  `;

  document.getElementById('logout-btn').addEventListener('click', logOut);

  const main = document.getElementById('main-content');
  switch (viewName) {
    case 'dashboard':
      renderDashboard(main, currentUser);
      break;
    default:
      renderComingSoon(main, viewName);
  }
}

function renderComingSoon(container, viewName) {
  const label = viewName.charAt(0).toUpperCase() + viewName.slice(1);
  container.innerHTML = `
    <div class="coming-soon">
      <div class="coming-soon-icon">🌱</div>
      <h2>Growing soon!</h2>
      <p>${label} is sprouting. Check back soon.</p>
    </div>
  `;
}

function renderView(viewName) {
  if (!currentUser) {
    renderLanding(app, signInWithGoogle);
    return;
  }
  renderAppShell(viewName);
}

// Routes
const routes = {
  '/': () => renderView('dashboard'),
  '/plants': () => renderView('plants'),
  '/wishlist': () => renderView('wishlist'),
};

const router = createRouter(routes);

// Auth drives everything: when auth state changes, re-render
onAuthChange((user) => {
  currentUser = user;
  router.handleRoute();
});
