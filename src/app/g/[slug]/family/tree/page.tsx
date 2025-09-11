import { FamilyGroupClient } from '../FamilyGroupClient'
import TreeView from '../TreeView'

export default function FamilyTreePage() {
  return (
    <FamilyGroupClient view="tree">
      <TreeView />
    </FamilyGroupClient>
  )
}
