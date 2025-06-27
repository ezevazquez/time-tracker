create or replace function log_generic_changes()
returns trigger as $$
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
    SELECT 
        raw_user_meta_data ->> 'name',
        raw_user_meta_data ->> 'email'
    INTO user_name, user_email
    FROM auth.users
    WHERE id = user_id;


    -- INSERT: Log all new values
    if TG_OP = 'INSERT' then
        new_vals := hstore(new);
        foreach key in array akeys(new_vals) loop
            insert into audit_log (
                table_name, record_id, field_name, old_value, new_value,
                changed_by, changed_by_name, changed_by_email, action
            )
            values (
                TG_TABLE_NAME, new.id, key, null, new_vals -> key,
                user_id, user_name, user_email, TG_OP
            );
        end loop;

    -- DELETE: Log all old values
    elsif TG_OP = 'DELETE' then
        old_vals := hstore(old);
        foreach key in array akeys(old_vals) loop
            insert into audit_log (
                table_name, record_id, field_name, old_value, new_value,
                changed_by, changed_by_name, changed_by_email, action
            )
            values (
                TG_TABLE_NAME, old.id, key, old_vals -> key, null,
                user_id, user_name, user_email, TG_OP
            );
        end loop;

    -- UPDATE: Log only changed values
    elsif TG_OP = 'UPDATE' then
        old_vals := hstore(old);
        new_vals := hstore(new);
        keys := akeys(new_vals - old_vals);

        foreach key in array keys loop
            if old_vals -> key is distinct from new_vals -> key then
                insert into audit_log (
                    table_name, record_id, field_name, old_value, new_value,
                    changed_by, changed_by_name, changed_by_email, action
                )
                values (
                    TG_TABLE_NAME, new.id, key, old_vals -> key, new_vals -> key,
                    user_id, user_name, user_email, TG_OP
                );
            end if;
        end loop;
    end if;

    return null;
end;
$$ language plpgsql;