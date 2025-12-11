//The Clerk authenticated userId in the form of "user_someCode". Initially I thought this "someCode" within
//the userId is some UUID that can be fed into the Neon database but that was not it. After applying the algorithm in this file,
//I obtained the following observation:
//36d2f293-vHHL-dNyt-5mM5-A8hFrJT -------->(UUID from Clerk)
//a874d7da-a329-4246-9e04-9db24afbaabb --->(UUID from Neon)
//The "someCode" is NOT a UUID for which I had to ignore all the conversion logic and ultimately change the data type of the UUID Database field names so that
//the Clerk authenticated userID is allowed into it. This meant changing the data type from UUID to VARCHAR(255)
//I also had to DROP all the relationships between different tables before ALTERing the PRIMARY KEYs and then adding all the CONSTRAINTs and defining the
//relationships again after the ALTER logic

clerkId = "user_36d2f293vHHLdNyt5mM5A8hFrJT";
// A CORRECTED approach for deterministic V4 UUID construction:
const hexId = clerkId.slice(5); // The 32-character hex ID: '09c842d04dff46ef925cfe563ffb3bf5'

const uuid = `${hexId.slice(0, 8)}-${hexId.slice(8, 12)}-4${hexId.slice(
  13,
  16
)}-a${hexId.slice(17, 20)}-${hexId.slice(20, 32)}`;
// Output: user_09c842d04dff46ef925cfe563ffb3bf5 -> 09c842d0-4dff-46ef-a25c-fe563ffb3bf5

console.log(`🔄 Converting Clerk ID to UUID: ${clerkId} -> ${uuid}`);
