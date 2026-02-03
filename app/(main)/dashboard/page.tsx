"use client";
import { useQuery } from "@tanstack/react-query";

type Community = { id: number; name: string };

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<Community[]>({
    queryKey: ["communities"],
    queryFn: async (): Promise<Community[]> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([{ id: 1, name: "Community 1" }]);
        }, 1000);
      });
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      {data?.map((community) => (
        <div key={community.id}>{community.name}</div>
      ))}
    </div>
  );
}
