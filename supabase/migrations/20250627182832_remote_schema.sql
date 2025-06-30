

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "hstore" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgaudit" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."check_assignment_overallocation"("_assignment_id" "uuid", "_person_id" "uuid", "_start_date" "date", "_end_date" "date", "_allocation" double precision) RETURNS TABLE("overallocated_date" "date", "total_allocation" double precision)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  d date;
  current_total double precision;
  existing_sum double precision;
BEGIN
  -- Iterar por cada día en el rango
  FOR d IN SELECT generate_series(_start_date, _end_date, interval '1 day')::date
  LOOP
    -- Calcular la asignación existente para este día
    SELECT COALESCE(SUM(a.allocation), 0)
    INTO existing_sum
    FROM assignments a
    WHERE a.person_id = _person_id
      AND a.id != COALESCE(_assignment_id, '00000000-0000-0000-0000-000000000000'::uuid)  -- exclude the assignment being updated
      AND d BETWEEN a.start_date AND a.end_date;
    
    -- Calcular el total incluyendo la nueva asignación
    current_total := existing_sum + _allocation;
    
    -- Debug: Log el cálculo para este día
    RAISE NOTICE 'Día: %, Asignación existente: %, Nueva asignación: %, Total: %', 
      d, 
      existing_sum, 
      _allocation, 
      current_total;
    
    -- Si la asignación total excede 1.0, retornar este día
    IF current_total > 1.0 THEN
      overallocated_date := d;
      total_allocation := current_total;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."check_assignment_overallocation"("_assignment_id" "uuid", "_person_id" "uuid", "_start_date" "date", "_end_date" "date", "_allocation" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_llnn_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    letters TEXT := 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
    result TEXT := '';
    digit1 INT;
    digit2 INT;
BEGIN
    -- Random two uppercase letters
    result := substr(letters, trunc(random()*26 + 1)::int, 1) ||
              substr(letters, trunc(random()*26 + 1)::int, 1);

    -- Random two digits
    digit1 := trunc(random()*10)::int;
    digit2 := trunc(random()*10)::int;

    result := result || digit1::text || digit2::text;

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."generate_llnn_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_unique_llnn_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    new_code TEXT;
    tries INT := 0;
BEGIN
    LOOP
        new_code := generate_llnn_code();
        -- Try to avoid infinite loops
        tries := tries + 1;
        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM projects WHERE project_code = new_code
        ) OR tries > 100;
    END LOOP;

    IF tries > 100 THEN
        RAISE EXCEPTION 'Failed to generate unique code after 100 attempts';
    END IF;

    RETURN new_code;
END;
$$;


ALTER FUNCTION "public"."generate_unique_llnn_code"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_name" "text",
    "record_id" "uuid",
    "field_name" "text",
    "old_value" "text",
    "new_value" "text",
    "changed_by" "uuid",
    "changed_by_name" "text",
    "changed_by_email" "text",
    "action" "text",
    "changed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_audit_logs_for_project_code"("p_project_code" "text") RETURNS SETOF "public"."audit_log"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  with target_project as (
    select id
    from projects
    where project_code = p_project_code
  )
  select *
  from audit_log
  where (
      table_name = 'projects'
      and record_id in (select id from target_project)
    )
    or (
      table_name = 'assignments'
      and record_id in (
        select a.id
        from assignments a
        join target_project tp on a.project_id = tp.id
      )
    )
  order by changed_at desc
$$;


ALTER FUNCTION "public"."get_audit_logs_for_project_code"("p_project_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_audit_logs_for_project_code"("p_project_code" "text", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS SETOF "public"."audit_log"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  with target_project as (
    select id
    from projects
    where project_code = p_project_code
  )
  select *
  from audit_log
  where (
      table_name = 'projects'
      and record_id in (select id from target_project)
    )
    or (
      table_name = 'assignments'
      and record_id in (
        select a.id
        from assignments a
        join target_project tp on a.project_id = tp.id
      )
    )
  order by changed_at desc
  limit p_limit
  offset p_offset
$$;


ALTER FUNCTION "public"."get_audit_logs_for_project_code"("p_project_code" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_project_activity_logs"("p_project_id" "uuid") RETURNS TABLE("id" "uuid", "user_id" "uuid", "display_name" "text", "email" "text", "resource_type" "text", "resource_id" "uuid", "action" "text", "metadata" "jsonb", "created_at" timestamp with time zone)
    LANGUAGE "sql"
    AS $$
  select
    gen_random_uuid() as id,
    ah.changed_by as user_id,
    ah.changed_by_name as display_name,
    ah.changed_by_email as email,
    'assignment' as resource_type,
    ah.assignment_id as resource_id,
    ah.action,
    jsonb_build_object(
      'person_id', ah.person_id,
      'project_id', ah.project_id,
      'start_date', ah.start_date,
      'end_date', ah.end_date,
      'allocation', ah.allocation,
      'assigned_role', ah.assigned_role,
      'is_billable', ah.is_billable
    ) as metadata,
    ah.changed_at at time zone 'UTC' as created_at
  from public.assignments_history ah
  where ah.project_id = p_project_id

  union all

  select
    gen_random_uuid() as id,
    ph.changed_by as user_id,
    ph.changed_by_name as display_name,
    ph.changed_by_email as email,
    'project' as resource_type,
    ph.project_id as resource_id,
    ph.action,
    jsonb_build_object(
      'name', ph.name,
      'description', ph.description,
      'status', ph.status,
      'start_date', ph.start_date,
      'end_date', ph.end_date,
      'client_id', ph.client_id,
      'project_code', ph.project_code
    ) as metadata,
    ph.changed_at at time zone 'UTC' as created_at
  from public.projects_history ph
  where ph.project_id = p_project_id

  order by created_at;
$$;


ALTER FUNCTION "public"."get_project_activity_logs"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_timeoff_overlaps"("p_person_id" "uuid", "p_start_date" "date", "p_end_date" "date") RETURNS TABLE("source" "text", "record_id" "uuid", "from_date" "date", "end_date" "date", "type" "text", "comments" "text")
    LANGUAGE "plpgsql"
    AS $$
begin
  -- Overlapping timeoffs
  return query
  select
    'timeoff' as source,
    t.id,
    t.from_date,
    t.end_date,
    t.type,
    t.comments
  from timeoffs t
  where t.person_id = p_person_id
    and t.from_date <= coalesce(p_end_date, p_start_date)
    and t.end_date >= coalesce(p_start_date, p_end_date);

  -- Overlapping assignments
  return query
  select
    'assignment' as source,
    a.id,
    a.start_date,
    a.end_date,
    a.assigned_role as type,
    null::text as comments
  from assignments a
  where a.person_id = p_person_id
    and a.start_date <= coalesce(p_end_date, p_start_date)
    and a.end_date >= coalesce(p_start_date, p_end_date);
end;
$$;


ALTER FUNCTION "public"."get_timeoff_overlaps"("p_person_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_activity_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    action_type TEXT;
    affected_id UUID;
    metadata JSONB;
BEGIN
    -- Determine action
    IF TG_OP = 'INSERT' THEN
        action_type := 'INSERT';
        affected_id := NEW.id;
        metadata := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'UPDATE';
        affected_id := NEW.id;
        metadata := jsonb_build_object(
            'old', to_jsonb(OLD),
            'new', to_jsonb(NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        action_type := 'DELETE';
        affected_id := OLD.id;
        metadata := to_jsonb(OLD);
    END IF;

    -- Insert into activity_logs
    INSERT INTO public.activity_logs (
        resource_type,
        resource_id,
        action,
        metadata
    ) VALUES (
        TG_TABLE_NAME,
        affected_id,
        action_type,
        metadata
    );

    RETURN NULL; -- AFTER triggers should return NULL
END;
$$;


ALTER FUNCTION "public"."log_activity_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_assignment_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
    user_id UUID := current_setting('app.current_user_id', true)::UUID;
    user_name TEXT;
    user_email TEXT;
BEGIN
    -- Fetch name and email from auth.users.raw_user_meta_data
    SELECT 
        raw_user_meta_data ->> 'name',
        raw_user_meta_data ->> 'email'
    INTO user_name, user_email
    FROM auth.users
    WHERE id = user_id;

    IF TG_OP = 'DELETE' THEN
        INSERT INTO assignments_history (
            assignment_id, person_id, project_id, start_date, end_date,
            allocation, created_at, updated_at, assigned_role, is_billable,
            changed_by, action, changed_by_name, changed_by_email
        )
        VALUES (
            OLD.id, OLD.person_id, OLD.project_id, OLD.start_date, OLD.end_date,
            OLD.allocation, OLD.created_at, OLD.updated_at, OLD.assigned_role, OLD.is_billable,
            user_id, TG_OP, user_name, user_email
        );
    ELSE
        INSERT INTO assignments_history (
            assignment_id, person_id, project_id, start_date, end_date,
            allocation, created_at, updated_at, assigned_role, is_billable,
            changed_by, action, changed_by_name, changed_by_email
        )
        VALUES (
            NEW.id, NEW.person_id, NEW.project_id, NEW.start_date, NEW.end_date,
            NEW.allocation, NEW.created_at, NEW.updated_at, NEW.assigned_role, NEW.is_billable,
            user_id, TG_OP, user_name, user_email
        );
    END IF;

    RETURN NULL;
END;$$;


ALTER FUNCTION "public"."log_assignment_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_generic_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
    user_id uuid := current_setting('app.current_user_id', true)::uuid;
    user_name text;
    user_email text;
    old_vals hstore;
    new_vals hstore;
    keys text[];
    key text;
begin
    -- Get user details
    select 
        raw_user_meta_data ->> 'name',
        raw_user_meta_data ->> 'email'
    into user_name, user_email
    from auth.users
    where id = user_id
    limit 1;
    -- ... resto del código ...
    return null;
end;
$$;


ALTER FUNCTION "public"."log_generic_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_person_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
    user_id UUID := current_setting('app.current_user_id', true)::UUID;
    user_name TEXT;
    user_email TEXT;
BEGIN
    -- Fetch name and email from auth.users.raw_user_meta_data
    SELECT 
        raw_user_meta_data ->> 'name',
        raw_user_meta_data ->> 'email'
    INTO user_name, user_email
    FROM auth.users
    WHERE id = user_id;

    IF TG_OP = 'DELETE' THEN
        INSERT INTO people_history (
            person_id, last_name, first_name, profile, start_date, end_date,
            status, type, created_at, updated_at, changed_by, action, changed_by_name, changed_by_email
        )
        VALUES (
            OLD.id, OLD.last_name, OLD.first_name, OLD.profile, OLD.start_date, OLD.end_date,
            OLD.status, OLD.type, OLD.created_at, OLD.updated_at, user_id, TG_OP, user_name, user_email
        );
    ELSE
        INSERT INTO people_history (
            person_id, last_name, first_name, profile, start_date, end_date,
            status, type, created_at, updated_at, changed_by, action, changed_by_name, changed_by_email
        )
        VALUES (
            NEW.id, NEW.last_name, NEW.first_name, NEW.profile, NEW.start_date, NEW.end_date,
            NEW.status, NEW.type, NEW.created_at, NEW.updated_at, user_id, TG_OP, user_name, user_email
        );
    END IF;
    RETURN NULL;
END;$$;


ALTER FUNCTION "public"."log_person_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_project_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE user_id UUID := current_setting('app.current_user_id', true)::UUID;
user_name TEXT;
user_email TEXT;
BEGIN -- Fetch name and email from auth.users.raw_user_meta_data
SELECT raw_user_meta_data->>'name',
    raw_user_meta_data->>'email' INTO user_name,
    user_email
FROM auth.users
WHERE id = user_id;
IF TG_OP = 'DELETE' THEN
INSERT INTO public.projects_history (
        project_id,
        name,
        description,
        status,
        start_date,
        end_date,
        client_id,
        project_code,
        changed_by,
        action,
        changed_by_name,
        changed_by_email
    )
VALUES (
        OLD.id,
        OLD.name,
        OLD.description,
        OLD.status,
        OLD.start_date,
        OLD.end_date,
        OLD.client_id,
        OLD.project_code,
        user_id,
        TG_OP,
        user_name,
        user_email
    );
ELSE
INSERT INTO public.projects_history (
        project_id,
        name,
        description,
        status,
        start_date,
        end_date,
        client_id,
        project_code,
        changed_by,
        action,
        changed_by_name,
        changed_by_email
    )
VALUES (
        NEW.id,
        NEW.name,
        NEW.description,
        NEW.status,
        NEW.start_date,
        NEW.end_date,
        NEW.client_id,
        NEW.project_code,
        user_id,
        TG_OP,
        user_name,
        user_email
    );
END IF;
RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."log_project_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ocupation_report_between"("initial_date" "date", "final_date" "date") RETURNS TABLE("assignment_id" "uuid", "person_id" "uuid", "project_id" "uuid", "person_first_name" "text", "person_last_name" "text", "project_name" "text", "assignment_start_date" "date", "assignment_end_date" "date", "allocation" double precision)
    LANGUAGE "sql"
    AS $$
  select
a.id as assignment_id,
p.id as person_id,
pro.id as project_id,
p.first_name as person_first_name,
p.last_name as person_last_name,
pro.name as project_name,
a.start_date as assignment_start_date,
a.end_date as assignment_end_date,
a.allocation as allocation
  from assignments a    
  left join people p on p.id = a.person_id
  right join projects pro on pro.id = a.project_id
  where
    a.start_date <= ocupation_report_between.final_date
AND a.end_date >= ocupation_report_between.initial_date
$$;


ALTER FUNCTION "public"."ocupation_report_between"("initial_date" "date", "final_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_date"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at := CURRENT_DATE;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_date"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at_timestamp"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"(),
    "resource_type" "text" NOT NULL,
    "resource_id" "uuid" DEFAULT "gen_random_uuid"(),
    "action" "text" NOT NULL,
    "metadata" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assignments" (
    "id" "uuid" NOT NULL,
    "project_id" "uuid",
    "person_id" "uuid",
    "start_date" "date",
    "end_date" "date",
    "allocation" double precision,
    "created_at" "date" DEFAULT CURRENT_DATE,
    "updated_at" "date",
    "assigned_role" "text",
    "is_billable" boolean DEFAULT true NOT NULL,
    CONSTRAINT "assignments_allocation_check" CHECK ((("allocation" >= (0.0)::double precision) AND ("allocation" <= (100.0)::double precision)))
);


ALTER TABLE "public"."assignments" OWNER TO "postgres";


COMMENT ON COLUMN "public"."assignments"."is_billable" IS 'Whether the assignment is billable or not';



CREATE TABLE IF NOT EXISTS "public"."assignments_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assignment_id" "uuid",
    "person_id" "uuid",
    "project_id" "uuid",
    "start_date" "date",
    "end_date" "date",
    "allocation" double precision,
    "created_at" "date",
    "updated_at" "date",
    "assigned_role" "text",
    "changed_by" "uuid",
    "changed_at" timestamp without time zone DEFAULT "now"(),
    "action" "text",
    "is_billable" boolean DEFAULT true NOT NULL,
    "changed_by_name" "text",
    "changed_by_email" "text",
    CONSTRAINT "assignments_history_action_check" CHECK (("action" = ANY (ARRAY['INSERT'::"text", 'UPDATE'::"text", 'DELETE'::"text"])))
);


ALTER TABLE "public"."assignments_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auth_users" (
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."auth_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid",
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "position" "text"
);


ALTER TABLE "public"."client_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."people" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL,
    "profile" character varying,
    "start_date" "date",
    "end_date" "date",
    "status" character varying,
    "type" character varying,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "first_name" "text" DEFAULT 'a'::"text" NOT NULL,
    "last_name" "text" DEFAULT ''::"text" NOT NULL,
    "is_archived" boolean DEFAULT false NOT NULL,
    "profile_id" "uuid",
    CONSTRAINT "people_is_archived_check" CHECK (("is_archived" = ANY (ARRAY[true, false]))),
    CONSTRAINT "people_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('Active'::character varying)::"text", ('Paused'::character varying)::"text", ('Terminated'::character varying)::"text"]))),
    CONSTRAINT "people_type_check" CHECK ((("type")::"text" = ANY (ARRAY[('Internal'::character varying)::"text", ('External'::character varying)::"text"])))
);


ALTER TABLE "public"."people" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."people_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "person_id" "uuid",
    "last_name" "text",
    "first_name" "text",
    "profile" "text",
    "start_date" "date",
    "end_date" "date",
    "status" "text",
    "type" "text",
    "created_at" timestamp without time zone,
    "updated_at" timestamp without time zone,
    "changed_by" "uuid",
    "changed_at" timestamp without time zone DEFAULT "now"(),
    "action" "text",
    "changed_by_name" "text",
    "changed_by_email" "text",
    CONSTRAINT "people_history_action_check" CHECK (("action" = ANY (ARRAY['INSERT'::"text", 'UPDATE'::"text", 'DELETE'::"text"])))
);


ALTER TABLE "public"."people_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" NOT NULL,
    "name" character varying NOT NULL,
    "description" "text",
    "start_date" "date",
    "end_date" "date",
    "status" character varying,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "client_id" "uuid",
    "project_code" "text" DEFAULT "public"."generate_unique_llnn_code"(),
    "fte" double precision,
    "is_archived" boolean DEFAULT false NOT NULL,
    "owner" "uuid",
    "contract_type" "text",
    CONSTRAINT "projects_contract_type_check" CHECK (("contract_type" = ANY (ARRAY['Retainers'::"text", 'Fix time'::"text", 'Fix price'::"text", 'TyM'::"text"]))),
    CONSTRAINT "projects_is_archived_check" CHECK (("is_archived" = ANY (ARRAY[true, false]))),
    CONSTRAINT "projects_project_code_check" CHECK (("project_code" ~ '^[A-Za-z]{2}[0-9]{2}$'::"text")),
    CONSTRAINT "projects_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['In Progress'::character varying, 'Finished'::character varying, 'On Hold'::character varying, 'Not Started'::character varying])::"text"[])))
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


COMMENT ON COLUMN "public"."projects"."fte" IS 'Total FTE requerido para el proyecto (opcional)';



CREATE TABLE IF NOT EXISTS "public"."projects_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "name" "text",
    "description" "text",
    "status" "text",
    "start_date" "date",
    "end_date" "date",
    "client_id" "uuid",
    "changed_by" "uuid",
    "changed_at" timestamp without time zone DEFAULT "now"(),
    "action" "text",
    "project_code" "text",
    "changed_by_name" "text",
    "changed_by_email" "text",
    CONSTRAINT "projects_history_action_check" CHECK (("action" = ANY (ARRAY['INSERT'::"text", 'UPDATE'::"text", 'DELETE'::"text"]))),
    CONSTRAINT "projects_history_project_code_check" CHECK (("project_code" ~ '^[A-Za-z]{2}[0-9]{2}$'::"text"))
);


ALTER TABLE "public"."projects_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."timeoffs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "person_id" "uuid" NOT NULL,
    "from_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "type" "text" NOT NULL,
    "comments" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "timeoffs_date_check" CHECK (("from_date" <= "end_date")),
    CONSTRAINT "timeoffs_type_check" CHECK (("type" = ANY (ARRAY['Vacations'::"text", 'Licence'::"text", 'Personal'::"text", 'Holidays'::"text", 'Study'::"text", 'Others'::"text"])))
);


ALTER TABLE "public"."timeoffs" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assignments_history"
    ADD CONSTRAINT "assignments_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auth_users"
    ADD CONSTRAINT "auth_users_pkey" PRIMARY KEY ("email");



ALTER TABLE ONLY "public"."client_contacts"
    ADD CONSTRAINT "client_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."people_history"
    ADD CONSTRAINT "people_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."people"
    ADD CONSTRAINT "people_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects_history"
    ADD CONSTRAINT "projects_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_project_code_key" UNIQUE ("project_code");



ALTER TABLE ONLY "public"."timeoffs"
    ADD CONSTRAINT "timeoffs_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "set_updated_at_date" BEFORE UPDATE ON "public"."assignments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_date"();



CREATE OR REPLACE TRIGGER "trg_audit_generic" AFTER INSERT OR DELETE OR UPDATE ON "public"."assignments" FOR EACH ROW EXECUTE FUNCTION "public"."log_generic_changes"();



CREATE OR REPLACE TRIGGER "trg_audit_generic" AFTER INSERT OR DELETE OR UPDATE ON "public"."people" FOR EACH ROW EXECUTE FUNCTION "public"."log_generic_changes"();



CREATE OR REPLACE TRIGGER "trg_audit_generic" AFTER INSERT OR DELETE OR UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."log_generic_changes"();



CREATE OR REPLACE TRIGGER "trg_audit_generic" AFTER INSERT OR DELETE OR UPDATE ON "public"."timeoffs" FOR EACH ROW EXECUTE FUNCTION "public"."log_generic_changes"();



CREATE OR REPLACE TRIGGER "trg_update_timeoffs_updated_at" BEFORE UPDATE ON "public"."timeoffs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_log_assignments_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."assignments" FOR EACH ROW EXECUTE FUNCTION "public"."log_assignment_change"();



CREATE OR REPLACE TRIGGER "trigger_log_person_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."people" FOR EACH ROW EXECUTE FUNCTION "public"."log_person_change"();



CREATE OR REPLACE TRIGGER "trigger_log_projects_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."log_project_change"();



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_contacts"
    ADD CONSTRAINT "client_contacts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."timeoffs"
    ADD CONSTRAINT "fk_timeoffs_person_id" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."people"
    ADD CONSTRAINT "people_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_owner_fkey" FOREIGN KEY ("owner") REFERENCES "public"."people"("id");



CREATE POLICY "Allow access to authenticated users" ON "public"."assignments" TO "authenticated" USING (("set_config"('app.current_user_id'::"text", ("auth"."uid"())::"text", true) IS NOT NULL));



CREATE POLICY "Allow access to authenticated users" ON "public"."client_contacts" TO "authenticated" USING (("set_config"('app.current_user_id'::"text", ("auth"."uid"())::"text", true) IS NOT NULL));



CREATE POLICY "Allow access to authenticated users" ON "public"."clients" TO "authenticated" USING (("set_config"('app.current_user_id'::"text", ("auth"."uid"())::"text", true) IS NOT NULL));



CREATE POLICY "Allow access to authenticated users" ON "public"."people" TO "authenticated" USING (("set_config"('app.current_user_id'::"text", ("auth"."uid"())::"text", true) IS NOT NULL));



CREATE POLICY "Allow access to authenticated users" ON "public"."projects" TO "authenticated" USING (("set_config"('app.current_user_id'::"text", ("auth"."uid"())::"text", true) IS NOT NULL));



CREATE POLICY "Allow authenticated insert" ON "public"."people" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated insert" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated can read logs" ON "public"."audit_log" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Policy with security definer functions" ON "public"."assignments_history" TO "authenticated" USING (("set_config"('app.current_user_id'::"text", ("auth"."uid"())::"text", true) IS NOT NULL));



CREATE POLICY "Policy with security definer functions" ON "public"."people_history" TO "authenticated" USING (("set_config"('app.current_user_id'::"text", ("auth"."uid"())::"text", true) IS NOT NULL));



CREATE POLICY "Policy with security definer functions" ON "public"."projects_history" TO "authenticated" USING (("set_config"('app.current_user_id'::"text", ("auth"."uid"())::"text", true) IS NOT NULL));



CREATE POLICY "Trigger-only insert" ON "public"."audit_log" FOR INSERT TO "authenticated" WITH CHECK (("current_setting"('app.current_user_id'::"text", true) IS NOT NULL));



ALTER TABLE "public"."assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assignments_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."client_contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "no_deletes_on_people" ON "public"."people" FOR DELETE USING (false);



CREATE POLICY "no_deletes_on_projects" ON "public"."projects" FOR DELETE USING (false);



ALTER TABLE "public"."people" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."people_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects_history" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



















































































































































































































































































































































GRANT ALL ON FUNCTION "public"."check_assignment_overallocation"("_assignment_id" "uuid", "_person_id" "uuid", "_start_date" "date", "_end_date" "date", "_allocation" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."check_assignment_overallocation"("_assignment_id" "uuid", "_person_id" "uuid", "_start_date" "date", "_end_date" "date", "_allocation" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_assignment_overallocation"("_assignment_id" "uuid", "_person_id" "uuid", "_start_date" "date", "_end_date" "date", "_allocation" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_llnn_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_llnn_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_llnn_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_unique_llnn_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_unique_llnn_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_unique_llnn_code"() TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_audit_logs_for_project_code"("p_project_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_audit_logs_for_project_code"("p_project_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_audit_logs_for_project_code"("p_project_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_audit_logs_for_project_code"("p_project_code" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_audit_logs_for_project_code"("p_project_code" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_audit_logs_for_project_code"("p_project_code" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_project_activity_logs"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_project_activity_logs"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_project_activity_logs"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_timeoff_overlaps"("p_person_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_timeoff_overlaps"("p_person_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_timeoff_overlaps"("p_person_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_activity_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_activity_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_activity_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_assignment_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_assignment_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_assignment_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_generic_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_generic_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_generic_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_person_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_person_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_person_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_project_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_project_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_project_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ocupation_report_between"("initial_date" "date", "final_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."ocupation_report_between"("initial_date" "date", "final_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ocupation_report_between"("initial_date" "date", "final_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_date"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_date"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_date"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_timestamp"() TO "service_role";


















GRANT ALL ON TABLE "public"."activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."assignments" TO "anon";
GRANT ALL ON TABLE "public"."assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."assignments" TO "service_role";



GRANT ALL ON TABLE "public"."assignments_history" TO "anon";
GRANT ALL ON TABLE "public"."assignments_history" TO "authenticated";
GRANT ALL ON TABLE "public"."assignments_history" TO "service_role";



GRANT ALL ON TABLE "public"."auth_users" TO "anon";
GRANT ALL ON TABLE "public"."auth_users" TO "authenticated";
GRANT ALL ON TABLE "public"."auth_users" TO "service_role";



GRANT ALL ON TABLE "public"."client_contacts" TO "anon";
GRANT ALL ON TABLE "public"."client_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."client_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."people" TO "anon";
GRANT ALL ON TABLE "public"."people" TO "authenticated";
GRANT ALL ON TABLE "public"."people" TO "service_role";



GRANT ALL ON TABLE "public"."people_history" TO "anon";
GRANT ALL ON TABLE "public"."people_history" TO "authenticated";
GRANT ALL ON TABLE "public"."people_history" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."projects_history" TO "anon";
GRANT ALL ON TABLE "public"."projects_history" TO "authenticated";
GRANT ALL ON TABLE "public"."projects_history" TO "service_role";



GRANT ALL ON TABLE "public"."timeoffs" TO "anon";
GRANT ALL ON TABLE "public"."timeoffs" TO "authenticated";
GRANT ALL ON TABLE "public"."timeoffs" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
