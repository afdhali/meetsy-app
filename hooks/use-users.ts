import { client } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const res = await client.api.users.me.$get();
      if (!res.ok) {
        throw new Error("Failed to fetch current user");
      }
      return res.json();
    },
  });
};
