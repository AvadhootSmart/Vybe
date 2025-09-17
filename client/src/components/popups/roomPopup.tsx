"use client";

import React, { useState, useEffect, useRef } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RoomDialogProps = {
  onCreate?: (roomName?: string) => void | Promise<void>;
  onJoin?: (roomCode: string) => void | Promise<void>;
  initialMode?: "create" | "join";
  children: React.ReactNode;
};

/**
 * Validation rules:
 * - min length: 4
 * - lowercase only (a-z), digits (0-9) and hyphens (-)
 * - no spaces allowed (we strip spaces on input)
 * - create max 60, join max 12
 */
const createSchema = z
  .string()
  .min(4, { message: "Room name must be at least 4 characters." })
  .max(60, { message: "Room name can be at most 60 characters." })
  .regex(/^[a-z0-9-]+$/, {
    message: "Only lowercase letters, numbers, and hyphens are allowed.",
  });

const joinSchema = z
  .string()
  .min(4, { message: "Room code must be at least 4 characters." })
  .max(12, { message: "Room code can be at most 12 characters." })
  .regex(/^[a-z0-9-]+$/, {
    message: "Only lowercase letters, numbers, and hyphens are allowed.",
  });

export function RoomPopup({
  onCreate,
  onJoin,
  initialMode,
  children,
}: RoomDialogProps) {
  const [mode, setMode] = useState<"create" | "join" | undefined>(initialMode);
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // focus input when mode changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
    // clear errors when toggling mode
    setError(null);
  }, [mode]);

  // normalize input: lowercase and strip spaces
  function handleChange(raw: string) {
    // convert to lowercase and remove whitespace characters
    const normalized = raw.toLowerCase().replace(/\s+/g, "");
    setValue(normalized);
    setError(null);
  }

  const trimmed = value.trim();

  // validate using zod
  const createValidation = createSchema.safeParse(trimmed);
  const joinValidation = joinSchema.safeParse(trimmed);

  const isValidCreate = createValidation.success;
  const isValidJoin = joinValidation.success;

  const canConfirm =
    mode === "create" ? isValidCreate : mode === "join" ? isValidJoin : false;

  async function handleConfirm(e?: React.FormEvent) {
    e?.preventDefault();
    if (!mode) return;

    // Re-validate before submitting
    const schema = mode === "create" ? createSchema : joinSchema;
    const result = schema.safeParse(trimmed);

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid value");
      return;
    }

    try {
      setIsSubmitting(true);

      if (mode === "create") {
        // Set localStorage flag for room host
        const roomKey = `room_${trimmed}_host`;
        localStorage.setItem(roomKey, "true");

        await Promise.resolve(onCreate?.(trimmed));
      } else {
        await Promise.resolve(onJoin?.(trimmed));
      }

      // reset dialog state after success
      setMode(undefined);
      setValue("");
      setError(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && canConfirm && !isSubmitting) {
      handleConfirm();
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader className="text-left">
          <DialogTitle className="text-2xl font-Poppins">
            Vybe Rooms
          </DialogTitle>
          <DialogDescription>
            Create a new room or join an existing one using a room code.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 mt-2">
          <Button
            variant={mode === "create" ? "default" : "outline"}
            onClick={() => {
              setMode((prev) => (prev === "create" ? undefined : "create"));
              setValue("");
              setError(null);
            }}
            aria-pressed={mode === "create"}
          >
            Create room
          </Button>
          <Button
            variant={mode === "join" ? "default" : "outline"}
            onClick={() => {
              setMode((prev) => (prev === "join" ? undefined : "join"));
              setValue("");
              setError(null);
            }}
            aria-pressed={mode === "join"}
          >
            Join room
          </Button>
        </div>

        {mode && (
          <form className="mt-4 space-y-2" onSubmit={handleConfirm}>
            <div>
              <Label htmlFor="room-input" className="text-lg mb-1">
                {mode === "create" ? "Room name" : "Room code"}
              </Label>
              <Input
                id="room-input"
                ref={inputRef}
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={
                  mode === "create" ? "e.g. my-study-session" : "e.g. ab12-34"
                }
                aria-invalid={!!error}
                aria-describedby="room-input-help room-input-error"
                onPaste={(e) => {
                  const pasted = //eslint-disable-next-line
                  (e.clipboardData || (window as any).clipboardData).getData(
                    "text",
                  );

                  e.preventDefault();
                  handleChange(pasted);
                }}
              />
              <p
                id="room-input-help"
                className="text-xs text-muted-foreground mt-1"
              >
                {mode === "create"
                  ? "Lowercase, 4–60 chars. Only letters a–z, digits and hyphens (no spaces)."
                  : "Lowercase, 4–12 chars. Only letters a–z, digits and hyphens (no spaces)."}
              </p>

              {error && (
                <p id="room-input-error" className="text-xs text-red-500 mt-1">
                  {error}
                </p>
              )}
            </div>
          </form>
        )}

        <DialogFooter className="flex justify-between mt-6">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setMode(undefined);
                setValue("");
                setError(null);
                // onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => handleConfirm()}
              disabled={!canConfirm || isSubmitting || !mode}
            >
              {isSubmitting
                ? "Working..."
                : mode === "create"
                  ? "Confirm & Create"
                  : "Confirm & Join"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
