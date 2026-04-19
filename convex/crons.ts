// convex/crons.ts
import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

crons.hourly(
  "generate recommendations for all users",
  { minuteUTC: 0 }, // At the top of every hour
  api.recommendations.generateForAllUsers,
);

export default crons;
