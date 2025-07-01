CREATE POLICY "Allow access to authenticated users" ON "public"."profiles" TO "authenticated" USING (("set_config"('app.current_user_id'::"text", ("auth"."uid"())::"text", true) IS NOT NULL));
CREATE POLICY "Allow access to authenticated users" ON "public"."timeoffs" TO "authenticated" USING (("set_config"('app.current_user_id'::"text", ("auth"."uid"())::"text", true) IS NOT NULL));
CREATE POLICY "Allow access to authenticated users" ON "public"."auth_users" TO "authenticated" USING (("set_config"('app.current_user_id'::"text", ("auth"."uid"())::"text", true) IS NOT NULL));

ALTER TABLE public.projects
DROP CONSTRAINT projects_contract_type_check;

ALTER TABLE public.projects
ADD CONSTRAINT projects_contract_type_check
CHECK (
    contract_type = ANY (
        ARRAY['Retainer', 'FP-FY', 'T&M', 'Interno']
    )
);
