import { PrismaClient, User, UserUserRelationCategory } from '../../src/generated/prisma'
import * as fs from 'fs'
import * as path from 'path'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting family group seeder...')

  // --- 1. Fetch required code table records ---
  const memberRole = await prisma.groupUserRole.findFirst({ where: { code: 'member', groupId: null } })
  const parentRelation = await prisma.userUserRelationType.findFirst({ where: { code: 'parent', groupId: null } })
  const spouseRelation = await prisma.userUserRelationType.findFirst({ where: { code: 'spouse', groupId: null } })
  const partnerRelation = await prisma.userUserRelationType.findFirst({ where: { code: 'partner', groupId: null } })

  if (!memberRole || !parentRelation || !spouseRelation || !partnerRelation) {
    throw new Error('Required base codes not found. Make sure the main seed script has been run.')
  }

  // --- 2. Upsert the Test Family Group ---
  const familyGroup = await prisma.group.upsert({
    where: { slug: 'test-family' },
    update: { name: 'The Test Family' },
    create: {
      name: 'The Test Family',
      slug: 'test-family',
      idTree: 'test-family', // This might need a more robust generation strategy
      groupType: { connect: { code: 'family' } },
    },
  })
  console.log(`Upserted group: '${familyGroup.name}'`)

  // --- 3. Read and parse CSV data ---
  const csvPath = path.join(__dirname, '../../docs/outdated/family-tree-list.csv')
  if (!fs.existsSync(csvPath)) {
    console.warn(`Warning: CSV file not found at ${csvPath}. Skipping family tree creation.`)
    return
  }
  const csvData = fs.readFileSync(csvPath, 'utf-8')
  const lines = csvData.split('\n').slice(1) // Skip header
  const relationshipPaths = lines
    .map((line) => {
      const [label, path] = line.split(',')
      return { label: label?.trim(), path: path?.trim() }
    })
    .filter((p) => p.label && p.path)

  // --- 4. Process relationships and create users ---
  const users = new Map<string, User>()

  // Ensure Ego exists first
  const ego = await getOrCreateUser('Ego', memberRole.id)

  // Create dedicated half-siblings for testing
  const commonParent = await getOrCreateUser('Common Parent', memberRole.id)
  const egoOtherParent = await getOrCreateUser('Ego Other Parent', memberRole.id)
  await createParentChild(commonParent, ego)
  await createParentChild(egoOtherParent, ego)

  const halfBrotherOtherParent = await getOrCreateUser('Half Brother Other Parent', memberRole.id)
  const halfBrother = await getOrCreateUser('Half Brother', memberRole.id, 'male')
  await createParentChild(commonParent, halfBrother)
  await createParentChild(halfBrotherOtherParent, halfBrother)

  const halfSisterOtherParent = await getOrCreateUser('Half Sister Other Parent', memberRole.id)
  const halfSister = await getOrCreateUser('Half Sister', memberRole.id, 'female')
  await createParentChild(commonParent, halfSister)
  await createParentChild(halfSisterOtherParent, halfSister)

  // Process paths from CSV
  for (const { path } of relationshipPaths) {
    if (path === 'parent > child') continue // Skip redundant sibling path

    const steps = path.trim().split(/\s*>\s*/)
    let pathParts = ['Ego']

    for (const step of steps) {
      const previousUserPath = pathParts.join(' > ')
      pathParts.push(step)
      const currentUserPath = pathParts.join(' > ')

      const previousUser = await getOrCreateUser(previousUserPath, memberRole.id)
      const currentUser = await getOrCreateUser(currentUserPath, memberRole.id)

      switch (step) {
        case 'parent':
          await createParentChild(currentUser, previousUser)
          break
        case 'child':
          // Special handling for sibling creation
          if (currentUserPath === 'Ego > parent > child') {
            const egoParent1 = await getOrCreateUser('Ego > parent', memberRole.id)
            const egoParent2 = await getOrCreateUser('Ego > parent 2', memberRole.id)
            await createParentChild(egoParent1, currentUser)
            await createParentChild(egoParent2, currentUser)
          } else {
            await createParentChild(previousUser, currentUser)
          }
          break
        case 'spouse':
          await createSpouse(previousUser, currentUser)
          break
        case 'partner':
          await createPartner(previousUser, currentUser)
          break
      }
    }
  }

  // --- Helper Functions ---

  async function getOrCreateUser(path: string, memberRoleId: number, gender: 'male' | 'female' | null = null): Promise<User> {
    if (users.has(path)) {
      return users.get(path)!
    }

    const email = `${path.toLowerCase().replace(/\s*>?\s*/g, '.')}@test.com`
    const hashedPassword = await bcrypt.hash('password', 10)

    const user = await prisma.user.upsert({
      where: { email },
      update: { firstName: path },
      create: {
        username: email,
        password: hashedPassword,
        firstName: path,
        email: email,
        gender,
      },
    })

    // Ensure user is a member of the family group
    await prisma.groupUser.upsert({
      where: { userId_groupId: { userId: user.id, groupId: familyGroup.id } },
      update: { roleId: memberRoleId },
      create: { userId: user.id, groupId: familyGroup.id, roleId: memberRoleId },
    })

    users.set(path, user)
    return user
  }

  async function createParentChild(parent: User, child: User) {
    await prisma.userUser.upsert({
      where: {
        user_relation_type_group_unique: {
          user1Id: parent.id,
          user2Id: child.id,
          relationTypeId: parentRelation!.id,
          groupId: familyGroup.id,
        },
      },
      update: {},
      create: {
        user1Id: parent.id,
        user2Id: child.id,
        relationTypeId: parentRelation!.id,
        groupId: familyGroup.id,
      },
    })
  }

  async function createSpouse(user1: User, user2: User) {
    await prisma.userUser.upsert({
      where: {
        user_relation_type_group_unique: {
          user1Id: user1.id,
          user2Id: user2.id,
          relationTypeId: spouseRelation!.id,
          groupId: familyGroup.id,
        },
      },
      update: {},
      create: {
        user1Id: user1.id,
        user2Id: user2.id,
        relationTypeId: spouseRelation!.id,
        groupId: familyGroup.id,
      },
    })
  }

  async function createPartner(user1: User, user2: User) {
    await prisma.userUser.upsert({
      where: {
        user_relation_type_group_unique: {
          user1Id: user1.id,
          user2Id: user2.id,
          relationTypeId: partnerRelation!.id,
          groupId: familyGroup.id,
        },
      },
      update: {},
      create: {
        user1Id: user1.id,
        user2Id: user2.id,
        relationTypeId: partnerRelation!.id,
        groupId: familyGroup.id,
      },
    })
  }

  console.log(`Seeding finished. Upserted ${users.size} users.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
