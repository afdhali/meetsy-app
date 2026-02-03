"use client";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

type Community = { id: number; name: string };

export default function DashboardPage() {
  const user = useUser();
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
    <div className="page-wrapper">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.user?.firstName || "User"}!
        </p>
      </div>
      {data?.map((community) => (
        <div key={community.id}>{community.name}</div>
      ))}
    </div>
  );
}
