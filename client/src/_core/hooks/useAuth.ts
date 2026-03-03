import { getLoginUrl } from "@/const";
import { endpoints } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await endpoints.auth.me();
      // If the response is { user, token }, return it
      return response.data;
    },
    initialData: () => {
      if (typeof window === "undefined") return undefined;
      const saved = localStorage.getItem("manus-runtime-user-info");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Handle both old flat format and new {user, token} format
          return parsed;
        } catch (e) {
          return undefined;
        }
      }
      return undefined;
    },
    retry: false,
    refetchOnWindowFocus: false,
    enabled: typeof window !== "undefined" && !!localStorage.getItem("app_token"),
    // @ts-ignore
    onError: (err: any) => {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("manus-runtime-user-info");
        localStorage.removeItem("app_token"); // Clear token
        queryClient.setQueryData(['auth', 'me'], null);
      }
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await endpoints.auth.logout();
      return response.data;
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null);
      localStorage.removeItem("app_token"); // Clear token on logout
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem("manus-runtime-user-info");
      localStorage.removeItem("app_token");
      queryClient.setQueryData(['auth', 'me'], null);
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      await queryClient.resetQueries({ queryKey: ['auth', 'me'] });
    }
  }, [logoutMutation, queryClient]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "manus-runtime-user-info",
        JSON.stringify(meQuery.data)
      );
    }
  }, [meQuery.data]);

  const state = useMemo(() => {
    // Extract user if it's nested, otherwise use top-level
    const userData = meQuery.data?.user ?? meQuery.data ?? null;
    const token = meQuery.data?.token ?? localStorage.getItem('app_token') ?? null;

    return {
      user: userData,
      token: token,
      loading: (meQuery.isLoading || (meQuery.isFetching && !meQuery.data)) || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(userData),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
