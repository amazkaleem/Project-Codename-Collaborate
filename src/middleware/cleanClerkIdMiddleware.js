//this is a custom middleware designed to remove the "user_" from the user_id specified by Clerk
//AND to validate this Clerk assigned Id to be a valid V4 UUID that NEON and the backend accepts

// cleanClerkIdMiddleware.js (New file or integrated at the top of your router file)

const cleanClerkIdMiddleware = (req, res, next) => {
  const userId = req.params.userId;
  if (!userId) return next();

  const CLERK_PREFIX = "user_";
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const hex32Regex = /^[0-9a-fA-F]{32}$/;

  if (userId.startsWith(CLERK_PREFIX)) {
    const raw = userId.slice(CLERK_PREFIX.length); // might be dashed or compact hex

    // If clerk provides 32-hex (no dashes), convert to dashed UUID deterministically
    let candidateUuid = raw;
    if (hex32Regex.test(raw)) {
      const hex = raw.toLowerCase();
      candidateUuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(
        13,
        16
      )}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
    }

    if (uuidRegex.test(candidateUuid)) {
      req.params.userId = candidateUuid;
      console.log(`✅ Converted Clerk ID: ${userId} -> ${candidateUuid}`);
      return next();
    } else {
      console.warn(`⚠️ Invalid UUID after conversion for: ${userId}`);
      return res.status(400).json({ error: "Invalid User ID format." });
    }
  }

  // Not a clerk-prefixed id — leave alone
  return next();
};

export default cleanClerkIdMiddleware;
