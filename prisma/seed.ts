import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Check for a specific seeder argument
  const seederArg = process.argv.find((arg) => arg.startsWith('--seeder='))

  if (seederArg) {
    const seederFileName = seederArg.split('=')[1]
    console.log(`Running specific seeder: ${seederFileName}`)
    try {
      await import(`./seeds/${seederFileName}`)
    } catch (error) {
      console.error(`Error running seeder ${seederFileName}:`, error)
      process.exit(1)
    }
    return // Exit after running the specific seeder
  }

  console.log(`Start seeding ...`)

  // --- Seed Code Tables ---
  console.log('Seeding code tables...')

  // Reset sequences to prevent primary key conflicts on subsequent runs
  console.log('  - Resetting code table sequences...')
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('entity_types', 'id'), coalesce(max(id), 1)) FROM entity_types;`
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('group_types', 'id'), coalesce(max(id), 1)) FROM group_types;`
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('group_user_roles', 'id'), coalesce(max(id), 1)) FROM group_user_roles;`
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('photo_types', 'id'), coalesce(max(id), 1)) FROM photo_types;`
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('user_user_relation_types', 'id'), coalesce(max(id), 1)) FROM user_user_relation_types;`

  const entityTypes = [{ code: 'group' }, { code: 'user' }]
  for (const et of entityTypes) {
    await prisma.$executeRaw`INSERT INTO entity_types (code) VALUES (${et.code}) ON CONFLICT (code) DO NOTHING;`
  }
  console.log(`  - Seeded ${entityTypes.length} entity types.`)

  const groupTypes = [{ code: 'community' }, { code: 'family' }]
  for (const gt of groupTypes) {
    await prisma.groupType.upsert({ where: { code: gt.code }, update: {}, create: gt })
  }
  console.log(`  - Seeded ${groupTypes.length} group types.`)

  const groupUserRoles = [{ code: 'admin' }, { code: 'member' }, { code: 'super' }, { code: 'guest' }]
  for (const gur of groupUserRoles) {
    await prisma.$executeRaw`INSERT INTO group_user_roles (code) VALUES (${gur.code}) ON CONFLICT (code) DO NOTHING;`
  }
  console.log(`  - Seeded ${groupUserRoles.length} group user roles.`)

  const photoTypes = [{ code: 'logo' }, { code: 'primary' }, { code: 'other' }]
  for (const pt of photoTypes) {
    await prisma.$executeRaw`INSERT INTO photo_types (code) VALUES (${pt.code}) ON CONFLICT (code) DO NOTHING;`
  }
  console.log(`  - Seeded ${photoTypes.length} photo types.`)

  const relationTypes = [
    { code: 'acquaintance', category: 'other' },
    { code: 'friend', category: 'other' },
    { code: 'family', category: 'other' },
    { code: 'parent', category: 'family' },
    { code: 'spouse', category: 'family' },
    { code: 'partner', category: 'family' },
  ]
  for (const rt of relationTypes) {
    await prisma.$executeRaw`INSERT INTO user_user_relation_types (code, category) VALUES (${rt.code}, ${rt.category}::"UserUserRelationCategory") ON CONFLICT (code, category) DO UPDATE SET category = ${rt.category}::"UserUserRelationCategory";`
  }
  console.log(`  - Seeded ${relationTypes.length} user user relation types.`)

  // --- Seed Users and Groups ---
  console.log('Seeding users and groups...')

  const hashedPassword = await bcrypt.hash('password123', 10)

  const gadminUser = await prisma.user.upsert({
    where: { username: 'gadmin' },
    update: {},
    create: {
      username: 'gadmin',
      firstName: 'Global',
      lastName: 'Admin',
      password: hashedPassword,
    },
  })
  console.log(`  - Upserted 'gadmin' user.`)

  const joeUser = await prisma.user.upsert({
    where: { username: 'joe' },
    update: {},
    create: {
      username: 'joe',
      firstName: 'Joe',
      lastName: 'Tippetts',
      password: hashedPassword,
      createdById: gadminUser.id,
      updatedById: gadminUser.id,
    },
  })
  console.log(`  - Upserted 'joe' user.`)

  const familyGroupType = await prisma.groupType.findUnique({ where: { code: 'family' } })
  if (!familyGroupType) throw new Error('Family group type not found')

  const adminGroup = await prisma.group.upsert({
    where: { slug: 'global-admin' },
    update: {},
    create: {
      name: 'Global Admin',
      slug: 'global-admin',
      idTree: 'global-admin',
      description: 'Group for super administrators of the entire application.',
      groupTypeId: familyGroupType.id,
      createdById: gadminUser.id,
      updatedById: gadminUser.id,
    },
  })
  console.log(`  - Upserted 'global-admin' group.`)

  const superUserRole = await prisma.groupUserRole.findFirst({ where: { code: 'super' } })
  if (!superUserRole) throw new Error('Super user role not found')

  await prisma.groupUser.upsert({
    where: {
      userId_groupId: {
        userId: gadminUser.id,
        groupId: adminGroup.id,
      },
    },
    update: { roleId: superUserRole.id },
    create: {
      userId: gadminUser.id,
      groupId: adminGroup.id,
      roleId: superUserRole.id,
    },
  })
  console.log(`  - Ensured 'gadmin' is a super user in 'global-admin' group.`)

  console.log(`Seeding finished.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
