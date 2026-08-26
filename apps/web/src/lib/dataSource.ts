export type DataSource = "mock" | "api";

const rawDataSource = import.meta.env.VITE_DATA_SOURCE;

export const dataSource: DataSource = rawDataSource === "api" ? "api" : "mock";
export const isApiMode = dataSource === "api";
export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api/v1";
