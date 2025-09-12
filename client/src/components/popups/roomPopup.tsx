"use client";

import React, { useState, useEffect, useRef } from "react";
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

export function RoomPopup({
  onCreate,
  onJoin,
  initialMode,
  children,
}: RoomDialogProps) {
  const [mode, setMode] = useState<"create" | "join" | undefined>(initialMode);
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // focus input when mode changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [mode]);

  // simple validation
  const trimmed = value.trim();
  const isValidCreate = trimmed.length >= 1 && trimmed.length <= 60;
  const isValidJoin = /^[A-Za-z0-9\-]{4,12}$/.test(trimmed);
  const canConfirm =
    mode === "create" ? isValidCreate : mode === "join" ? isValidJoin : false;

  async function handleConfirm(e?: React.FormEvent) {
    e?.preventDefault();
    if (!mode || !canConfirm) return;

    try {
      setIsSubmitting(true);
      if (mode === "create") {
        await Promise.resolve(onCreate?.(trimmed));
      } else {
        await Promise.resolve(onJoin?.(trimmed));
      }
      setMode(undefined);
      setValue("");
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
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle className="text-2xl font-Poppins">Vybe Rooms</DialogTitle>
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
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={
                  mode === "create" ? "e.g. My Study Session" : "e.g. AB12-34"
                }
                aria-invalid={
                  mode === "create"
                    ? !isValidCreate && value.length > 0
                    : !isValidJoin && value.length > 0
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {mode === "create"
                ? "Pick a friendly name (1–60 chars). You can change it later."
                : "Enter the room code (4–12 characters, letters, numbers, hyphens allowed)."}
            </p>
          </form>
        )}

        <DialogFooter className="flex justify-between mt-6">
          <div className="text-sm text-muted-foreground">
            {mode ? (
              canConfirm ? (
                <span>Ready to {mode}.</span>
              ) : (
                <span>
                  {mode === "create"
                    ? "Room name required."
                    : "Valid room code required."}
                </span>
              )
            ) : (
              <span>Select an action to continue.</span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setMode(undefined);
                setValue("");
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
