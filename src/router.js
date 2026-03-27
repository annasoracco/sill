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
    const handler = routes[path] || routes['/'];
    if (handler) handler();
  }

  window.addEventListener('hashchange', handleRoute);

  return { navigate, handleRoute };
}
