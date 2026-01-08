// utils/taskDeadlineChecker.js

import { Alert } from "react-native";

/**
 * Schedules deletion of a completed task after 30 seconds
 * @param {String} taskId - ID of the task to delete
 * @param {String} taskTitle - Title of the task for the alert message
 * @param {Function} deleteTaskFn - Function to delete a task
 * @param {Function} setTasksFn - Function to update tasks state
 * @param {Function} setTimersFn - Function to update deletion timers state
 * @returns {void}
 */
export const scheduleCompletedTaskDeletion = (
  taskId,
  taskTitle,
  deleteTaskFn,
  setTasksFn,
  setTimersFn
) => {
  Alert.alert(
    "Task Completed! 🎉",
    `"${taskTitle}" has been completed! This task will be automatically deleted after 30 seconds.`,
    [
      {
        text: "OK",
        onPress: () => {
          console.log("⏰ Starting 30-second deletion timer for task:", taskId);

          // Schedule deletion after 30 seconds
          const timer = setTimeout(async () => {
            try {
              console.log("🗑️ Auto-deleting completed task:", taskId);
              await deleteTaskFn(taskId);

              // Update local state to remove the task
              setTasksFn((prevTasks) =>
                prevTasks.filter((t) => t.task_id !== taskId)
              );

              // Remove timer from state
              setTimersFn((prev) => {
                const newTimers = { ...prev };
                delete newTimers[taskId];
                return newTimers;
              });

              console.log("✅ Task auto-deleted successfully");
            } catch (error) {
              console.error("❌ Error auto-deleting task:", error);
              Alert.alert("Error", "Failed to auto-delete completed task");
            }
          }, 30000); // 30 seconds

          // Store timer reference
          setTimersFn((prev) => ({
            ...prev,
            [taskId]: timer,
          }));
        },
      },
    ]
  );
};

/**
 * Cleans up all pending deletion timers
 * @param {Object} timers - Object containing timer references
 * @returns {void}
 */
export const cleanupDeletionTimers = (timers) => {
  if (!timers) return;
  const timerCount = Object.keys(timers).length;
  if (timerCount > 0) {
    console.log(`🧹 Cleaning up ${timerCount} deletion timer(s)`);
  }
  Object.values(timers).forEach((timer) => {
    if (timer) clearTimeout(timer);
  });
};
