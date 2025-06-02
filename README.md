# Headquarter 2

Headquarter 2 is a web application built with [Next.js](https://nextjs.org/), [Tailwind CSS](https://tailwindcss.com/), and [Supabase](https://supabase.com/). It's designed to manage projects, assignments, and people within an organization.

## 🚀 Tech Stack

- **Next.js** – React framework for modern apps
- **Tailwind CSS** – utility-first CSS framework
- **Supabase** – database and auth platform
- **Typescript** – static typing for reliability
- **Shadcn/UI** – modern component system
- **PNPM** – fast and efficient package manager

## 📁 Project Structure

```
/app              # Main routes and views (projects, people, assignments)
/components       # Reusable and UI components
/hooks            # Custom React hooks
/lib              # Utilities, Supabase and DB logic
/public           # Static assets
/styles           # Global CSS
```

## 🛠️ Getting Started

1. Clone the repository:

```bash
git clone https://github.com/your-user/headquarter-2.git
cd headquarter-2
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

Rename `.env.local.example` to `.env.local` and fill in the required values (e.g. Supabase keys).

4. Run the development server:

```bash
pnpm dev
```

## 📦 Useful Scripts

```bash
pnpm dev        # Start local dev server
pnpm build      # Build for production
pnpm lint       # Run linter
```
