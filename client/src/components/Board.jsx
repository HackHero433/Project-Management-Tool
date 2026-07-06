import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { taskApi } from '../api/endpoints';
import TaskCard from './TaskCard';

function applyFilters(task, filters, currentUser) {
  const search = filters.search.trim().toLowerCase();
  const assigneeIds = (task.assignees || []).map((assignee) => assignee._id);

  if (search && !task.title.toLowerCase().includes(search)) {
    return false;
  }

  if (filters.priority && task.priority !== filters.priority) {
    return false;
  }

  if (filters.assignee && !assigneeIds.includes(filters.assignee)) {
    return false;
  }

  if (filters.assignedToMe && !assigneeIds.includes(currentUser.id)) {
    return false;
  }

  return true;
}

function moveOptimistically(payload, source, destination, draggableId) {
  const next = structuredClone(payload);
  const sourceList = next.board.lists.find((list) => list._id === source.droppableId);
  const targetList = next.board.lists.find((list) => list._id === destination.droppableId);
  const [movedTask] = sourceList.tasks.splice(source.index, 1);

  movedTask.list = targetList._id;
  targetList.tasks.splice(destination.index, 0, movedTask);
  sourceList.tasks.forEach((task, index) => {
    task.order = index;
  });
  targetList.tasks.forEach((task, index) => {
    task.order = index;
  });

  if (movedTask._id !== draggableId) {
    return payload;
  }

  return next;
}

export default function Board({ data, filters, currentUser, setData, onOpenTask, onReload }) {
  const [newTasks, setNewTasks] = useState({});
  const dragDisabled = Boolean(filters.search || filters.assignee || filters.priority || filters.assignedToMe);
  const lists = useMemo(
    () =>
      data.board.lists.map((list) => ({
        ...list,
        tasks: (list.tasks || []).filter((task) => applyFilters(task, filters, currentUser))
      })),
    [data.board.lists, filters, currentUser]
  );

  const onDragEnd = async ({ source, destination, draggableId }) => {
    if (!destination) {
      return;
    }

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const previous = data;
    setData((current) => moveOptimistically(current, source, destination, draggableId));

    try {
      await taskApi.update(draggableId, {
        listId: destination.droppableId,
        order: destination.index
      });
      await onReload();
    } catch (error) {
      setData(previous);
    }
  };

  const createTask = async (event, listId) => {
    event.preventDefault();
    const title = newTasks[listId]?.trim();
    if (!title) {
      return;
    }

    await taskApi.create(listId, { title });
    setNewTasks((current) => ({ ...current, [listId]: '' }));
    await onReload();
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <section className="kanban" aria-label="Project board">
        {lists.map((list) => (
          <Droppable droppableId={list._id} key={list._id}>
            {(provided) => (
              <article className="list" ref={provided.innerRef} {...provided.droppableProps}>
                <header className="list-header">
                  <h2>{list.title}</h2>
                  <span>{list.tasks.length}</span>
                </header>
                <div className="task-stack">
                  {list.tasks.map((task, index) => (
                    <Draggable draggableId={task._id} index={index} key={task._id} isDragDisabled={dragDisabled}>
                      {(dragProvided, snapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className={snapshot.isDragging ? 'dragging' : ''}
                        >
                          <TaskCard task={task} onClick={() => onOpenTask(task._id)} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
                <form className="new-task" onSubmit={(event) => createTask(event, list._id)}>
                  <input
                    value={newTasks[list._id] || ''}
                    onChange={(event) => setNewTasks((current) => ({ ...current, [list._id]: event.target.value }))}
                    placeholder="Add task"
                  />
                  <button type="submit" aria-label={`Add task to ${list.title}`} title={`Add task to ${list.title}`}>
                    <Plus size={16} />
                  </button>
                </form>
              </article>
            )}
          </Droppable>
        ))}
      </section>
    </DragDropContext>
  );
}
