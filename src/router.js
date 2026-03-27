export function createRouter(routes) {
  function navigate(path) {
    window.location.hash = path;
  }

  function getRoute() {
    const hash = window.location.hash.slice(1);
    return hash || '/';
  }

  function handleRoute() {
    const path = getRoute();

    // Check for exact match first
    if (routes[path]) {
      routes[path]();
      return;
    }

    // Check for dynamic routes like /plant/:id
    const parts = path.split('/').filter(Boolean);
    if (parts[0] === 'plant' && parts[1]) {
      if (routes['/plant/:id']) {
        routes['/plant/:id'](parts[1]);
      }
      return;
    }

    // Fallback
    const fallback = routes['/'];
    if (fallback) fallback();
  }

  window.addEventListener('hashchange', handleRoute);

  return { navigate, handleRoute };
}
