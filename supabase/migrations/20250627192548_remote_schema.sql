alter table "public"."projects" drop constraint "projects_status_check";

alter table "public"."projects" add constraint "projects_status_check" CHECK (((status)::text = ANY ((ARRAY['In Progress'::character varying, 'Finished'::character varying, 'On Hold'::character varying, 'Not Started'::character varying])::text[]))) not valid;

alter table "public"."projects" validate constraint "projects_status_check";


