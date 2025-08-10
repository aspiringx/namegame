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
import type { MemberWithUser as Member, FullRelationship } from '@/types/index'
import type { UserUserRelationType } from '@/generated/prisma'

type RelationWithUser = Awaited<ReturnType<typeof getMemberRelations>>[0]

interface RelateModalProps {
  isOpen: boolean
  onClose: () => void
  member: Member | null
  groupMembers: Member[]
  groupSlug: string
  initialRelations: RelationWithUser[]
}

export default function RelateModal({
  isOpen,
  onClose,
  member,
  groupMembers,
  groupSlug,
  initialRelations,
}: RelateModalProps) {
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeletingTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [selectedRelationTypeId, setSelectedRelationTypeId] = useState('')
  const [relations, setRelations] = useState(initialRelations)
  const [relationTypes, setRelationTypes] = useState<UserUserRelationType[]>([])
  const [showDetails, setShowDetails] = useState(false)
  const [relationToDelete, setRelationToDelete] =
    useState<RelationWithUser | null>(null)

  useEffect(() => {
    setRelations(initialRelations)
  }, [initialRelations])

  useEffect(() => {
    if (isOpen) {
      getFamilyRelationTypes().then(setRelationTypes)
    } else {
      // Reset form when modal closes
      formRef.current?.reset()
      setSelectedMemberId('')
      setSelectedRelationTypeId('')
    }
  }, [isOpen])

  if (!member) return null

  const getRelationLabel = (relation: RelationWithUser) => {
    if (relation.relationType.code === 'parent') {
      // In the DB, for 'parent' relations, user1 is the parent, user2 is the child.
      // We are viewing the modal for 'member'.
      // If member is user1, the relatedUser is user2 (the child).
      return relation.user1Id === member.userId ? 'child' : 'parent'
    }
    return relation.relationType.code
  }

  const relatedUserIds = new Set(relations.map((r) => r.relatedUser.id))
  const availableMembers = groupMembers.filter(
    (m) => m.userId !== member.userId && !relatedUserIds.has(m.userId),
  )

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        const result = await addUserRelation(formData)
        if (result.success) {
          toast.success(result.message)
          const updatedRelations = await getMemberRelations(
            member.userId,
            groupSlug,
          )
          setRelations(updatedRelations)
          formRef.current?.reset()
          setSelectedMemberId('')
          setSelectedRelationTypeId('')
        } else {
          toast.error(result.message)
        }
      } catch (error) {
        toast.error('An unexpected error occurred.')
      }
    })
  }

  const handleDelete = () => {
    if (!relationToDelete) return

    startDeletingTransition(async () => {
      try {
        const result = await deleteUserRelation(relationToDelete.id, groupSlug)
        if (result.success) {
          toast.success(result.message)
          const updatedRelations = await getMemberRelations(
            member.userId,
            groupSlug,
          )
          setRelations(updatedRelations)
          setRelationToDelete(null)
        } else {
          toast.error(result.message)
        }
      } catch (error) {
        toast.error('An unexpected error occurred.')
      }
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${member.user.name}`}>
      <div className="mt-4">
        <form
          ref={formRef}
          action={handleSubmit}
          className="rounded-md border border-gray-200 p-4 dark:border-gray-700"
        >
          <h4 className="font-medium text-gray-800 dark:text-gray-200">
            New Direct Relationship
          </h4>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            <p>
              NOTICE: Add or change direct relationships here.{' '}
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Details
              </button>
            </p>
            {showDetails && (
              <div id="details" className="mt-2 space-y-2 p-2">
                <ul className="list-inside list-disc space-y-1">
                  <li>Spouse or partner</li>
                  <li>Parent (birth or adoptive)</li>
                  <li>Child (birth or adoptive)</li>
                </ul>
                <p>
                  All other family relationships (grand, in-law, step, etc.) are
                  calculated through these direct relationships.
                </p>
                <button
                  type="button"
                  onClick={() => setShowDetails(false)}
                  className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Close Details
                </button>
              </div>
            )}
          </div>
          <input type="hidden" name="user1Id" value={member.userId} />
          <input type="hidden" name="groupSlug" value={groupSlug} />

          <div className="mt-4">
            <label
              htmlFor="user2Id"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Member
            </label>
            <Combobox
              name="user2Id"
              options={availableMembers.map((m) => ({
                value: m.userId,
                label: m.user.name || '',
              }))}
              selectedValue={selectedMemberId}
              onSelectValue={setSelectedMemberId}
              placeholder="Select a member"
              zIndex="z-20"
            />
          </div>

          <div className="mt-4">
            <label
              htmlFor="relationTypeId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Relationship
            </label>
            <Combobox
              name="relationTypeId"
              options={[
                ...relationTypes.map((rt) => ({
                  value: rt.id.toString(),
                  label: rt.code,
                })),
                { value: 'child', label: 'child' },
              ]}
              selectedValue={selectedRelationTypeId}
              onSelectValue={setSelectedRelationTypeId}
              placeholder="Select a relationship"
              zIndex="z-10"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={
                isPending || !selectedMemberId || !selectedRelationTypeId
              }
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {isPending ? 'Adding...' : 'Add Relationship'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <h4 className="font-medium text-gray-800 dark:text-gray-200">
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
