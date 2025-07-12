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




