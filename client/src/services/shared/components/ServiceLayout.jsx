/**
 * ServiceLayout Component
 * Provides service-specific layout and theming context
 * Wraps service pages with service-specific styling and configuration
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import { getService, getServiceFromRoute } from '../../config/services';

/**
 * ServiceLayout - Wraps service pages with service context
 * @param {React.ReactNode} children - The service page content
 * @param {string} serviceId - Optional service ID, will be detected from route if not provided
 */
export const ServiceLayout = ({ children, serviceId = null }) => {
  const location = useLocation();
  const service = serviceId 
    ? getService(serviceId) 
    : getServiceFromRoute(location.pathname);

  // Apply service-specific CSS variables if service is found
  React.useEffect(() => {
    if (service) {
      const root = document.documentElement;
      root.style.setProperty('--service-primary', service.color.primary);
      root.style.setProperty('--service-hover', service.color.hover);
      root.style.setProperty('--service-bg', service.color.bg);
    }

    return () => {
      // Cleanup on unmount
      const root = document.documentElement;
      root.style.removeProperty('--service-primary');
      root.style.removeProperty('--service-hover');
      root.style.removeProperty('--service-bg');
    };
  }, [service]);

  return (
    <div className="service-layout" data-service={service?.id || 'default'}>
      {children}
    </div>
  );
};

export default ServiceLayout;

