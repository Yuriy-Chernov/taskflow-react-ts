import { baseApi } from "@/app/baseApi"
import { PAGE_SIZE } from "@/common/constants"
import type { BaseResponse } from "@/common/types"
import type { DomainTask, GetTasksResponse, UpdateTaskModel } from "./tasksApi.types"

const updateTaskListsForTodolist = (
  dispatch: (action: unknown) => { undo: () => void },
  getState: () => unknown,
  todolistId: string,
  recipe: (state: GetTasksResponse) => void,
) => {
  const cachedArgs = tasksApi.util.selectCachedArgsForQuery(getState() as never, "getTasks")

  return cachedArgs
    .filter((args) => args.id === todolistId)
    .map((args) => dispatch(tasksApi.util.updateQueryData("getTasks", args, recipe)))
}

export const tasksApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTasks: build.query<GetTasksResponse, { id: string; params: { page: number; count: number } }>({
      query: ({ id, params }) => {
        return {
          url: `todo-lists/${id}/tasks`,
          params: {
            ...params,
            count: PAGE_SIZE,
          },
        }
      },
      providesTags: (_result, _error, { id }) => [{ type: "Task", id }],
    }),
    addTask: build.mutation<BaseResponse<{ item: DomainTask }>, { todolistId: string; title: string }>({
      query: ({ todolistId, title }) => ({
        url: `todo-lists/${todolistId}/tasks`,
        method: "POST",
        body: { title },
      }),
      onQueryStarted: async ({ todolistId, title }, { dispatch, getState, queryFulfilled }) => {
        const tempTaskId = `temp-${Date.now()}`
        const patchResults = updateTaskListsForTodolist(dispatch, getState, todolistId, (state) => {
          state.items.unshift({
            id: tempTaskId,
            todoListId: todolistId,
            title,
            status: 0,
            priority: 1,
            description: null,
            startDate: null,
            deadline: null,
            order: -1,
            addedDate: new Date().toISOString(),
          })
          state.totalCount += 1
        })

        try {
          const { data } = await queryFulfilled
          updateTaskListsForTodolist(dispatch, getState, todolistId, (state) => {
            const tempIndex = state.items.findIndex((task) => task.id === tempTaskId)
            if (tempIndex !== -1) {
              state.items[tempIndex] = data.data.item
            }
          })
        } catch {
          patchResults.forEach((patchResult) => patchResult.undo())
        }
      },
      invalidatesTags: (_result, _error, { todolistId }) => [{ type: "Task", id: todolistId }],
    }),
    removeTask: build.mutation<BaseResponse, { todolistId: string; taskId: string }>({
      query: ({ todolistId, taskId }) => ({
        url: `todo-lists/${todolistId}/tasks/${taskId}`,
        method: "DELETE",
      }),
      onQueryStarted: async ({ todolistId, taskId }, { dispatch, getState, queryFulfilled }) => {
        const patchResults = updateTaskListsForTodolist(dispatch, getState, todolistId, (state) => {
          const index = state.items.findIndex((task) => task.id === taskId)
          if (index !== -1) {
            state.items.splice(index, 1)
            state.totalCount -= 1
          }
        })

        try {
          await queryFulfilled
        } catch {
          patchResults.forEach((patchResult) => patchResult.undo())
        }
      },
      invalidatesTags: (_result, _error, { todolistId }) => [{ type: "Task", id: todolistId }],
    }),
    updateTask: build.mutation<
      BaseResponse<{ item: DomainTask }>,
      { todolistId: string; taskId: string; model: UpdateTaskModel }
    >({
      query: ({ todolistId, taskId, model }) => ({
        url: `todo-lists/${todolistId}/tasks/${taskId}`,
        method: "PUT",
        body: model,
      }),
      onQueryStarted: async ({ todolistId, taskId, model }, { dispatch, getState, queryFulfilled }) => {
        const patchResults = updateTaskListsForTodolist(dispatch, getState, todolistId, (state) => {
          const index = state.items.findIndex((task) => task.id === taskId)
          if (index !== -1) {
            state.items[index] = { ...state.items[index], ...model }
          }
        })

        try {
          await queryFulfilled
        } catch {
          patchResults.forEach((patchResult) => patchResult.undo())
        }
      },
      invalidatesTags: (_result, _error, { todolistId }) => [{ type: "Task", id: todolistId }],
    }),
  }),
})
export const { useGetTasksQuery, useAddTaskMutation, useRemoveTaskMutation, useUpdateTaskMutation } = tasksApi
