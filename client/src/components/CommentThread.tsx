import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThumbsUp, ThumbsDown, MessageSquare, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  marketId: string;
  userAddress: string;
  content: string;
  parentCommentId: string | null;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  updatedAt: string;
}

interface CommentThreadProps {
  marketId: string;
  userAddress?: string;
}

type SortOption = "top" | "new" | "controversial";

export function CommentThread({ marketId, userAddress }: CommentThreadProps) {
  const [sortBy, setSortBy] = useState<SortOption>("top");
  const { toast } = useToast();

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ["/api/markets", marketId, "comments"],
  });

  // Sort comments based on selected option
  const sortedComments = useMemo(() => {
    const commentsCopy = [...comments];
    
    switch (sortBy) {
      case "top":
        return commentsCopy.sort((a, b) => {
          const scoreA = a.upvotes - a.downvotes;
          const scoreB = b.upvotes - b.downvotes;
          return scoreB - scoreA;
        });
      case "new":
        return commentsCopy.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "controversial":
        return commentsCopy.sort((a, b) => {
          const controversyA = Math.min(a.upvotes, a.downvotes);
          const controversyB = Math.min(b.upvotes, b.downvotes);
          return controversyB - controversyA;
        });
      default:
        return commentsCopy;
    }
  }, [comments, sortBy]);

  // Group comments into threads (top-level and replies)
  const commentTree = useMemo(() => {
    const topLevel: Comment[] = [];
    const replies: Record<string, Comment[]> = {};

    sortedComments.forEach(comment => {
      if (!comment.parentCommentId) {
        topLevel.push(comment);
      } else {
        if (!replies[comment.parentCommentId]) {
          replies[comment.parentCommentId] = [];
        }
        replies[comment.parentCommentId].push(comment);
      }
    });

    return { topLevel, replies };
  }, [sortedComments]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-muted animate-pulse rounded-lg" />
        <div className="h-24 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">
          Discussion ({comments.length})
        </h3>
        <div className="flex gap-2">
          <Button
            variant={sortBy === "top" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("top")}
            data-testid="button-sort-top"
          >
            <ArrowUp className="w-4 h-4 mr-1" />
            Top
          </Button>
          <Button
            variant={sortBy === "new" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("new")}
            data-testid="button-sort-new"
          >
            New
          </Button>
          <Button
            variant={sortBy === "controversial" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("controversial")}
            data-testid="button-sort-controversial"
          >
            Controversial
          </Button>
        </div>
      </div>

      {userAddress && (
        <CommentForm
          marketId={marketId}
          userAddress={userAddress}
          onSuccess={() => {}}
        />
      )}

      <div className="space-y-4">
        {commentTree.topLevel.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </Card>
        ) : (
          commentTree.topLevel.map(comment => (
            <CommentCard
              key={comment.id}
              comment={comment}
              replies={commentTree.replies[comment.id] || []}
              userAddress={userAddress}
              marketId={marketId}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface CommentFormProps {
  marketId: string;
  userAddress: string;
  parentCommentId?: string;
  onSuccess: () => void;
}

function CommentForm({ marketId, userAddress, parentCommentId, onSuccess }: CommentFormProps) {
  const [content, setContent] = useState("");
  const { toast } = useToast();

  const createCommentMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/markets/${marketId}/comments`, {
        userAddress,
        content,
        parentCommentId: parentCommentId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/markets", marketId, "comments"] });
      setContent("");
      onSuccess();
      toast({
        title: "Comment posted!",
        description: "Your comment has been added to the discussion.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      createCommentMutation.mutate();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentCommentId ? "Write a reply..." : "Share your thoughts on this market..."}
        className="resize-none"
        rows={3}
        data-testid={`input-comment-${parentCommentId || 'main'}`}
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!content.trim() || createCommentMutation.isPending}
          size="sm"
          data-testid={`button-submit-comment-${parentCommentId || 'main'}`}
        >
          {createCommentMutation.isPending ? "Posting..." : parentCommentId ? "Reply" : "Comment"}
        </Button>
      </div>
    </form>
  );
}

interface CommentCardProps {
  comment: Comment;
  replies: Comment[];
  userAddress?: string;
  marketId: string;
  isReply?: boolean;
}

function CommentCard({ comment, replies, userAddress, marketId, isReply = false }: CommentCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const { toast } = useToast();

  const score = comment.upvotes - comment.downvotes;

  const voteMutation = useMutation({
    mutationFn: async (vote: number) => {
      return await apiRequest("POST", `/api/comments/${comment.id}/vote`, {
        userAddress,
        vote,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/markets", marketId, "comments"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to vote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleVote = (vote: number) => {
    if (!userAddress) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to vote on comments.",
        variant: "destructive",
      });
      return;
    }
    voteMutation.mutate(vote);
  };

  return (
    <Card className={`p-4 ${isReply ? 'ml-8 mt-3' : ''}`} data-testid={`card-comment-${comment.id}`}>
      <div className="flex gap-3">
        <div className="flex flex-col items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover-elevate active-elevate-2"
            onClick={() => handleVote(1)}
            disabled={voteMutation.isPending}
            data-testid={`button-upvote-${comment.id}`}
          >
            <ThumbsUp className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold" data-testid={`text-score-${comment.id}`}>
            {score}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover-elevate active-elevate-2"
            onClick={() => handleVote(-1)}
            disabled={voteMutation.isPending}
            data-testid={`button-downvote-${comment.id}`}
          >
            <ThumbsDown className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {comment.userAddress.slice(2, 4).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium" data-testid={`text-author-${comment.id}`}>
              {comment.userAddress.slice(0, 6)}...{comment.userAddress.slice(-4)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>

          <p className="text-sm whitespace-pre-wrap" data-testid={`text-content-${comment.id}`}>
            {comment.content}
          </p>

          <div className="flex items-center gap-4">
            {userAddress && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 hover-elevate active-elevate-2"
                onClick={() => setShowReplyForm(!showReplyForm)}
                data-testid={`button-reply-${comment.id}`}
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Reply
              </Button>
            )}
            {replies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 hover-elevate active-elevate-2"
                onClick={() => setShowReplies(!showReplies)}
                data-testid={`button-toggle-replies-${comment.id}`}
              >
                {showReplies ? 'Hide' : 'Show'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </Button>
            )}
          </div>

          {showReplyForm && userAddress && (
            <div className="mt-3">
              <CommentForm
                marketId={marketId}
                userAddress={userAddress}
                parentCommentId={comment.id}
                onSuccess={() => setShowReplyForm(false)}
              />
            </div>
          )}

          {showReplies && replies.length > 0 && (
            <div className="space-y-3 mt-3">
              {replies.map(reply => (
                <CommentCard
                  key={reply.id}
                  comment={reply}
                  replies={[]}
                  userAddress={userAddress}
                  marketId={marketId}
                  isReply={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
