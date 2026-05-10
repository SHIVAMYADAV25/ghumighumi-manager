import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import {
  useQuery,
  useMutation,
  useQueryClient
} from '@tanstack/react-query';

import {
  motion,
  AnimatePresence
} from 'framer-motion';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';

import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable';

import { CSS } from '@dnd-kit/utilities';

import {
  itineraryApi,
  activitiesApi
} from '../../api/trips';

import {
  GripVertical,
  Clock,
  MapPin,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2
} from 'lucide-react';

import {
  formatDate,
  categoryIcons
} from '../../utils';

import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

import {
  Input,
  Textarea
} from '../../components/ui/Input';

import { PageLoader } from '../../components/ui/Skeleton';

import toast from 'react-hot-toast';

import { useTripSocket } from '../../hooks/useSocket';

function SortableActivity({
  activity,
  tripId,
  canEdit,
  onEdit,
  onDelete
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: activity._id
  });

  const qc = useQueryClient();

  const voteMut = useMutation({
    mutationFn: (type) =>
      activitiesApi.vote(
        tripId,
        activity._id,
        type
      ),

    onSuccess: () =>
      qc.invalidateQueries([
        'itinerary',
        tripId
      ]),
  });

  const style = {
    transform:
      CSS.Transform.toString(transform),

    transition,

    opacity:
      isDragging ? 0.5 : 1
  };

  const STATUS_COLOR = {
    planned: 'ink',
    confirmed: 'sage',
    completed: 'sand',
    cancelled: 'terracotta'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-start gap-3 p-3 bg-ink-800 rounded-xl border border-white/5 hover:border-white/10 transition-all"
    >
      {canEdit && (
        <button
          {...attributes}
          {...listeners}
          className="mt-1 text-sand-600 hover:text-sand-400 cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base">
              {categoryIcons[
                activity.category
              ] || '📌'}
            </span>

            <span className="text-sm font-medium text-sand-100">
              {activity.title}
            </span>

            <Badge
              variant={
                STATUS_COLOR[
                  activity.status
                ]
              }
            >
              {activity.status}
            </Badge>
          </div>

          {canEdit && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() =>
                  onEdit(activity)
                }
                className="btn-ghost p-1 rounded-md"
              >
                <Edit2 size={13} />
              </button>

              <button
                onClick={() =>
                  onDelete(activity)
                }
                className="btn-ghost p-1 rounded-md text-terracotta hover:bg-terracotta/10"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 mt-1.5 text-xs text-sand-500 flex-wrap">
          {(activity.startTime ||
            activity.endTime) && (
            <span className="flex items-center gap-1">
              <Clock size={11} />

              {activity.startTime}

              {activity.endTime
                ? ` – ${activity.endTime}`
                : ''}
            </span>
          )}

          {activity.location?.name && (
            <span className="flex items-center gap-1">
              <MapPin size={11} />
              {activity.location.name}
            </span>
          )}

          {activity.cost?.amount > 0 && (
            <span className="text-amber">
              {activity.cost.currency}
              {' '}
              {activity.cost.amount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() =>
              voteMut.mutate('up')
            }
            className="flex items-center gap-1 text-xs text-sand-500 hover:text-sage transition-colors"
          >
            <ThumbsUp size={12} />
            {activity.votes?.up?.length || 0}
          </button>

          <button
            onClick={() =>
              voteMut.mutate('down')
            }
            className="flex items-center gap-1 text-xs text-sand-500 hover:text-terracotta transition-colors"
          >
            <ThumbsDown size={12} />
            {activity.votes?.down?.length || 0}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ItineraryPage() {
  const {
    trip,
    userRole
  } = useOutletContext();

  const canEdit =
    ['owner', 'editor']
      .includes(userRole);

  const qc = useQueryClient();

  const [expandedDay, setExpandedDay] =
    useState('');

  const [editActivity, setEditActivity] =
    useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'activity',
    startTime: '',
    endTime: '',

    location: {
      name: ''
    },

    cost: {
      amount: 0,
      currency: 'USD'
    }
  });

  const sensors = useSensors(
    useSensor(
      PointerSensor,
      {
        activationConstraint: {
          distance: 8
        }
      }
    ),

    useSensor(
      KeyboardSensor,
      {
        coordinateGetter:
          sortableKeyboardCoordinates
      }
    )
  );

  const {
    data: days,
    isLoading
  } = useQuery({
    queryKey: [
      'itinerary',
      trip._id
    ],

    queryFn: () =>
      itineraryApi
        .getAll(trip._id)
        .then((r) => r.data.data),
  });

  useEffect(() => {
    if (
      days?.length &&
      !expandedDay
    ) {
      setExpandedDay(
        days[0]._id
      );
    }
  }, [days]);

  const deleteMutation = useMutation({
    mutationFn: (activityId) =>
      activitiesApi.delete(
        trip._id,
        activityId
      ),

    onSuccess: () => {
      toast.success(
        'Activity deleted'
      );

      qc.invalidateQueries([
        'itinerary',
        trip._id
      ]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      activitiesApi.update(
        trip._id,
        editActivity._id,
        form
      ),

    onSuccess: () => {
      toast.success(
        'Activity updated'
      );

      setEditActivity(null);

      qc.invalidateQueries([
        'itinerary',
        trip._id
      ]);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (payload) =>
      activitiesApi.reorder(
        trip._id,
        payload
      ),

    onSuccess: () => {
      qc.invalidateQueries([
        'itinerary',
        trip._id
      ]);
    },
  });

  useTripSocket(trip._id, {
    'activity:created': () =>
      qc.invalidateQueries([
        'itinerary',
        trip._id
      ]),

    'activity:updated': () =>
      qc.invalidateQueries([
        'itinerary',
        trip._id
      ]),

    'activity:deleted': () =>
      qc.invalidateQueries([
        'itinerary',
        trip._id
      ]),

    'activity:reordered': () =>
      qc.invalidateQueries([
        'itinerary',
        trip._id
      ]),
  });

  function handleDragEnd(
    event,
    day
  ) {
    const {
      active,
      over
    } = event;

    if (
      !over ||
      active.id === over.id
    ) {
      return;
    }

    const oldIndex =
      day.activities.findIndex(
        (a) =>
          a._id === active.id
      );

    const newIndex =
      day.activities.findIndex(
        (a) =>
          a._id === over.id
      );

    const reordered =
      arrayMove(
        day.activities,
        oldIndex,
        newIndex
      );

    reorderMutation.mutate({
      itineraryId: day._id,

      activities:
        reordered.map(
          (a, index) => ({
            activityId: a._id,
            order: index
          })
        ),
    });
  }

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div>
      <div className="space-y-3">
        {(days || []).map((day) => {
          const isExpanded =
            expandedDay === day._id;

          return (
            <motion.div
              key={day._id}
              className="card overflow-hidden"
              layout
            >
              {/* Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() =>
                  setExpandedDay(
                    (prev) =>
                      prev === day._id
                        ? null
                        : day._id
                  )
                }
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="font-display font-bold text-amber text-sm">
                      {day.dayNumber}
                    </span>
                  </div>

                  <div>
                    <p className="font-medium text-sand-100 text-sm">
                      {day.title ||
                        formatDate(
                          day.date,
                          'EEEE, MMM d'
                        )}
                    </p>

                    <p className="text-xs text-sand-500">
                      {day.activities?.length || 0}
                      {' '}
                      activities
                    </p>
                  </div>
                </div>

                {isExpanded ? (
                  <ChevronUp
                    size={16}
                    className="text-sand-500"
                  />
                ) : (
                  <ChevronDown
                    size={16}
                    className="text-sand-500"
                  />
                )}
              </div>

              {/* Activities */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{
                      height: 0,
                      opacity: 0
                    }}

                    animate={{
                      height: 'auto',
                      opacity: 1
                    }}

                    exit={{
                      height: 0,
                      opacity: 0
                    }}

                    className="px-4 pb-4 overflow-hidden"
                  >
                    {!day.activities?.length ? (
                      <div className="text-center py-10 text-sand-500 text-sm">
                        No activities yet.
                      </div>
                    ) : (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) =>
                          handleDragEnd(
                            event,
                            day
                          )
                        }
                      >
                        <SortableContext
                          items={
                            day.activities.map(
                              (a) => a._id
                            )
                          }

                          strategy={
                            verticalListSortingStrategy
                          }
                        >
                          <div className="space-y-3">
                            {day.activities.map(
                              (activity) => (
                                <SortableActivity
                                  key={activity._id}
                                  activity={activity}
                                  tripId={trip._id}
                                  canEdit={canEdit}
                                  onEdit={(activity) => {
                                    setEditActivity(
                                      activity
                                    );

                                    setForm({
                                      title:
                                        activity.title || '',

                                      description:
                                        activity.description || '',

                                      category:
                                        activity.category || 'activity',

                                      startTime:
                                        activity.startTime || '',

                                      endTime:
                                        activity.endTime || '',

                                      location: {
                                        name:
                                          activity.location?.name || ''
                                      },

                                      cost: {
                                        amount:
                                          activity.cost?.amount || 0,

                                        currency:
                                          activity.cost?.currency || 'USD'
                                      }
                                    });
                                  }}

                                  onDelete={(activity) =>
                                    deleteMutation.mutate(
                                      activity._id
                                    )
                                  }
                                />
                              )
                            )}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editActivity}
        onClose={() =>
          setEditActivity(null)
        }
        title="Edit Activity"
      >
        <div className="space-y-4">
          <Input
            placeholder="Title"
            value={form.title}
            onChange={(e) =>
              setForm({
                ...form,
                title: e.target.value
              })
            }
          />

          <Textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value
              })
            }
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Start time"
              value={form.startTime}
              onChange={(e) =>
                setForm({
                  ...form,
                  startTime: e.target.value
                })
              }
            />

            <Input
              placeholder="End time"
              value={form.endTime}
              onChange={(e) =>
                setForm({
                  ...form,
                  endTime: e.target.value
                })
              }
            />
          </div>

          <Input
            placeholder="Location"
            value={form.location.name}
            onChange={(e) =>
              setForm({
                ...form,
                location: {
                  name: e.target.value
                }
              })
            }
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              placeholder="Cost"
              value={form.cost.amount}
              onChange={(e) =>
                setForm({
                  ...form,
                  cost: {
                    ...form.cost,
                    amount: e.target.value
                  }
                })
              }
            />

            <Input
              placeholder="Currency"
              value={form.cost.currency}
              onChange={(e) =>
                setForm({
                  ...form,
                  cost: {
                    ...form.cost,
                    currency: e.target.value
                  }
                })
              }
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() =>
                setEditActivity(null)
              }
            >
              Cancel
            </Button>

            <Button
              onClick={() =>
                updateMutation.mutate()
              }
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}