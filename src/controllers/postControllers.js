import { sql } from "../config/db.js";

//Creating a new user
export async function createUser(req, res) {
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
}

//Creating a new board. Done by the admin of the board
export async function createBoard(req, res) {
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

    // Validation for created_by
    if (!created_by || typeof created_by !== "string" || created_by.trim() === "") {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    if (
      !created_by ||
      typeof created_by !== "string" ||
      created_by.trim() === ""
    ) {
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
}

//Creating a new task
export async function createTask(req, res) {
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

    // Validation
    if (
      !created_by ||
      typeof created_by !== "string" ||
      created_by.trim() === ""
    ) {
      return res.status(400).json({ message: "Task created by an invalid user ID format" });
    }

    if (!board_id || typeof boardId !== "string" || boardId.trim() === "") {
      return res.status(400).json({ message: "Task belongs to Invalid user ID format" });
    }

    if (
      (assigned_to && typeof assigned_to !== "string") ||
      assigned_to.trim() === ""
    ) {
      return res.status(400).json({ message: "Task assigned to Invalid user ID format" });
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
      SET task_count = task_count + 1,
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
}

// Add a member to a board (POST /api/boards/:boardId/members)
export async function addBoardMember(req, res) {
  try {
    const { boardId } = req.params;
    const { user_id, role = "member" } = req.body;

    if (
      !boardId ||
      typeof boardId !== "string" ||
      boardId.trim() === "" ||
      !userId ||
      typeof userId !== "string" ||
      userId.trim() === ""
    ) {
      return res
        .status(400)
        .json({ message: "Invalid boardID or userId format" });
    }

    // ensure board exists
    const board =
      await sql`SELECT board_id FROM boards WHERE board_id = ${boardId}`;
    if (!board.length)
      return res.status(404).json({ message: "Board not found" });

    // ensure user exists
    const user =
      await sql`SELECT user_id FROM users WHERE user_id = ${user_id}`;
    if (!user.length)
      return res.status(404).json({ message: "User not found" });

    // insert member, avoid duplicates
    const inserted = await sql`
      INSERT INTO board_members(board_id, user_id, role)
      VALUES (${boardId}, ${user_id}, ${role})
      ON CONFLICT (board_id, user_id) DO NOTHING
      RETURNING *
    `;

    if (!inserted.length) {
      return res
        .status(409)
        .json({ message: "User is already a member of this board" });
    }

    // increment member_count (no COALESCE since column defaults to 0)
    await sql`
      UPDATE boards
      SET member_count = member_count + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE board_id = ${boardId}
    `;

    res.status(201).json({ message: "Member added", member: inserted[0] });
  } catch (error) {
    console.log("Error adding member:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
