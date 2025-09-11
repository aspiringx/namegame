import { FamilyGroupClient } from './FamilyGroupClient'
import GridView from './GridView'

export default function FamilyGridPage() {
  return (
    <FamilyGroupClient view="grid">
      <GridView />
    </FamilyGroupClient>
  )
}
