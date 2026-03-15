import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getFocusedProject, parkSession } from '@/lib/store';
import { toast } from 'sonner';

interface ParkSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ParkSessionDialog({ open, onOpenChange }: ParkSessionDialogProps) {
  const [notes, setNotes] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const project = getFocusedProject();

  const handlePark = () => {
    if (!project) {
      toast.error('No active project to park');
      onOpenChange(false);
      return;
    }

    const breadcrumb = `${project.name} → ${project.current_stage.charAt(0).toUpperCase() + project.current_stage.slice(1)} stage`;

    parkSession({
      project_id: project.id,
      stage: project.current_stage,
      page_route: location.pathname,
      breadcrumb,
      notes: notes || undefined,
    });

    toast.success('Session parked. See you when you\'re back.');
    setNotes('');
    onOpenChange(false);
    navigate('/app/focus');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Park Session</DialogTitle>
        </DialogHeader>
        {project ? (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted text-sm">
              <span className="text-muted-foreground">Context: </span>
              <span className="font-medium text-foreground">
                {project.name} → {project.current_stage.charAt(0).toUpperCase() + project.current_stage.slice(1)}
              </span>
            </div>
            <div>
              <Label htmlFor="park-notes" className="text-sm text-muted-foreground">
                Leave yourself a note for when you come back
              </Label>
              <Textarea
                id="park-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Where did I leave off..."
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No active project to park.</p>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handlePark} disabled={!project}>Park & Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
