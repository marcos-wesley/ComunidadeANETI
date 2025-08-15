import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Heart, ThumbsUp, Laugh, Angry, Frown, PartyPopper } from "lucide-react";

const reactions = [
  { type: "like", icon: ThumbsUp, label: "Curtir", emoji: "👍" },
  { type: "love", icon: Heart, label: "Amei", emoji: "❤️" },
  { type: "laugh", icon: Laugh, label: "Risada", emoji: "😂" },
  { type: "celebrate", icon: PartyPopper, label: "Parabéns", emoji: "🎉" },
  { type: "sad", icon: Frown, label: "Triste", emoji: "😢" },
  { type: "angry", icon: Angry, label: "Raiva", emoji: "😠" },
];

interface ReactionSelectorProps {
  currentReaction?: string;
  onReact: (reactionType: string) => void;
  disabled?: boolean;
}

export function ReactionSelector({ currentReaction, onReact, disabled }: ReactionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentReactionData = reactions.find(r => r.type === currentReaction);
  const MainIcon = currentReactionData?.icon || ThumbsUp;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={`gap-2 ${
            currentReaction 
              ? currentReaction === 'love' 
                ? 'text-red-500 hover:text-red-600' 
                : 'text-blue-500 hover:text-blue-600'
              : 'text-muted-foreground hover:text-blue-500'
          }`}
        >
          <MainIcon className="h-4 w-4" />
          <span className="text-xs">
            {currentReactionData?.label || "Curtir"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex items-center gap-1">
          {reactions.map((reaction) => {
            const Icon = reaction.icon;
            return (
              <Button
                key={reaction.type}
                variant="ghost"
                size="sm"
                onClick={() => {
                  onReact(reaction.type);
                  setIsOpen(false);
                }}
                className="flex flex-col items-center gap-1 h-auto p-2 min-w-[60px] hover:bg-muted"
              >
                <span className="text-lg">{reaction.emoji}</span>
                <span className="text-xs text-muted-foreground">
                  {reaction.label}
                </span>
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}