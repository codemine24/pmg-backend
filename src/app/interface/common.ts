import { UserRole } from "../modules/user/user.interfaces";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company_id: string | null;
  platform_id: string;
  iat: number;
  exp: number;
};
