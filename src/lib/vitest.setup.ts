import { execSync } from 'child_process'

async function setup() {
  console.log('Setting up test database...')
  // Reset the database, run the main seeder, then the family seeder
  execSync('npx prisma migrate reset --force', { stdio: 'inherit' })
  execSync('npm run seed:family', { stdio: 'inherit' })
  console.log('Test database setup complete.')
}

export default setup
