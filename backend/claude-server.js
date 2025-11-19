import express from "express";
import dotenv from "dotenv";
import { sql } from "./src/config/db.js";
import { validate as isUuid } from "uuid";
import transactionRoutes from "./src/routes/transactionRoutes.js";

dotenv.config();

const app = express();

//MiddleWare
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 8081;

// ============================================
// GET ROUTES
// ============================================

//GET all boards by userId
app.get("/api/boards/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate UUID early to avoid accidental route collisions and bogus queries
    if (!isUuid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Using parameterized query - postgres.js automatically handles SQL injection prevention
    const boards = await sql`
      SELECT DISTINCT b.board_id, b.board_name, b.created_by, b.member_count, b.task_count, b.updated_at
      FROM boards b
      JOIN board_members bm ON b.board_id = bm.board_id
      WHERE bm.user_id = ${userId}
      ORDER BY b.updated_at DESC
    `;

    res.status(200).json(boards);
  } catch (error) {
    console.log("There was an error GETTING all the boards:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//GET all tasks for displaying on the boards dashboard. Done by board id
app.get("/api/tasks/board/:boardId", async (req, res) => {
  try {
    const { boardId } = req.params;

    // Validate UUID format
    if (!isUuid(boardId)) {
      return res.status(400).json({ message: "Invalid board ID format" });
    }

    // Using parameterized query
    const tasks = await sql`
      SELECT * FROM tasks WHERE board_id = ${boardId}
      ORDER BY position ASC, created_at DESC
    `;

    res.status(200).json(tasks);
  } catch (error) {
    console.log("There was an error GETTING all tasks by board id:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//GET all the tasks assigned to a specific user. Done by user id
app.get("/api/tasks/user/:userId", async (req, res) => {
  try {
    /*
    1) req.params:
      a) Purpose: Used to capture dynamic segments from the URL path, defined in the route pattern.
      b) Location of Data: The data comes from the URL itself, as part of the path.
      c) Example: const userId = req.params.id; // If the URL is /users/123, userId will be '123'
    2) req.body:
      a) Purpose: Used to access data sent in the body of the HTTP request. This data is typically sent with POST, PUT, or PATCH requests.
      b) Location of Data: The data is contained within the request body, not the URL.
         It often comes from form submissions or API requests with a payload.
      c) Example: const newProduct = req.body; // If the request body is { name: 'Laptop', price: 1200 }, newProduct will be that object
    */
    const { userId } = req.params;

    // Validate UUID format
    if (!isUuid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Using parameterized query
    const tasks = await sql`
      SELECT * FROM tasks 
      WHERE assigned_to = ${userId}
      ORDER BY due_date ASC, created_at DESC
    `;

    res.status(200).json(tasks);
  } catch (error) {
    console.log("There was an error GETTING all tasks by userId:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ============================================
// POST ROUTES
// ============================================

//Creating a new user
app.post("/api/users", async (req, res) => {
  try {
    // console.log("POST /api/users body:", req.body);

    //Use req.body for data sent in POST, PUT, or PATCH requests, usually in JSON or form data.
    const { username, email, password_hash, full_name } = req.body;

    // Input validation - check for required fields
    if (!username || !email || !password_hash || !full_name) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Additional validation - check field lengths and formats
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({
        message: "Username must be between 3 and 50 characters",
      });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (full_name.length > 100) {
      return res.status(400).json({
        message: "Full name must not exceed 100 characters",
      });
    }

    // Using parameterized query - values are automatically escaped
    const user = await sql`
      INSERT INTO users(username, email, password_hash, full_name)
      VALUES (${username}, ${email}, ${password_hash}, ${full_name})
      RETURNING user_id, username, email, full_name, avatar_url, created_at, is_active
    `;

    console.log("New user created:", user[0].user_id);
    res.status(201).json(user[0]);
  } catch (error) {
    console.log("There was an error creating a new USER:", error);

    // Handle unique constraint violations (duplicate username or email)
    if (error.code === "23505") {
      if (error.constraint === "users_username_key") {
        return res.status(409).json({ message: "Username already exists" });
      }
      if (error.constraint === "users_email_key") {
        return res.status(409).json({ message: "Email already exists" });
      }
    }

    res.status(500).json({ message: "Internal Server Error" });
  }
});

//Creating a new board. Done by the admin of the board
app.post("/api/boards", async (req, res) => {
  try {
    // console.log("POST /api/boards body:", req.body);
    //Use req.body for data sent in POST, PUT, or PATCH requests, usually in JSON or form data.
    const { board_name, description, created_by } = req.body;
    //const created_by = req.user?.user_id; // example: from JWT or session
    //There are some referencing problems here because "created_by" references users(user_id)
    //and it cannot be NULL
    //If there are no users in the database, created_by will become NULL which throws a 500 "Internal Server Error"
    //We can actually destructure the req.params into a userId and assign it to created_by as a potential solution

    // Input validation - check for required fields
    if (!board_name || !description || !created_by) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate UUID format for created_by
    if (!isUuid(created_by)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Additional validation - check field lengths
    if (board_name.length > 100) {
      return res.status(400).json({
        message: "Board name must not exceed 100 characters",
      });
    }

    // Using parameterized query - values are automatically escaped
    const board = await sql`
      INSERT INTO boards(board_name, description, created_by)
      VALUES (${board_name}, ${description}, ${created_by})
      RETURNING *
    `;

    // Also add the creator as an admin member of the board
    await sql`
      INSERT INTO board_members(board_id, user_id, role)
      VALUES (${board[0].board_id}, ${created_by}, 'admin')
    `;

    console.log("New board created:", board[0].board_id);
    res.status(201).json(board[0]);
  } catch (error) {
    console.log("There was an error creating a new board:", error);

    // Handle foreign key constraint violations (invalid user)
    if (error.code === "23503") {
      return res.status(400).json({
        message: "Invalid user ID - user does not exist",
      });
    }

    res.status(500).json({ message: "Internal Server Error" });
  }
});

//Creating a new task
app.post("/api/tasks", async (req, res) => {
  try {
    const {
      title,
      created_by,
      board_id,
      description,
      assigned_to,
      due_date,
      tags,
      status,
    } = req.body;

    // Input validation - check for required fields
    if (!title || !created_by || !board_id) {
      return res.status(400).json({
        message: "Title, created_by, and board_id are required",
      });
    }

    // Validate UUID formats
    if (!isUuid(created_by)) {
      return res
        .status(400)
        .json({ message: "Invalid created_by user ID format" });
    }

    if (!isUuid(board_id)) {
      return res.status(400).json({ message: "Invalid board ID format" });
    }

    if (assigned_to && !isUuid(assigned_to)) {
      return res
        .status(400)
        .json({ message: "Invalid assigned_to user ID format" });
    }

    // Validate status if provided
    const validStatuses = ["To-Do", "In-Progress", "In-Review", "Done"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Additional validation - check field lengths
    if (title.length > 255) {
      return res.status(400).json({
        message: "Title must not exceed 255 characters",
      });
    }

    // Validate tags is an array if provided
    if (tags && !Array.isArray(tags)) {
      return res.status(400).json({
        message: "Tags must be an array",
      });
    }

    // Using parameterized query - values are automatically escaped
    const task = await sql`
      INSERT INTO tasks(
        title,
        board_id,
        created_by,
        description,
        assigned_to,
        due_date,
        tags,
        status
      )
      VALUES (
        ${title},
        ${board_id},
        ${created_by},
        ${description || null},
        ${assigned_to || null},
        ${due_date || null},
        ${tags || null},
        ${status || "To-Do"}
      )
      RETURNING *
    `;

    // Increment task_count on the board (keep board metadata in sync)
    const updatedBoard = await sql`
      UPDATE boards
      SET task_count = COALESCE(task_count, 0) + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE board_id = ${board_id}
      RETURNING task_count
    `;

    // If board not found, rollback created task to avoid inconsistent state
    if (updatedBoard.length === 0) {
      await sql`
        DELETE FROM tasks WHERE task_id = ${task[0].task_id}
      `;
      return res
        .status(400)
        .json({ message: "Board not found; task creation rolled back" });
    }

    console.log("New task created:", task[0].task_id);
    res.status(201).json(task[0]);
  } catch (error) {
    console.log("There was an error POSTING a new task:", error);

    // Handle foreign key constraint violations
    if (error.code === "23503") {
      if (error.constraint === "tasks_board_id_fkey") {
        return res.status(400).json({
          message: "Invalid board ID - board does not exist",
        });
      }
      if (error.constraint === "tasks_created_by_fkey") {
        return res.status(400).json({
          message: "Invalid created_by user ID - user does not exist",
        });
      }
      if (error.constraint === "tasks_assigned_to_fkey") {
        return res.status(400).json({
          message: "Invalid assigned_to user ID - user does not exist",
        });
      }
    }

    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Add a member to a board (POST /api/boards/:boardId/members)
app.post("/api/boards/:boardId/members", async (req, res) => {
  try {
    const { boardId } = req.params;
    const { user_id, role = "member" } = req.body;

    if (!isUuid(boardId) || !isUuid(user_id)) {
      return res
        .status(400)
        .json({ message: "Invalid boardId or user_id format" });
    }

    // run in a transaction so insert + count-update are atomic
    const result = await sql.begin(async (tx) => {
      // ensure board exists
      const board =
        await tx`SELECT board_id FROM boards WHERE board_id = ${boardId}`;
      if (!board.length) throw { status: 404, message: "Board not found" };

      // ensure user exists
      const user =
        await tx`SELECT user_id FROM users WHERE user_id = ${user_id}`;
      if (!user.length) throw { status: 400, message: "User not found" };

      // insert member, avoid duplicates
      const inserted = await tx`
        INSERT INTO board_members(board_id, user_id, role)
        VALUES (${boardId}, ${user_id}, ${role})
        ON CONFLICT (board_id, user_id) DO NOTHING
        RETURNING *
      `;

      // only increment if we actually inserted a new row
      if (inserted.length) {
        await tx`
          UPDATE boards
          SET member_count = COALESCE(member_count, 0) + 1,
              updated_at = CURRENT_TIMESTAMP
          WHERE board_id = ${boardId}
        `;
      }

      return inserted;
    });

    if (!result.length) {
      return res
        .status(409)
        .json({ message: "User is already a member of this board" });
    }

    res.status(201).json({ message: "Member added", member: result[0] });
  } catch (error) {
    if (error && error.status)
      return res.status(error.status).json({ message: error.message });
    console.log("Error adding member:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Remove a member from a board (DELETE /api/boards/:boardId/members/:userId)
app.delete("/api/boards/:boardId/members/:userId", async (req, res) => {
  try {
    const { boardId, userId } = req.params;

    if (!isUuid(boardId) || !isUuid(userId)) {
      return res
        .status(400)
        .json({ message: "Invalid boardId or userId format" });
    }

    /*

    Prefer authenticated user id (replace with your auth middleware value)
    Example: req.user is set by your JWT/session middleware
    const requester_id =
      req.user?.user_id ||                // preferred: from auth middleware
      req.body?.requester_id ||          // fallback: request body (POST/DELETE bodies may be unsupported by some clients)
      req.query?.requester_id ||         // fallback: query string ?requester_id=...
      req.get("x-requester-id");         // fallback: custom header

    */

    /*
    A transaction in a database is a sequence of one or more operations (like reading, writing, updating, or deleting data) 
    that are treated as a single, indivisible unit of work.
    The core principle of a database transaction is its "all-or-nothing" nature: 
    either all operations within the transaction are successfully completed and permanently recorded in the database (committed),
    or if any part of the transaction fails, all changes made during that transaction are undone (rolled back),
    leaving the database in its state before the transaction began.
    Represented by the 'tx' keyword inside the asynchronous function
    This ensures data consistency and integrity, even in the face of system failures or concurrent access by multiple users. 
    Transactions adhere to the ACID properties:
      1) Atomicity: All operations within a transaction are treated as a single, indivisible unit.
      2) Consistency: A transaction brings the database from one valid state to another valid state.
      3) Isolation: Concurrent transactions appear to execute in isolation from each other, preventing interference.
      4) Durability: Once a transaction is committed, its changes are permanent and survive system failures.
    */
    const result = await sql.begin(async (tx) => {
      // delete the membership
      const deleted = await tx`
        DELETE FROM board_members
        WHERE board_id = ${boardId} AND user_id = ${userId}
        RETURNING *
      `;

      if (!deleted.length) return deleted; // nothing removed

      // decrement member_count but not below 0
      await tx`
        UPDATE boards
        SET member_count = GREATEST(COALESCE(member_count, 0) - 1, 0),
            updated_at = CURRENT_TIMESTAMP
        WHERE board_id = ${boardId}
      `;

      return deleted;
    });

    if (!result.length) {
      return res.status(404).json({ message: "Membership not found" });
    }

    res.status(200).json({ message: "Member removed", removed: result[0] });
  } catch (error) {
    console.log("Error removing member:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ============================================
// DELETE ROUTES
// ============================================

//Deleting a user. Done by the user himself/herself
app.delete("/api/users/:deleteId", async (req, res) => {
  try {
    const { deleteId } = req.params;

    // Validate UUID format
    if (!isUuid(deleteId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Using parameterized query
    const afterDelete = await sql`
      DELETE FROM users 
      WHERE user_id = ${deleteId} 
      RETURNING user_id, username, email
    `;

    if (afterDelete.length === 0) {
      return res.status(404).json({ message: "User not found" });
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
});

//Deleting a board. Done by the admin of the board
app.delete("/api/boards/:deleteId", async (req, res) => {
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
});

//Deleting a task
app.delete("/api/tasks/:deleteId", async (req, res) => {
  try {
    const { deleteId: taskId } = req.params;

    // Validate UUID format
    if (!isUuid(taskId)) {
      return res.status(400).json({ message: "Invalid task ID format" });
    }

    // Using parameterized query
    const afterDeleteTask = await sql`
      DELETE FROM tasks
      WHERE task_id = ${taskId}
      RETURNING task_id, title, board_id
    `;

    if (afterDeleteTask.length === 0) {
      return res.status(404).json({ message: "Task not found" });
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
});

// ============================================
// PATCH ROUTES
// ============================================

// UPDATE user information (username, full_name, avatar_url)
app.patch("/api/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, full_name, avatar_url } = req.body;

    // Validate UUID format
    if (!isUuid(userId)) {
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

    // Build dynamic update query based on provided fields
    //This method of pushing data to arrays and generating dynamic queries through them
    //is to prevent SQL INJECTION
    //"Developers remember to use prepared statements and keep input validation tight!"
    const updates = [];
    const values = [];
    if (username !== undefined) {
      updates.push(`username = $${updates.length + 1}`);
      values.push(username);
    }
    if (full_name !== undefined) {
      updates.push(`full_name = $${updates.length + 1}`);
      values.push(full_name);
    }
    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${updates.length + 1}`);
      values.push(avatar_url);
    }

    // Add userId as the last parameter
    values.push(userId);

    //values = [ username, // → $1, full_name, // → $2, avatar_url, // → $3, userId // → $4 ]

    //The output of the ${sql.unsafe} : "username = $1, full_name = $2"
    const updatedUser = await sql`
      UPDATE users
      SET ${sql.unsafe(updates.join(", "))}
      WHERE user_id = ${userId}
      RETURNING user_id, username, email, full_name, avatar_url, created_at, last_login, is_active
    `;

    if (updatedUser.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser[0]);
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
});

// UPDATE board information (board_name, description)
app.patch("/api/boards/:boardId", async (req, res) => {
  try {
    const { boardId } = req.params;
    const { board_name, description } = req.body;

    // Validate UUID format
    if (!isUuid(boardId)) {
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

    // Build dynamic update query
    const updates = [];
    const values = [];

    if (board_name !== undefined) {
      updates.push(`board_name = $${updates.length + 1}`);
      values.push(board_name);
    }
    if (description !== undefined) {
      updates.push(`description = $${updates.length + 1}`);
      values.push(description);
    }

    // Add updated_at timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add boardId as the last parameter
    values.push(boardId);

    const updatedBoard = await sql`
      UPDATE boards 
      SET ${sql.unsafe(updates.join(", "))}
      WHERE board_id = ${boardId}
      RETURNING *
    `;

    if (updatedBoard.length === 0) {
      return res.status(404).json({ message: "Board not found" });
    }

    res.status(200).json(updatedBoard[0]);
  } catch (error) {
    console.log("There was an error UPDATING the board:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// UPDATE task information (title, description, assigned_to, due_date, tags, status)
app.patch("/api/tasks/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, assigned_to, due_date, tags, status } =
      req.body;

    // Validate UUID format
    if (!isUuid(taskId)) {
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
    if (assigned_to && assigned_to !== null && !isUuid(assigned_to)) {
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

    // Build dynamic update query
    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push(`title = $${updates.length + 1}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${updates.length + 1}`);
      values.push(description);
    }
    if (assigned_to !== undefined) {
      updates.push(`assigned_to = $${updates.length + 1}`);
      values.push(assigned_to);
    }
    if (due_date !== undefined) {
      updates.push(`due_date = $${updates.length + 1}`);
      values.push(due_date);
    }
    if (tags !== undefined) {
      updates.push(`tags = $${updates.length + 1}`);
      values.push(tags);
    }
    if (status !== undefined) {
      updates.push(`status = $${updates.length + 1}`);
      values.push(status);
    }

    // Add updated_at timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add taskId as the last parameter
    values.push(taskId);

    const updatedTask = await sql`
      UPDATE tasks 
      SET ${sql.unsafe(updates.join(", "))}
      WHERE task_id = ${taskId}
      RETURNING *
    `;

    if (updatedTask.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json(updatedTask[0]);
  } catch (error) {
    console.log("There was an error UPDATING the task:", error);

    // Handle foreign key constraint violations
    if (error.code === "23503") {
      return res.status(400).json({
        message: "Invalid assigned_to user ID - user does not exist",
      });
    }

    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Mount router under /api (replace the incomplete app.use("/api") later in the file)
app.use("/api", transactionRoutes);

app.listen(PORT, () => {
  console.log(`Server is running at PORT number ${PORT}`);
});
