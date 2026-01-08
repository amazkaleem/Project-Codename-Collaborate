import ratelimit from "../config/upstash.js"; //The extension '.js' is important at the end of this line for local imports
//due to "type":"module" in the package.json

const rateLimiter = async (req, res, next) => {
  try {
    //"...But as I said in production grade applications, you would have something like
    // either user_id or an IP Address. In our case, let us keep it simple just to understand
    // the concept of rate limiting and leave a hardcoded identifier in the argument of limit(), in this case,
    // 'my-rate-limit'..." By Codesistency
    const { success } = await ratelimit.limit("my-rate-limit");

    if (!success) {
      return res.status(429).json({
        message: "Too many requests, please try again later.",
      });
    }

    next();
  } catch (error) {
    console.log("Rate limit error", error);
    next(error);
  }
};

export default rateLimiter;
