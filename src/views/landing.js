export function renderLanding(container, onSignIn) {
  container.innerHTML = `
    <div class="landing">
      <div class="landing-decor">
        <div class="decor-leaf decor-leaf-1"></div>
        <div class="decor-leaf decor-leaf-2"></div>
        <div class="decor-leaf decor-leaf-3"></div>
        <div class="decor-circle decor-circle-1"></div>
        <div class="decor-circle decor-circle-2"></div>
      </div>

      <div class="landing-content">
        <div class="landing-eyebrow">
          <span class="eyebrow-leaf">🌿</span>
          <span>a better way to care</span>
          <span class="eyebrow-leaf">🌿</span>
        </div>

        <h1 class="landing-title">
          <span class="title-line">Sill</span>
        </h1>

        <p class="landing-subtitle">
          Your plants deserve more than guesswork.
          Track watering, schedule long-term care,
          diagnose problems, and watch your green family thrive.
        </p>

        <button class="btn btn-primary btn-lg landing-cta" id="sign-in-btn">
          <i class="fab fa-google"></i>
          <span>Continue with Google</span>
        </button>

        <div class="landing-features">
          <div class="feature-pill">
            <i class="fas fa-droplet"></i>
            <span>Watering</span>
          </div>
          <div class="feature-pill">
            <i class="fas fa-calendar-check"></i>
            <span>Care schedules</span>
          </div>
          <div class="feature-pill">
            <i class="fas fa-stethoscope"></i>
            <span>Plant doctor</span>
          </div>
          <div class="feature-pill">
            <i class="fas fa-camera-retro"></i>
            <span>Growth journal</span>
          </div>
        </div>
      </div>

      <footer class="landing-footer">
        <p>made with 🌱 for plant parents everywhere</p>
      </footer>
    </div>
  `;

  document.getElementById('sign-in-btn').addEventListener('click', onSignIn);
}
