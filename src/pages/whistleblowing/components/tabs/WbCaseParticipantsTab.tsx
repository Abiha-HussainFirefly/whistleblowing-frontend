import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Pagination } from '@components/ui/pagination';
import { Select } from '@components/ui/select';
import { Sheet } from '@components/ui/sheet';
import { Textarea } from '@components/ui/textarea';
import {
  useAddParticipant,
  useRemoveParticipant,
  useUpdateParticipant,
} from '@features/whistleblowing/hooks';
import type { ParticipantInput, WbParticipant } from '@features/whistleblowing/types';
import { WB_PARTICIPANT_ROLE_OPTIONS } from '@features/whistleblowing/utils/format';
import { wbParticipantRoleLabelT } from '@features/whistleblowing/utils/i18n';
import { getApiErrorMessage } from '@lib/api-error';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CaseEmptyState, CaseSection } from '../WbCaseConsolePrimitives';

const DETAIL_PAGE_SIZE = 5;
const EMPTY_PARTICIPANT: ParticipantInput = {
  firstName: '',
  lastName: '',
  jobTitle: '',
  relationship: '',
  role: 'SUBJECT',
  results: '',
};

function formatPerson(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  title: string | null | undefined,
  unknown = 'Unknown',
): string {
  const name = [firstName, lastName]
    .filter((value): value is string => value !== null && value !== undefined && value.length > 0)
    .join(' ');
  const parts = [name, title].filter(
    (value): value is string => value !== null && value !== undefined && value.length > 0,
  );
  return parts.length > 0 ? parts.join(' - ') : unknown;
}

function pageMetaFor(
  page: number,
  total: number,
): { page: number; pageSize: number; total: number; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(total / DETAIL_PAGE_SIZE));
  return {
    page: Math.min(Math.max(1, page), totalPages),
    pageSize: DETAIL_PAGE_SIZE,
    total,
    totalPages,
  };
}

export function WbCaseParticipantsTab({
  caseId,
  participants,
  canEdit,
  showSection = true,
  openForm,
  onOpenFormChange,
}: {
  caseId: string;
  participants: WbParticipant[];
  canEdit: boolean;
  showSection?: boolean;
  openForm?: boolean;
  onOpenFormChange?: (open: boolean) => void;
}): ReactElement {
  const { t } = useTranslation('whistleblowing');
  const add = useAddParticipant();
  const update = useUpdateParticipant();
  const remove = useRemoveParticipant();
  const [addingInternal, setAddingInternal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ParticipantInput>(EMPTY_PARTICIPANT);
  const [page, setPage] = useState(1);
  const adding = openForm ?? addingInternal;
  const setAdding = (open: boolean): void => {
    if (onOpenFormChange !== undefined) {
      onOpenFormChange(open);
    } else {
      setAddingInternal(open);
    }
  };
  const visibleParticipants = participants.slice(
    (pageMetaFor(page, participants.length).page - 1) * DETAIL_PAGE_SIZE,
    page * DETAIL_PAGE_SIZE,
  );

  const startAdd = (): void => {
    setForm({ ...EMPTY_PARTICIPANT });
    setEditId(null);
    setAdding(true);
  };

  const startEdit = (participant: WbParticipant): void => {
    setForm({
      firstName: participant.firstName ?? '',
      lastName: participant.lastName ?? '',
      jobTitle: participant.jobTitle ?? '',
      relationship: participant.relationship ?? '',
      role: participant.role,
      results: participant.results ?? '',
    });
    setEditId(participant.id);
    setAdding(true);
  };

  const cancel = (): void => {
    setAdding(false);
    setEditId(null);
  };

  const save = (): void => {
    if (editId !== null) {
      update.mutate({ id: caseId, participantId: editId, data: form }, { onSuccess: cancel });
      return;
    }
    add.mutate({ id: caseId, data: form }, { onSuccess: cancel });
  };

  const error = add.error ?? update.error ?? remove.error;

  return (
    <>
      {showSection && (
        <CaseSection
          title={t('caseConsole.panels.participants', { defaultValue: 'Participants' })}
          icon={Users}
          action={
            canEdit ? (
              <Button type="button" variant="outline" size="sm" onClick={startAdd}>
                <Plus className="h-4 w-4" />
                {t('caseConsole.participants.add', { defaultValue: 'Add participant' })}
              </Button>
            ) : null
          }
        >
          {participants.length === 0 ? (
            <CaseEmptyState
              icon={Users}
              label={t('caseConsole.participants.empty', {
                defaultValue: 'No participants recorded.',
              })}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                    <th className="py-2 pr-3">
                      {t('caseConsole.participants.name', { defaultValue: 'Name' })}
                    </th>
                    <th className="py-2 pr-3">
                      {t('caseConsole.participants.jobTitle', { defaultValue: 'Job title' })}
                    </th>
                    <th className="py-2 pr-3">
                      {t('caseConsole.participants.relationship', { defaultValue: 'Relationship' })}
                    </th>
                    <th className="py-2 pr-3">
                      {t('caseConsole.participants.role', { defaultValue: 'Role' })}
                    </th>
                    {canEdit && <th className="w-16 py-2" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {visibleParticipants.map((participant) => (
                    <tr
                      key={participant.id}
                      className="notranslate text-slate-700 dark:text-slate-200"
                      translate="no"
                      dir="auto"
                    >
                      <td className="notranslate py-3 pr-3" translate="no" dir="auto">
                        {participant.fullName ??
                          formatPerson(
                            participant.firstName,
                            participant.lastName,
                            null,
                            t('caseConsole.unknown', { defaultValue: 'Unknown' }),
                          )}
                      </td>
                      <td className="py-3 pr-3">{participant.jobTitle ?? '—'}</td>
                      <td className="py-3 pr-3">{participant.relationship ?? '—'}</td>
                      <td className="py-3 pr-3">{wbParticipantRoleLabelT(participant.role, t)}</td>
                      {canEdit && (
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                startEdit(participant);
                              }}
                              aria-label={t('caseConsole.participants.edit', {
                                defaultValue: 'Edit participant',
                              })}
                              className="text-slate-400 hover:text-brand-accent"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                remove.mutate({ id: caseId, participantId: participant.id });
                              }}
                              aria-label={t('caseConsole.participants.remove', {
                                defaultValue: 'Remove participant',
                              })}
                              className="text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {participants.length > DETAIL_PAGE_SIZE && (
                <Pagination meta={pageMetaFor(page, participants.length)} onPageChange={setPage} />
              )}
            </div>
          )}

          {error !== null && (
            <p className="mt-3 text-xs text-red-600">{getApiErrorMessage(error)}</p>
          )}
        </CaseSection>
      )}
      {canEdit && (
        <Sheet
          isOpen={adding}
          onClose={cancel}
          title={
            editId !== null
              ? t('caseConsole.participants.edit', { defaultValue: 'Edit participant' })
              : t('caseConsole.participants.new', { defaultValue: 'New participant' })
          }
          description={t('caseConsole.participants.sheetDescription', {
            defaultValue: 'Add a person involved in this case and record their role.',
          })}
          width="2xl"
          footer={
            <div className="form-sheet-footer">
              <Button
                variant="outline"
                onClick={cancel}
                disabled={add.isPending || update.isPending}
              >
                {t('caseConsole.actions.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button disabled={add.isPending || update.isPending} onClick={save}>
                {add.isPending || update.isPending
                  ? t('caseConsole.actions.saving', { defaultValue: 'Saving...' })
                  : t('caseConsole.actions.save', { defaultValue: 'Save participant' })}
              </Button>
            </div>
          }
        >
          <div className="form-sheet-body space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <InputField
                value={form.firstName ?? ''}
                placeholder={t('persons.firstName', { defaultValue: 'First name' })}
                onChange={(value) => {
                  setForm((current) => ({ ...current, firstName: value }));
                }}
              />
              <InputField
                value={form.lastName ?? ''}
                placeholder={t('persons.lastName', { defaultValue: 'Last name' })}
                onChange={(value) => {
                  setForm((current) => ({ ...current, lastName: value }));
                }}
              />
              <InputField
                value={form.jobTitle ?? ''}
                placeholder={t('caseConsole.participants.jobTitle', { defaultValue: 'Job title' })}
                onChange={(value) => {
                  setForm((current) => ({ ...current, jobTitle: value }));
                }}
              />
              <InputField
                value={form.relationship ?? ''}
                placeholder={t('caseConsole.participants.relationship', {
                  defaultValue: 'Relationship',
                })}
                onChange={(value) => {
                  setForm((current) => ({ ...current, relationship: value }));
                }}
              />
            </div>
            <Select
              value={form.role}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  role: event.target.value as ParticipantInput['role'],
                }));
              }}
            >
              {WB_PARTICIPANT_ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {wbParticipantRoleLabelT(option.value, t)}
                </option>
              ))}
            </Select>
            <Textarea
              value={form.results ?? ''}
              onChange={(event) => {
                setForm((current) => ({ ...current, results: event.target.value }));
              }}
              rows={5}
              placeholder={t('caseConsole.participants.resultsPlaceholder', {
                defaultValue: 'Results / notes (optional)',
              })}
            />
          </div>
        </Sheet>
      )}
    </>
  );
}

function InputField({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}): ReactElement {
  return (
    <Input
      value={value}
      placeholder={placeholder}
      onChange={(event) => {
        onChange(event.target.value);
      }}
    />
  );
}
