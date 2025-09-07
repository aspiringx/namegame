import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { MemberWithUser } from '@/types';

const DB_NAME = 'name-game-db';
const DB_VERSION = 1;
const MEMBERS_STORE = 'members';

interface NameGameDB extends DBSchema {
  [MEMBERS_STORE]: {
    key: string;
    value: MemberWithUser;
    indexes: { 'by-group': number };
  };
}

let dbPromise: Promise<IDBPDatabase<NameGameDB>> | null = null;

const getDb = (): Promise<IDBPDatabase<NameGameDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<NameGameDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(MEMBERS_STORE)) {
          const store = db.createObjectStore(MEMBERS_STORE, { keyPath: 'userId' });
          store.createIndex('by-group', 'groupId');
        }
      },
    });
  }
  return dbPromise;
};

export async function saveMembers(members: MemberWithUser[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(MEMBERS_STORE, 'readwrite');
  await Promise.all(members.map(member => tx.store.put(member)));
  await tx.done;
}

export async function getMembersByGroup(groupId: number): Promise<MemberWithUser[]> {
  const db = await getDb();
  return db.getAllFromIndex(MEMBERS_STORE, 'by-group', groupId);
}
