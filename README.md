# Vertex

A student-focused AI project planning web app designed for design students and creative teams.

## Tech Stack
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4
- **Animations**: Motion (Framer Motion)
- **Icons**: Lucide React

## Design System

### Colors
- **Primary**: `#7C3AED` (Purple 600)
- **Primary Gradient**: `linear-gradient(90deg, #7C3AED 0%, #2563EB 100%)`
- **Accent**: `#F472B6` (Pink 400)
- **Dark Background**: `#0B1220`
- **Text Dark**: `#0F172A` (Slate 900)
- **Neutral Light**: `#FFFFFF`
- **Neutral Light 2**: `#F8FAFC`

### Typography
- **Headings**: Poppins / Inter (Display)
- **Body**: Inter (Sans)

### Spacing & Radius
- **Radius**: 
  - Buttons/Inputs: `rounded-xl` (12px)
  - Cards: `rounded-2xl` (16px)
- **Spacing**: Standard Tailwind spacing scale (4px base)

### Shadows
- **Card**: `shadow-sm` (subtle) -> `shadow-lg` (hover)
- **Primary Button**: `shadow-lg shadow-indigo-500/30`

## Project Structure
- `/src/components`: Reusable UI and feature components
  - `/ui`: Basic atoms (Button, Card, Badge, Avatar)
  - `/layout`: Header, Footer
  - `/landing`: Landing page sections
  - `/dashboard`: Dashboard specific widgets
  - `/modals`: Dialogs
- `/src/pages`: Page composition
- `/src/data`: Mock data
- `/src/types.ts`: TypeScript definitions

## Features
- **Landing Page**: Responsive, with hero, features, pricing, and interactive modal.
- **Dashboard**: Kanban and Timeline views, task management.
- **AI Assistant**: Floating widget for quick actions.
- **Responsive**: Mobile-first design.

## Development
1. Install dependencies: `npm install`
2. Run dev server: `npm run dev`
