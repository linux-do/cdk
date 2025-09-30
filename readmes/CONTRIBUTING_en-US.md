# Contribution Guide

[中文版](/CONTRIBUTING.md)

Thank you for your interest in contributing to this project! We welcome all forms of contributions, but please read the following documentation first to save both your time and ours.

When using Vibe-coding tools like Claude Code or Gemini CLI, it is recommended to append the content of this document to your context.

## Changes We Do Not Accept

For reasons including but not limited to project sustainability and maintainability, we do not accept the following types of changes.
If your submitted PR contains changes of the following types, we may, including but not limited to, ignore, close, or request you to modify the PR content.

- Changes that cause an overall performance degradation of the project;
- Small PRs that only modify comments, whitespace, or formatting;
- Corrections of insignificant typos or code comments that do not improve readability or accuracy;
- Refactoring of stable logic without substantial improvements in maintainability or functionality;
- Un-discussed changes to interface or API names;
- A large number of meaningless changes submitted solely for obtaining community badges.

**Please note: The criterion is not the size of the change, but whether the change has a practical impact.**

To improve collaboration efficiency, we recommend that you briefly describe the motivation and background via an Issue before submitting a PR.

## Before Writing Code

1.  Please carefully read the [Contributor License Agreement](/CLA.md). Submitting a PR implies you have read and agreed to this agreement.
2.  Please conceptualize your changes in advance and ensure they are not on the list of **Changes We Do Not Accept**.

## Contribution Steps

1.  **Fork this repository** and create your branch (meaningful branch names are recommended).
2.  **Write code**, ensuring it follows the project's code style and best practices.
3.  **Add/update tests** to ensure your changes do not break existing functionality.
4.  **Test locally** to confirm all tests pass.
5.  **Submit a Pull Request**, providing a detailed description of your changes and their motivation.

## Code Standards

### General

All PRs require at least one Approve from a collaborator with write permissions before being merged.

### Backend

**Basic Checks**

Must pass CodeQL scanning. For longer code segments, adding a Copilot check is recommended.

**API Documentation**

All interfaces must have Swagger documentation. Run `make swagger` to update the documentation before submitting.

**Response Format**

```json
// The outermost layer of the response data has two fields: error_msg and data
{
    "error_msg": "",
    "data": null
}

// For non-list data
{
    "error_msg": "",
    "data": {}
}

// For paginated data
{
    "error_msg": "",
    "data": {
        "total": 0,
        "results": []
    }
}
```

**Database**

- The use of foreign keys is prohibited, but corresponding field indexes must be retained.
- If a field has a default value, it must be the same as the struct's default value (e.g., nil, 0, false, empty string) to avoid data anomalies caused by uninitialized or missing values during initialization.

### Frontend

**Basic Checks**

Code must pass ESLint checks and CodeQL scanning.

**Type Safety**

- The use of the `any` type is prohibited. The `any` type bypasses TypeScript's type checking system and can lead to potential runtime errors.
- `unknown` is the type-safe version of `any`, but it must be immediately type-asserted or narrowed.
- The `never` type represents a value type that should never occur. It must be used cautiously and accompanied by clear explanatory comments.

**Component Standards**

- Components should be categorized by functionality.
- Public components are placed in the `components/common` directory.
- ShadcnUI components are placed in the `components/ui` directory.
- Custom icons should be placed in the `/components/icons/` directory and managed as named exports. For regular icons, we use the Lucide library.

**Service Layer**

The service layer architecture is the unified entry point for frontend-API interaction, based on the following principles:

1. Separation of Concerns - Each service is responsible for a specific business domain.
2. Unified Entry Point - All services are exported via a `services` object.
3. Type Safety - All requests and responses have clear type definitions.

**How to Create a New Interface Service**

1. **Create the directory structure**

   ```text
   /services/NewServiceName/
     - types.ts       // Type definitions
     - ServiceName.service.ts  // Service implementation
     - index.ts       // Service export
   ```

   

2. **Implement the service class**

   ```typescript
   // NewServiceName/ServiceName.service.ts
   import { BaseService } from '../core/base.service';
   
   export class NewServiceClass extends BaseService {
     protected static readonly basePath = '/api/v1/path';
   
     static async methodName(parameters): Promise<ReturnType> {
       return this.get<ReturnType>('/endpoint');
     }
   }
   ```

   

3. **Register in services/index.ts**

```typescript
   import { NewServiceClass } from './NewServiceName';
   
   const services = {
     auth: AuthService,
     newServiceName: NewServiceClass
   };
```

**Usage**

```typescript
import services from '@/lib/services';

// Call the service method
const result = await services.newServiceName.methodName(parameters);
```