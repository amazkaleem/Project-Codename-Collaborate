import { sql } from "../config/db.js";
import { validate as isUuid } from "uuid";

//Deleting a user. Done by the user himself/herself
export async function deleteUser(req, res) {
  try {
    const { deleteId } = req.params;

    const thisId = deleteId.slice(5);

    // Validate UUID format
    if (!isUuid(thisId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // 1) Get list of boards the user is a member of (capture before deleting)
    const memberBoards = await sql`
      SELECT DISTINCT board_id
      FROM board_members
      WHERE user_id = ${thisId}
    `;

    // Delete the user (this will also remove board_members rows if FK has ON DELETE CASCADE)
    const afterDelete = await sql`
        DELETE FROM users 
        WHERE user_id = ${thisId} 
        RETURNING user_id, username, email
        `;

    if (afterDelete.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Reduce member_count for each affected board (do not go below 0)
    for (const row of memberBoards) {
      const boardId = row.board_id;
      await sql`
        UPDATE boards
        SET member_count = GREATEST(COALESCE(member_count, 0) - 1, 0),
            updated_at = CURRENT_TIMESTAMP
        WHERE board_id = ${boardId}
      `;
    }

    console.log("User deleted:", afterDelete[0].user_id);
    res.status(200).json({
      message: "User successfully deleted",
      deleted_user: afterDelete[0],
    });
  } catch (error) {
    console.log("There was an error DELETING the user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

//Deleting a board. Done by the admin of the board
export async function deleteBoard(req, res) {
  try {
    const { deleteId: boardId } = req.params;

    // Validate UUID format
    if (!isUuid(boardId)) {
      return res.status(400).json({ message: "Invalid board ID format" });
    }

    // Using parameterized query
    const afterDeleteBoards = await sql`
        DELETE FROM boards 
        WHERE board_id = ${boardId} 
        RETURNING board_id, board_name
        `;

    if (afterDeleteBoards.length === 0) {
      return res.status(404).json({ message: "Board not found" });
    }

    console.log("Board deleted:", afterDeleteBoards[0].board_id);
    res.status(200).json({
      message: "Board deleted successfully",
      deleted_board: afterDeleteBoards[0],
    });
  } catch (error) {
    console.log("There was an error DELETING the board:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

//Deleting a task
export async function deleteTask(req, res) {
  try {
    const { deleteId: taskId } = req.params;

    // Validate UUID format
    if (!isUuid(taskId)) {
      return res.status(400).json({ message: "Invalid task ID format" });
    }

    // Using parameterized query: delete and return board_id so we can update counts
    const afterDeleteTask = await sql`
      DELETE FROM tasks
      WHERE task_id = ${taskId}
      RETURNING task_id, title, board_id
    `;

    if (afterDeleteTask.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    // 2) Reduce task_count for the affected board (do not go below 0)
    const boardId = afterDeleteTask[0].board_id;
    if (boardId) {
      await sql`
        UPDATE boards
        SET task_count = GREATEST(COALESCE(task_count, 0) - 1, 0),
            updated_at = CURRENT_TIMESTAMP
        WHERE board_id = ${boardId}
      `;
    }

    console.log("Task deleted:", afterDeleteTask[0].task_id);
    res.status(200).json({
      message: "Task deleted successfully",
      deleted_task: afterDeleteTask[0],
    });
  } catch (error) {
    console.log("There was an error DELETING the task:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Remove a member from a board (DELETE /api/boards/:boardId/members/:userId)
export async function removeBoardMember(req, res) {
  try {
    const { boardId, userId } = req.params;

    const thisId = userId.slice(5);

    if (!isUuid(boardId) || !isUuid(thisId)) {
      return res
        .status(400)
        .json({ message: "Invalid boardId or userId format" });
    }

    // Start a manual transaction using BEGIN / COMMIT / ROLLBACK
    await sql.unsafe("BEGIN");

    // delete the membership
    const deleted = await sql`
      DELETE FROM board_members
      WHERE board_id = ${boardId} AND user_id = ${thisId}
      RETURNING *
    `;

    if (!deleted.length) {
      // nothing removed — commit and respond 404
      await sql.unsafe("COMMIT");
      return res.status(404).json({ message: "Membership not found" });
    }

    // decrement member_count but not below 0
    await sql`
      UPDATE boards
      SET member_count = GREATEST(COALESCE(member_count, 0) - 1, 0),
          updated_at = CURRENT_TIMESTAMP
      WHERE board_id = ${boardId}
    `;

    // check remaining members for this board
    const remaining = await sql`
      SELECT user_id, role
      FROM board_members
      WHERE board_id = ${boardId}
      ORDER BY joined_at ASC
    `;

    let promoted = null;
    if (remaining.length === 1) {
      const remainingMember = remaining[0];
      // promote to admin only if not already admin
      if (remainingMember.role !== "admin") {
        await sql`
          UPDATE board_members
          SET role = ${"admin"}
          WHERE board_id = ${boardId} AND user_id = ${remainingMember.user_id}
        `;
        promoted = { user_id: remainingMember.user_id, role: "admin" };
      }
    }

    // commit the transaction
    await sql.unsafe("COMMIT");

    const response = { message: "Member removed", removed: deleted[0] };
    if (promoted) response.promoted = promoted;

    res.status(200).json(response);
  } catch (error) {
    // attempt rollback; ignore rollback errors
    try {
      await sql.unsafe("ROLLBACK");
    } catch (e) {}

    console.log("Error removing member:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
