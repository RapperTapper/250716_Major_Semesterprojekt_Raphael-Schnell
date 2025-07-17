# Keyboard Accessibility Guide

This application includes comprehensive keyboard navigation support for better accessibility and user experience.

## Global Keyboard Shortcuts

### Login/Register Page
- **Tab**: Navigate between form fields and buttons
- **Enter**: Submit the form (when both email and password are filled)
- **Auto-focus**: Email field is automatically focused when page loads

**Tab Order:**
1. Email field
2. Password field  
3. Sign In/Create Account button
4. Forgot Password button
5. Toggle Sign In/Sign Up button

### Dashboard Page
- **Tab**: Navigate between interactive elements
- **Enter**: Submit profile form (when editing)
- **Escape**: Cancel editing mode
- **Auto-focus**: Display name field is automatically focused when editing

**Tab Order:**
1. Logout button
2. Set Up Display Name button (if not set)
3. Edit button (when viewing profile)

**When Editing Profile:**
1. Display Name field (auto-focused)
2. Email Address field
3. Password field
4. Save Changes button
5. Cancel button

### Reset Password Page
- **Tab**: Navigate between form fields and buttons
- **Enter**: Submit password reset (when both passwords are filled)
- **Auto-focus**: New password field is automatically focused

**Tab Order:**
1. New Password field
2. Confirm Password field
3. Update Password button
4. Back to Login button

## Form Features

### Auto-completion Support
- Email fields: `autocomplete="email"`
- Password fields: Appropriate autocomplete values
- Name fields: `autocomplete="name"`

### Form Validation
- Real-time validation with user-friendly error messages
- Keyboard submission only works when required fields are filled
- Visual feedback for disabled/enabled states

### Accessibility Features
- Proper form structure with semantic HTML
- Clear tab order with logical flow
- Focus management for better screen reader support
- Form submission works with both mouse clicks and keyboard

## Tips for Users

1. **Use Tab**: Navigate through all interactive elements
2. **Use Enter**: Submit forms quickly without reaching for the mouse
3. **Use Escape**: Quick way to cancel editing (on dashboard)
4. **Follow the focus**: Visual focus indicators show where you are
5. **Screen readers**: All form fields have proper labels and descriptions

## Implementation Details

For developers working on this project:

- All forms use proper `<form>` elements with `onSubmit` handlers
- `tabIndex` attributes ensure logical navigation order
- `autoFocus` is used strategically for better UX
- `onKeyDown` handlers provide Enter key functionality
- Proper `type` attributes for form inputs
- Semantic HTML structure for accessibility
