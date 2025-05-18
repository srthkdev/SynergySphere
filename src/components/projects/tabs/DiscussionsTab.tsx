import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from 'date-fns';
import { 
  MessageCircle, 
  Edit2, 
  Trash2, 
  MoreVertical, 
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { fetchComments, createComment, updateComment, deleteComment } from "@/lib/queries";
import { Comment } from "@/types";

// Define context for optimistic comment updates
interface OptimisticCommentContext {
  previousComments?: Comment[];
  optimisticComment?: Comment; // For adding a new comment
}

export function DiscussionsTab({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<Comment | null>(null);

  const { data: comments, isLoading, error } = useQuery<Comment[], Error>({
    queryKey: ['comments', projectId, null], 
    queryFn: () => fetchComments(projectId), 
  });

  // Mutations use OptimisticCommentContext defined above
  const addCommentMutation = useMutation<Comment, Error, { content: string; taskId?: string | null }, OptimisticCommentContext>(
    {
      mutationFn: (commentData) => createComment(projectId, commentData),
      onMutate: async (newCommentData) => {
        await queryClient.cancelQueries({ queryKey: ['comments', projectId, null] });
        const previousComments = queryClient.getQueryData<Comment[]>(['comments', projectId, null]);
        const optimisticComment: Comment = {
            id: `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            content: newCommentData.content,
            projectId: projectId,
            taskId: newCommentData.taskId || null,
            authorId: currentUserId || "temp-user-id", // Ensure a fallback string ID
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            authorName: session?.user?.name || "You",
            authorImage: session?.user?.image || undefined,
        };
        queryClient.setQueryData<Comment[]>(['comments', projectId, null], (oldComments = []) => 
          [...oldComments, optimisticComment]
        );
        setNewComment(""); // Clear input after optimistic update attempt
        return { previousComments, optimisticComment };
      },
      onError: (err, newCommentData, context) => {
        toast.error(err.message || "Failed to post comment.");
        if (context?.previousComments) {
            queryClient.setQueryData<Comment[]>(['comments', projectId, null], context.previousComments);
        }
      },
      onSuccess: () => {
        toast.success("Comment posted!");
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['comments', projectId, null]});
      }
    }
  );
  
  const updateCommentMutation = useMutation<Comment, Error, { commentId: string; content: string }, OptimisticCommentContext>(
    {
      mutationFn: ({ commentId, content }) => updateComment(commentId, content),
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: ['comments', projectId, null] });
        const previousComments = queryClient.getQueryData<Comment[]>(['comments', projectId, null]);
        queryClient.setQueryData<Comment[]>(['comments', projectId, null], (oldComments = []) => 
          oldComments.map(c => c.id === variables.commentId ? { ...c, content: variables.content, updatedAt: new Date().toISOString() } : c)
        );
        return { previousComments };
      },
      onSuccess: () => {
        setEditingComment(null);
        setNewComment("");
        toast.success("Comment updated!");
      },
      onError: (err, variables, context) => {
        toast.error(err.message || "Failed to update comment.");
        if (context?.previousComments) {
            queryClient.setQueryData<Comment[]>(['comments', projectId, null], context.previousComments);
        }
      },
      onSettled: () => {
         queryClient.invalidateQueries({ queryKey: ['comments', projectId, null]});
      }
    }
  );
  
  const deleteCommentMutation = useMutation<
    {success: boolean, deletedCommentId: string}, 
    Error, 
    string, 
    OptimisticCommentContext
  >(
    {
      mutationFn: (commentId) => deleteComment(commentId),
      onMutate: async (deletedCommentId) => {
        await queryClient.cancelQueries({ queryKey: ['comments', projectId, null] });
        const previousComments = queryClient.getQueryData<Comment[]>(['comments', projectId, null]);
        queryClient.setQueryData<Comment[]>(['comments', projectId, null], (oldComments = []) => 
          oldComments.filter(c => c.id !== deletedCommentId)
        );
        return { previousComments };
      },
      onError: (err, deletedCommentId, context) => {
        toast.error(err.message || "Failed to delete comment.");
        if (context?.previousComments) {
            queryClient.setQueryData<Comment[]>(['comments', projectId, null], context.previousComments);
        }
      },
      onSuccess: () => {
        toast.success("Comment deleted.");
      },
      onSettled: () => {
         queryClient.invalidateQueries({ queryKey: ['comments', projectId, null]});
      }
    }
  );

  const handlePostComment = () => {
    if (newComment.trim()) {
      if (editingComment) {
        updateCommentMutation.mutate({ commentId: editingComment.id, content: newComment.trim() });
      } else {
        addCommentMutation.mutate({ content: newComment.trim(), taskId: null }); // Explicitly null for project comment
      }
    }
  };

  const startEditComment = (commentToEdit: Comment) => {
    setEditingComment(commentToEdit);
    setNewComment(commentToEdit.content);
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setNewComment("");
  }

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="text-red-500 text-center py-10">Error loading discussions: {error.message}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Project Discussions</h2>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 items-start">
            <Avatar className="h-9 w-9 mt-1">
              <AvatarImage src={session?.user?.image || undefined} />
              <AvatarFallback>{session?.user?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <Textarea 
              placeholder={editingComment ? "Edit your comment..." : "Write a comment..."}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="flex-grow"
              disabled={addCommentMutation.isPending || updateCommentMutation.isPending}
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            {editingComment && (
              <Button variant="ghost" onClick={cancelEdit} disabled={addCommentMutation.isPending || updateCommentMutation.isPending }>
                Cancel Edit
              </Button>
            )}
            <Button 
              onClick={handlePostComment} 
              disabled={!newComment.trim() || addCommentMutation.isPending || updateCommentMutation.isPending}
              className="min-w-[100px]"
            >
              {(addCommentMutation.isPending || updateCommentMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingComment ? "Save" : "Post"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {comments && comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((commentItem) => (
            <Card key={commentItem.id} className="overflow-hidden">
              <CardContent className="p-4 flex items-start gap-3">
                <Avatar className="h-9 w-9 mt-1">
                  <AvatarImage src={commentItem.authorImage || undefined} />
                  <AvatarFallback>{commentItem.authorName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-sm">{commentItem.authorName}</span>
                        <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(commentItem.createdAt), { addSuffix: true })}
                        </span>
                        {commentItem.createdAt !== commentItem.updatedAt && (
                            <span className="text-xs text-muted-foreground/70">(edited)</span>
                        )}
                    </div>
                    {currentUserId === commentItem.authorId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem onClick={() => startEditComment(commentItem)} disabled={updateCommentMutation.isPending && updateCommentMutation.variables?.commentId === commentItem.id}>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteCommentMutation.mutate(commentItem.id)} 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            disabled={deleteCommentMutation.isPending && deleteCommentMutation.variables === commentItem.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{commentItem.content}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No discussions yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
} 