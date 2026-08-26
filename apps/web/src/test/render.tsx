import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../features/auth/AuthProvider";
import { queryClient } from "../lib/queryClient";

type RenderWithProvidersOptions = {
  initialEntries?: string[];
};

export function renderWithProviders(ui: ReactElement, { initialEntries }: RenderWithProvidersOptions = {}) {
  queryClient.clear();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>{ui}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
