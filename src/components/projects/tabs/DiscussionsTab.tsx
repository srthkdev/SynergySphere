import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from 'date-fns';
import { 
  MessageCircle, 
  Edit2, 
  Trash2, 
  MoreVertical, 
  Loader2,
  Send
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
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<{ [commentId: string]: string }>({});
  const [openThread, setOpenThread] = useState<Comment | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(380);

  const { data: comments, isLoading, error } = useQuery<Comment[], Error>({
    queryKey: ['comments', projectId, null],
    queryFn: () => fetchComments(projectId),
  });

  // Mutations use OptimisticCommentContext defined above
  const addCommentMutation = useMutation<Comment, Error, { content: string; taskId?: string | null; parentId?: string | null }, OptimisticCommentContext>(
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
        addCommentMutation.mutate({ content: newComment.trim(), taskId: null, parentId: null });
      }
    }
  };

  const handleReply = (parentId: string) => {
    const text = replyText[parentId]?.trim();
    if (text) {
      addCommentMutation.mutate({ content: text, taskId: null, parentId });
      setReplyText((prev) => ({ ...prev, [parentId]: "" }));
      setReplyTo(null);
    }
  };

  const startEditComment = (commentToEdit: Comment) => {
    setEditingComment(commentToEdit);
    setNewComment(commentToEdit.content);
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setNewComment("");
  };

  // Helper: group comments by parentId
  function buildCommentTree(comments: Comment[]): { [parentId: string]: Comment[] } {
    const tree: { [parentId: string]: Comment[] } = {};
    comments.forEach((c) => {
      const pid = c.parentId || "root";
      if (!tree[pid]) tree[pid] = [];
      tree[pid].push(c);
    });
    return tree;
  }

  // Only show top-level comments in main view
  const commentTree = comments ? buildCommentTree(comments) : {};
  const topLevelComments = commentTree["root"] || [];

  // Count replies for a comment
  function countReplies(commentId: string): number {
    return (comments || []).filter(c => c.parentId === commentId).length;
  }

  // Main view: only top-level comments, show 'Open thread' if replies exist
  function renderTopLevelComments() {
    return topLevelComments.map((commentItem) => {
      const repliesCount = countReplies(commentItem.id);
      return (
        <div key={commentItem.id}>
          <Card className="overflow-visible bg-transparent border-none shadow-none">
            <CardContent className="p-2 flex items-start gap-2">
              <Avatar className="h-7 w-7 mt-0.5">
                <AvatarImage src={commentItem.authorImage || undefined} />
                <AvatarFallback className="text-xs">{commentItem.authorName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-xs leading-tight">{commentItem.authorName}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(commentItem.createdAt), 'dd-MM-yyyy HH:mm')}
                  </span>
                  {commentItem.createdAt !== commentItem.updatedAt && (
                    <span className="text-[10px] text-muted-foreground/70">(edited)</span>
                  )}
                </div>
                <div className="flex items-end justify-between mt-1">
                  <p className="text-xs mt-0.5 whitespace-pre-wrap break-words max-w-full">{commentItem.content}</p>
                  <Button variant="ghost" size="sm" className="ml-2 px-2 py-0.5 text-xs h-6" onClick={() => setReplyTo(commentItem.id)}>
                    Reply
                  </Button>
                </div>
                {repliesCount > 0 && (
                  <div className="flex justify-start mt-1">
                    <Button variant="outline" size="sm" className="text-xs px-2 h-6 border-muted-foreground/20" onClick={() => setOpenThread(commentItem)}>
                      {repliesCount} Message{repliesCount > 1 ? 's' : ''} →
                    </Button>
                  </div>
                )}
                {replyTo === commentItem.id && (
                  <div className="mt-1 flex gap-2 items-start">
                    <Textarea
                      placeholder="Write a reply..."
                      value={replyText[commentItem.id] || ""}
                      onChange={e => setReplyText(prev => ({ ...prev, [commentItem.id]: e.target.value }))}
                      rows={2}
                      className="flex-grow text-xs min-h-[32px] max-h-[64px] p-1"
                    />
                    <Button
                      onClick={() => handleReply(commentItem.id)}
                      disabled={!replyText[commentItem.id]?.trim() || addCommentMutation.isPending}
                      className="h-6 px-2 text-xs"
                    >
                      {addCommentMutation.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : "Reply"}
                    </Button>
                    <Button variant="ghost" onClick={() => setReplyTo(null)} className="h-6 px-2 text-xs">
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
              {currentUserId === commentItem.authorId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[120px]">
                    <DropdownMenuItem onClick={() => startEditComment(commentItem)} disabled={updateCommentMutation.isPending && updateCommentMutation.variables?.commentId === commentItem.id} className="text-xs">
                      <Edit2 className="mr-1 h-3 w-3" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => deleteCommentMutation.mutate(commentItem.id)} 
                      className="text-destructive focus:text-destructive focus:bg-destructive/10 text-xs"
                      disabled={deleteCommentMutation.isPending && deleteCommentMutation.variables === commentItem.id}
                    >
                      <Trash2 className="mr-1 h-3 w-3" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </CardContent>
          </Card>
        </div>
      );
    });
  }

  // Thread sidebar component
  function ThreadSidebar({ parent }: { parent: Comment }) {
    // Use all comments from the main query
    const allComments = comments || [];
    // Collect all descendants of the thread starter (parent)
    function collectThreadReplies(parentId: string): Comment[] {
      const directReplies = allComments.filter(c => c.parentId === parentId);
      let all = [...directReplies];
      for (const reply of directReplies) {
        all = all.concat(collectThreadReplies(reply.id));
      }
      return all;
    }
    // Flat list: parent + all descendants, sorted by createdAt
    const threadMsgs = [parent, ...collectThreadReplies(parent.id)].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    // Reply input for thread
    const [threadReply, setThreadReply] = useState("");
    const [replyToMsg, setReplyToMsg] = useState<Comment | null>(null); // which message in thread is being replied to
    const inputRef = useRef<HTMLInputElement>(null);
    const handleThreadReply = () => {
      if (threadReply.trim()) {
        addCommentMutation.mutate(
          { content: threadReply.trim(), taskId: null, parentId: replyToMsg ? replyToMsg.id : parent.id },
          {
            onSuccess: () => {
              setThreadReply("");
              setReplyToMsg(null);
              setTimeout(() => {
                inputRef.current?.focus();
              }, 200);
            }
          }
        );
      }
    };
    // Helper to truncate long messages for the title
    function truncate(str: string, n: number) {
      return str.length > n ? str.slice(0, n - 1) + '…' : str;
    }
    // Helper to find parent message in thread
    function findParentMsg(msg: Comment): Comment | undefined {
      return threadMsgs.find(m => m.id === msg.parentId);
    }
    // Handle Enter key for sending reply
    function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleThreadReply();
      }
    }
    return (
      <div className="h-full w-full flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-muted-foreground/10">
          <span
            className="font-semibold text-xs truncate max-w-[260px]"
            title={parent.content}
          >
            {truncate(parent.content, 40)}
          </span>
          <Button size="icon" variant="ghost" onClick={() => setOpenThread(null)} className="h-7 w-7">
            ×
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threadMsgs.map((msg, idx) => {
            // Show reply context if not replying to thread starter
            const parentMsg = msg.parentId !== parent.id ? findParentMsg(msg) : undefined;
            return (
              <div key={msg.id} className={`flex items-start gap-2 ${msg.id === parent.id ? '' : 'ml-6'} group`}>
                <Avatar className={msg.id === parent.id ? "h-7 w-7 mt-0.5" : "h-6 w-6 mt-0.5"}>
                  <AvatarImage src={msg.authorImage || undefined} />
                  <AvatarFallback className="text-xs">{msg.authorName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-muted/10 rounded-lg px-3 py-2">
                  {parentMsg && (
                    <div className="text-[10px] text-muted-foreground mb-1">
                      Replying to <span className="font-semibold">{parentMsg.authorName}</span>: <span className="italic">{truncate(parentMsg.content, 24)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs leading-tight">{msg.authorName}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(msg.createdAt), 'dd-MM-yyyy HH:mm')}
                    </span>
                    {msg.createdAt !== msg.updatedAt && (
                      <span className="text-[10px] text-muted-foreground/70">(edited)</span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5 whitespace-pre-wrap break-words max-w-full">{msg.content}</p>
                  <div className="flex items-center justify-end mt-1 gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2 py-0.5 text-xs h-6 opacity-70 hover:opacity-100"
                      onClick={() => {
                        setReplyToMsg(msg);
                        setTimeout(() => inputRef.current?.focus(), 100);
                      }}
                    >
                      Reply
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-3 border-t border-muted-foreground/10 flex flex-col gap-1 items-stretch">
          {replyToMsg && (
            <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
              Replying to <span className="font-semibold">{replyToMsg.authorName}</span>
              <Button size="icon" variant="ghost" className="h-4 w-4 p-0 ml-1" onClick={() => setReplyToMsg(null)}>
                ×
              </Button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <input
              ref={inputRef}
              type="text"
              placeholder="Write a reply..."
              value={threadReply}
              onChange={e => setThreadReply(e.target.value)}
              onKeyDown={handleInputKeyDown}
              className="flex-grow text-xs min-h-[32px] max-h-[64px] p-1 rounded bg-muted/20 border border-muted-foreground/20 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button
              onClick={handleThreadReply}
              disabled={!threadReply.trim() || addCommentMutation.isPending}
              className="h-8 px-4 text-xs rounded-full bg-primary text-black hover:bg-primary/90 transition-colors flex items-center gap-1 shadow-none border-none disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Reply</span>
              <Send className="h-4 w-4 ml-0.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Mouse event handlers
  function onMouseDown(e: React.MouseEvent) {
    dragging.current = true;
    startX.current = e.clientX;
    startWidth.current = sidebarWidth;
    document.body.style.cursor = 'ew-resize';
  }
  function onMouseMove(e: MouseEvent) {
    if (!dragging.current) return;
    const dx = startX.current - e.clientX;
    let newWidth = startWidth.current + dx;
    newWidth = Math.max(280, Math.min(600, newWidth));
    setSidebarWidth(newWidth);
  }
  function onMouseUp() {
    dragging.current = false;
    document.body.style.cursor = '';
  }
  useEffect(() => {
    function move(e: MouseEvent) { onMouseMove(e); }
    function up() { onMouseUp(); }
    if (dragging.current) {
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    } else {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    }
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [dragging.current]);

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="text-red-500 text-center py-10">Error loading discussions: {error.message}</div>;

  return (
    <div className="relative flex w-full h-full min-h-[500px]">
      <div className={`space-y-6 transition-all duration-300 flex flex-col h-full ${openThread ? '' : 'w-full'}`} style={{ minWidth: 0, width: openThread ? `calc(100% - ${sidebarWidth}px)` : '100%' }}>
        <h2 className="text-xl font-semibold">Project Discussions</h2>
        <Card className="flex-0">
          <CardContent className="p-2">
            <div className="flex gap-2 items-start">
              <Avatar className="h-7 w-7 mt-0.5">
                <AvatarImage src={session?.user?.image || undefined} />
                <AvatarFallback className="text-xs">{session?.user?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <Textarea 
                placeholder={editingComment ? "Edit your comment..." : "Write a comment..."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                className="flex-grow text-xs min-h-[32px] max-h-[64px] p-1"
                disabled={addCommentMutation.isPending || updateCommentMutation.isPending}
              />
            </div>
            <div className="mt-2 flex justify-end gap-2">
              {editingComment && (
                <Button variant="ghost" onClick={cancelEdit} disabled={addCommentMutation.isPending || updateCommentMutation.isPending } className="h-6 px-2 text-xs">
                  Cancel Edit
                </Button>
              )}
              <Button 
                onClick={handlePostComment} 
                disabled={!newComment.trim() || addCommentMutation.isPending || updateCommentMutation.isPending}
                className="min-w-[60px] h-6 px-2 text-xs"
              >
                {(addCommentMutation.isPending || updateCommentMutation.isPending) && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                {editingComment ? "Save" : "Post"}
              </Button>
            </div>
          </CardContent>
        </Card>
        {topLevelComments.length > 0 ? (
          <div className="space-y-4 flex-1 overflow-y-auto">
            {renderTopLevelComments()}
          </div>
        ) : (
          <div className="text-center py-10 flex-1 flex items-center justify-center">
            <div>
              <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No discussions yet. Be the first to comment!</p>
            </div>
          </div>
        )}
      </div>
      {openThread && (
        <div className="relative h-full flex flex-col" style={{ width: sidebarWidth }}>
          {/* Drag handle */}
          <div
            className="absolute left-0 top-0 h-full w-2 cursor-ew-resize z-50 bg-transparent hover:bg-muted/30 transition-colors"
            onMouseDown={onMouseDown}
            title="Resize thread sidebar"
          />
          <div className="w-full h-full border-l border-muted-foreground/10 bg-background flex flex-col">
            <ThreadSidebar parent={openThread} />
          </div>
        </div>
      )}
    </div>
  );
} 