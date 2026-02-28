/**
 * Centralized API Service
 * Main export file - maintains backward compatibility
 * Imports from service-specific API files
 */

import { matflowApi } from './matflowApi';
import { mlflowApi } from './mlflowApi';

// Service-key aware admin wrapper so we can reuse the same backend for multiple services
export const serviceAdminApi = {
  // Landing / hero / header / logos
  landing: {
    getHeroImages: async (serviceKey) => mlflowApi.landing.getHeroImages(serviceKey),
    getHeaderSection: async (serviceKey) => mlflowApi.landing.getHeaderSection(serviceKey),
    getSupportLogos: async (serviceKey) => mlflowApi.landing.getSupportLogos(serviceKey),
    createHeroImage: async (formData, serviceKey) => mlflowApi.landing.createHeroImage(formData, serviceKey),
    updateHeroImage: async (id, formData, serviceKey) => mlflowApi.landing.updateHeroImage(id, formData, serviceKey),
    deleteHeroImage: async (id, serviceKey) => mlflowApi.landing.deleteHeroImage(id, serviceKey),
    createSupportLogo: async (formData, serviceKey) => mlflowApi.landing.createSupportLogo(formData, serviceKey),
    updateSupportLogo: async (id, formData, serviceKey) => mlflowApi.landing.updateSupportLogo(id, formData, serviceKey),
    deleteSupportLogo: async (id, serviceKey) => mlflowApi.landing.deleteSupportLogo(id, serviceKey),
    createHeaderSection: async (formData, serviceKey) => mlflowApi.landing.createHeaderSection(formData, serviceKey),
    updateHeaderSection: async (id, formData, serviceKey) => mlflowApi.landing.updateHeaderSection(id, formData, serviceKey),
  },
  // FAQ
  faq: {
    getAll: async (serviceKey) => mlflowApi.faq.getAll(serviceKey),
    create: async (data, serviceKey) => mlflowApi.faq.create(data, serviceKey),
    update: async (id, data, serviceKey) => mlflowApi.faq.update(id, data, serviceKey),
    delete: async (id, serviceKey) => mlflowApi.faq.delete(id, serviceKey),
  },
  // Services list
  services: {
    getAll: async (serviceKey) => mlflowApi.services.getAll(serviceKey),
    create: async (formData, serviceKey) => mlflowApi.services.create(formData, serviceKey),
    update: async (id, formData, serviceKey) => mlflowApi.services.update(id, formData, serviceKey),
    delete: async (id, serviceKey) => mlflowApi.services.delete(id, serviceKey),
  },
};

// Maintain backward compatibility with existing code
export const apiService = {
  matflow: matflowApi,
};

export const commonApi = {
  ...mlflowApi,
  projects: {
    list: async () => {
      const response = await matflowApi.projects.list();
      return response;
    },
    get: async (id) => {
      return await matflowApi.projects.get(id);
    },
    create: async (payload) => {
      const response = await matflowApi.projects.create(payload);
      return response;
    },
    update: async (id, payload) => {
      const response = await matflowApi.projects.update(id, payload);
      return response;
    },
    remove: async (id) => {
      const response = await matflowApi.projects.remove(id);
      return response;
    },
    createSample: async (sampleType) => {
      return await matflowApi.projects.createSample(sampleType);
    },
    seedGuestSample: async (projectId, sampleType) => {
      return await matflowApi.projects.seedGuestSample(projectId, sampleType);
    },
  },
};

// Export individual APIs for convenience
export { matflowApi, mlflowApi };

// Export default for convenience
export default { apiService, commonApi };
