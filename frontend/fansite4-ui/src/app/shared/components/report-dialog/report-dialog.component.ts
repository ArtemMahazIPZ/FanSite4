import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  template: `
  <div class="p-4 text-white bg-[#0B1020]">
    <h2 class="text-lg font-semibold">Report article</h2>
    <p class="text-white/70 text-sm mt-1">Describe the reason (visible to admins).</p>

    <form class="mt-4 grid gap-3" [formGroup]="form" (ngSubmit)="submit()">
      <mat-form-field appearance="outline">
        <mat-label>Reason</mat-label>
        <textarea matInput rows="5" formControlName="reason"></textarea>
      </mat-form-field>

      <div class="flex gap-2 justify-end">
        <button mat-stroked-button type="button" (click)="ref.close(null)"
                class="border-white/20! text-white! rounded-2xl!">
          Cancel
        </button>
        <button mat-raised-button type="submit" [disabled]="form.invalid" class="rounded-2xl!">
          Send
        </button>
      </div>
    </form>
  </div>
  `,
})
export class ReportDialogComponent {
  ref = inject(MatDialogRef<ReportDialogComponent>);
  data = inject<{ articleId: number }>(MAT_DIALOG_DATA);
  fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(400)]],
  });

  submit() {
    this.ref.close(this.form.getRawValue().reason);
  }
}
