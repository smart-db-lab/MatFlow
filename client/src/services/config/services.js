/**
 * Service Registry Configuration
 * Centralized configuration for all services in MLflow platform
 * Add new services here to make them available on the landing page
 */

export const services = {
  matflow: {
    id: 'matflow',
    name: 'Matflow',
    displayName: 'MATFLOW',
    route: '/matflow',
    apiBase: '/api',
    description: 'No-code machine learning platform with visual workflows and automated ML pipelines.',
    logo: null, // Can be set to logo path if available
    color: {
      primary: '#00ba7c',
      hover: '#00a86c',
      bg: '#064f32',
    },
    pages: {
      home: 'HomePage',
      dashboard: 'Dashboard',
      editor: 'EditorPage',
    },
    components: {
      dashboardTop: 'DashBoardTop',
      dashboardLeft: 'DashBoardLeft',
      dashboardRight: 'DashBoardRight',
    },
    enabled: true,
  },
  // Future services can be added here:
  // service2: {
  //   id: 'service2',
  //   name: 'Service 2',
  //   displayName: 'SERVICE2',
  //   route: '/service2',
  //   apiBase: '/api/service2',
  //   description: 'Description of service 2',
  //   color: {
  //     primary: '#color',
  //     hover: '#color',
  //     bg: '#color',
  //   },
  //   pages: {
  //     home: 'Service2HomePage',
  //   },
  //   enabled: true,
  // },
};

/**
 * Get service by ID
 */
export const getService = (serviceId) => {
  return services[serviceId] || null;
};

/**
 * Get service by route
 */
export const getServiceByRoute = (route) => {
  return Object.values(services).find(service => service.route === route) || null;
};

/**
 * Get all enabled services
 */
export const getEnabledServices = () => {
  return Object.values(services).filter(service => service.enabled);
};

/**
 * Check if a route belongs to a service
 */
export const isServiceRoute = (route) => {
  return Object.values(services).some(service => route.startsWith(service.route));
};

/**
 * Get service context from current route
 */
export const getServiceFromRoute = (pathname) => {
  // Check exact matches first
  for (const service of Object.values(services)) {
    if (pathname === service.route || pathname.startsWith(service.route + '/')) {
      return service;
    }
  }
  return null;
};

export default services;

