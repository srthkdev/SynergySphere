import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  UserPlus, 
  Shield, 
  UserCog, 
  Trash, 
  MoreVertical, 
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { fetchProjectMembers, addProjectMember, removeProjectMember, updateMemberRole } from "@/lib/queries";
import { ProjectMember } from "@/types";

export function MembersTab({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"admin" | "member">("member");
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  // Fetch project members
  const { 
    data: members = [], 
    isLoading: isMembersLoading, 
    error: membersError 
  } = useQuery<ProjectMember[], Error>({
    queryKey: ['projectMembers', projectId],
    queryFn: () => fetchProjectMembers(projectId),
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: ({ email, role }: { email: string; role: "admin" | "member" }) => {
      return addProjectMember(projectId, { email, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setInviteEmail("");
      setIsInviteDialogOpen(false);
      toast.success("Member added successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add member");
    },
  });

  // Update member role mutation
  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: "admin" | "member" }) => {
      return updateMemberRole(projectId, memberId, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] });
      toast.success("Member role updated!");
      setEditMemberId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update member role");
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => {
      return removeProjectMember(projectId, memberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success("Member removed successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove member");
    },
  });

  const handleInviteMember = () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    addMemberMutation.mutate({ email: inviteEmail.trim(), role: memberRole });
  };

  const handleRoleChange = (memberId: string, newRole: "admin" | "member") => {
    updateMemberRoleMutation.mutate({ memberId, role: newRole });
  };

  if (isMembersLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (membersError) {
    return (
      <div className="text-red-500 text-center py-10">
        Error loading members: {membersError.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Team Members</h2>
        <Button onClick={() => setIsInviteDialogOpen(true)} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" /> Invite Member
        </Button>
      </div>

      {members.length > 0 ? (
        <div className="space-y-4">
          {members.map((member) => (
            <Card key={member.id} className="overflow-hidden">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.image || undefined} />
                    <AvatarFallback>{member.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-muted-foreground">{member.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.role === "admin" ? (
                    <div className="flex items-center text-sm text-primary-foreground bg-primary px-2 py-1 rounded-full">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      <Users className="h-3 w-3 mr-1" />
                      Member
                    </div>
                  )}
                  
                  {/* Don't show dropdown for current user */}
                  {member.id !== currentUserId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem 
                          onClick={() => handleRoleChange(member.id, member.role === "admin" ? "member" : "admin")}
                          disabled={updateMemberRoleMutation.isPending}
                        >
                          <UserCog className="mr-2 h-4 w-4" />
                          Make {member.role === "admin" ? "Member" : "Admin"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => removeMemberMutation.mutate(member.id)}
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          disabled={removeMemberMutation.isPending}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Just you here</h3>
              <p className="text-muted-foreground mb-4">
                Invite team members to collaborate on this project.
              </p>
              <Button onClick={() => setIsInviteDialogOpen(true)}>
                Invite Members
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Add a new team member to your project by email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={memberRole} onValueChange={(value: "admin" | "member") => setMemberRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Admins can manage project settings and members. Members can only create and edit tasks.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleInviteMember} 
              disabled={addMemberMutation.isPending || !inviteEmail.trim()}>
              {addMemberMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Invite Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 