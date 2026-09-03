import { createUsersApi } from "../../lib/api/users";
import type { ApiAccountStatus, ApiUserRecord, UserListFilters, UsersApi } from "../../lib/api/users";
import { createSessionApiHttpClient } from "../../lib/api/session";
import type { ApiListMeta, ApiListResponse } from "../../lib/api/types";
import { dataSource } from "../../lib/dataSource";
import { mockStore } from "../../mocks/mockStore";
import type { UserRole } from "../../types/models";

export interface AdminAccount {
  id: string;
  displayName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: ApiAccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAccountsService {
  listUsers(filters?: UserListFilters): Promise<ApiListResponse<AdminAccount>>;
  lockUser(id: string): Promise<AdminAccount>;
  unlockUser(id: string): Promise<AdminAccount>;
  deactivateUser(id: string): Promise<AdminAccount>;
  resetPassword(id: string): Promise<{ temporaryPassword: string }>;
}

interface AdminAccountsServiceOptions {
  source: "mock" | "api";
  api?: UsersApi;
  fetcher?: typeof fetch;
}

function mapUser(record: ApiUserRecord): AdminAccount {
  return {
    id: record.id,
    displayName: record.displayName,
    email: record.email,
    phone: record.phone,
    role: record.role,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function paginate(items: AdminAccount[], filters: UserListFilters): ApiListResponse<AdminAccount> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 100;
  const start = (page - 1) * pageSize;
  const meta: ApiListMeta = { requestId: "mock", page, pageSize, total: items.length };
  return { data: items.slice(start, start + pageSize), meta };
}

function mockUsers(filters: UserListFilters = {}): ApiListResponse<AdminAccount> {
  const q = filters.q?.toLocaleLowerCase();
  const items = mockStore.users
    .filter((user) => (!filters.role || user.role === filters.role)
      && (!filters.status || user.status === filters.status)
      && (!q || [user.displayName, user.email, user.phone].some((value) => value.toLocaleLowerCase().includes(q))))
    .map((user) => ({ ...user }));
  return paginate(items, filters);
}

function requireMockUser(id: string): AdminAccount {
  const user = mockStore.users.find((candidate) => candidate.id === id);
  if (!user) throw new Error("Không tìm thấy tài khoản.");
  return user;
}

function defaultApi(fetcher?: typeof fetch): UsersApi {
  const client = createSessionApiHttpClient(fetcher);
  return createUsersApi(client.request, client.requestEnvelope);
}

export function createAdminAccountsService(options: AdminAccountsServiceOptions): AdminAccountsService {
  const api = options.source === "api" ? (options.api ?? defaultApi(options.fetcher)) : undefined;

  return {
    async listUsers(filters = {}) {
      if (!api) return mockUsers(filters);
      const response = await api.listUsers(filters);
      return { data: response.data.map(mapUser), meta: response.meta };
    },
    async lockUser(id) {
      if (api) return mapUser(await api.lockUser(id));
      const user = requireMockUser(id);
      user.status = "locked";
      return { ...user };
    },
    async unlockUser(id) {
      if (api) return mapUser(await api.unlockUser(id));
      const user = requireMockUser(id);
      user.status = "active";
      return { ...user };
    },
    async deactivateUser(id) {
      if (api) return mapUser(await api.deactivateUser(id));
      const user = requireMockUser(id);
      user.status = "inactive";
      return { ...user };
    },
    async resetPassword(id) {
      if (api) return api.resetPassword(id);
      requireMockUser(id);
      return { temporaryPassword: "careflow123" };
    },
  };
}

export const adminAccountsService = createAdminAccountsService({ source: dataSource });

export const adminAccountsQueryOptions = {
  list: (filters: UserListFilters = {}) => ({
    queryKey: ["admin", "accounts", filters] as const,
    queryFn: () => adminAccountsService.listUsers(filters),
    initialData: dataSource === "mock" ? mockUsers(filters) : undefined,
  }),
};
