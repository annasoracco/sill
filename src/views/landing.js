export function renderLanding(container, onSignIn) {
  container.innerHTML = `
    <div class="landing">
      <div class="landing-content">
        <h1 class="landing-title">S<span class="landing-sparkle">i</span>ll</h1>
        <p class="landing-subtitle">Plant care, simplified.</p>

        <button class="landing-cta" id="sign-in-btn">
          <i class="fab fa-google"></i>
          Sign in with Google
        </button>

        <div class="landing-details">
          <span>Track watering</span>
          <span class="landing-dot"></span>
          <span>AI diagnostics</span>
          <span class="landing-dot"></span>
          <span>Care journal</span>
        </div>
      </div>
    </div>
  `;

  document.getElementById('sign-in-btn').addEventListener('click', onSignIn);
}
