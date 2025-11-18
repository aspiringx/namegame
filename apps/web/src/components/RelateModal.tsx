'use client'

import {
  useState,
  useEffect,
  useTransition,
  useRef,
  useMemo,
  useCallback,
} from 'react'
import { X } from 'lucide-react'
import Modal from './ui/modal'
import {
  Combobox,
  type ComboboxOption,
  type DividerOption as ComboboxOptionDivider,
} from './ui/combobox'
import { toast } from 'sonner'
import {
  addUserRelation,
  deleteUserRelation,
  updateUserRelation,
  getRelationTypes,
  getMemberRelations,
} from '@/lib/actions'
import { updateUserGender, updateUserBirthDate } from '@/app/(main)/me/actions'

import type { MemberWithUser as Member, FullRelationship } from '@/types/index'
import type {
  GroupType,
  Gender,
  User,
  UserUser,
  UserUserRelationType,
} from '@namegame/db'

// Determines the correct display label (e.g., 'child' vs 'parent').
function getRelationLabel(
  relation: RelationWithUser,
  mainUserId: string,
): string {
  if (relation.relationType.code === 'parent') {
    return relation.user1Id === mainUserId ? 'child' : 'parent'
  }
  return relation.relationType.code
}

// Determines the value for the dropdown selector.
function getRelationValue(
  relation: RelationWithUser,
  mainUserId: string,
  relationTypes: RelationTypeOption[],
): string | number {
  if (relation.relationType.code === 'parent') {
    if (relation.user1Id === mainUserId) {
      return 'child'
    }
    // Find the 'parent' relation type to get its ID
    const parentType = relationTypes.find((rt) => rt.code === 'parent')
    return parentType ? parentType.id : relation.relationTypeId
  }
  return relation.relationTypeId
}

// A type that represents a relation that includes the other user in the relation.
// This is not a database model.
export type RelationWithUser = UserUser & {
  relatedUser: User
  relationType: UserUserRelationType
}

// Local type for the options in the relation type dropdown
type RelationTypeOption = {
  id: string | number
  code: string
  category: UserUserRelationType['category']
}

interface RelateModalProps {
  isOpen: boolean
  onClose: () => void
  member: Member
  groupType: GroupType
  groupMembers: Member[]
  groupSlug: string
  initialRelations: RelationWithUser[]
  onRelationshipAdded: (relation?: FullRelationship) => void
  isReadOnly: boolean
  loggedInUserId: string
}

// A new component to handle the display and editing of a single relationship.
function RelationshipEditor({
  relation,
  isReadOnly,
  relationTypes,
  groupSlug,
  onUpdate,
  loggedInUserId: _loggedInUserId,
  mainUserId,
}: {
  relation: RelationWithUser
  isReadOnly: boolean
  relationTypes: RelationTypeOption[]
  groupSlug: string
  onUpdate: () => void
  loggedInUserId: string
  mainUserId: string
}) {
  const [isUpdating, startUpdateTransition] = useTransition()

  const currentLabel = getRelationLabel(relation, mainUserId)
  const currentValue = getRelationValue(relation, mainUserId, relationTypes)

  if (isReadOnly) {
    return (
      <span className="text-sm text-gray-500 capitalize text-gray-400">
        {currentLabel}
      </span>
    )
  }

  const handleRelationChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newRelationTypeId = event.target.value
    startUpdateTransition(async () => {
      const result = await updateUserRelation(
        relation.id,
        newRelationTypeId,
        groupSlug,
        mainUserId,
      )
      if (result.success) {
        toast.success('Relationship updated.')
      } else {
        toast.error(result.message || 'Failed to update relationship.')
      }
      onUpdate() // This will trigger a re-fetch of relations in the parent
    })
  }

  return (
    <select
      value={currentValue}
      onChange={handleRelationChange}
      disabled={isUpdating}
      className="rounded-md border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      aria-label={`Edit relationship with ${relation.relatedUser.firstName}`}
    >
      {relationTypes.map((rt) => (
        <option key={rt.id} value={rt.id}>
          {rt.code.charAt(0).toUpperCase() + rt.code.slice(1)}
        </option>
      ))}
    </select>
  )
}

function RelateModalContent({
  isOpen,
  onClose,
  member,
  groupType,
  groupMembers,
  groupSlug,
  initialRelations,
  onRelationshipAdded,
  isReadOnly,
  loggedInUserId,
}: RelateModalProps) {
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeletingTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  // State for the modal's primary subject
  const [relations, setRelations] = useState(initialRelations)
  const [memberGender, setMemberGender] = useState<Gender | null>(
    member?.user.gender || null,
  )

  // State for the relationship form
  const [relationTypes, setRelationTypes] = useState<RelationTypeOption[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [selectedRelationTypeId, setSelectedRelationTypeId] = useState('')
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null)
  const [memberBirthDate, setMemberBirthDate] = useState('')
  const [relatedPersonBirthDate, setRelatedPersonBirthDate] = useState('')

  // UI control state
  const [relationToDelete, setRelationToDelete] =
    useState<RelationWithUser | null>(null)
  const [showMemberGenderEditor, setShowMemberGenderEditor] = useState(false)
  const [isFamilyExpanded, setIsFamilyExpanded] = useState(true)
  const [isFriendsExpanded, setIsFriendsExpanded] = useState(true)

  const relationTypeOptions = useMemo(() => {
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

    if (groupType.code === 'community') {
      const sortedTypes = [...relationTypes].sort((a, b) => {
        if (a.category === 'other' && b.category !== 'other') return -1
        if (a.category !== 'other' && b.category === 'other') return 1
        return a.code.localeCompare(b.code)
      })

      const otherTypes = sortedTypes.filter((rt) => rt.category === 'other')
      const familyTypes = sortedTypes.filter((rt) => rt.category === 'family')

      if (otherTypes.length > 0 && familyTypes.length > 0) {
        const options: (ComboboxOption | ComboboxOptionDivider)[] = []
        otherTypes.forEach((rt) => {
          options.push({
            value: rt.id.toString(),
            label: capitalize(rt.code),
          })
        })
        options.push({ isDivider: true })
        familyTypes.forEach((rt) => {
          options.push({
            value: rt.id.toString(),
            label: capitalize(rt.code),
          })
        })
        return options
      }
    }

    if (groupType.code === 'family') {
      const directFamilyTypes = relationTypes.filter(
        (rt) => rt.category === 'family',
      )
      const otherFamilyTypes = relationTypes.filter(
        (rt) => rt.category === 'other',
      )

      const options: (ComboboxOption | ComboboxOptionDivider)[] = []

      if (directFamilyTypes.length > 0) {
        options.push({ isDivider: true, label: 'Direct Family Relationships' })
        directFamilyTypes
          .sort((a, b) => a.code.localeCompare(b.code))
          .forEach((rt) => {
            options.push({
              value: rt.id.toString(),
              label: capitalize(rt.code),
            })
          })
      }

      if (otherFamilyTypes.length > 0) {
        options.push({ isDivider: true, label: 'Other Family Relationships' })
        otherFamilyTypes.forEach((rt) => {
          options.push({
            value: rt.id.toString(),
            label: capitalize(rt.code),
          })
        })
      }
      return options
    }

    // Fallback for other group types or if no sorting is needed
    return relationTypes.map((rt) => ({
      value: rt.id.toString(),
      label: capitalize(rt.code),
    }))
  }, [relationTypes, groupType.code])

  const { familyRelations, friendRelations } = useMemo(() => {
    const family: RelationWithUser[] = []
    const friends: RelationWithUser[] = []

    relations.forEach((relation) => {
      const isFamily =
        relation.relationType.category === 'family' ||
        (relation.relationType.category === 'other' &&
          relation.relationType.code === 'family')

      if (isFamily) {
        family.push(relation)
      } else {
        friends.push(relation)
      }
    })

    const sortByName = (a: RelationWithUser, b: RelationWithUser) => {
      const lastNameA = a.relatedUser.lastName || ''
      const lastNameB = b.relatedUser.lastName || ''
      const firstNameA = a.relatedUser.firstName || ''
      const firstNameB = b.relatedUser.firstName || ''

      if (lastNameA.localeCompare(lastNameB) !== 0) {
        return lastNameA.localeCompare(lastNameB)
      }
      return firstNameA.localeCompare(firstNameB)
    }

    family.sort(sortByName)
    friends.sort(sortByName)

    return { familyRelations: family, friendRelations: friends }
  }, [relations])

  const refreshRelations = useCallback(async () => {
    if (!member) return
    const updatedRelations = await getMemberRelations(member.userId, groupSlug)
    setRelations(updatedRelations)
    onRelationshipAdded()
  }, [member, groupSlug, onRelationshipAdded])

  // Reset state when the user (member) or initial relations change
  useEffect(() => {
    setRelations(initialRelations)
    setMemberGender(member?.user.gender || null)
    setSelectedMemberId('')
    setSelectedRelationTypeId('')
    setSelectedGender(null)
    setMemberBirthDate('')
    setRelatedPersonBirthDate('')
    setRelationToDelete(null)
    formRef.current?.reset()
  }, [member, initialRelations])

  // Fetch relation types
  useEffect(() => {
    const fetchRelationTypes = async () => {
      let fetchedTypes: RelationTypeOption[] = []
      const allTypes = await getRelationTypes()

      if (groupType.code === 'family') {
        fetchedTypes = allTypes.filter(
          (t: RelationTypeOption) =>
            t.category === 'family' ||
            (t.category === 'other' && t.code === 'family'),
        )
      } else {
        fetchedTypes = allTypes // For community, use all types
      }

      if (!fetchedTypes.some((t) => t.id === 'child')) {
        fetchedTypes.push({ id: 'child', code: 'child', category: 'family' })
      }
      setRelationTypes(fetchedTypes)
    }

    fetchRelationTypes()
  }, [groupType.code])

  // Decide whether to show the gender editor based on the current member
  useEffect(() => {
    if (member && !isReadOnly && !member.user.gender) {
      setShowMemberGenderEditor(true)
    } else {
      setShowMemberGenderEditor(false)
    }
  }, [member, isReadOnly])

  const handleMemberGenderChange = async (newGender: Gender | null) => {
    if (!member) return

    setMemberGender(newGender)
    startTransition(async () => {
      const result = await updateUserGender(
        member.userId,
        newGender,
        groupSlug,
        member.userId,
      )
      if (result.success) {
        toast.success(`${member.user.firstName}'s gender updated.`)
        onRelationshipAdded()
      } else {
        toast.error(result.error || 'Failed to update gender.')
        setMemberGender(member.user.gender || null)
      }
    })
  }

  const resetForm = () => {
    formRef.current?.reset()
    setSelectedMemberId('')
    setSelectedRelationTypeId('')
    setSelectedGender(null)
    setRelatedPersonBirthDate('')
    setMemberBirthDate('')
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!member) return
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      try {
        if (memberBirthDate) {
          await updateUserBirthDate(member.userId, memberBirthDate, groupSlug)
        }

        const user2Id = formData.get('user2Id') as string
        if (user2Id && relatedPersonBirthDate) {
          await updateUserBirthDate(user2Id, relatedPersonBirthDate, groupSlug)
        }

        const selectedGenderValue = selectedGender
        if (user2Id && selectedGenderValue) {
          await updateUserGender(
            user2Id,
            selectedGenderValue,
            groupSlug,
            member.userId,
          )
        }

        const result = await addUserRelation(formData, groupSlug)
        if (result.success && result.relation) {
          toast.success('Relationship added!')
          const relatedUser =
            member.userId === result.relation.user1Id
              ? result.relation.user2
              : result.relation.user1
          const newRelation: RelationWithUser = {
            ...result.relation,
            relatedUser: relatedUser,
          }
          setRelations((prev) => [...prev, newRelation])
          onRelationshipAdded(result.relation)
          resetForm()
        } else {
          toast.error(result.message || 'Failed to add relationship.')
        }
      } catch (error) {
        console.error(error)
        toast.error(
          error instanceof Error ? error.message : 'An error occurred.',
        )
      }
    })
  }

  const handleDelete = async () => {
    if (!relationToDelete) return
    startDeletingTransition(async () => {
      try {
        const result = await deleteUserRelation(relationToDelete.id, groupSlug)
        if (result.success) {
          setRelations((prev) =>
            prev.filter((r) => r.id !== relationToDelete.id),
          )
          toast.success('Relationship deleted.')
          onRelationshipAdded()
          setRelationToDelete(null)
        } else {
          toast.error(result.message || 'Failed to delete relationship.')
        }
      } catch (error) {
        console.error(error)
        toast.error(
          error instanceof Error ? error.message : 'An error occurred.',
        )
      }
    })
  }

  const genderOptions: { label: string; value: Gender }[] = [
    { label: 'He', value: 'male' },
    { label: 'She', value: 'female' },
    { label: 'They', value: 'non_binary' },
  ]

  const selectedMember = groupMembers.find((m) => m.userId === selectedMemberId)

  if (!member) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <button
        type="button"
        className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-300"
        onClick={onClose}
      >
        <span className="sr-only">Close</span>
        <X className="h-6 w-6" />
      </button>
      <div className="p-6">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-100">
              {member.user.firstName} {member.user.lastName}
            </h3>
            {isReadOnly && (
              <span className="absolute top-6 right-12 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 bg-yellow-900 text-yellow-300">
                Read-only
              </span>
            )}
          </div>
          {!isReadOnly &&
            (showMemberGenderEditor || !member.user.birthDate) && (
              <div className="mt-4 flex flex-col space-y-3">
                {showMemberGenderEditor && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Gender:</span>
                    {genderOptions.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleMemberGenderChange(value)}
                        className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                          memberGender === value
                            ? 'border-transparent bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
                            : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                {!member.user.birthDate && (
                  <div>
                    <label className="text-sm text-gray-400">Birth Date:</label>
                    <input
                      type="text"
                      name="memberBirthDate"
                      value={memberBirthDate}
                      onChange={(e) => setMemberBirthDate(e.target.value)}
                      placeholder="Birth year or date"
                      className="mt-1 block w-full max-w-xs rounded-md border border-gray-600 bg-gray-800 px-3 py-1 text-sm text-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>
            )}
        </div>

        {!isReadOnly && (
          <form ref={formRef} onSubmit={handleSubmit} className="mt-6">
            <input type="hidden" name="user1Id" value={member.userId} />
            <input type="hidden" name="groupSlug" value={groupSlug} />

            <div className="mt-4">
              <label
                htmlFor="relationTypeId"
                className="block text-sm font-medium text-gray-300"
              >
                {member.user.firstName}&apos;s
              </label>
              <Combobox
                name="relationTypeId"
                options={relationTypeOptions}
                selectedValue={selectedRelationTypeId}
                onSelectValue={setSelectedRelationTypeId}
                placeholder="Select a relationship"
                zIndex="z-30"
              />
            </div>

            <div className="mt-4">
              <label
                htmlFor="user2Id"
                className="block text-sm font-medium text-gray-300"
              >
                Is this person
              </label>
              <Combobox
                name="user2Id"
                options={groupMembers
                  .filter((m) => m.userId !== member.userId)
                  .map((m) => ({
                    value: m.userId,
                    label: [m.user.firstName, m.user.lastName]
                      .filter(Boolean)
                      .join(' '),
                  }))}
                selectedValue={selectedMemberId}
                onSelectValue={setSelectedMemberId}
                placeholder="Select a person"
                zIndex="z-20"
              />
            </div>

            {selectedMemberId && (
              <>
                {!selectedMember?.user.gender && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-400">
                      Their Gender
                    </label>
                    <div className="mt-2 flex items-center space-x-2">
                      {genderOptions.map(({ label, value }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setSelectedGender(
                              selectedGender === value ? null : value,
                            )
                          }
                          className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                            selectedGender === value
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-700 text-gray-200 ring-1 ring-gray-600 ring-inset hover:bg-gray-600'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!selectedMember?.user.birthDate && (
                  <div className="mt-4">
                    <label
                      htmlFor="relatedPersonBirthDate"
                      className="block text-sm font-medium text-gray-400"
                    >
                      Their Birth Date
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        id="relatedPersonBirthDate"
                        name="relatedPersonBirthDate"
                        value={relatedPersonBirthDate}
                        onChange={(e) =>
                          setRelatedPersonBirthDate(e.target.value)
                        }
                        placeholder="Birth year or date"
                        className="block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={
                  isPending || !selectedMemberId || !selectedRelationTypeId
                }
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? 'Adding...' : 'Add Relationship'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 border-t border-gray-200 pt-6 border-gray-700">
          <h4 className="text-md font-medium text-gray-100">
            Existing Relationships
          </h4>
          {relations.length > 0 ? (
            <div className="mt-2 max-h-64 overflow-y-auto pr-2">
              {familyRelations.length > 0 && (
                <div className="mb-4">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-md bg-gray-700 px-3 py-2 text-left text-sm font-semibold text-gray-300 hover:bg-gray-600"
                    onClick={() => setIsFamilyExpanded(!isFamilyExpanded)}
                  >
                    <span>Family</span>
                    <svg
                      className={`h-5 w-5 transform transition-transform ${
                        isFamilyExpanded ? 'rotate-180' : ''
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  {isFamilyExpanded && (
                    <ul className="mt-1 divide-y divide-gray-200 divide-gray-700">
                      {familyRelations.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center justify-between py-2 pl-3"
                        >
                          <span>
                            {r.relatedUser.firstName} {r.relatedUser.lastName}
                          </span>
                          <div className="flex items-center gap-4">
                            <RelationshipEditor
                              relation={r}
                              isReadOnly={isReadOnly}
                              relationTypes={relationTypes}
                              groupSlug={groupSlug}
                              onUpdate={refreshRelations}
                              loggedInUserId={loggedInUserId}
                              mainUserId={member.userId}
                            />
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => setRelationToDelete(r)}
                                className="text-red-500 hover:text-red-400"
                                aria-label={`Delete relationship with ${r.relatedUser.firstName} ${r.relatedUser.lastName}`}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {friendRelations.length > 0 && (
                <div>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-md bg-gray-700 px-3 py-2 text-left text-sm font-semibold text-gray-300 hover:bg-gray-600"
                    onClick={() => setIsFriendsExpanded(!isFriendsExpanded)}
                  >
                    <span>Friends</span>
                    <svg
                      className={`h-5 w-5 transform transition-transform ${
                        isFriendsExpanded ? 'rotate-180' : ''
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  {isFriendsExpanded && (
                    <ul className="mt-1 divide-y divide-gray-200 divide-gray-700">
                      {friendRelations.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center justify-between py-2 pl-3"
                        >
                          <span>
                            {r.relatedUser.firstName} {r.relatedUser.lastName}
                          </span>
                          <div className="flex items-center gap-4">
                            <RelationshipEditor
                              relation={r}
                              isReadOnly={isReadOnly}
                              relationTypes={relationTypes}
                              groupSlug={groupSlug}
                              onUpdate={refreshRelations}
                              loggedInUserId={loggedInUserId}
                              mainUserId={member.userId}
                            />
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => setRelationToDelete(r)}
                                className="text-red-500 hover:text-red-400"
                                aria-label={`Delete relationship with ${r.relatedUser.firstName} ${r.relatedUser.lastName}`}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-400">No relationships yet.</p>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 bg-blue-800 text-blue-100 hover:bg-blue-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
      {relationToDelete && (
        <Modal
          isOpen={!!relationToDelete}
          onClose={() => setRelationToDelete(null)}
          title=""
        >
          <div className="p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-100">
              Confirm Deletion
            </h3>
            <div className="mt-4">
              <p className="text-sm text-gray-400">
                Are you sure you want to delete this relationship? This action
                cannot be undone.
              </p>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 shadow-sm hover:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
                onClick={() => setRelationToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  )
}

export default function RelateModal(props: RelateModalProps) {
  if (!props.member) return null

  return <RelateModalContent key={props.member.userId} {...props} />
}
