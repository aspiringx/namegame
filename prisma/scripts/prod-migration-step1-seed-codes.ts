// prisma/scripts/prod-migration-step1-seed-codes.ts
import {
  PrismaClient,
  UserUserRelationCategory,
} from '../../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting Step 1: Seeding new code tables...')

  // Seed GroupType
  const groupTypes = [
    { id: 1, code: 'business' },
    { id: 2, code: 'church' },
    { id: 3, code: 'family' },
    { id: 4, code: 'friends' },
    { id: 5, code: 'neighborhood' },
    { id: 6, code: 'school' },
  ]
  for (const gt of groupTypes) {
    await prisma.groupType.upsert({
      where: { id: gt.id },
      update: {},
      create: gt,
    })
    console.log(`Seeded GroupType: ${gt.code}`)
  }

  // Seed UserUserRelationType
  const relationTypes = [
    { id: 1, code: 'acquaintance', category: UserUserRelationCategory.other },
    { id: 2, code: 'friend', category: UserUserRelationCategory.other },
    { id: 3, code: 'family', category: UserUserRelationCategory.family },
  ]
  for (const rt of relationTypes) {
    await prisma.userUserRelationType.upsert({
      where: { id: rt.id },
      update: {},
      create: rt,
    })
    console.log(`Seeded UserUserRelationType: ${rt.code}`)
  }

  // Seed GroupUserRole
  const roleTypes = [
    { id: 1, code: 'admin' },
    { id: 2, code: 'member' },
    { id: 3, code: 'super' },
    { id: 4, code: 'guest' },
  ]
  for (const role of roleTypes) {
    await prisma.groupUserRole.upsert({
      where: { id: role.id },
      update: {},
      create: role,
    })
    console.log(`Seeded GroupUserRole: ${role.code}`)
  }

  // Seed EntityType
  const entityTypes = [
    { id: 1, code: 'group' },
    { id: 2, code: 'user' },
  ]
  for (const et of entityTypes) {
    await prisma.entityType.upsert({
      where: { id: et.id },
      update: {},
      create: et,
    })
    console.log(`Seeded EntityType: ${et.code}`)
  }

  // Seed PhotoType
  const photoTypes = [
    { id: 1, code: 'logo' },
    { id: 2, code: 'primary' },
    { id: 3, code: 'other' },
  ]
  for (const pt of photoTypes) {
    await prisma.photoType.upsert({
      where: { id: pt.id },
      update: {},
      create: pt,
    })
    console.log(`Seeded PhotoType: ${pt.code}`)
  }

  console.log('Step 1 finished successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
