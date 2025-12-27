import httpStatus from "http-status";
import catchAsync from "../../shared/catch-async";
import sendResponse from "../../shared/send-response";
import { ScanningServices } from "./scanning.services";

// ----------------------------------- INBOUND SCAN -----------------------------------
const inboundScan = catchAsync(async (req, res) => {
    const platformId = (req as any).platformId;
    const user = (req as any).user;
    const { order_id } = req.params;

    const result = await ScanningServices.inboundScan(
        order_id,
        req.body,
        user,
        platformId
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: {
            asset: result.asset,
            progress: result.progress,
        },
    });
});

export const ScanningControllers = {
    inboundScan,
};
