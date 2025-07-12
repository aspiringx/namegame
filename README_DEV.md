# Dev Notes

Use this to describe regular processes for this next.js app. 

## Prisma

- We define models that are the basis for postgres tables in schema.prisma.
- We're using next-auth for authentication. It stores usernames and passwords 
  in the users table. 
- After changing schemas.prisma, run `npx prisma generate` to generate the Prisma Client.
  - Docs just show `prisma generate`. We use npx because it's a local package, not global. 
- After generating the Prisma Client, run `npx prisma db push` to update the database.

## Migrations and Seed Scripts

- I asked cascade to create migrations to create the new Global Admin group and 
  add username joe to it with super role. 
- It suggested using a repeatable seed script instead of a migration, starting in seed.ts. 
  - I may change the name if we need more seeds. 


Cool. Now let's create a page for that code URL. When another person scans it:

* If they're already authenticated:
  * Create or update a UserUser relation
  * If the relation already exists, just update the updatedAt date and increment the greetCount
  * If not, create it with a relationType of 'acquaintance' and increment set the greetCount to 1
  * If the user is not already a member of the group, add a GroupUser relation with the role of 'guest'
  * Then redirect to the group page at "/g/[slug]"

* If the user is not authenticated, this page should say, "Welcome, you just met [firstName of the user from codes.userId]!" 
* Prompt the user to Login or Sign up
* If they choose Login, redirect to the /login page, then back to this page
* If they don't choose Login, have an inline form with just a First name input
* When they submit the first name:
  * Create a new user with the firstName and "guest" + timestamp as the username
  * Set the password to "password1" (they'll change it later)
  * Before submitting it to the server to create the user, check the users table to see if another user exists with that username. If it's taken, change the username to "username"+new timestamp to ensure it's unique.
 * After the new user is created:
    * Create a UserUser relation between this new user and the code.userId user with a relationType of 'acquaintance'
    * Create a GroupUser relation between this new user and the current group (from code.parentGroupId) with a role of 'guest'

