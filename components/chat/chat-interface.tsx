/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useConversations } from "@/hooks/use-conversations";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Textarea } from "../ui/textarea";
import { UserAvatar } from "../ui/user-avatar";
import { useCurrentUser } from "@/hooks/use-users";
import { useMatches } from "@/hooks/use-ai-partner";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { Message } from "@/types/main-types";

export default function ChatInterface({ matchId }: { matchId: string }) {
  const { data: currentUser } = useCurrentUser();

  // Get the conversation ID from the match
  // We need to fetch the conversation for this match
  const { data: conversation, isLoading: isLoadingConversation } = useQuery({
    queryKey: ["conversation", matchId],
    queryFn: async () => {
      // Fetch conversation by match ID
      const res = await client.api.conversations["by-match"][":matchId"].$get({
        param: { matchId },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch conversation");
      }
      return res.json();
    },
    enabled: !!matchId,
  });

  // Fetch messages using the conversation ID
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    error: errorMessages,
  } = useConversations(conversation?.id || "");

  // Fetch all matches to find the match and its conversation
  const {
    data: matches,
    isLoading: isLoadingMatches,
    error: errorMatches,
  } = useMatches();

  // Find the specific match
  const foundMatch = matches?.find((m) => m.id === matchId);

  if (isLoadingMatches || isLoadingConversation) {
    return <div>Loading...</div>;
  }

  if (errorMatches) {
    return <div>Error loading match: {errorMatches.message}</div>;
  }

  if (!foundMatch) {
    return <div>Match not found</div>;
  }

  const otherUser = {
    id: foundMatch.partner.id,
    name: foundMatch.partner.name,
    imageUrl: foundMatch.partner.imageUrl ?? undefined,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="col-span-2">
        <Card className="h-150 flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <UserAvatar
                name="John Doe"
                imageUrl="https://github.com/shadcn.png"
              />
              <CardTitle>John Doe</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message: Message) => {
              const isCurrentUser = message.senderId === currentUser?.id;
              const user = isCurrentUser ? currentUser : otherUser;
              return (
                <div key={message.id} className="space-y-4">
                  <div
                    className={cn(
                      "flex items-center gap-2",
                      isCurrentUser ? "justify-end" : "justify-start",
                    )}
                  >
                    {!isCurrentUser && (
                      <UserAvatar
                        name={user.name}
                        imageUrl={user.imageUrl ?? undefined}
                      />
                    )}
                    <div
                      className={cn(
                        "max-w-[70%] rounded-lg p-3",
                        isCurrentUser
                          ? "bg-primary/10 text-primary-foreground"
                          : "bg-muted",
                      )}
                    >
                      <p className="text-sm text-foreground">
                        {message.content}
                      </p>
                      <p className="text-xs opacity-70 mt-1 text-foreground">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    {isCurrentUser && (
                      <UserAvatar
                        name="John Doe"
                        imageUrl="https://github.com/shadcn.png"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
          <CardFooter className="border-t p-4">
            <div className="flex w-full gap-2 items-center">
              <Textarea
                placeholder="Type your message..."
                value={""}
                onChange={() => {}}
                className="resize-none"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    console.log("send message");
                  }
                }}
              />
              <Button>Send</Button>
            </div>
          </CardFooter>
        </Card>
      </div>
      <div className="col-span-1">
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Conversation Summary</CardTitle>
              <Button size="sm">Generate</Button>
            </div>
          </CardHeader>
          <CardContent>Summary</CardContent>
        </Card>
      </div>
    </div>
  );
}
