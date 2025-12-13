/**
 * ==================== DATE & TIME HELPERS ====================
 */

/**
 * Format a date string to readable format
 * @param {string} dateString - ISO date string
 * @param {string} format - "short" | "long" | "relative"
 * @returns {string} Formatted date
 */
export const formatDate = (dateString, format = "short") => {
  if (!dateString) return "No date";

  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Relative format (e.g., "Today", "Tomorrow", "2 days ago")
  if (format === "relative") {
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 1) return `In ${diffDays} days`;
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
  }

  // Short format (e.g., "Jan 15, 2025")
  if (format === "short") {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // Long format (e.g., "January 15, 2025 at 3:30 PM")
  if (format === "long") {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString();
};

/**
 * Check if a date is overdue
 * @param {string} dateString - ISO date string
 * @returns {boolean}
 */
export const isOverdue = (dateString) => {
  if (!dateString) return false;
  const dueDate = new Date(dateString);
  const now = new Date();
  return dueDate < now;
};

/**
 * Get days until due date
 * @param {string} dateString - ISO date string
 * @returns {number} Days until due (negative if overdue)
 */
export const daysUntilDue = (dateString) => {
  if (!dateString) return null;
  const dueDate = new Date(dateString);
  const now = new Date();
  const diffTime = dueDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * ==================== TASK STATUS HELPERS ====================
 */

/**
 * Get color for task status
 * @param {string} status - Task status
 * @returns {string} Color hex code
 */
export const getStatusColor = (status) => {
  const statusColors = {
    "To-Do": "#E74C3C", // Red
    "In-Progress": "#F39C12", // Orange
    "In-Review": "#3498DB", // Blue
    Done: "#2ECC71", // Green
  };
  return statusColors[status] || "#95A5A6"; // Gray default
};

/**
 * Get background color (lighter version) for task status
 * @param {string} status - Task status
 * @returns {string} Color hex code
 */
export const getStatusBackgroundColor = (status) => {
  const statusBgColors = {
    "To-Do": "#FADBD8", // Light red
    "In-Progress": "#FCE5CD", // Light orange
    "In-Review": "#D6EAF8", // Light blue
    Done: "#D5F4E6", // Light green
  };
  return statusBgColors[status] || "#ECF0F1"; // Light gray default
};

/**
 * Get icon name for task status (for icon libraries like Ionicons)
 * @param {string} status - Task status
 * @returns {string} Icon name
 */
export const getStatusIcon = (status) => {
  const statusIcons = {
    "To-Do": "radio-button-off-outline",
    "In-Progress": "hourglass-outline",
    "In-Review": "eye-outline",
    Done: "checkmark-circle-outline",
  };
  return statusIcons[status] || "help-circle-outline";
};

/**
 * ==================== VALIDATION HELPERS ====================
 */

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate username
 * @param {string} username - Username
 * @returns {object} { valid: boolean, error: string }
 */
export const validateUsername = (username) => {
  if (!username) {
    return { valid: false, error: "Username is required" };
  }
  if (username.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters" };
  }
  if (username.length > 50) {
    return { valid: false, error: "Username must not exceed 50 characters" };
  }
  return { valid: true, error: null };
};

/**
 * Validate password strength
 * @param {string} password - Password
 * @returns {object} { valid: boolean, error: string, strength: string }
 */
export const validatePassword = (password) => {
  if (!password) {
    return { valid: false, error: "Password is required", strength: "none" };
  }
  if (password.length < 8) {
    return {
      valid: false,
      error: "Password must be at least 8 characters",
      strength: "weak",
    };
  }

  // Check strength
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const strengthCount = [
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChar,
  ].filter(Boolean).length;

  let strength = "weak";
  if (strengthCount >= 3) strength = "medium";
  if (strengthCount === 4 && password.length >= 12) strength = "strong";

  return {
    valid: true,
    error: null,
    strength,
  };
};

/**
 * ==================== TEXT HELPERS ====================
 */

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string}
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

/**
 * Capitalize first letter of each word
 * @param {string} text - Text to capitalize
 * @returns {string}
 */
export const capitalizeWords = (text) => {
  if (!text) return "";
  return text
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Get initials from full name
 * @param {string} fullName - Full name
 * @returns {string} Initials (max 2 letters)
 */
export const getInitials = (fullName) => {
  if (!fullName) return "?";
  const names = fullName.trim().split(" ");
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

/**
 * ==================== BOARD/TASK CALCULATION HELPERS ====================
 */

/**
 * Calculate task completion percentage
 * @param {Array} tasks - Array of task objects
 * @returns {number} Percentage (0-100)
 */
export const calculateTaskProgress = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;
  const completedTasks = tasks.filter((task) => task.status === "Done").length;
  return Math.round((completedTasks / tasks.length) * 100);
};

/**
 * Group tasks by status
 * @param {Array} tasks - Array of task objects
 * @returns {object} Tasks grouped by status
 */
export const groupTasksByStatus = (tasks) => {
  if (!tasks) return {};
  return tasks.reduce((groups, task) => {
    const status = task.status || "To-Do";
    if (!groups[status]) groups[status] = [];
    groups[status].push(task);
    return groups;
  }, {});
};

/**
 * Get overdue tasks count
 * @param {Array} tasks - Array of task objects
 * @returns {number}
 */
export const getOverdueTasksCount = (tasks) => {
  if (!tasks) return 0;
  return tasks.filter((task) => {
    return task.due_date && isOverdue(task.due_date) && task.status !== "Done";
  }).length;
};

/**
 * Sort tasks by priority (overdue first, then by due date)
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Sorted tasks
 */
export const sortTasksByPriority = (tasks) => {
  if (!tasks) return [];
  return [...tasks].sort((a, b) => {
    const aOverdue = a.due_date && isOverdue(a.due_date);
    const bOverdue = b.due_date && isOverdue(b.due_date);

    // Overdue tasks first
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    // Then sort by due date
    if (a.due_date && b.due_date) {
      return new Date(a.due_date) - new Date(b.due_date);
    }

    // Tasks without due date go last
    if (a.due_date && !b.due_date) return -1;
    if (!a.due_date && b.due_date) return 1;

    return 0;
  });
};

/**
 * ==================== ARRAY HELPERS ====================
 */

/**
 * Remove duplicates from array based on key
 * @param {Array} array - Array of objects
 * @param {string} key - Key to check for uniqueness
 * @returns {Array}
 */
export const removeDuplicates = (array, key) => {
  if (!array) return [];
  return array.filter(
    (item, index, self) => index === self.findIndex((t) => t[key] === item[key])
  );
};

/**
 * ==================== UUID HELPERS ====================
 */

/**
 * Check if string is a valid UUID
 * @param {string} uuid - UUID string
 * @returns {boolean}
 */
export const isValidUUID = (uuid) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};
