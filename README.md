# Mentator

A Next.js 13 project with TypeScript, Tailwind CSS, and TypeDoc integration.

## Tech Stack

- Next.js 13
- TypeScript
- Tailwind CSS
- TypeDoc for documentation
- ESLint for code quality

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Documentation

Generate documentation:
```bash
npm run docs
```

Watch mode for documentation:
```bash
npm run docs:watch
```

Documentation will be generated in the `docs` directory.

## Project Structure

```
src/
├── app/           # App router pages and layouts
├── components/    # Reusable components
├── lib/          # Utility functions and shared logic
└── types/        # TypeScript type definitions
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run docs` - Generate documentation

## Best Practices

- Use TypeScript for type safety
- Document components and functions using TypeDoc comments
- Follow Next.js 13 App Router conventions
- Use Tailwind CSS for styling
- Write clean, maintainable code with proper documentation
