import { PrismaClient, User, UserUserRelationType } from '../../src/generated/prisma'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding family relationships for tests...')

  // --- 1. Fetch required code table records ---
  const memberRole = await prisma.groupUserRole.findFirst({ where: { code: 'member' } })
  if (!memberRole) throw new Error('Member role not found')

  const parentRelation = await prisma.userUserRelationType.findFirst({ where: { code: 'parent' } })
  if (!parentRelation) throw new Error('Parent relation type not found')

  const spouseRelation = await prisma.userUserRelationType.findFirst({ where: { code: 'spouse' } })
  if (!spouseRelation) throw new Error('Spouse relation type not found')

  const partnerRelation = await prisma.userUserRelationType.findFirst({ where: { code: 'partner' } })
  if (!partnerRelation) throw new Error('Partner relation type not found')

  // --- Helper Functions ---
  const users = new Map<string, User>()

  async function getOrCreateUser(name: string, gender: 'male' | 'female' | null = null): Promise<User> {
    if (users.has(name)) return users.get(name)!

    const hashedPassword = await bcrypt.hash('password', 10)

    const user = await prisma.user.upsert({
      where: { username: name.replace(/\s/g, '_') },
      update: {},
      create: {
        email: `${name.replace(/\s/g, '_')}@test.com`,
        username: name.replace(/\s/g, '_'),
        password: hashedPassword,
        firstName: name,
        gender: gender,
        groupMemberships: {
          create: {
            group: {
              connectOrCreate: {
                where: { slug: 'test-family' }, // Correct slug for tests
                create: {
                  name: 'Test Family',
                  slug: 'test-family',
                  idTree: 'test-family',
                  description: 'A group for testing family relationships.',
                  groupType: { connect: { code: 'family' } },
                },
              },
            },
            role: { connect: { id: memberRole!.id } },
          },
        },
      },
    })
    users.set(name, user)
    return user
  }

  async function createRelationship(user1: User, user2: User, code: UserUserRelationType) {
    await prisma.userUser.upsert({
      where: {
        user1Id_user2Id_relationTypeId: {
          user1Id: user1.id,
          user2Id: user2.id,
          relationTypeId: code.id,
        },
      },
      create: { user1Id: user1.id, user2Id: user2.id, relationTypeId: code.id },
      update: {},
    })
  }

  async function createParentChild(parent: User, child: User) {
    await createRelationship(parent, child, parentRelation!)
  }

  async function createSpouse(user1: User, user2: User) {
    await createRelationship(user1, user2, spouseRelation!)
    await createRelationship(user2, user1, spouseRelation!) // Mutual
  }

  async function createPartner(user1: User, user2: User) {
    await createRelationship(user1, user2, partnerRelation!)
    await createRelationship(user2, user1, partnerRelation!) // Mutual
  }

  // --- Dynamic User and Relationship Creation ---
  const ego = await getOrCreateUser('Ego', 'female')

  const relationshipPaths = [
    { label: 'Child', path: 'child' },
    { label: 'Parent', path: 'parent' },
    { label: 'Spouse', path: 'spouse' },
    { label: 'Grandchild', path: 'child > child' },
    { label: 'Grandparent', path: 'parent > parent' },
    { label: 'Sibling', path: 'parent > child' },
    { label: 'Half Brother', path: 'parent > child' },
    { label: 'Half Sister', path: 'parent > child' },
    { label: 'Great-grandchild', path: 'child > child > child' },
    { label: 'Great-grandparent', path: 'parent > parent > parent' },
    { label: 'Nibling', path: 'parent > child > child' },
    { label: 'Pibling', path: 'parent > parent > child' },
    { label: 'Cousin', path: 'parent > parent > child > child' },
    { label: 'Great-great-grandchild', path: 'child > child > child > child' },
    { label: 'Great-great-grandparent', path: 'parent > parent > parent > parent' },
    { label: 'Great-nibling', path: 'parent > child > child > child' },
    { label: 'Great-pibling', path: 'parent > parent > parent > child' },
    { label: '1st cousin-once-removed', path: 'parent > parent > child > child > child' },
    { label: '1st cousin-once-removed', path: 'parent > parent > parent > child > child' },
    { label: 'Great-great-nibling', path: 'parent > child > child > child > child' },
    { label: 'Great-great-pibling', path: 'parent > parent > parent > parent > child' },
    { label: '2nd cousin', path: 'parent > parent > parent > child > child > child' },
    { label: 'Child-in-law', path: 'child > spouse' },
    { label: 'Parent-in-law', path: 'spouse > parent' },
    { label: 'Grandparent-in-law', path: 'spouse > parent > parent' },
    { label: 'Sibling-in-law', path: 'spouse > parent > child' },
    { label: 'Great-grandparent-in-law', path: 'spouse > parent > parent > parent' },
    { label: 'Nibling-in-law', path: 'spouse > parent > child > child' },
    { label: 'Pibling-in-law', path: 'parent > parent > child > spouse' },
    { label: 'Pibling-in-law', path: 'spouse > parent > parent > child' },
    { label: 'Cousin-in-law', path: 'spouse > parent > parent > child > child' },
    { label: 'Great-great-grandparent-in-law', path: 'spouse > parent > parent > parent > parent' },
    { label: 'Great-nibling-in-law', path: 'spouse > parent > child > child > child' },
    { label: 'Great-pibling-in-law', path: 'parent > parent > parent > child > spouse' },
    { label: 'Pibling-in-law', path: 'spouse > parent > parent > child > spouse' },
    { label: '1st cousin-once-removed-in-law', path: 'spouse > parent > parent > child > child > child' },
    { label: '1st cousin-once-removed-in-law', path: 'spouse > parent > parent > parent > child > child' },
    { label: '1st cousin-once-removed-in-law', path: 'parent > parent > parent > child > child > spouse' },
    { label: 'Great-great-nibling-in-law', path: 'spouse > parent > child > child > child > child' },
    { label: 'Great-great-pibling-in-law', path: 'parent > parent > parent > parent > child > spouse' },
    { label: '1st cousin-once-removed-in-law', path: 'spouse > parent > parent > parent > child > child > spouse' },
    { label: '2nd cousin-in-law', path: 'spouse > parent > parent > parent > child > child > child' },
    { label: 'Step-child', path: 'spouse > child' },
    { label: 'Step-parent', path: 'parent > spouse' },
    { label: 'Step-grandchild', path: 'spouse > child > child' },
    { label: 'Step-grandparent', path: 'parent > spouse > parent' },
    { label: 'Step-sibling', path: 'parent > spouse > child' },
    { label: 'Step-great-grandchild', path: 'spouse > child > child > child' },
    { label: 'Step-great-grandparent', path: 'parent > spouse > parent > parent' },
    { label: 'Step-nibling', path: 'parent > child > spouse > child' },
    { label: 'Step-pibling', path: 'parent > spouse > parent > child' },
    { label: 'Step-great-great-grandchild', path: 'spouse > child > child > child > child' },
    { label: 'Step-great-great-grandparent', path: 'parent > spouse > parent > parent > parent' },
    { label: 'Step-great-nibling', path: 'parent > child > spouse > child > child' },
    { label: 'Step-great-pibling', path: 'parent > spouse > parent > parent > child' },
    { label: 'Step-cousin', path: 'parent > spouse > parent > child > child' },
    { label: 'Step-1st cousin-once-removed', path: 'parent > spouse > parent > child > child > child' },
    { label: 'Step-1st cousin-once-removed', path: 'parent > spouse > parent > parent > child > child' },
    { label: 'Step-1st cousin-once-removed', path: 'parent > parent > parent > child > spouse > child' },
    { label: 'Step-great-great-nibling', path: 'parent > child > spouse > child > child > child' },
    { label: 'Step-great-great-pibling', path: 'parent > spouse > parent > parent > parent > child' },
    { label: 'Step-2nd cousin', path: 'parent > spouse > parent > parent > child > child > child' },
    { label: 'Step-2nd cousin', path: 'parent > parent > parent > child > child > spouse > child' },
    { label: 'Partner', path: 'partner' },
    { label: 'Co-child', path: 'partner > child' },
    { label: 'Co-parent', path: 'parent > partner' },
    { label: 'Co-parent', path: 'partner > parent' },
    { label: 'Co-grandchild', path: 'partner > child > child' },
    { label: 'Co-grandparent', path: 'parent > partner > parent' },
    { label: 'Co-grandparent', path: 'partner > parent > parent' },
    { label: 'Co-sibling', path: 'parent > partner > child' },
    { label: 'Co-sibling', path: 'partner > parent > child' },
    { label: 'Co-great-grandchild', path: 'partner > child > child > child' },
    { label: 'Co-great-grandparent', path: 'parent > partner > parent > parent' },
    { label: 'Co-great-grandparent', path: 'partner > parent > parent > parent' },
    { label: 'Co-nibling', path: 'partner > parent > child > child' },
    { label: 'Co-nibling', path: 'parent > child > partner > child' },
    { label: 'Co-pibling', path: 'parent > partner > parent > child' },
    { label: 'Co-pibling', path: 'partner > parent > parent > child' },
    { label: 'Co-cousin', path: 'partner > parent > parent > child > child' },
    { label: 'Co-great-great-grandchild', path: 'partner > child > child > child > child' },
    { label: 'Co-great-nibling', path: 'partner > parent > child > child > child' },
    { label: 'Co-great-nibling', path: 'parent > child > child > partner > child' },
    { label: 'Co-great-pibling', path: 'parent > partner > parent > parent > child' },
    { label: 'Co-great-pibling', path: 'partner > parent > parent > parent > child' },
    { label: 'Co-1st cousin-once-removed', path: 'partner > parent > parent > child > child > child' },
    { label: 'Co-1st cousin-once-removed', path: 'partner > parent > parent > parent > child > child' },
    { label: 'Co-1st cousin-once-removed', path: 'parent > parent > parent > child > child > partner' },
    { label: 'Co-1st cousin-once-removed', path: 'parent > parent > child > child > partner > child' },
    { label: 'Co-2nd cousin', path: 'partner > parent > parent > parent > child > child > child' },
    { label: 'Co-2nd cousin', path: 'parent > parent > parent > child > child > child > partner' },
  ]

  for (const { label, path } of relationshipPaths) {
    const alterName = label === 'Half Brother' || label === 'Half Sister' ? label : `Ego > ${path}`
    let currentUser = ego
    const pathSegments = path.split(' > ')

    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i]
      const isLastSegment = i === pathSegments.length - 1
      const nextUserGender = isLastSegment ? (label.includes('Brother') ? 'male' : label.includes('Sister') ? 'female' : null) : null
      const nextUserName = isLastSegment ? alterName : `${currentUser.firstName} > ${segment}`

      let nextUser: User | undefined = users.get(nextUserName)

      if (!nextUser) {
        switch (segment) {
          case 'parent':
            const p1 = await getOrCreateUser(nextUserName, 'male')
            await createParentChild(p1, currentUser)
            // For Sibling test, ensure two common parents
            if (alterName === 'Sibling') {
                const p2_name = `${p1.firstName}'s Spouse`;
                const p2 = await getOrCreateUser(p2_name, 'female');
                await createSpouse(p1, p2);
                await createParentChild(p2, currentUser);
            }
            nextUser = p1
            break
          case 'child':
            const c1 = await getOrCreateUser(nextUserName, nextUserGender)
            await createParentChild(currentUser, c1)
            nextUser = c1
            break
          case 'spouse':
            const s1 = await getOrCreateUser(nextUserName, nextUserGender || 'female')
            await createSpouse(currentUser, s1)
            nextUser = s1
            break
          case 'partner':
            const pa1 = await getOrCreateUser(nextUserName, nextUserGender || 'male')
            await createPartner(currentUser, pa1)
            nextUser = pa1
            break;
        }
      }
      currentUser = nextUser!
    }
  }

  console.log(`✅ ${users.size} users created and relationships seeded.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

