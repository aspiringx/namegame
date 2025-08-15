'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import Modal from './ui/modal'
import { Combobox } from './ui/combobox'
import { toast } from 'sonner'
import {
  addUserRelation,
  deleteUserRelation,
  getFamilyRelationTypes,
  getMemberRelations,
} from '@/app/g/[slug]/family/actions'
import { updateUserGender, updateUserBirthDate } from '@/app/(main)/me/actions'

import type { MemberWithUser as Member } from '@/types/index'
import type { UserUserRelationType, Gender } from '@/generated/prisma'

type RelationWithUser = Awaited<ReturnType<typeof getMemberRelations>>[0]

interface RelateModalProps {
  isOpen: boolean
  onClose: () => void
  member: Member | null
  groupMembers: Member[]
  groupSlug: string
  initialRelations: RelationWithUser[]
  onRelationshipAdded: () => void
  isReadOnly?: boolean
}

function RelateModalContent({
  isOpen,
  onClose,
  member,
  groupMembers,
  groupSlug,
  initialRelations,
  onRelationshipAdded,
  isReadOnly = false,
}: RelateModalProps) {
  if (!member) return null
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeletingTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  // State for the modal's primary subject
  const [relations, setRelations] = useState(initialRelations)
  const [memberGender, setMemberGender] = useState<Gender | null>(
    member?.user.gender || null,
  )

  // State for the relationship form
  const [relationTypes, setRelationTypes] = useState<
    (UserUserRelationType | { id: string; code: string; name: string })[]
  >([])
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [selectedRelationTypeId, setSelectedRelationTypeId] = useState('')
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null)
  const [memberBirthDate, setMemberBirthDate] = useState('')
  const [relatedPersonBirthDate, setRelatedPersonBirthDate] = useState('')

  // UI control state
  const [relationToDelete, setRelationToDelete] =
    useState<RelationWithUser | null>(null)
  const [showMemberGenderEditor, setShowMemberGenderEditor] = useState(false)

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

  // Fetch relation types and add the 'Child' convenience option
  useEffect(() => {
    if (isOpen) {
      getFamilyRelationTypes().then((types) => {
        // 'child' is the inverse of 'parent', not a real type in the DB.
        // We add it here for user convenience in the dropdown.
        const childOption = {
          id: 'child',
          code: 'child',
          name: 'Child',
          description: 'The person is their child',
          isFamilyRelation: true,
        }
        setRelationTypes([...types, childOption])
      })
    }
  }, [isOpen])

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

    // Optimistically update the UI
    setMemberGender(newGender)

    startTransition(async () => {
      const result = await updateUserGender(
        member.userId,
        newGender,
        groupSlug,
        member.userId, // updatingUserId
      )
      if (result.success) {
        toast.success(`${member.user.firstName}'s gender updated.`)
        onRelationshipAdded() // Refresh data
      } else {
        toast.error(result.error || 'Failed to update gender.')
        // Revert on failure
        setMemberGender(member.user.gender || null)
      }
    })
  }

  const getRelationLabel = (relation: RelationWithUser) => {
    if (relation.relationType.code === 'parent') {
      return relation.user1Id === member.userId ? 'child' : 'parent'
    }
    return relation.relationType.code
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      try {
        // Handle birth date updates first
        if (memberBirthDate) {
          await updateUserBirthDate(member.userId, memberBirthDate, groupSlug)
        }

        const user2Id = formData.get('user2Id') as string
        if (user2Id && relatedPersonBirthDate) {
          await updateUserBirthDate(user2Id, relatedPersonBirthDate, groupSlug)
        }

        // Handle gender update for related person
        const selectedGenderValue = selectedGender
        if (user2Id && selectedGenderValue) {
          await updateUserGender(
            user2Id,
            selectedGenderValue,
            groupSlug,
            member.userId, // updatingUserId
          )
        }

        // Finally, add the relationship
        const result = await addUserRelation(formData, groupSlug)
        if (result.success) {
          toast.success('Relationship added!')
          onRelationshipAdded()
          onClose()
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
          // Optimistically remove the relation from the list
          setRelations((prev) =>
            prev.filter((r) => r.id !== relationToDelete.id),
          )
          toast.success('Relationship deleted.')
          onRelationshipAdded() // This should trigger a refresh
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div>
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
              {member.user.firstName} {member.user.lastName}
            </h3>
            {isReadOnly && (
              <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                Read-only
              </span>
            )}
          </div>
          {!isReadOnly &&
            (showMemberGenderEditor || !member.user.birthDate) && (
              <div className="mt-4 flex flex-col space-y-3">
                {showMemberGenderEditor && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Gender:
                    </span>
                    {genderOptions.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleMemberGenderChange(value)}
                        className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                          memberGender === value
                            ? 'border-transparent bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
                            : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                {!member.user.birthDate && (
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      Birth Date:
                    </label>
                    <input
                      type="text"
                      name="memberBirthDate"
                      value={memberBirthDate}
                      onChange={(e) => setMemberBirthDate(e.target.value)}
                      placeholder="Birth year or date"
                      className="mt-1 block w-full max-w-xs rounded-md border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
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
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {member.user.firstName}'s
              </label>
              <Combobox
                name="relationTypeId"
                options={relationTypes.map((rt) => ({
                  value: rt.id.toString(),
                  label: rt.code.charAt(0).toUpperCase() + rt.code.slice(1),
                }))}
                selectedValue={selectedRelationTypeId}
                onSelectValue={setSelectedRelationTypeId}
                placeholder="Select a relationship"
                zIndex="z-30"
              />
            </div>

            <div className="mt-4">
              <label
                htmlFor="user2Id"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
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
                              : 'bg-white text-gray-700 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-600 dark:hover:bg-gray-600'
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
                      className="block text-sm font-medium text-gray-700 dark:text-gray-400"
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
                        className="block w-full rounded-md border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
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

        <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
          <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">
            Existing Relationships
          </h4>
          {relations.length > 0 ? (
            <ul className="mt-2 divide-y divide-gray-200 dark:divide-gray-700">
              {relations.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <span>
                      {r.relatedUser.firstName} {r.relatedUser.lastName}
                    </span>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      ({getRelationLabel(r)})
                    </span>
                  </div>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => setRelationToDelete(r)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500"
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
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              No relationships yet.
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-700"
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
          title="Confirm Deletion"
        >
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete the relationship with{' '}
              <strong>
                {relationToDelete.relatedUser.firstName}{' '}
                {relationToDelete.relatedUser.lastName}
              </strong>
              ?
            </p>
          </div>
          <div className="mt-6 flex justify-end space-x-2">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              onClick={() => setRelationToDelete(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleDelete}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
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
