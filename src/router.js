export class Router {
  constructor(routes, defaultRoute) {
    this.routes = routes;
    this.defaultRoute = defaultRoute;
    this.currentView = null;
    this.appContainer = document.getElementById('app');
    
    window.addEventListener('hashchange', () => this.handleRouteChange());
  }
  
  start() {
    this.handleRouteChange();
  }
  
  navigate(path) {
    window.location.hash = path;
  }
  
  async handleRouteChange() {
    const hash = window.location.hash.slice(1) || this.defaultRoute;
    const [path, paramsStr] = hash.split('?');
    
    const params = new URLSearchParams(paramsStr);
    
    let routeHandler = this.routes[path];
    
    // Dynamic matching like deck/:id
    if (!routeHandler) {
      for (const route in this.routes) {
        if (route.includes(':')) {
          const baseRoute = route.split('/:')[0];
          if (path.startsWith(baseRoute + '/')) {
            routeHandler = this.routes[route];
            params.set('id', path.split('/')[1]);
            break;
          }
        }
      }
    }
    
    if (routeHandler) {
      if (this.currentView && this.currentView.unmount) {
        this.currentView.unmount();
      }
      
      const ViewClass = routeHandler;
      this.currentView = new ViewClass(this.appContainer, params);
      await this.currentView.mount();
    } else {
      console.error('Route not found:', path);
      this.navigate(this.defaultRoute);
    }
  }
}
