# Image Generation Tool - Claude Development Guide

This project is an image generation tool built with Bun, React, TypeScript, and Google's Gemini AI.

## Project Overview

**Purpose**: A comprehensive image generation tool that provides text-to-image generation, image editing, multi-image composition, and iterative refinement using Google's Gemini 2.5-flash-image-preview model.

**Tech Stack**:
- **Runtime**: Bun (preferred over Node.js)
- **Backend**: Bun.serve() with TypeScript
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **AI Model**: Google Gemini 2.5-flash-image-preview
- **Testing**: Playwright

## Project Structure

```
image-gemini/
├── backend/
│   └── server.ts              # API server with Gemini integration
├── frontend/
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── ImageGenerator.tsx
│   │   ├── ImageEditor.tsx
│   │   ├── MultiImageComposer.tsx
│   │   └── IterativeRefinement.tsx
│   ├── lib/
│   │   └── utils.ts          # Utility functions
│   ├── App.tsx               # Main application
│   ├── index.tsx             # Frontend server
│   ├── index.html            # HTML entry point
│   └── index.css             # Global styles
├── tests/                    # Playwright tests
├── package.json
├── tsconfig.json
└── CLAUDE.md                 # This file
```

## Development Commands

### Bun-First Approach
- Use `bun <file>` instead of `node <file>`
- Use `bun run <script>` instead of `npm run <script>`
- Use `bun install` instead of `npm install`
- Use `bun test` for testing

### Available Scripts
```bash
# Development
bun run dev     # Start frontend server (port 3000)
bun run server  # Start backend server (port 3001)

# Production
bun run start   # Start frontend in production mode
bun run build   # Build the project

# Testing
bun test        # Run Playwright tests
bun test:ui     # Run tests with UI
bun test:headed # Run tests in headed mode
```

## Environment Setup

### Required Environment Variables
```bash
GOOGLE_AI_API_KEY=your-google-ai-api-key-here
```

**Important**: The API key variable is `GOOGLE_AI_API_KEY` (not `GOOGLE_API_KEY`).

## API Endpoints

### Backend (Port 3001)

1. **Text-to-Image Generation**
   - `POST /api/text-to-image`
   - Body: `{ "prompt": "your text description" }`

2. **Image Editing**
   - `POST /api/image-edit`
   - Body: FormData with `image` (File) and `instructions` (string)

3. **Multi-Image Composition**
   - `POST /api/multi-image`
   - Body: FormData with `images` (File[]) and `instructions` (string)

All endpoints include proper CORS headers for frontend access.

## Development Rules & Best Practices

### 1. Code Standards
- **TypeScript**: Use strict typing throughout
- **Components**: Functional components with hooks
- **Styling**: Tailwind CSS with shadcn/ui components
- **Error Handling**: Always include try-catch blocks and user-friendly error messages
- **CORS**: All API responses must include CORS headers

### 2. File Organization
- **Components**: Keep components in `frontend/components/`
- **UI Components**: Use shadcn/ui, store in `frontend/components/ui/`
- **Utilities**: Place shared utilities in `frontend/lib/utils.ts`
- **Tests**: Mirror frontend structure in `tests/` directory

### 3. Adding New Features

#### Frontend Components
1. Create component in `frontend/components/`
2. Follow existing patterns (loading states, error handling)
3. Use TypeScript interfaces for props
4. Include responsive design (mobile-first)
5. Add to main App.tsx if needed

#### Backend Endpoints
1. Add handler function following existing pattern
2. Include proper error handling with CORS headers
3. Add to the fetch router in server.ts
4. Test with different input scenarios

#### Testing
1. Create corresponding test file in `tests/`
2. Test both success and error scenarios
3. Include mobile and desktop viewport tests
4. Test accessibility features

### 4. UI/UX Guidelines
- **Responsive**: Mobile-first design approach
- **Loading States**: Show loading indicators during API calls
- **Error Messages**: Clear, actionable error messages
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Touch Targets**: Minimum 44px for mobile usability

### 5. API Integration Rules
- **Model**: Always use `gemini-2.5-flash-image-preview`
- **Error Handling**: Wrap all Gemini API calls in try-catch
- **CORS**: Include CORS headers in all responses
- **FormData**: Use FormData for file uploads
- **Validation**: Validate inputs before API calls

## Common Patterns

### Component Structure
```typescript
interface ComponentProps {
  // Define props with TypeScript
}

export function Component({ prop }: ComponentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultType | null>(null);

  const handleAction = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/endpoint', {
        method: 'POST',
        // ... configuration
      });
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Component JSX */}
      {error && <div className="text-red-500">{error}</div>}
      {loading && <div>Loading...</div>}
    </div>
  );
}
```

### API Handler Pattern
```typescript
async function handleApiEndpoint(request: Request) {
  try {
    // Parse request
    // Validate inputs
    // Call Gemini API
    // Return success response with CORS headers
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ 
      error: "Descriptive error message",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
}
```

## Modification Guidelines

### When Adding Features
1. **Plan First**: Document the feature requirement
2. **Backend First**: Implement and test API endpoints
3. **Frontend Integration**: Build UI components
4. **Testing**: Add comprehensive tests
5. **Documentation**: Update this file

### When Modifying Existing Features
1. **Understand Impact**: Check dependencies
2. **Maintain Compatibility**: Don't break existing functionality
3. **Update Tests**: Modify relevant test cases
4. **Version Control**: Commit incremental changes

### Prohibited Modifications
- **Don't** change the API key variable name without updating all references
- **Don't** remove CORS headers from API responses
- **Don't** change the Gemini model without testing compatibility
- **Don't** modify core Bun configurations without justification

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure all API responses include CORS headers
2. **API Key Invalid**: Verify `GOOGLE_AI_API_KEY` environment variable
3. **Port Conflicts**: Check if ports 3000/3001 are available
4. **TypeScript Errors**: Ensure path aliases are configured correctly

### Debug Mode
- Backend errors logged to console
- Frontend development mode shows detailed error messages
- Use browser dev tools for network debugging

## Future Enhancements

### Planned Features
- Image history and gallery
- Batch image processing
- Custom style presets
- Export to different formats
- Advanced prompt templates

### Architecture Considerations
- Database integration for image storage
- User authentication system
- Rate limiting for API calls
- Image optimization and compression
- Caching layer for generated images

---

**Last Updated**: 2025-09-09
**Version**: 1.0.0
**Maintainer**: Claude Code Assistant
- no usar placeholder ni codigo harcodeado