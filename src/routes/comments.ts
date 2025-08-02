import { Router } from "express";

import * as commentController from "../controllers/commentsController";



const commentsRouter = Router();

commentsRouter.route("/").post(commentController.createComment);
commentsRouter.route("/products/:productId").get(commentController.getCommentsByProductId);
commentsRouter.route("/:id").get(commentController.getComment).put(commentController.updateComment).delete(commentController.deleteComment);

export default commentsRouter;