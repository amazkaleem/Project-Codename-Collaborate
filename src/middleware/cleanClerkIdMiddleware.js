//this is a custom middleware designed to remove the "user_" from the user_id specified by Clerk 
//AND to validate this Clerk assigned Id to be a valid V4 UUID that NEON and the backend accepts

// cleanClerkIdMiddleware.js (New file or integrated at the top of your router file)

const cleanClerkIdMiddleware = (req, res, next) => {

    // Check if a userId parameter exists in the route
    const userId = req.params.userId;

    // The UUID validation regex (checks for V1-V5 and standard variant)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const CLERK_PREFIX = "user_";
    
  if (userId && userId.startsWith(CLERK_PREFIX)) {
    const rawUuid = userId.slice(CLERK_PREFIX.length); // e.g., 'd6eb621f-...'

    // IMPORTANT: Verify that the sliced part is actually a valid UUID
    if (uuidRegex.test(rawUuid)) {
      // 1. Overwrite the original parameter with the cleaned UUID
      req.params.userId = rawUuid;

      // 2. We can also attach it to the request object for controllers to use
      // req.cleanUserId = rawUuid; 

      console.log(`✅ Converted Clerk ID: ${userId} -> ${rawUuid}`);
      return next(); // Continue to the controller
    } else {
      // If the prefix exists but the rest is not a valid UUID (malformed or invalid)
      console.warn(`⚠️ Invalid UUID format detected after stripping prefix in: ${userId}`);
      // In a real app, you might stop execution here to prevent errors:
      // return res.status(400).json({ error: "Invalid User ID format." });
      return next(); // For now, pass the original ID just in case the controller handles it
    }
  }

  // If no userId parameter is present or no prefix found, just continue.
  next();
};

export default cleanClerkIdMiddleware;