import { PrismaClient, GroupUserRole } from '../../src/generated/prisma'
import { faker } from '@faker-js/faker'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log(`Start seeding community group...`)

  const communityGroupType = await prisma.groupType.findUnique({
    where: { code: 'community' },
  })

  if (!communityGroupType) {
    throw new Error(
      "Group type 'community' not found. Please run the base seeder first.",
    )
  }

  // Ensure the test group exists
  const testGroup = await prisma.group.upsert({
    where: { slug: 'the-test-community' },
    update: {},
    create: {
      name: 'The Test Community',
      slug: 'the-test-community',
      description: 'A test group for the community.',
      idTree: 'the-test-community',
      groupTypeId: communityGroupType.id,
    },
  })
  console.log(`Upserted group '${testGroup.name}' with id: ${testGroup.id}`)

  const targetGroupId = testGroup.id
  const numberOfUsersToCreate = 50
  const numberOfRelationsToCreate = 15

  // 1. Upsert random users
  const createdUsers = []
  console.log(`Upserting ${numberOfUsersToCreate} random users...`)
  const hashedPassword = await bcrypt.hash('password123', 10)

  for (let i = 0; i < numberOfUsersToCreate; i++) {
    const username = `${faker.internet.userName().toLowerCase()}_${Math.random().toString(36).substring(2, 7)}`
    try {
      const user = await prisma.user.upsert({
        where: { username },
        update: {},
        create: {
          username,
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          email: faker.internet.email().toLowerCase(),
          password: hashedPassword,
        },
      })
      createdUsers.push(user)
    } catch (error: any) {
      console.error(`Failed to upsert user ${username}. Skipping.`, error.message)
    }
  }
  console.log(`Successfully upserted ${createdUsers.length} users.`)

  // 2. Add them all to the test group with a role of 'member'
  const memberRole = await prisma.groupUserRole.findFirst({
    where: { code: 'member', groupId: null }, // Find the global 'member' role
  })

  if (!memberRole) {
    throw new Error("Global 'member' role not found. Please run the base seeder first.")
  }

  console.log(`Adding ${createdUsers.length} users to group ${targetGroupId} as members...`)
  for (const user of createdUsers) {
    await prisma.groupUser.upsert({
      where: { userId_groupId: { userId: user.id, groupId: targetGroupId } },
      update: { roleId: memberRole.id },
      create: {
        userId: user.id,
        groupId: targetGroupId,
        roleId: memberRole.id,
      },
    })
  }
  console.log(`Successfully added ${createdUsers.length} users to group.`)

  // 3. Add relationships between them
  const acquaintanceRelation = await prisma.userUserRelationType.findFirst({
    where: { code: 'acquaintance', groupId: null },
  })

  if (!acquaintanceRelation) {
    throw new Error("'acquaintance' relation type not found. Please run the base seeder first.")
  }

  if (createdUsers.length >= 2) {
    const targetUserForRelations = createdUsers[0]!
    const usersForRelation = createdUsers.slice(1, numberOfRelationsToCreate + 1)

    console.log(`Creating ${usersForRelation.length} relationships with user ${targetUserForRelations.username}...`)
    for (const user of usersForRelation) {
      if (user.id === targetUserForRelations.id) continue
      await prisma.userUser.upsert({
        where: {
          user_relation_type_group_unique: {
            user1Id: targetUserForRelations.id,
            user2Id: user.id,
            relationTypeId: acquaintanceRelation.id,
            groupId: targetGroupId,
          },
        },
        update: {},
        create: {
          user1Id: targetUserForRelations.id,
          user2Id: user.id,
          relationTypeId: acquaintanceRelation.id,
          groupId: targetGroupId,
        },
      })
    }
    console.log(`Successfully created ${usersForRelation.length} relationships.`)
  }

  console.log(`\nSeeding finished.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
