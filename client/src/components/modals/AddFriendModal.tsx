import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Create a schema for adding friend with Zod
const addFriendSchema = z.object({
  uniqueId: z.string().min(3, {
    message: "Unique ID must be at least 3 characters long",
  }),
});

export function AddFriendModal({ isOpen, onClose }: AddFriendModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with useForm hook
  const form = useForm<z.infer<typeof addFriendSchema>>({
    resolver: zodResolver(addFriendSchema),
    defaultValues: {
      uniqueId: "",
    },
  });

  // Set up mutation for adding a friend
  const sendFriendRequest = useMutation({
    mutationFn: async (uniqueId: string) => {
      try {
        const res = await apiRequest("POST", "/api/friends/requests", { uniqueId });
        return res.json();
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Friend request sent",
        description: "They'll be notified of your request",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Could not send friend request";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (values: z.infer<typeof addFriendSchema>) => {
    setIsSubmitting(true);
    try {
      await sendFriendRequest.mutateAsync(values.uniqueId);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add a Friend</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="uniqueId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Talkio ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your friend's Talkio ID"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}