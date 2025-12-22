import { sortOrderType } from "../../constants/common";

export const companySortableFields = [
  "name",
  "domain",
  "created_at",
  "updated_at"
];

export const companyQueryValidationConfig = {
  sort_by: companySortableFields,
  sort_order: sortOrderType,
};