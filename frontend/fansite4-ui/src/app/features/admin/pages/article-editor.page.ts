import { Component, computed, inject, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ArticleService, UploadImageResponse } from '../../../core/services/article.service';
import { ToastService } from '../../../core/services/toast.service';
import { ArticleCategory } from '../../../core/models/enums';
import { ArticleDto, ArticleUpsertRequest } from '../../../core/models/article.models';
import { Observable } from 'rxjs';

@Component({
  standalone: true,
  imports: [NgIf, RouterLink, ReactiveFormsModule, MatButtonModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-linear-to-b from-[#0B1020] to-[#070A14] text-white">
      <div class="max-w-6xl mx-auto px-4 py-8">

        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 class="text-3xl font-semibold">{{ isEdit() ? 'Edit Article' : 'New Article' }}</h1>
            <p class="text-white/70 mt-1">Create a beautiful post that appears in the catalog.</p>
          </div>

          <div class="flex items-center gap-2">
            <a routerLink="/admin/articles"
               class="px-4 py-2 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 inline-flex items-center gap-2">
              ← Back
            </a>

            <button mat-flat-button
                    (click)="save()"
                    [disabled]="saving() || uploading() || formInvalid()"
                    class="rounded-2xl!">
              <mat-icon>save</mat-icon>
              <span class="ml-2">{{ saving() ? 'Saving...' : 'Save' }}</span>
            </button>
          </div>
        </div>

        <div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- FORM -->
          <div class="rounded-3xl bg-white/10 border border-white/10 p-6">
            <div class="space-y-5">

              <div>
                <div class="text-white/70 text-sm mb-1">Title*</div>
                <input [formControl]="title"
                       class="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-white/20"
                       placeholder="Title" />
              </div>

              <div>
                <div class="text-white/70 text-sm mb-1">Category*</div>
                <select [formControl]="category"
                        class="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-white/20">
                  <option value="Person">Person</option>
                  <option value="Weapon">Weapon</option>
                  <option value="Mission">Mission</option>
                </select>
              </div>

              <!-- Upload from PC -->
              <div>
                <div class="text-white/70 text-sm mb-2">Image*</div>

                <div class="flex flex-wrap items-center gap-3">
                  <input #fileInput type="file" accept="image/*"
                         class="hidden"
                         (change)="onPickFile($event)" />

                  <button type="button"
                          class="px-4 py-2 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 inline-flex items-center gap-2"
                          (click)="pickFile(fileInput)">
                    <mat-icon>upload</mat-icon>
                    <span>{{ uploading() ? 'Uploading...' : 'Upload from computer' }}</span>
                  </button>

                  <button type="button"
                          class="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10"
                          (click)="imageUrl.setValue('')">
                    Clear
                  </button>

                  <span class="text-white/60 text-sm" *ngIf="uploading()">Please wait…</span>
                </div>

                <div class="mt-3 text-white/60 text-xs">
                  Or paste URL (optional)
                </div>

                <input [formControl]="imageUrl"
                       class="mt-2 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-white/20"
                       placeholder="https://..." />

                <div class="mt-2 text-red-300 text-sm" *ngIf="imgError()">{{ imgError() }}</div>
              </div>

              <div>
                <div class="text-white/70 text-sm mb-1">Content*</div>
                <textarea [formControl]="content"
                          rows="9"
                          class="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-white/20"
                          placeholder="Write content..."></textarea>
              </div>

              <div class="flex items-center gap-2">
                <button type="button"
                        class="px-4 py-2 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15"
                        (click)="reset()">
                  Reset
                </button>

                <div class="text-white/50 text-sm">
                  Tip: upload portrait-friendly image — it will look great in details page.
                </div>
              </div>

            </div>
          </div>

          <!-- PREVIEW -->
          <div class="rounded-3xl bg-white/10 border border-white/10 overflow-hidden">
            <div class="h-72 bg-black/20">
              <img *ngIf="imageUrl.value"
                   [src]="imageUrl.value"
                   class="h-72 w-full object-cover"
                   alt=""/>
              <div *ngIf="!imageUrl.value" class="h-72 flex items-center justify-center text-white/40">
                Preview image
              </div>
            </div>

            <div class="p-6">
              <div class="text-white/60 text-xs">{{ category.value }} • preview</div>
              <div class="mt-2 text-2xl font-semibold">{{ title.value || 'Title' }}</div>
              <div class="mt-2 text-white/70 whitespace-pre-line">{{ content.value || 'Content...' }}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class ArticleEditorPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private articles = inject(ArticleService);
  private toast = inject(ToastService);

  readonly id = signal<number | null>(null);
  readonly isEdit = computed(() => this.id() !== null);

  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly imgError = signal<string | null>(null);

  readonly title = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200)] });
  readonly category = new FormControl<ArticleCategory>('Person', { nonNullable: true, validators: [Validators.required] });
  readonly imageUrl = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(2048)] });
  readonly content = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(20000)] });

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;

    if (Number.isFinite(id) && id > 0) {
      this.id.set(id);
      this.articles.getById(id).subscribe({
        next: (a: ArticleDto) => {
          this.title.setValue(a.title ?? '');
          this.category.setValue(a.category ?? 'Person');
          this.imageUrl.setValue(a.imageUrl ?? '');
          this.content.setValue(a.content ?? '');
        },
        error: () => this.toast.error('Failed to load article'),
      });
    }
  }

  formInvalid() {
    return this.title.invalid || this.category.invalid || this.content.invalid || this.imageUrl.invalid || this.uploading();
  }

  reset() {
    this.title.setValue('');
    this.category.setValue('Person');
    this.imageUrl.setValue('');
    this.content.setValue('');
    this.imgError.set(null);
  }

  pickFile(input: HTMLInputElement) {
    this.imgError.set(null);
    input.click();
  }

  onPickFile(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.imgError.set('Please select an image file.');
      return;
    }
    if (file.size > 10_000_000) {
      this.imgError.set('Image is too large (max 10 MB).');
      return;
    }

    this.uploading.set(true);
    this.articles.uploadImage(file).subscribe({
      next: (res: UploadImageResponse) => {
        this.imageUrl.setValue(res.url);
        this.toast.success('Image uploaded');
      },
      error: (e: HttpErrorResponse) => {
        const msg = (e?.error as any)?.message || e?.message || `Upload failed (${e.status})`;
        this.imgError.set(msg);
        this.toast.error(msg);
      },
      complete: () => this.uploading.set(false),
    });
  }

  save() {
    if (this.formInvalid()) {
      this.toast.error('Please fill all required fields (including image).');
      return;
    }

    const req: ArticleUpsertRequest = {
      title: this.title.value.trim(),
      category: this.category.value,
      imageUrl: this.imageUrl.value.trim(),
      content: this.content.value.trim(),
    };

    this.saving.set(true);

    const id = this.id();
    const call$: Observable<ArticleDto> = id
      ? this.articles.update(id, req)
      : this.articles.create(req);

    call$.subscribe({
      next: (a: ArticleDto) => {
        this.toast.success(id ? 'Updated' : 'Created');
        this.articles.reload();
        this.router.navigateByUrl(`/articles/${a.id}`);
      },
      error: (e: HttpErrorResponse) => {
        const msg =
          (e?.error as any)?.message ||
          (typeof e?.error === 'string' ? e.error : null) ||
          `Create/Update failed (${e.status})`;
        console.error('Save failed:', e);
        this.toast.error(msg);
      },
      complete: () => this.saving.set(false),
    });
  }
}
