import { Router } from "express";
import { authRouter } from "./auth";
import { quizzesRouter } from "./quizzes";
import { attemptsRouter } from "./attempts";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/quizzes", quizzesRouter);
apiRouter.use("/attempts", attemptsRouter);
