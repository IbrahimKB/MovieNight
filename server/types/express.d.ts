import { JWTPayload } from "../models/types";

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
