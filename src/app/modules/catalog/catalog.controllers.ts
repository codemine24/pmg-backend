import httpStatus from "http-status";
import catchAsync from "../../shared/catch-async";
import sendResponse from "../../shared/send-response";
import { CatalogFilters } from "./catalog.interfaces";
import { CatalogServices } from "./catalog.services";

const getCatalog = catchAsync(async (req, res) => {
  const user = (req as any).user;
  const platformId = (req as any).platformId; // Assuming platform context

  // Extract filters from query params
  const filters: CatalogFilters = {
    company_id: (req.query.company as string) || (user.company_id ? user.company_id : undefined),
    brand_id: req.query.brand as string,
    category: req.query.category as string,
    search: req.query.search as string,
    type: req.query.type as 'asset' | 'collection' | 'all',
    limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
    offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
  };

  // Enforce company scope for client users if they try to access other companies (though service logic mainly relies on what's passed or derived)
  // If user has a company_id, they can only see their company's catalog? 
  // The snippet said: `const companyScope = getUserCompanyScope(user);`
  // We'll mimic this: if user.role is CLIENT, force filters.company_id = user.company_id
  if (user.role === 'CLIENT' && user.company_id) {
    filters.company_id = user.company_id;
  }

  const result = await CatalogServices.getCatalog(filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Catalog fetched successfully",
    data: result,
  });
});

export const CatalogControllers = {
  getCatalog,
};
