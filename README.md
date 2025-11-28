# Sydney Adaptive Learning Platform

A modern adaptive learning platform built with React + TypeScript + Vite, PostgreSQL, and Docker.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)

### Development with Docker (Recommended)

1. **Clone and setup environment:**
```bash
git clone <repository-url>
cd project_sydney
cp .env.example .env
```

2. **Start all services:**
```bash
# Start all containers (database + frontend)
docker compose up --build

# Or start in detached mode (background)
docker compose up -d --build
```

3. **Access the application:**
- **Frontend**: http://localhost:5173
- **pgAdmin**: http://localhost:5050 (admin@sydney.com / admin123)
- **Database**: localhost:5432 (admin / admin123)

### Common Docker Commands

```bash
# Start all services
docker compose up --build

# Start in background
docker compose up -d

# Stop all services
docker compose down

# Rebuild after changes
docker compose up --build

# View logs (all services)
docker compose logs -f

# View logs (specific service)
docker compose logs -f frontend
docker compose logs -f postgres

# Restart specific service
docker compose restart frontend

# Execute command in container
docker compose exec frontend npm install new-package
docker compose exec postgres psql -U admin -d sydney_db
```

### Local Development (Alternative)

If you prefer to run the frontend locally:

1. **Install dependencies:**
```bash
npm install
```

2. **Start only the database:**
```bash
docker compose up postgres pgadmin -d
```

3. **Start the frontend locally:**
```bash
npm run dev
```

## 📁 Project Structure

```
project_sydney/
├── src/                      # React application source
│   ├── components/           # Reusable UI components
│   ├── pages/               # Page components (routing)
│   ├── types/               # TypeScript interfaces
│   ├── hooks/               # Custom React hooks
│   └── utils/               # Utility functions
├── database/                 # Database configuration
│   ├── init.sql             # Database initialization
│   └── README.md            # Database setup guide
├── docker-compose.yml       # Docker services orchestration
├── Dockerfile              # Frontend container configuration
├── .env                    # Environment variables (excluded from git)
├── .env.example           # Environment template
└── vite.config.ts         # Vite configuration
```

## 🐳 Docker Services

### Frontend (React + Vite)
- **Container**: `sydney_frontend`
- **Port**: 5173
- **Features**: Hot reload, TypeScript, Tailwind CSS
- **Volume mounts**: Source code for development

### Database (PostgreSQL)
- **Container**: `sydney_postgres`
- **Port**: 5432
- **Database**: `sydney_db`
- **User**: `admin` / `admin123`
- **Persistent storage**: Docker volume

### pgAdmin (Database Management)
- **Container**: `sydney_pgadmin`
- **Port**: 5050
- **Login**: `admin@sydney.com` / `admin123`

## 🔧 Environment Configuration

Key environment variables in `.env`:

```env
# Frontend
FRONTEND_PORT=5173
VITE_API_URL=http://localhost:3001

# Database
POSTGRES_DB=sydney_db
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin123
POSTGRES_PORT=5432

# pgAdmin
PGADMIN_EMAIL=admin@sydney.com
PGADMIN_PASSWORD=admin123
PGADMIN_PORT=5050
```

## 🛠️ Development Features

### Hot Reload
- ✅ File changes automatically refresh the browser
- ✅ Works inside Docker containers
- ✅ Fast development workflow

### Routing
- ✅ React Router v6 setup
- ✅ Multiple pages: Home, Login, Register, Dashboard, Quiz

### Styling
- ✅ Tailwind CSS configured
- ✅ Responsive design
- ✅ Component-based styling

### Icons
- ✅ Lucide React icons
- ✅ Consistent icon system

## 🏗️ Architecture

### Frontend Stack
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library

### Database
- **PostgreSQL 15** - Primary database
- **Docker volumes** - Data persistence

### Development Tools
- **Docker Compose** - Local development environment
- **pgAdmin** - Database management interface
- **Hot reload** - Fast development feedback

## 🔒 Security Notes

⚠️ **Development Configuration**: Current setup is for development only!

- Simple passwords for ease of development
- No SSL/TLS encryption
- Database exposed on localhost

**For production deployment:**
- Use strong, unique passwords
- Enable SSL connections
- Configure proper firewall rules
- Use secrets management
- Implement proper authentication

## 🚀 Next Steps

The platform is ready for:
1. **Backend API** - Node.js/Express server
2. **Authentication** - User registration/login
3. **Database Schema** - User, Quiz, Progress tables
4. **Quiz Functionality** - Interactive quiz engine
5. **Progress Tracking** - Learning analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Docker
5. Submit a pull request

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## React + TypeScript + Vite (Original Template Info)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
