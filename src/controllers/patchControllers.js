import { sql } from "../config/db.js";

// UPDATE user information (username, full_name, avatar_url)
export async function patchUserByUserId(req, res) {
  try {
    const { userId } = req.params;
    const { username, full_name, avatar_url } = req.body;

    // Validation
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Check if at least one field is provided
    if (!username && !full_name && avatar_url === undefined) {
      return res.status(400).json({
        message:
          "At least one field (username, full_name, or avatar_url) must be provided",
      });
    }

    // Additional validation for provided fields
    if (
      username !== undefined &&
      (username.length < 3 || username.length > 50)
    ) {
      return res.status(400).json({
        message: "Username must be between 3 and 50 characters",
      });
    }

    if (full_name !== undefined && full_name.length > 100) {
      return res.status(400).json({
        message: "Full name must not exceed 100 characters",
      });
    }

    if (
      avatar_url !== undefined &&
      avatar_url !== null &&
      avatar_url.length > 500
    ) {
      return res.status(400).json({
        message: "Avatar URL must not exceed 500 characters",
      });
    }

    // ensure user exists
    const existing =
      await sql`SELECT user_id FROM users WHERE user_id = ${userId}`;
    if (!existing.length) {
      return res.status(404).json({ message: "User not found" });
    }

    // Execute one UPDATE per provided field (safe parameter binding)
    try {
      if (username !== undefined) {
        await sql`
          UPDATE users
          SET username = ${username}
          WHERE user_id = ${userId}
        `;
      }

      if (full_name !== undefined) {
        await sql`
          UPDATE users
          SET full_name = ${full_name}
          WHERE user_id = ${userId}
        `;
      }

      if (avatar_url !== undefined) {
        await sql`
          UPDATE users
          SET avatar_url = ${avatar_url}
          WHERE user_id = ${userId}
        `;
      }
    } catch (err) {
      // handle unique constraint (duplicate username) and other pg errors
      if (err?.code === "23505") {
        return res.status(409).json({ message: "Username already exists" });
      }
      console.log("There was an error UPDATING the user:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    // return updated row
    const [updatedUser] = await sql`
      SELECT user_id, username, email, full_name, avatar_url, created_at, last_login, is_active
      FROM users
      WHERE user_id = ${userId}
    `;

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("There was an error UPDATING the user:", error);

    // Handle unique constraint violations (duplicate username/email)
    //User is trying to update username to something already taken by another user.
    //For example, if there is user01 with username "ali" and user_id of 1,
    //And there is a second user02 with username "sara" and user_id of 2,
    //id user02 sends PATCH { "username": "ali" }, Database tries to update → fails → throws 23505 → API returns 409: { message: "Username already exists"}
    // Why Important? :
    // 1) Usernames must be unique across the platform
    // 2) Without this check, SQL would throw a DB error your API wouldn’t handle cleanly.
    // 3) You provide a user-friendly message instead of an internal DB crash message
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Username already exists",
      });
    }

    res.status(500).json({ message: "Internal Server Error" });
  }
}

// UPDATE board information (board_name, description)
export async function patchBoardByBoardId(req, res) {
  try {
    const { boardId } = req.params;
    const { board_name, description } = req.body;

    // Validation
    if (!boardId || typeof boardId !== "string" || boardId.trim() === "") {
      return res.status(400).json({ message: "Invalid board ID format" });
    }

    // Check if at least one field is provided
    if (!board_name && !description) {
      return res.status(400).json({
        message:
          "At least one field (board_name or description) must be provided",
      });
    }

    // Additional validation for provided fields
    if (board_name !== undefined && board_name.length > 100) {
      return res.status(400).json({
        message: "Board name must not exceed 100 characters",
      });
    }

    // ensure board exists
    const existing =
      await sql`SELECT board_id FROM boards WHERE board_id = ${boardId}`;
    if (!existing.length) {
      return res.status(404).json({ message: "Board not found" });
    }

    // Execute one UPDATE per provided field to avoid sql.unsafe/placeholder binding issues
    try {
      if (board_name !== undefined) {
        await sql`
          UPDATE boards
          SET board_name = ${board_name}, updated_at = CURRENT_TIMESTAMP
          WHERE board_id = ${boardId}
        `;
      }

      if (description !== undefined) {
        await sql`
          UPDATE boards
          SET description = ${description}, updated_at = CURRENT_TIMESTAMP
          WHERE board_id = ${boardId}
        `;
      }
    } catch (err) {
      console.log("There was an error UPDATING the board:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    const [updatedBoard] = await sql`
      SELECT * FROM boards WHERE board_id = ${boardId}
    `;

    res.status(200).json(updatedBoard);
  } catch (error) {
    console.log("There was an error UPDATING the board:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// UPDATE task information (title, description, assigned_to, due_date, tags, status)
export async function patchTaskByTaskId(req, res) {
  try {
    const { taskId } = req.params;
    const { title, description, assigned_to, due_date, tags, status } =
      req.body;

    // Validation
    if (!taskId || typeof taskId !== "string" || taskId.trim() === "") {
      return res.status(400).json({ message: "Invalid task ID format" });
    }

    // Check if at least one field is provided
    if (
      !title &&
      !description &&
      !assigned_to &&
      !due_date &&
      !tags &&
      !status
    ) {
      return res.status(400).json({
        message: "At least one field must be provided for update",
      });
    }

    // Validate status if provided
    const validStatuses = ["To-Do", "In-Progress", "In-Review", "Done"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Validate assigned_to is a valid UUID if provided
    if (assigned_to && assigned_to !== null) {
      return res
        .status(400)
        .json({ message: "Invalid assigned_to user ID format" });
    }

    // Additional validation for provided fields
    if (title !== undefined && title.length > 255) {
      return res.status(400).json({
        message: "Title must not exceed 255 characters",
      });
    }

    // Validate tags is an array if provided
    if (tags !== undefined && tags !== null && !Array.isArray(tags)) {
      return res.status(400).json({
        message: "Tags must be an array",
      });
    }

    // ensure task exists
    const existing =
      await sql`SELECT task_id FROM tasks WHERE task_id = ${taskId}`;
    if (!existing.length) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Execute one UPDATE per provided field (safe parameter binding)
    try {
      if (title !== undefined) {
        await sql`
          UPDATE tasks
          SET title = ${title}, updated_at = CURRENT_TIMESTAMP
          WHERE task_id = ${taskId}
        `;
      }

      if (description !== undefined) {
        await sql`
          UPDATE tasks
          SET description = ${description}, updated_at = CURRENT_TIMESTAMP
          WHERE task_id = ${taskId}
        `;
      }

      if (assigned_to !== undefined) {
        await sql`
          UPDATE tasks
          SET assigned_to = ${assigned_to}, updated_at = CURRENT_TIMESTAMP
          WHERE task_id = ${taskId}
        `;
      }

      if (due_date !== undefined) {
        await sql`
          UPDATE tasks
          SET due_date = ${due_date}, updated_at = CURRENT_TIMESTAMP
          WHERE task_id = ${taskId}
        `;
      }

      if (tags !== undefined) {
        await sql`
          UPDATE tasks
          SET tags = ${tags}, updated_at = CURRENT_TIMESTAMP
          WHERE task_id = ${taskId}
        `;
      }

      if (status !== undefined) {
        await sql`
          UPDATE tasks
          SET status = ${status}, updated_at = CURRENT_TIMESTAMP
          WHERE task_id = ${taskId}
        `;
      }
    } catch (err) {
      // Handle FK violations and other DB errors
      if (err?.code === "23503") {
        return res.status(400).json({
          message: "Invalid assigned_to user ID - user does not exist",
        });
      }
      console.log("There was an error UPDATING the task:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    const [updatedTask] = await sql`
      SELECT * FROM tasks WHERE task_id = ${taskId}
    `;

    res.status(200).json(updatedTask);
  } catch (error) {
    console.log("There was an error UPDATING the task:", error);

    if (error.code === "23503") {
      return res.status(400).json({
        message: "Invalid assigned_to user ID - user does not exist",
      });
    }

    res.status(500).json({ message: "Internal Server Error" });
  }
}
