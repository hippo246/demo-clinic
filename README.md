# ClinicOS

A modern, feature-rich clinic management system built with React, TypeScript, and Vite. ClinicOS provides comprehensive patient management, appointment scheduling, billing, and reporting capabilities for healthcare facilities.

## Features

### Core Functionality
- **Patient Management**: Complete patient records with medical history, medications, allergies, and alerts
- **Smart Search**: Advanced search with smart phrases (e.g., "diabetic", "follow-up overdue", "critical")
- **Role-Based Access**: Different interfaces for Receptionists, Doctors, and Admins
- **Audit Trail**: Complete audit logging for all patient data changes
- **Data Persistence**: LocalStorage-based data persistence with fallback to mock data
- **Undo/Redo**: Full undo/redo functionality for patient changes (Ctrl+Z / Ctrl+Shift+Z)

### Patient Features
- Comprehensive patient profiles with demographics, insurance, and medical information
- Risk scoring and next best action recommendations
- Visit readiness tracking
- Timeline of patient events and interactions
- Document management
- Family member tracking
- Emergency contact management

### Clinical Decision Support
- Drug interaction checking with severity levels
- Treatment protocol suggestions
- Clinical alerts based on vital signs
- Medication database with common dosages

### Additional Features
- Dark/light mode support (Ctrl+D)
- Responsive design (mobile, tablet, desktop)
- CSV import for patient data
- CSV/JSON export for patient data
- Print summaries
- Statistics dashboard
- Bulk patient selection and actions
- Loading states and skeleton screens
- Advanced filtering and sorting
- Keyboard shortcuts for power users

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite 8
- **Styling**: Custom CSS-in-JS with CSS variables
- **Icons**: Tabler Icons
- **State Management**: React hooks (useState, useEffect, useCallback)
- **Data Persistence**: localStorage

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Lint code
npm run lint
npm run lint:fix
```

### Development

The development server will start at `http://localhost:5173`

## Keyboard Shortcuts

- `Ctrl+K` / `Cmd+K` - Focus search
- `Ctrl+N` / `Cmd+N` - New patient
- `Ctrl+E` / `Cmd+E` - Export patients to CSV
- `Ctrl+D` / `Cmd+D` - Toggle dark mode
- `Ctrl+F` / `Cmd+F` - Focus search (alternative)
- `Ctrl+Z` / `Cmd+Z` - Undo
- `Ctrl+Shift+Z` / `Cmd+Shift+Z` - Redo
- `Ctrl+Y` / `Cmd+Y` - Redo (alternative)
- `Ctrl+1-5` / `Cmd+1-5` - Switch tabs
- `Escape` - Close modals/go back

## License

This project is a demo/prototype for educational purposes.
