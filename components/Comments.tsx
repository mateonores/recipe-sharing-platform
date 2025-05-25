"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userExistingRating, setUserExistingRating] = useState<number | null>(
    null
  );

  const isRecipeOwner = user?.id === recipeOwnerId;
  const canRate = user && !isRecipeOwner;

  // Fetch comments and user's existing rating
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch comments
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

        // Fetch user's existing rating if they can rate
        if (canRate) {
          const { data: ratingData } = await supabase
            .from("ratings")
            .select("rating")
            .eq("recipe_id", recipeId)
            .eq("user_id", user.id)
            .single();

          setUserExistingRating(ratingData?.rating || null);
          setNewRating(ratingData?.rating || 0);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load comments");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [recipeId, canRate, user?.id, onCommentsCountChange]);

  // Add new comment (and rating if applicable)
  const handleAddComment = async () => {
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

      // Add comment
      const { data: commentData, error: commentError } = await supabase
        .from("comments")
        .insert({
          recipe_id: recipeId,
          user_id: user.id,
          content: newComment.trim(),
        })
        .select(
          `
          *,
          users(username, full_name, avatar_url)
        `
        )
        .single();

      if (commentError) throw commentError;

      // Add or update rating if user can rate and provided a rating
      if (canRate && newRating > 0) {
        if (userExistingRating) {
          // Update existing rating
          const { error: ratingError } = await supabase
            .from("ratings")
            .update({ rating: newRating })
            .eq("recipe_id", recipeId)
            .eq("user_id", user.id);

          if (ratingError) throw ratingError;
        } else {
          // Insert new rating
          const { error: ratingError } = await supabase.from("ratings").insert({
            recipe_id: recipeId,
            user_id: user.id,
            rating: newRating,
          });

          if (ratingError) throw ratingError;
        }

        setUserExistingRating(newRating);
        onRatingChange?.();
      }

      setComments((prev) => [commentData, ...prev]);
      setNewComment("");
      if (canRate && !userExistingRating) {
        setNewRating(0);
      }
      onCommentsCountChange?.(comments.length + 1);

      const ratingMessage =
        canRate && newRating > 0
          ? ` and ${
              userExistingRating ? "updated your rating" : "added your rating"
            }!`
          : "!";
      toast.success(`Comment added${ratingMessage}`);
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
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
  }: {
    rating: number;
    onRatingChange?: (rating: number) => void;
    onHover?: (rating: number) => void;
    onLeave?: () => void;
    readonly?: boolean;
  }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={`text-2xl transition-colors ${
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
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent("");
  };

  // Save edited comment
  const handleSaveEdit = async (commentId: string) => {
    if (!editingContent.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      const { error } = await supabase
        .from("comments")
        .update({ content: editingContent.trim() })
        .eq("id", commentId)
        .eq("user_id", user?.id);

      if (error) throw error;

      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? { ...comment, content: editingContent.trim() }
            : comment
        )
      );

      setEditingCommentId(null);
      setEditingContent("");
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

      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      onCommentsCountChange?.(comments.length - 1);
      toast.success("Comment deleted successfully!");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

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

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold">Comments ({comments.length})</h3>

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
                    {userExistingRating
                      ? "Update your rating:"
                      : "Rate this recipe:"}
                  </label>
                  <StarRating
                    rating={hoveredRating || newRating}
                    onRatingChange={setNewRating}
                    onHover={setHoveredRating}
                    onLeave={() => setHoveredRating(0)}
                  />
                  {newRating > 0 && (
                    <p className="text-sm text-gray-600">
                      {newRating} star{newRating !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              )}

              {/* Comment textarea */}
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-20"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleAddComment}
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

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
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
                    <Textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="min-h-20"
                    />
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
            <p>No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
}
