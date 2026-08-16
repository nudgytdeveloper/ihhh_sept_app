"use client";

import { useState } from "react";
import { RotateCcw, Trash2, Database } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GAME_DATA_CONTROLS } from "@/constants/host";

/**
 * The two destructive-ish game-data controls, kept together and away from the
 * round flow buttons so neither is hit by accident:
 *
 * - Reset game session — opens a fresh round. Scores are banked, not lost.
 * - Clear all game data — wipes every score for the event, in memory and in the
 *   database. Irreversible, so it's behind a confirmation dialog.
 */
export function GameDataControl({
  onResetSession,
  onClearAll,
}: {
  onResetSession: () => void;
  onClearAll: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="size-4 text-brand-blue" />
          {GAME_DATA_CONTROLS.title}
        </CardTitle>
        <CardDescription>{GAME_DATA_CONTROLS.description}</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-2 sm:grid-cols-2">
        <Button
          variant="outline"
          onClick={onResetSession}
          className="h-auto justify-start gap-2 py-2 text-left"
        >
          <RotateCcw className="size-4 shrink-0 text-brand-blue" />
          <span className="flex flex-col">
            <span className="text-sm font-medium">{GAME_DATA_CONTROLS.resetLabel}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {GAME_DATA_CONTROLS.resetDetail}
            </span>
          </span>
        </Button>

        <Button
          variant="outline"
          onClick={() => setConfirming(true)}
          className="h-auto justify-start gap-2 border-destructive/30 py-2 text-left text-destructive hover:bg-destructive/5 hover:text-destructive"
        >
          <Trash2 className="size-4 shrink-0" />
          <span className="flex flex-col">
            <span className="text-sm font-medium">{GAME_DATA_CONTROLS.clearLabel}</span>
            <span className="text-xs font-normal text-destructive/80">
              {GAME_DATA_CONTROLS.clearDetail}
            </span>
          </span>
        </Button>
      </CardContent>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{GAME_DATA_CONTROLS.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {GAME_DATA_CONTROLS.confirmBody}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{GAME_DATA_CONTROLS.confirmCancel}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onClearAll}>
              {GAME_DATA_CONTROLS.confirmAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
