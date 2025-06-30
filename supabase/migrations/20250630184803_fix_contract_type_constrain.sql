-- Step 1: Drop the existing constraint
ALTER TABLE public.projects
DROP CONSTRAINT projects_contract_type_check;

-- Step 2: Add the new constraint
ALTER TABLE public.projects
ADD CONSTRAINT projects_contract_type_check
CHECK (
    contract_type = ANY (
        ARRAY['Retainer', 'FP-FY', 'T&M']
    )
);
