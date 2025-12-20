import { sql } from "../config/db.js";

//GET all boards by userId
export async function getBoardsByUserId(req, res) {
  try {
    const { userId } = req.params;

    // Validation early to avoid accidental route collisions and bogus queries
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
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
}

//GET all tasks for displaying on the boards dashboard. Done by board id
export async function getTasksByBoardId(req, res) {
  try {
    const { boardId } = req.params;

    // Validation
    if (!boardId || typeof boardId !== "string" || boardId.trim() === "") {
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
}

//GET all the tasks assigned to a specific user. Done by user id
export async function getTasksByUserId(req, res) {
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

    // Validation
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
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
}

//GET all members of a board by board ID
export async function getBoardMembers(req, res) {
  try {
    const { boardId } = req.params;

    // Validation
    if (!boardId || typeof boardId !== "string" || boardId.trim() === "") {
      return res.status(400).json({ message: "Invalid board ID format" });
    }

    // Using parameterized query to get members with user details
    const members = await sql`
      SELECT
        bm.user_id,
        bm.role,
        bm.joined_at,
        u.email,
        u.username,
        u.full_name,
        u.avatar_url
      FROM board_members bm
      JOIN users u ON bm.user_id = u.user_id
      WHERE bm.board_id = ${boardId}
      ORDER BY bm.joined_at ASC
    `;

    res.status(200).json(members);
  } catch (error) {
    console.log("There was an error GETTING board members:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
