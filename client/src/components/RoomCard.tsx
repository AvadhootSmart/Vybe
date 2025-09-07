"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils"; // optional utility; remove if not present

type RoomCardProps = {
  onCreate?: (roomName?: string) => void | Promise<void>;

  onJoin?: (roomCode: string) => void | Promise<void>;

  initialMode?: "create" | "join";

  className?: string;
};

export default function RoomCard({
  onCreate,
  onJoin,
  initialMode,
  className,
}: RoomCardProps) {
  const [mode, setMode] = useState<"create" | "join" | undefined>(initialMode);
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus input when mode changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [mode]);

  // Simple validation:
  // - Create: allow non-empty trimmed name up to 60 chars (optional: allow empty to generate random)
  // - Join: require 4-12 alphanumeric code (example)
  const trimmed = value.trim();
  const isValidCreate = trimmed.length >= 1 && trimmed.length <= 60;
  const isValidJoin = /^[A-Za-z0-9\-]{4,12}$/.test(trimmed);

  const canConfirm = mode === "create" ? isValidCreate : mode === "join" ? isValidJoin : false;

  async function handleConfirm(e?: React.FormEvent) {
    e?.preventDefault();
    if (!mode) return;
    if (!canConfirm) return;

    try {
      setIsSubmitting(true);
      if (mode === "create") {
        await Promise.resolve(onCreate ? onCreate(trimmed) : undefined);
      } else {
        await Promise.resolve(onJoin ? onJoin(trimmed) : undefined);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Allow pressing Enter to submit when input is focused
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && canConfirm && !isSubmitting) {
      handleConfirm();
    }
  }

  return (
    <Card className={cn("w-full max-w-md", className ?? "")}>
      <CardHeader>
        <CardTitle className="text-lg">Vybe Rooms</CardTitle>
        <p className="text-sm text-muted-foreground">
          Create a new room or join an existing one using a room code.
        </p>
      </CardHeader>

      <CardContent>
        <div className="flex gap-3">
          <Button
            variant={mode === "create" ? "default" : "outline"}
            onClick={() => {
              setMode(prev => (prev === "create" ? undefined : "create"));
              setValue("");
            }}
            aria-pressed={mode === "create"}
            aria-label="Create a new room"
          >
            Create room
          </Button>

          <Button
            variant={mode === "join" ? "default" : "outline"}
            onClick={() => {
              setMode(prev => (prev === "join" ? undefined : "join"));
              setValue("");
            }}
            aria-pressed={mode === "join"}
            aria-label="Join an existing room"
          >
            Join room
          </Button>
        </div>

        {/* Show input only when a mode is selected */}
        {mode && (
          <form className="mt-4" onSubmit={handleConfirm}>
            <div className="space-y-2">
              <div>
                <Label htmlFor="room-input" className="text-sm">
                  {mode === "create" ? "Room name" : "Room code"}
                </Label>
                <Input
                  id="room-input"
                  ref={inputRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={mode === "create" ? "e.g. My Study Session" : "e.g. AB12-34"}
                  aria-invalid={mode === "create" ? !isValidCreate && value.length > 0 : !isValidJoin && value.length > 0}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                {mode === "create" ? (
                  <>
                    Pick a friendly name (1–60 chars). You can change it later.
                  </>
                ) : (
                  <>
                    Enter the room code (4–12 characters, letters, numbers, hyphens allowed).
                  </>
                )}
              </p>
            </div>
          </form>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2">
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
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={() => handleConfirm()}
            disabled={!canConfirm || isSubmitting || !mode}
            aria-disabled={!canConfirm || isSubmitting || !mode}
          >
            {isSubmitting ? "Working..." : mode === "create" ? "Confirm & Create" : "Confirm & Join"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
