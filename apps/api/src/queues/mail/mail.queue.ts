/* eslint-disable prettier/prettier */
import { Queue } from "bullmq";
import { redis } from "../redis/redis.provider";

export const mailQueue = new Queue("mail-queue", {
  connection: redis
});
