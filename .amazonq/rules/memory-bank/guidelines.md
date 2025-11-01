# StreamAPI - Development Guidelines

## Code Quality Standards

### File Structure & Organization
- **Consistent Module Structure**: All route files follow the pattern: imports → configuration → helper functions → route handlers → exports
- **Separation of Concerns**: Models, routes, middleware, and views are clearly separated into dedicated directories
- **Configuration Management**: Environment variables and API keys are centralized and properly managed

### Naming Conventions
- **Variables**: camelCase for JavaScript variables (`userSessions`, `activeTorrents`, `watchlistStorage`)
- **Constants**: UPPER_SNAKE_CASE for constants (`YTS_API_BASE`, `DEFAULT_TRACKERS`, `SWIPE_THRESHOLD`)
- **Functions**: camelCase with descriptive names (`fetchFromTMDB`, `constructMagnetURI`, `toggleQuickActions`)
- **Database Fields**: snake_case for database field names (`added_date`, `poster_path`, `media_type`)

### Error Handling Patterns
- **Consistent Error Responses**: Standardized error handling with `handleError()` and `handleApiError()` functions
- **Try-Catch Blocks**: Comprehensive error handling in async functions with proper logging
- **Graceful Degradation**: Fallback mechanisms when external APIs fail
- **User-Friendly Messages**: Clear error messages for end users while logging technical details

## Architectural Patterns

### Express.js Route Structure
```javascript
// Standard route pattern observed across files
router.get('/endpoint', async (req, res) => {
    try {
        // Input validation
        const { param1, param2 } = req.query;
        
        // Business logic
        const data = await someAsyncOperation();
        
        // Response formatting
        res.render('template', { data });
    } catch (error) {
        handleError(res, "Error message", 500);
    }
});
```

### Database Integration Patterns
- **Mongoose Schema Design**: Consistent schema structure with proper validation and indexing
- **Pre-save Middleware**: Password hashing and data transformation before database operations
- **Instance Methods**: Custom methods on schemas for common operations (`comparePassword`, `generatePasswordReset`)
- **Index Management**: Proper index creation and cleanup for performance optimization

### API Integration Standards
- **Centralized API Functions**: Reusable functions like `fetchFromTMDB()` for external API calls
- **Parameter Handling**: Consistent query parameter construction and validation
- **Response Formatting**: Standardized data transformation for consistent API responses
- **Rate Limiting Awareness**: Proper handling of external API limitations

## Frontend Development Patterns

### JavaScript Event Handling
- **Event Delegation**: Proper use of event listeners with stopPropagation() for nested elements
- **Touch Event Management**: Comprehensive touch handling for mobile devices with gesture recognition
- **Keyboard Shortcuts**: Consistent keyboard event handling with preventDefault() for custom controls
- **State Management**: Local state tracking for UI components (controls visibility, touch states)

### DOM Manipulation Standards
- **Element Selection**: Consistent use of getElementById() and querySelector() methods
- **Dynamic Content**: Proper DOM updates with null checks and error handling
- **Event Cleanup**: Proper event listener cleanup on page unload
- **Cross-browser Compatibility**: Fallback methods for different browser implementations

## Security Practices

### Authentication & Authorization
- **Password Security**: bcrypt hashing with salt rounds for password storage
- **Session Management**: Secure session configuration with MongoDB store
- **Route Protection**: Middleware-based authentication checks (`ensureAuthenticated`)
- **Input Validation**: Comprehensive validation for user inputs and API parameters

### Data Protection
- **SQL Injection Prevention**: Parameterized queries and input sanitization
- **XSS Protection**: Content Security Policy headers and input escaping
- **CSRF Protection**: Proper form handling and token validation
- **Environment Variables**: Sensitive data stored in environment variables, not code

## Performance Optimization

### Caching Strategies
- **In-Memory Storage**: Strategic use of Maps and objects for frequently accessed data
- **Session Caching**: Efficient session storage with cleanup mechanisms
- **API Response Caching**: Temporary storage of external API responses

### Resource Management
- **Connection Pooling**: Proper database connection management
- **Memory Cleanup**: Regular cleanup of temporary data and expired sessions
- **File Upload Limits**: Proper file size and type restrictions
- **WebSocket Management**: Connection lifecycle management with heartbeat mechanisms

## Testing & Debugging

### Logging Standards
- **Consistent Logging**: Structured console logging for errors and important events
- **Error Context**: Detailed error information including stack traces and request context
- **Performance Monitoring**: Timing information for critical operations
- **Debug Information**: Conditional debug output for development environments

### Code Documentation
- **Inline Comments**: Clear explanations for complex logic and business rules
- **Function Documentation**: Purpose and parameter descriptions for key functions
- **API Documentation**: Endpoint descriptions with expected parameters and responses
- **Configuration Comments**: Clear explanations for environment variables and settings

## Deployment Considerations

### Environment Configuration
- **Multi-Platform Support**: Configuration for Vercel, Render, Docker, and local development
- **Environment Variables**: Comprehensive environment variable management
- **Build Scripts**: Proper npm scripts for different deployment scenarios
- **Health Checks**: Basic health check endpoints for monitoring

### Production Readiness
- **Error Monitoring**: Comprehensive error logging and monitoring
- **Security Headers**: Proper security headers for production deployment
- **Asset Optimization**: Efficient static asset serving and caching
- **Database Optimization**: Proper indexing and query optimization for production loads