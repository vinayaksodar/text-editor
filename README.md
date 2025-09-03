# Text Editor

A minimal, high-performance text editor built with vanilla JavaScript featuring custom text rendering, virtualization, and an MVC architecture.

## Features

- **Virtualized Rendering**: Efficiently handles large documents (20,000+ lines) by only rendering visible content
- **Custom Text Model**: Purpose-built text manipulation with cursor management and selection handling
- **Search & Highlight**: Real-time text search with match highlighting and navigation
- **Keyboard Shortcuts**: Full keyboard navigation and text editing commands
- **Undo/Redo System**: Complete command history with undo/redo functionality
- **Modular Architecture**: Clean separation of concerns with MVC pattern

## Architecture

### Core Components

- **EditorModel**: Manages text content, cursor position, and selections
- **EditorView**: Handles rendering, virtualization, and visual updates
- **EditorController**: Coordinates user interactions and command execution

### Handler System

- **KeyboardHandler**: Processes keyboard input and shortcuts
- **PointerHandler**: Manages mouse interactions and text selection
- **SearchHandler**: Implements search functionality with highlighting

### UI Components

- **EditorContainer**: Main text editing area with scroll management
- **Toolbar**: Command interface and editor controls
- **WidgetLayer**: Overlay system for floating UI elements
- **SearchWidget**: Floating search interface

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd text-editor

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The editor will be available at `http://localhost:5173`

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Technical Details

### Virtualization

The editor implements viewport-based virtualization to handle large documents efficiently:

- Only renders lines visible in the current viewport
- Dynamically calculates scroll positions and line ranges
- Maintains smooth scrolling performance regardless of document size

### Text Rendering

Custom text rendering system with:

- Character-level cursor positioning using DOM ranges
- Syntax highlighting support through span-based markup
- Selection rendering with proper text flow handling
- Search match highlighting with current match indication

### Performance Optimizations

- **Efficient DOM Updates**: Minimal DOM manipulation using targeted updates
- **Event Delegation**: Centralized event handling to reduce memory overhead
- **Debounced Operations**: Search and scroll operations are optimized for performance
- **Memory Management**: Proper cleanup of event listeners and intervals

## File Structure

```
src/
├── editor/
│   ├── EditorModel.js          # Text data model
│   ├── EditorView.js           # Rendering and virtualization
│   ├── EditorController.js     # Main controller
│   ├── commands.js             # Command definitions
│   ├── undoManager.js          # Undo/redo system
│   └── handlers/
│       ├── KeyboardHandler.js  # Keyboard input handling
│       ├── PointerHandler.js     # Mouse interaction handling
│       └── SearchHandler.js    # Search functionality
├── components/
│   ├── EditorContainer/        # Main editor container
│   ├── Toolbar/               # Editor toolbar
│   ├── WidgetLayer/           # Floating UI layer
│   └── SearchWidget/          # Search interface
├── main.js                    # Application entry point
└── style.css                  # Global styles
```

## Key Features Explained

### Custom Model System

The `EditorModel` class provides:

- Line-based text storage for efficient manipulation
- Cursor and selection state management
- Text insertion, deletion, and modification operations
- Event-driven updates to maintain view synchronization

### Virtualization Implementation

The virtualization system:

- Calculates visible line range based on scroll position
- Renders only necessary DOM elements
- Maintains cursor positioning accuracy across virtual boundaries
- Handles dynamic content height calculations

### Search System

Advanced search capabilities:

- Real-time search with instant highlighting
- Case-sensitive and case-insensitive options
- Navigation between search matches
- Visual indication of current match position

## Browser Support

- Chrome/Chromium 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Performance Notes

The editor is optimized for:

- Documents with up to 100,000 lines
- Smooth scrolling at 60fps
- Sub-100ms response time for text operations
- Memory usage under 50MB for typical documents

For extremely large files (1M+ lines), consider implementing additional optimizations such as:

- Line-level lazy loading
- Background text processing
- Progressive rendering strategies
