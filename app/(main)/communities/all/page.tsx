"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { ArrowLeftIcon, CheckIcon } from "lucide-react";
import Link from "next/link";
import {
  useAllCommunities,
  useCommunities,
  useJoinCommunity,
} from "@/hooks/use-communities";

export default function AllCommunitiesPage() {
  const {
    data: allCommunities,
    isLoading: isLoadingAllCommunities,
    error: errorAllCommunities,
  } = useAllCommunities();

  const { data: userCommunities } = useCommunities();

  const isJoined = (communityId: string) => {
    return userCommunities?.some(
      (community) => community.community.id === communityId,
    );
  };

  const joinCommunityMutation = useJoinCommunity();

  const handleJoinCommunity = async (communityId: string) => {
    console.log("Joining community", communityId);
    await joinCommunityMutation.mutateAsync(communityId);
  };

  if (isLoadingAllCommunities) return <div>Loading...</div>;
  if (errorAllCommunities)
    return <div>Error: {errorAllCommunities.message}</div>;

  return (
    <div>
      <Link href="/communities">
        <Button variant={"outline"}>
          <ArrowLeftIcon className="size-4" />
          Back to My Communities
        </Button>
      </Link>
      <div className="space-y-4 mt-4">
        <h2 className="text-2xl font-bold"> Browse Communities</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allCommunities?.map((community) => (
            <Card key={community.id}>
              <CardHeader>
                <CardTitle>{community.name}</CardTitle>
                <CardDescription>{community.description}</CardDescription>
                <CardFooter className="px-0 mt-2">
                  <Button
                    className="w-full"
                    disabled={isJoined(community.id)}
                    onClick={() => handleJoinCommunity(community.id)}
                  >
                    {isJoined(community.id) ? (
                      <>
                        <CheckIcon className="size-4" /> Joined
                      </>
                    ) : (
                      "Join Community"
                    )}
                  </Button>
                </CardFooter>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
