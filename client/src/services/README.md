# Service Architecture Documentation

## Overview

The MLflow platform uses a centralized service architecture where each service (Matflow, future services) is self-contained with its own file system, API client, and styling. Services are managed centrally on the landing page and easily extensible.

## Directory Structure

```
client/src/
├── services/
│   ├── api/                   # Centralized API service
│   │   └── apiService.js      # All API calls centralized here
│   ├── config/                # Service configuration
│   │   └── services.js        # Service registry
│   ├── matflow/               # Matflow service
│   │   ├── components/        # Matflow-specific components
│   │   ├── pages/             # Matflow-specific pages
│   │   ├── functions/         # Matflow-specific functions
│   │   ├── styles/            # Service-specific styles
│   │   │   └── matflow.css
│   │   └── config.js          # Service-specific config
│   └── shared/                # Shared components across services
│       ├── components/
│       │   └── ServiceLayout.jsx
│       └── utils/
```

## Adding a New Service

### Step 1: Register the Service

Add your service to `client/src/services/config/services.js`:

```javascript
export const services = {
  // ... existing services
  myNewService: {
    id: 'myNewService',
    name: 'My New Service',
    displayName: 'MY NEW SERVICE',
    route: '/my-new-service',
    apiBase: '/api/my-new-service',
    description: 'Description of my new service',
    logo: '/path/to/logo.svg', // Optional
    color: {
      primary: '#your-color',
      hover: '#your-hover-color',
      bg: '#your-bg-color',
    },
    pages: {
      home: 'MyNewServiceHomePage',
      dashboard: 'MyNewServiceDashboard', // Optional
    },
    components: {
      // Define service-specific components
    },
    enabled: true,
  },
};
```

### Step 2: Create Service Directory Structure

Create the following directories:
```
client/src/services/myNewService/
├── components/
├── pages/
├── functions/
├── styles/
│   └── myNewService.css
└── config.js
```

### Step 3: Add Service-Specific Styles

Create `client/src/services/myNewService/styles/myNewService.css`:

```css
:root {
  --mynewservice-primary: #your-color;
  --mynewservice-hover: #your-hover-color;
  --mynewservice-bg: #your-bg-color;
}

.service-layout[data-service="myNewService"] {
  /* Service-specific styles */
}
```

Import the styles in your service pages or in `client/src/index.css`:

```css
@import './services/myNewService/styles/myNewService.css';
```

### Step 4: Add Service APIs (if needed)

Add service-specific API endpoints to `client/src/services/api/apiService.js`:

```javascript
export const apiService = {
  // ... existing services
  myNewService: {
    operation1: async (data) => {
      const response = await apiFetch(`${API_BASE_URL}/api/my-new-service/operation1/`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return await parseResponse(response);
    },
    // ... more operations
  },
};
```

### Step 5: Create Service Pages

Create your service pages in `client/src/services/myNewService/pages/`:

```javascript
// MyNewServiceHomePage.jsx
import React from 'react';
import { ServiceLayout } from '../../shared/components/ServiceLayout';
import { apiService } from '../../api/apiService';

export const MyNewServiceHomePage = () => {
  return (
    <ServiceLayout>
      <div>
        <h1>My New Service</h1>
        {/* Your content */}
      </div>
    </ServiceLayout>
  );
};
```

### Step 6: Update Routing

Update `client/src/App.jsx` to include your service routes:

```javascript
import { MyNewServiceHomePage } from './services/myNewService/pages/MyNewServiceHomePage';

// In Routes:
<Route path="/my-new-service" element={<MyNewServiceHomePage />} />
```

Or use the service registry for dynamic routing:

```javascript
import { getEnabledServices } from './services/config/services';

// Generate routes dynamically
{getEnabledServices().map(service => (
  <Route 
    key={service.id}
    path={service.route} 
    element={<ServicePage service={service} />} 
  />
))}
```

### Step 7: Update Landing Page (Optional)

The landing page will automatically display your service if it's registered in the service registry and `enabled: true`. The services section reads from the centralized config.

## API Service Usage

### Using the Centralized API Service

Instead of using `fetch` directly, use the centralized API service:

```javascript
import { apiService, commonApi } from '../services/api/apiService';

// For Matflow APIs
const data = await apiService.matflow.dataset.getAllFiles();

// For common APIs (auth, articles, etc.)
const journals = await commonApi.articles.getJournals();
```

### Adding New API Endpoints

1. **Service-specific APIs**: Add to `apiService[serviceId]` in `apiService.js`
2. **Common APIs**: Add to `commonApi` in `apiService.js`

## Service Context

### Using Service Layout

Wrap your service pages with `ServiceLayout` to get service-specific theming:

```javascript
import { ServiceLayout } from '../services/shared/components/ServiceLayout';

export const MyServicePage = () => {
  return (
    <ServiceLayout>
      {/* Your page content */}
    </ServiceLayout>
  );
};
```

### Getting Service Information

```javascript
import { getService, getServiceFromRoute } from '../services/config/services';

// Get service by ID
const service = getService('matflow');

// Get service from current route
const location = useLocation();
const service = getServiceFromRoute(location.pathname);
```

## Best Practices

1. **Keep services isolated**: Each service should be self-contained
2. **Use centralized APIs**: Always use `apiService` or `commonApi` instead of direct `fetch` calls
3. **Service-specific styles**: Use CSS variables for theming
4. **Shared components**: Place shared components in `services/shared/`
5. **Service config**: Keep service-specific configuration in `services/[serviceId]/config.js`

## Migration Guide

### Migrating Existing Components

1. Move service-specific components to `services/[serviceId]/components/`
2. Update imports throughout the codebase
3. Replace `fetch` calls with `apiService` or `commonApi`
4. Wrap service pages with `ServiceLayout`

### Example Migration

**Before:**
```javascript
// In component
const response = await fetch(`${baseUrl}/api/dataset/`);
const data = await response.json();
```

**After:**
```javascript
import { apiService } from '../services/api/apiService';

// In component
const data = await apiService.matflow.dataset.getAllFiles();
```

## Troubleshooting

### Service not appearing on landing page
- Check that `enabled: true` in service config
- Verify service is in `services/config/services.js`
- Check that landing page is reading from service registry

### API calls failing
- Verify endpoint exists in `apiService.js`
- Check that you're using `apiFetch` (handles auth automatically)
- Verify API base URL is correct

### Styling not applying
- Ensure service CSS is imported
- Check that `ServiceLayout` is wrapping your page
- Verify CSS variables are set correctly

