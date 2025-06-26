# Supabase CLI Migration Guide

This guide explains how to properly use the Supabase CLI to work with migrations and environments (`local`, `stg`, `prod`).

---

## 1. Installing the Supabase CLI

If you don't have it installed:

```bash
npm install -g supabase
```

---

## 2. Key Concepts

- **Local**: Your development environment on your machine.
- **Stg (Staging)**: Testing environment before production.
- **Prod (Production)**: The real environment, where final data lives.

---

## 3. Connecting to Environments

### Local

To start Supabase locally:

```bash
supabase start
```

This will spin up a local instance with all Supabase services.

### Staging and Production

To interact with `stg` or `prod`, you need the environment variables and the `anon key`/`service key` for each project. These are usually set in `.env` or passed as flags:

```bash
supabase link --project-ref <project-ref-stg-or-prod>
```

---

## 4. Pulling the Database Schema

To fetch the latest schema changes from the remote database to your local project:

```bash
supabase db pull
```

This updates your local migration files according to the current state of the remote database.

- Use `--db-url` to specify the database (stg/prod):

```bash
supabase db pull --db-url "postgresql://user:password@host:port/db"
```

---

## 5. Creating a New Migration

1. **Make changes to your local schema** (for example, edit `.sql` files in `/supabase/migrations` or use the CLI):

```bash
supabase migration new migration_name
```

2. **Edit the generated file** to define your changes (CREATE, ALTER, etc).

3. **Apply the migration locally**:

```bash
supabase db push
```

4. **Verify everything works locally**.

5. **Push the migration to Staging** (using the stg URL):

```bash
supabase db push --db-url "postgresql://user:password@host:port/db_stg"
```

6. **Test in Staging**.

7. **Push the migration to Production** (be very careful!):

```bash
supabase db push --db-url "postgresql://user:password@host:port/db_prod"
```

---

## 6. Best Practices

- Always run `pull` before creating a new migration.
- Never edit migrations that have already been applied in production.
- Test first locally, then in stg, and only then in prod.
- Always make a backup before applying to production.

---

## 7. Resources

- [Supabase CLI Official Documentation](https://supabase.com/docs/guides/cli)
- [Migration Commands](https://supabase.com/docs/guides/database/migrations) 