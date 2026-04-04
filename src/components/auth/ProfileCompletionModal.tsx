import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { upsertCurrentUserProfile } from "@/lib/profile-service";

interface ProfileCompletionModalProps {
  userId: string;
  defaultName?: string;
  open: boolean;
  onCompleted: () => void;
}

export function ProfileCompletionModal({
  userId,
  defaultName,
  open,
  onCompleted,
}: ProfileCompletionModalProps) {
  const { toast } = useToast();
  const [fullName, setFullName] = useState(defaultName ?? "");
  const [ageInput, setAgeInput] = useState("");
  const [leetcodeIdentityInput, setLeetcodeIdentityInput] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setFullName(defaultName ?? "");
  }, [defaultName, open]);

  const isValid = useMemo(() => {
    const age = Number.parseInt(ageInput, 10);
    return (
      fullName.trim().length >= 2 &&
      Number.isInteger(age) &&
      age >= 13 &&
      age <= 120 &&
      leetcodeIdentityInput.trim().length > 0 &&
      description.trim().length <= 500
    );
  }, [ageInput, description, fullName, leetcodeIdentityInput]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) {
      toast({
        title: "Profile incomplete",
        description: "Fill all required fields before continuing.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await upsertCurrentUserProfile(userId, {
        fullName,
        age: Number.parseInt(ageInput, 10),
        leetcodeIdentityInput,
        description,
      });

      toast({
        title: "Profile saved",
        description: "You can now create or join rooms.",
      });
      onCompleted();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not save profile. Try again.";
      toast({
        title: "Profile save failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-lg border-cyan-400/35 bg-black/90 backdrop-blur-xl [&>button]:hidden"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-mono text-cyan-300 tracking-widest">
            COMPLETE YOUR PROFILE
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            This is required before entering the arena.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label
              className="text-xs font-mono text-cyan-300/80"
              htmlFor="fullName"
            >
              Name
            </label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Your name"
              required
              className="border-cyan-400/30 bg-black/40 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-cyan-300/80" htmlFor="age">
              Age
            </label>
            <Input
              id="age"
              value={ageInput}
              onChange={(event) => setAgeInput(event.target.value)}
              inputMode="numeric"
              placeholder="e.g. 21"
              required
              className="border-cyan-400/30 bg-black/40 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label
              className="text-xs font-mono text-cyan-300/80"
              htmlFor="leetcodeIdentity"
            >
              LeetCode Username or Profile URL
            </label>
            <Input
              id="leetcodeIdentity"
              value={leetcodeIdentityInput}
              onChange={(event) => setLeetcodeIdentityInput(event.target.value)}
              placeholder="username or https://leetcode.com/u/username/"
              required
              className="border-cyan-400/30 bg-black/40 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label
              className="text-xs font-mono text-cyan-300/80"
              htmlFor="description"
            >
              Description (Optional)
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Tell others about your coding goals"
              maxLength={500}
              className="min-h-[96px] border-cyan-400/30 bg-black/40 font-mono"
            />
          </div>

          <Button
            type="submit"
            disabled={saving || !isValid}
            className="w-full font-mono tracking-widest"
          >
            {saving ? "SAVING..." : "SAVE PROFILE"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
