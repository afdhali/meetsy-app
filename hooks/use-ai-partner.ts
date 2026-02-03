import { client } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useAiPartners = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (communityId: string) => {
      const res = await client.api.matches[":communityId"].aimatch.$post({
        param: { communityId },
      });
      if (!res.ok) {
        throw new Error("Failed to find ai partner");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["potentialPartners", variables],
      });
    },
    onError: (error) => {
      console.error("Error finding ai partner", error);
    },
  });
};
