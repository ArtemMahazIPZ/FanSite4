import { Component, Input, computed, effect, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ReactionType } from '../../../core/models/enums';
import { ReactionService } from '../../../core/services/reaction.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';


@Component({
  selector: 'fs-reaction-selector',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, NgClass],
  styles: [`
    .btn { transition: transform .15s ease, filter .15s ease; }
    .btn:active { transform: scale(.96); }
    .active { filter: brightness(1.2); transform: translateY(-1px) scale(1.03); }
    .pulse { animation: pulse .25s ease; }
    @keyframes pulse { 0%{transform:scale(1)} 50%{transform:scale(1.08)} 100%{transform:scale(1)} }
  `],
  template: `
  <div class="flex items-center gap-2">
    <button mat-stroked-button class="btn border-white/15! text-white! rounded-2xl!"
            [disabled]="disabled()" (click)="toggle('Like')"
            [ngClass]="{active: myReaction()==='Like', pulse: pulseLike()}">
      <mat-icon>thumb_up</mat-icon>
      <span class="ml-2">{{ likeCount() }}</span>
    </button>

    <button mat-stroked-button class="btn border-white/15! text-white! rounded-2xl!"
            [disabled]="disabled()" (click)="toggle('Smile')"
            [ngClass]="{active: myReaction()==='Smile', pulse: pulseSmile()}">
      <mat-icon>sentiment_satisfied</mat-icon>
      <span class="ml-2">{{ smileCount() }}</span>
    </button>

    <button mat-stroked-button class="btn border-white/15! text-white! rounded-2xl!"
            [disabled]="disabled()" (click)="toggle('Sad')"
            [ngClass]="{active: myReaction()==='Sad', pulse: pulseSad()}">
      <mat-icon>sentiment_dissatisfied</mat-icon>
      <span class="ml-2">{{ sadCount() }}</span>
    </button>
  </div>
  `,
})
export class ReactionSelectorComponent {
  private api = inject(ReactionService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  @Input({ required: true }) articleId!: number;

  @Input() set counts(v: { like: number; smile: number; sad: number } | null | undefined) {
    if (v) this._counts.set({ ...v });
  }

  private _counts = signal({ like: 0, smile: 0, sad: 0 });
  readonly myReaction = signal<ReactionType | null>(null);
  readonly pending = signal(false);

  readonly disabled = computed(() => this.pending() || !this.auth.isLoggedIn());

  readonly pulseLike = signal(false);
  readonly pulseSmile = signal(false);
  readonly pulseSad = signal(false);

  readonly likeCount = computed(() => this._counts().like);
  readonly smileCount = computed(() => this._counts().smile);
  readonly sadCount = computed(() => this._counts().sad);

  constructor() {
    effect(() => {
      const id = this.articleId;
      const logged = this.auth.isLoggedIn();
      if (!logged || !id) return;

      this.api.mine(id).subscribe({
        next: r => this.myReaction.set(r.reaction),
        error: () => {}
      });
    });
  }

  toggle(type: ReactionType) {
    if (!this.auth.isLoggedIn()) {
      this.toast.error('Please sign in to react.');
      return;
    }
    if (this.pending()) return;

    const prevReaction = this.myReaction();
    const prevCounts = { ...this._counts() };

    const nextReaction: ReactionType | null = (prevReaction === type) ? null : type;
    this.applyCountsOptimistic(prevReaction, nextReaction);
    this.myReaction.set(nextReaction);

    this.pending.set(true);
    this.api.toggle({ articleId: this.articleId, type }).subscribe({
      next: () => {
        this.firePulse(type);
      },
      error: () => {
        // rollback
        this._counts.set(prevCounts);
        this.myReaction.set(prevReaction);
        this.toast.error('Failed to react. Please try again.');
      },
      complete: () => this.pending.set(false),
    });
  }

  private applyCountsOptimistic(prev: ReactionType | null, next: ReactionType | null) {
    const c = { ...this._counts() };

    const dec = (t: ReactionType) => {
      if (t === 'Like') c.like = Math.max(0, c.like - 1);
      if (t === 'Smile') c.smile = Math.max(0, c.smile - 1);
      if (t === 'Sad') c.sad = Math.max(0, c.sad - 1);
    };
    const inc = (t: ReactionType) => {
      if (t === 'Like') c.like += 1;
      if (t === 'Smile') c.smile += 1;
      if (t === 'Sad') c.sad += 1;
    };

    if (prev) dec(prev);
    if (next) inc(next);

    this._counts.set(c);
  }

  private firePulse(t: ReactionType) {
    const setPulse = (sig: typeof this.pulseLike) => {
      sig.set(true);
      setTimeout(() => sig.set(false), 250);
    };
    if (t === 'Like') setPulse(this.pulseLike);
    if (t === 'Smile') setPulse(this.pulseSmile);
    if (t === 'Sad') setPulse(this.pulseSad);
  }
}
