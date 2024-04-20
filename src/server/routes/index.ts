import { Response, Router } from "express";
import moment from "moment";

const router = Router();

router.use((req, res: Response, next) => {
    res.send(`<html><body><h1>${moment().format()}</h1></body></html>`)
});

export { router as indexRouter };