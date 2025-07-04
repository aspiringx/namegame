DO $$
DECLARE
    new_group_id INT;
BEGIN
    -- Ensure user with ID 9 exists. This is necessary for the foreign key constraint on group_users.
    -- We use ON CONFLICT to avoid errors if the user already exists in the local dev database.
    INSERT INTO "users" (id, "firstName", "lastName", "createdAt", "updatedAt")
    VALUES (9, 'Global', 'Admin', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Create the new group
    INSERT INTO "groups" ("name", "slug", "description", "idTree", "createdAt", "updatedAt")
    VALUES ('Global Admin', 'group-admin', 'Group for global NameGame admins', 'temp-id-tree', NOW(), NOW())
    RETURNING id INTO new_group_id;

    -- Update the idTree for the new group to be its own ID, which is a common convention for root groups.
    UPDATE "groups"
    SET "idTree" = new_group_id::text
    WHERE id = new_group_id;

    -- Add user 9 to the new group with the 'super' role
    INSERT INTO "group_users" ("userId", "groupId", "role", "createdAt", "updatedAt")
    VALUES (9, new_group_id, 'super', NOW(), NOW());
END $$;
