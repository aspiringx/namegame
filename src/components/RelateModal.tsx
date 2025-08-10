'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import Modal from './ui/modal'
import { Combobox } from './ui/combobox'
import { toast } from 'sonner'
import {
  addUserRelation,
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
}

export default function RelateModal({
  isOpen,
  onClose,
  member,
  groupMembers,
  groupSlug,
}: RelateModalProps) {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [selectedRelationTypeId, setSelectedRelationTypeId] = useState('')
  const [relations, setRelations] = useState<RelationWithUser[]>([])
  const [relationTypes, setRelationTypes] = useState<UserUserRelationType[]>([])
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (isOpen && member) {
      getMemberRelations(member.userId, groupSlug).then(setRelations)
      getFamilyRelationTypes().then(setRelationTypes)
    }
  }, [isOpen, member, groupSlug])

  if (!member) return null

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
              NOTICE: Only add or change direct relationships here.{' '}
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
              options={relationTypes.map((rt) => ({
                value: rt.id.toString(),
                label: rt.code,
              }))}
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
                  <span>
                    {r.relatedUser.firstName} {r.relatedUser.lastName}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {r.relationType.code}
                  </span>
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
    </Modal>
  )
}
