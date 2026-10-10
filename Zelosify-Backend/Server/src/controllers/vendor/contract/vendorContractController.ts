import { Request, Response } from "express";
import {
  ContractError,
  getVendorOpening,
  listVendorOpenings,
} from "../../../services/contract/openingService.js";

export async function getVendorOpenings(req: Request, res: Response) {
  try {
    const result = await listVendorOpenings((req as any).user, req.query as any);
    return res.json({ success: true, ...result });
  } catch (error) {
    return sendError(res, error, "Failed to fetch openings");
  }
}

export async function getVendorOpeningDetails(req: Request, res: Response) {
  try {
    const data = await getVendorOpening((req as any).user, req.params.id);
    return res.json({ success: true, data });
  } catch (error) {
    return sendError(res, error, "Failed to fetch opening details");
  }
}

function sendError(res: Response, error: unknown, fallback: string) {
  const status = error instanceof ContractError ? error.statusCode : 500;
  const message = error instanceof ContractError ? error.message : fallback;
  return res.status(status).json({ message });
}
