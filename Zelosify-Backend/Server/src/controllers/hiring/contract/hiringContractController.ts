import { Request, Response } from "express";
import {
  ContractError,
  getHiringManagerProfiles as getProfiles,
  listHiringManagerOpenings,
} from "../../../services/contract/openingService.js";

export async function getHiringManagerOpenings(req: Request, res: Response) {
  try {
    const data = await listHiringManagerOpenings((req as any).user);
    return res.json({ success: true, data });
  } catch (error) {
    return sendError(res, error, "Failed to fetch openings");
  }
}

export async function getHiringManagerProfiles(req: Request, res: Response) {
  try {
    const result = await getProfiles((req as any).user, req.params.id);
    return res.json({ success: true, ...result });
  } catch (error) {
    return sendError(res, error, "Failed to fetch candidate profiles");
  }
}

function sendError(res: Response, error: unknown, fallback: string) {
  const status = error instanceof ContractError ? error.statusCode : 500;
  const message = error instanceof ContractError ? error.message : fallback;
  return res.status(status).json({ message });
}
