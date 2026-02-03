import { useAiPartners } from "@/hooks/use-ai-partner";
import { Button } from "../ui/button";
import { toast } from "sonner";

export default function AIMatching({
  totalGoals,
  selectedCommunityId,
}: {
  totalGoals: number;
  selectedCommunityId: string;
}) {
  const aiPartnerMutation = useAiPartners();

  const handleFindAIPartners = async () => {
    try {
      await aiPartnerMutation.mutateAsync(selectedCommunityId);
      toast.success("AI partners found successfully");
    } catch (error) {
      console.error("Error finding ai partners", error);
      toast.error("Failed to find ai partners");
    }
  };
  return (
    <div className="text-center py-8">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">AI-Powered Matching</h3>
        <p>
          Our AI will analyze your learning goals and automatically match you
          with the most compatible learning partners in this community.
        </p>
      </div>
      <Button
        size="lg"
        disabled={totalGoals === 0}
        onClick={handleFindAIPartners}
      >
        🤖 Find Partners with AI
      </Button>
      {totalGoals > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          You have {totalGoals} learning goals set
        </p>
      )}
      {totalGoals === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          Add learning goals first to enable AI matching
        </p>
      )}
    </div>
  );
}
