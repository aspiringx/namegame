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



REMOVE BELOW AFTER STEPS ARE COMPLETED

Step 1: Set Up Your DigitalOcean Space
First, you need to create the Space and get the necessary credentials.

Create a Space:
In your DigitalOcean dashboard, go to Spaces and click Create a Space.
Choose a datacenter region (e.g., NYC3).
Under Restrict File Listing, select Private. This is essential for security.
Choose a unique name for your Space (this is your "bucket" name, e.g., namegame-uploads).
Click Create a Space.
Generate API Keys:
In the DigitalOcean dashboard, go to the API section (in the main left-hand menu).
Scroll down to Spaces access keys and click Generate New Key.
Give it a name (e.g., namegame-uploader).
Important: Copy both the Access Key and the Secret Key immediately and save them somewhere secure. You will not be able to see the Secret Key again.
Step 2: Configure Environment Variables in DigitalOcean
Now, you need to add these keys and your Space's details to your app's environment variables on DigitalOcean. Go to your app's Settings -> Components -> select your Next.js component. Add the following variables, ensuring their scope is set to "Build & Run Time":

STORAGE_PROVIDER: do_spaces
DO_SPACES_KEY: Your generated Access Key.
DO_SPACES_SECRET: Your generated Secret Key.
DO_SPACES_ENDPOINT: The endpoint URL for your Space (e.g., nyc3.digitaloceanspaces.com). You can find this in your Space's settings.
DO_SPACES_REGION: The region of your Space (e.g., nyc3).
DO_SPACES_BUCKET: The name you gave your Space (e.g., namegame-uploads).
Step 3: Code Implementation Plan
Here's how we'll modify the code.

Install the AWS SDK: We need to add the necessary package to communicate with your Space.
Update File Upload Logic: We will modify your existing processImage function. It will check for the STORAGE_PROVIDER environment variable.
If it's not set (i.e., in development), it will save the file locally.
If it's set to do_spaces (i.e., in production), it will upload the file to your Space.
Implement Secure URL Generation: We will create a new function that generates the pre-signed URLs for accessing the private files in production.
Update the UI: We will modify the pages that display images to use this new function, ensuring that users always get a valid (and secure) URL.
This is a significant but necessary architectural change for a production application.

Are you ready to proceed with the code modifications?