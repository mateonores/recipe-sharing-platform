"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Comment = Database["public"]["Tables"]["comments"]["Row"] & {
  users?: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
};

interface CommentsProps {
  recipeId: string;
  recipeOwnerId: string;
  onCommentsCountChange?: (count: number) => void;
  onRatingChange?: () => void;
}

export function Comments({
  recipeId,
  recipeOwnerId,
  onCommentsCountChange,
  onRatingChange,
}: CommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingRating, setEditingRating] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userExistingReview, setUserExistingReview] = useState<Comment | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"all" | "reviews">("all");

  const isRecipeOwner = user?.id === recipeOwnerId;
  const canRate = user && !isRecipeOwner;

  // Fetch comments and user's existing review
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch all comments
        const { data: commentsData, error: commentsError } = await supabase
          .from("comments")
          .select(
            `
            *,
            users(username, full_name, avatar_url)
          `
          )
          .eq("recipe_id", recipeId)
          .order("created_at", { ascending: false });

        if (commentsError) throw commentsError;
        setComments(commentsData || []);
        onCommentsCountChange?.(commentsData?.length || 0);

        // Find user's existing review (comment with rating)
        if (user) {
          const userReview = commentsData?.find(
            (comment) => comment.user_id === user.id && comment.rating !== null
          );
          setUserExistingReview(userReview || null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load comments");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [recipeId, user, onCommentsCountChange]);

  // Add new comment
  const handleSubmitComment = async () => {
    if (!user) {
      toast.error("Please log in to comment");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    try {
      setIsSubmitting(true);

      // If user is adding a rating and they already have a review, remove rating from existing review
      if (canRate && newRating > 0 && userExistingReview) {
        const { error: updateError } = await supabase
          .from("comments")
          .update({ rating: null })
          .eq("id", userExistingReview.id);

        if (updateError) throw updateError;
      }

      // Add new comment
      const { data: commentData, error: commentError } = await supabase
        .from("comments")
        .insert({
          recipe_id: recipeId,
          user_id: user.id,
          content: newComment.trim(),
          rating: canRate && newRating > 0 ? newRating : null,
        })
        .select(
          `
          *,
          users(username, full_name, avatar_url)
        `
        )
        .single();

      if (commentError) throw commentError;

      // Update local state
      setComments((prev) => [commentData, ...prev]);

      // Update user's existing review if this comment has a rating
      if (canRate && newRating > 0) {
        // Remove rating from old review in local state
        if (userExistingReview) {
          setComments((prev) =>
            prev.map((comment) =>
              comment.id === userExistingReview.id
                ? { ...comment, rating: null }
                : comment
            )
          );
        }
        setUserExistingReview(commentData);
        onRatingChange?.();
      }

      onCommentsCountChange?.(comments.length + 1);

      // Reset form
      setNewComment("");
      setNewRating(0);

      toast.success("Comment added successfully!");
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast.error("Failed to submit comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Star rating component
  const StarRating = ({
    rating,
    onRatingChange,
    onHover,
    onLeave,
    readonly = false,
    size = "text-2xl",
  }: {
    rating: number;
    onRatingChange?: (rating: number) => void;
    onHover?: (rating: number) => void;
    onLeave?: () => void;
    readonly?: boolean;
    size?: string;
  }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={`${size} transition-colors ${
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
            } ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
            onClick={() => !readonly && onRatingChange?.(star)}
            onMouseEnter={() => !readonly && onHover?.(star)}
            onMouseLeave={() => !readonly && onLeave?.()}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  // Start editing comment
  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
    setEditingRating(comment.rating || 0);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent("");
    setEditingRating(0);
  };

  // Save edited comment
  const handleSaveEdit = async (commentId: string) => {
    if (!editingContent.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      const comment = comments.find((c) => c.id === commentId);
      const wasReview = comment?.rating !== null;
      const willBeReview = canRate && editingRating > 0;

      // If changing from non-review to review, and user already has a review, remove rating from existing review
      if (
        !wasReview &&
        willBeReview &&
        userExistingReview &&
        userExistingReview.id !== commentId
      ) {
        const { error: updateError } = await supabase
          .from("comments")
          .update({ rating: null })
          .eq("id", userExistingReview.id);

        if (updateError) throw updateError;
      }

      const { error } = await supabase
        .from("comments")
        .update({
          content: editingContent.trim(),
          rating: canRate ? editingRating || null : null,
        })
        .eq("id", commentId)
        .eq("user_id", user?.id);

      if (error) throw error;

      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              content: editingContent.trim(),
              rating: canRate ? editingRating || null : comment.rating,
            };
          }
          // If this edit created a new review and there was an old review, remove rating from old review
          if (
            !wasReview &&
            willBeReview &&
            userExistingReview &&
            comment.id === userExistingReview.id
          ) {
            return { ...comment, rating: null };
          }
          return comment;
        })
      );

      // Update user's existing review reference
      if (willBeReview) {
        const updatedComment = comments.find((c) => c.id === commentId);
        if (updatedComment) {
          setUserExistingReview({ ...updatedComment, rating: editingRating });
        }
      } else if (
        wasReview &&
        !willBeReview &&
        userExistingReview?.id === commentId
      ) {
        setUserExistingReview(null);
      }

      setEditingCommentId(null);
      setEditingContent("");
      setEditingRating(0);

      if (canRate && (willBeReview || (wasReview && !willBeReview))) {
        onRatingChange?.();
      }

      toast.success("Comment updated successfully!");
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment");
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user?.id);

      if (error) throw error;

      const deletedComment = comments.find((c) => c.id === commentId);
      const wasReview = deletedComment?.rating !== null;

      setComments((prev) => prev.filter((comment) => comment.id !== commentId));

      // Reset user's existing review if this was their review
      if (wasReview && userExistingReview?.id === commentId) {
        setUserExistingReview(null);
      }

      onCommentsCountChange?.(comments.length - 1);

      if (wasReview) {
        onRatingChange?.();
      }

      toast.success("Comment deleted successfully!");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  // Filter comments for different tabs
  const allComments = comments;
  const reviewComments = comments.filter((comment) => comment.rating !== null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Comments</h3>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const renderCommentsList = (commentsToRender: Comment[]) => (
    <div className="space-y-4">
      {commentsToRender.length > 0 ? (
        commentsToRender.map((comment) => (
          <div key={comment.id} className="border-b pb-4 last:border-0">
            <div className="flex gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage
                  src={comment.users?.avatar_url || ""}
                  alt={comment.users?.username || "User"}
                />
                <AvatarFallback>
                  {comment.users?.username?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="font-medium">
                        {comment.users?.full_name ||
                          comment.users?.username ||
                          "Anonymous"}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        {new Date(comment.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                    {/* Display rating next to user info */}
                    {comment.rating && (
                      <div className="flex items-center gap-1">
                        <StarRating
                          rating={comment.rating}
                          readonly={true}
                          size="text-sm"
                        />
                        <span className="text-sm text-gray-600">
                          ({comment.rating}/5)
                        </span>
                      </div>
                    )}
                  </div>
                  {user && user.id === comment.user_id && (
                    <div className="flex gap-2">
                      {editingCommentId === comment.id ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveEdit(comment.id)}
                          >
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEdit(comment)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {editingCommentId === comment.id ? (
                  <div className="space-y-3">
                    {/* Rating editing for non-recipe owners */}
                    {canRate && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Update rating:
                        </label>
                        <StarRating
                          rating={editingRating}
                          onRatingChange={setEditingRating}
                        />
                        {editingRating > 0 && (
                          <p className="text-sm text-gray-600">
                            {editingRating} star{editingRating !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    )}
                    <Textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="min-h-20"
                    />
                  </div>
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>
            {activeTab === "reviews"
              ? "No reviews yet. Be the first to leave a review!"
              : "No comments yet. Be the first to comment!"}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold">
        Comments ({allComments.length}) • Reviews ({reviewComments.length})
      </h3>

      {/* Add new comment */}
      {user ? (
        <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
          <div className="flex gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage
                src={user.user_metadata?.avatar_url || ""}
                alt="Your avatar"
              />
              <AvatarFallback>
                {user.user_metadata?.full_name?.charAt(0)?.toUpperCase() ||
                  user.email?.charAt(0)?.toUpperCase() ||
                  "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              {/* Rating section for non-recipe owners */}
              {canRate && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Add a rating to this comment (optional):
                  </label>
                  <StarRating
                    rating={hoveredRating || newRating}
                    onRatingChange={setNewRating}
                    onHover={setHoveredRating}
                    onLeave={() => setHoveredRating(0)}
                  />
                  {newRating > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">
                        {newRating} star{newRating !== 1 ? "s" : ""}
                      </p>
                      {userExistingReview && (
                        <p className="text-sm text-amber-600">
                          ⚠️ Adding a rating will remove your previous review
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Comment textarea */}
              <Textarea
                placeholder="Write a comment or ask a question..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-20"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitComment}
              disabled={isSubmitting || !newComment.trim()}
            >
              {isSubmitting ? "Adding..." : "Add Comment"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-slate-50 rounded-lg">
          <p>Please log in to leave a comment.</p>
          <Button variant="link" asChild className="p-0 mt-2">
            <a href="/login">Log in</a>
          </Button>
        </div>
      )}

      {/* Comments tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "all" | "reviews")}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all" className="cursor-pointer">
            All Comments ({allComments.length})
          </TabsTrigger>
          <TabsTrigger value="reviews" className="cursor-pointer">
            Reviews Only ({reviewComments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {renderCommentsList(allComments)}
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          {renderCommentsList(reviewComments)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
