"use client";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { UserAvatar } from "../ui/user-avatar";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { useUser } from "@clerk/nextjs";

export default function ChatInterface({ matchId }: { matchId: string }) {
  const { user: clerkUser } = useUser();

  //fetch the conversation for the match
  const { data: conversation } = useQuery({
    queryKey: ["conversation", matchId],
    queryFn: async () => {
      const res = await client.api.matches[":matchId"].conversation.$get({
        param: { matchId },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch conversation");
      }
      return res.json();
    },
  });

  //fetch the messages for the conversation
  const { data: messages } = useQuery({
    queryKey: ["messages", conversation?.id],
    queryFn: async () => {
      const res = await client.api.conversations[
        ":conversationId"
      ].messages.$get({
        param: { conversationId: conversation?.id ?? "" },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch messages");
      }
      return res.json();
    },
    refetchInterval: 5000, // poll every 5 seconds
  });

  if (!conversation) {
    return <div>Loading...</div>;
  }

  const otherUser = {
    id: conversation.otherUser.id,
    name: conversation.otherUser.name,
    imageUrl: conversation.otherUser.imageUrl,
  };

  const currentUser = {
    name: (clerkUser?.firstName + " " + clerkUser?.lastName).trim() ?? "You",
    imageUrl: clerkUser?.imageUrl ?? undefined,
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
            {messages?.map((message) => {
              const isCurrentUser =
                message.senderId === conversation.currentUserId;
              const user = isCurrentUser
                ? (currentUser ?? "")
                : (otherUser ?? "");
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
                        name={user?.name ?? "U"}
                        imageUrl={user?.imageUrl ?? undefined}
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
                        name={currentUser?.name ?? "You"}
                        imageUrl={currentUser?.imageUrl ?? undefined}
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
